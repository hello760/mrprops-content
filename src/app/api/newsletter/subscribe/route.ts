/**
 * POST /api/newsletter/subscribe
 *
 * Captures a newsletter signup from any of:
 *   - Footer form on every page
 *   - <NewsletterCTA /> on /tools, /guides, /regulations, /taxes, /glossary, /templates, /alternatives, /compare
 *
 * Soft double opt-in flow:
 *   1) Email validation + honeypot check + IP rate limit
 *   2) Detect country/currency via Vercel Edge geo headers (or x-vercel-ip-country)
 *   3) Insert (or upsert on conflict) row in newsletter_subscribers
 *   4) Send Email 1 (welcome) immediately via Postmark transactional stream
 *      — Email 1 contains the "keep getting these" CTA → sets confirmed_at on click
 *   5) Sequence engine cron only ships Email 2-10 if confirmed_at IS NOT NULL
 *
 * Pattern reference: src/app/api/leads/template-download/route.ts
 *
 * Runtime: nodejs (so we can use @supabase/supabase-js and crypto for tokens).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/resend';
import { renderWelcomeEmail } from '@/lib/newsletter-render';
import { signToken } from '@/lib/newsletter-tokens';
import { countryToCurrency, fetchFxRates, buildLocalizedModel } from '@/lib/newsletter-localize';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Simple in-memory rate limit (per Vercel function instance — fine at low volume).
// Resets on cold start. For production scale consider Upstash Redis.
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;   // 15 min
const RATE_LIMIT_MAX = 5;                       // 5 subs per 15min per IP
const ipBuckets = new Map<string, { count: number; firstAt: number }>();

function rateLimitOk(ip: string): boolean {
  const now = Date.now();
  const b = ipBuckets.get(ip);
  if (!b) {
    ipBuckets.set(ip, { count: 1, firstAt: now });
    return true;
  }
  if (now - b.firstAt > RATE_LIMIT_WINDOW_MS) {
    ipBuckets.set(ip, { count: 1, firstAt: now });
    return true;
  }
  b.count += 1;
  return b.count <= RATE_LIMIT_MAX;
}

const VALID_SOURCES = new Set([
  'footer', 'guides_cta', 'tools_cta', 'regulations_cta', 'taxes_cta',
  'glossary_cta', 'templates_cta', 'alternatives_cta', 'compare_cta', 'manual',
]);

export async function POST(req: NextRequest) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }
  if (!process.env.POSTMARK_SERVER_TOKEN) {
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
  }
  if (!process.env.NEWSLETTER_CONFIRM_SECRET) {
    return NextResponse.json({ error: 'Token secret not configured' }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  // Honeypot — silently absorb if present
  if (typeof body.website === 'string' && body.website.length > 0) {
    return NextResponse.json({ captured: true });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const sourceRaw = typeof body.source === 'string' ? body.source : 'footer';
  const source = VALID_SOURCES.has(sourceRaw) ? sourceRaw : 'footer';
  const source_url = typeof body.source_url === 'string' ? body.source_url.slice(0, 2048) : null;

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'invalid email' }, { status: 400 });
  }

  // Headers
  const ipRaw = (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '').split(',')[0].trim();
  const ip = ipRaw || 'unknown';
  const userAgent = req.headers.get('user-agent')?.slice(0, 512) || null;
  const referrer = req.headers.get('referer')?.slice(0, 2048) || null;
  // Vercel Edge geo
  const country = req.headers.get('x-vercel-ip-country') || null;
  const currency = countryToCurrency(country);

  // UTM passthrough
  const url_obj = new URL(req.url);
  const utm_source = url_obj.searchParams.get('utm_source')?.slice(0, 256) || null;
  const utm_medium = url_obj.searchParams.get('utm_medium')?.slice(0, 256) || null;
  const utm_campaign = url_obj.searchParams.get('utm_campaign')?.slice(0, 256) || null;

  // Rate limit
  if (!rateLimitOk(ip)) {
    return NextResponse.json({ error: 'too many requests' }, { status: 429 });
  }

  const sb = createClient(url, key);

  // Idempotency: check if email already an active subscriber
  const { data: existing } = await sb
    .from('newsletter_subscribers')
    .select('id, confirmed_at, unsubscribed_at')
    .eq('email', email)
    .is('unsubscribed_at', null)
    .maybeSingle();

  if (existing) {
    // Already a member — silent success, no duplicate Email 1
    return NextResponse.json({ captured: true, alreadyMember: true });
  }

  // Insert new subscriber
  const { data: inserted, error: insertErr } = await sb
    .from('newsletter_subscribers')
    .insert({
      email,
      source,
      source_url,
      utm_source,
      utm_medium,
      utm_campaign,
      ip,
      user_agent: userAgent,
      referrer,
      country,
      currency,
      sequence_id: 'welcome_v1',
      current_step: 0,
    })
    .select('id')
    .single();

  if (insertErr || !inserted) {
    console.error('[newsletter/subscribe] insert failed:', insertErr);
    return NextResponse.json({ error: 'capture failed' }, { status: 500 });
  }

  const subscriberId = inserted.id as string;

  // Build merge model (currency-localized)
  let templateModel: Record<string, unknown> = { currency };
  try {
    const rates = await fetchFxRates(sb);
    const confirmToken = signToken(subscriberId, 'confirm');
    const unsubToken = signToken(subscriberId, 'unsub');
    templateModel = buildLocalizedModel(currency, rates, {
      confirm_url: `https://mrprops.io/api/newsletter/confirm?token=${confirmToken}`,
      unsubscribe_url: `https://mrprops.io/newsletter/unsubscribed?token=${unsubToken}`,
      first_name: 'there', // we don't capture name — generic friendly fallback
    });
  } catch (err) {
    console.error('[newsletter/subscribe] localize failed (proceeding with EUR):', err);
  }

  // Send Email 1 immediately via Resend (no approval gate, ships to any domain)
  try {
    const rendered = renderWelcomeEmail(1, {
      ...(templateModel as Record<string, string>),
      // ensure required fields are non-undefined for the renderer's typed model
      confirm_url: (templateModel as Record<string, string>).confirm_url ?? '',
      unsubscribe_url: (templateModel as Record<string, string>).unsubscribe_url ?? '',
    });

    const sendResult = await sendEmail({
      to: email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      tags: [
        { name: 'sequence', value: 'welcome_v1' },
        { name: 'step', value: '1' },
        { name: 'source', value: source },
      ],
    });

    // Mark Email 1 sent + record Resend message id (kept in same column for now)
    await sb
      .from('newsletter_subscribers')
      .update({
        current_step: 1,
        last_email_sent_at: new Date().toISOString(),
        postmark_message_ids: [{ step: 1, message_id: sendResult.id, sent_at: new Date().toISOString(), provider: 'resend' }],
      })
      .eq('id', subscriberId);
  } catch (sendErr) {
    // Subscriber row exists but Email 1 failed — log + soft fail.
    console.error('[newsletter/subscribe] welcome email send failed:', sendErr);
  }

  return NextResponse.json({ captured: true, alreadyMember: false });
}
