/**
 * POST /api/leads/template-download
 *
 * Captures an email from the Mr Props template download gate.
 *
 * Minimal lead capture: store (email, content_piece_id, source_url, ip, ua)
 * in Supabase `template_leads` table and respond with the download URL that
 * the client already has (no secret to reveal — the Storage URL is public).
 *
 * Intentionally NOT sending a welcome email today. We don't yet have a
 * transactional provider wired against mrprops.io (needs DNS SPF+DKIM +
 * Resend/SendGrid account). Once that lands, a follow-up job will:
 *   1) send welcome email to new leads (via a row-insert trigger or cron)
 *   2) backfill-welcome any pre-existing rows
 * Column `welcome_email_sent_at` is already on the table to track that.
 *
 * Runtime: nodejs (not Edge) so we can use @supabase/supabase-js. If this
 * route gets hot we can migrate to Edge + PostgREST fetch later.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const content_piece_id = typeof body.content_piece_id === 'string' ? body.content_piece_id : null;
  const source_url = typeof body.source_url === 'string' ? body.source_url.slice(0, 2048) : null;

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'invalid email' }, { status: 400 });
  }

  // Pull IP + UA from request headers. Vercel sets x-forwarded-for; we take
  // the first value. Neither is critical — used for fraud/abuse diagnostics.
  const ip = (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '').split(',')[0].trim() || null;
  const userAgent = req.headers.get('user-agent')?.slice(0, 512) || null;
  const referrer = req.headers.get('referer')?.slice(0, 2048) || null;

  try {
    const sb = createClient(url, key);
    const { error } = await sb.from('template_leads').insert({
      email,
      content_piece_id,
      source_url,
      source: 'template-download',
      ip,
      user_agent: userAgent,
      referrer,
    });
    if (error) {
      // Don't leak DB errors to the client; log + respond generic. The
      // download still happens client-side even if this fails.
      console.error('[template-download] insert failed:', error);
      return NextResponse.json({ captured: false, error: 'capture failed' }, { status: 500 });
    }
  } catch (err) {
    console.error('[template-download] unexpected error:', err);
    return NextResponse.json({ captured: false, error: 'server error' }, { status: 500 });
  }

  return NextResponse.json({ captured: true });
}
