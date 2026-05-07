/**
 * POST /api/postmark/webhook
 *
 * Receives Postmark webhook events:
 *   - Bounce         (RecordType: "Bounce")          → set bounced_at
 *   - SpamComplaint  (RecordType: "SpamComplaint")   → set spam_complained_at
 *   - SubscriptionChange (RecordType: "SubscriptionChange") → set unsubscribed_at
 *   - Open / Click / Delivery — logged, no DB update needed (Postmark dashboard has these)
 *
 * Auth: HTTP basic auth (POSTMARK_WEBHOOK_USER + POSTMARK_WEBHOOK_PASS) configured
 * in Postmark dashboard webhook URL like:
 *   https://postmark_xxx:secretpass@mrprops.io/api/postmark/webhook
 * On Postmark's side the basic-auth creds get stripped when constructing the Authorization
 * header, so we verify here.
 *
 * Returns 200 always (after auth check) — Postmark retries on non-200.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

interface PostmarkWebhookEvent {
  RecordType: 'Bounce' | 'SpamComplaint' | 'SubscriptionChange' | 'Open' | 'Click' | 'Delivery';
  Email?: string;                  // recipient email
  MessageID?: string;
  // Bounce fields
  Type?: string;                   // 'HardBounce' | 'SoftBounce' | etc.
  // SubscriptionChange fields
  SuppressSending?: boolean;       // true = unsub
  SuppressionReason?: string;
  Origin?: string;                 // 'Recipient' | 'Customer' | 'Admin'
  Metadata?: Record<string, string>;
}

function checkBasicAuth(req: NextRequest): boolean {
  const expectedUser = process.env.POSTMARK_WEBHOOK_USER;
  const expectedPass = process.env.POSTMARK_WEBHOOK_PASS;
  if (!expectedUser || !expectedPass) {
    // If not configured, allow (dev mode). In production, set both env vars.
    console.warn('[postmark/webhook] basic-auth env vars not set — accepting unauthenticated webhook');
    return true;
  }
  const auth = req.headers.get('authorization') || '';
  if (!auth.startsWith('Basic ')) return false;
  try {
    const decoded = Buffer.from(auth.slice(6), 'base64').toString('utf-8');
    const [user, pass] = decoded.split(':');
    return user === expectedUser && pass === expectedPass;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!checkBasicAuth(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    // Acknowledge so Postmark doesn't retry, but log
    console.error('[postmark/webhook] Supabase not configured');
    return NextResponse.json({ ok: true });
  }

  let event: PostmarkWebhookEvent;
  try {
    event = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const email = event.Email?.trim().toLowerCase();
  const sb = createClient(url, key);
  const now = new Date().toISOString();

  try {
    switch (event.RecordType) {
      case 'Bounce': {
        if (!email) break;
        // Only mark bounced for hard bounces; soft bounces handled by Postmark retry
        const isHard = event.Type?.toLowerCase().includes('hard') ?? false;
        if (isHard) {
          await sb
            .from('newsletter_subscribers')
            .update({ bounced_at: now })
            .eq('email', email)
            .is('bounced_at', null);
          console.log(`[postmark/webhook] bounced: ${email} (type=${event.Type})`);
        }
        break;
      }
      case 'SpamComplaint': {
        if (!email) break;
        await sb
          .from('newsletter_subscribers')
          .update({ spam_complained_at: now, unsubscribed_at: now })
          .eq('email', email)
          .is('spam_complained_at', null);
        console.log(`[postmark/webhook] spam complaint: ${email}`);
        break;
      }
      case 'SubscriptionChange': {
        if (!email) break;
        if (event.SuppressSending) {
          await sb
            .from('newsletter_subscribers')
            .update({ unsubscribed_at: now })
            .eq('email', email)
            .is('unsubscribed_at', null);
          console.log(`[postmark/webhook] unsubscribed: ${email} (origin=${event.Origin})`);
        }
        break;
      }
      // Open/Click/Delivery: Postmark dashboard tracks. No DB update needed for v1.
      default:
        break;
    }
  } catch (err) {
    console.error('[postmark/webhook] handler error:', err);
    // Still return 200 so Postmark doesn't retry — we've logged
  }

  return NextResponse.json({ ok: true });
}
