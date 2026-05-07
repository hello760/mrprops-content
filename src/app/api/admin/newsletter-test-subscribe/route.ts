/**
 * POST /api/admin/newsletter-test-subscribe
 *
 * Admin-only endpoint to subscribe an email address with test_compressed_daily=true
 * so that the daily newsletter-sequence cron ships emails 2-10 at 1/day cadence
 * (instead of the production +2/+4/+7/+10/+14/+18/+23/+28/+35 schedule).
 *
 * Auth: Authorization: Bearer ${REVALIDATE_SECRET}
 *
 * Body: { email: string, currency?: string, force_confirm?: boolean }
 *
 * Behavior:
 *   1. Insert (or upsert) subscriber row with metadata.test_compressed_daily=true
 *   2. If force_confirm=true: set confirmed_at=now, current_step=1, scheduled_next_at=now
 *      (so the very next cron tick will send Email 2 — followed by 3, 4, ..., 10 over 9 days)
 *   3. Returns the subscriber row
 *
 * NOTE: Email 1 is NOT sent by this endpoint. It mirrors a confirmed-mid-sequence
 * subscriber. Use this AFTER Postmark account approval lands. Helvis can then
 * either:
 *   (a) hit POST /api/cron/newsletter-sequence manually 9 times (one per day) to
 *       receive emails 2-10, or
 *   (b) wait for the daily Vercel cron at 10 UTC and receive one email per day
 *       automatically.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTemplate } from '@/lib/postmark';
import { signToken } from '@/lib/newsletter-tokens';
import { fetchFxRates, buildLocalizedModel } from '@/lib/newsletter-localize';

export const runtime = 'nodejs';

function checkAuth(req: NextRequest): boolean {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected) return false;
  return req.headers.get('authorization') === `Bearer ${expected}`;
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  let body: { email?: string; currency?: string; force_confirm?: boolean; send_email_1?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const email = (body.email ?? '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'invalid email' }, { status: 400 });
  }

  const sb = createClient(url, key);
  const now = new Date().toISOString();

  // Check for existing row first
  const { data: existing } = await sb
    .from('newsletter_subscribers')
    .select('id, email, current_step, confirmed_at, metadata')
    .eq('email', email)
    .is('unsubscribed_at', null)
    .maybeSingle();

  const baseMetadata = ((existing?.metadata as Record<string, unknown>) ?? {});
  const newMetadata = { ...baseMetadata, test_compressed_daily: true, test_subscribed_at: now };

  let row;
  if (existing) {
    // Upgrade existing row to test mode + (optionally) force-confirm
    const updates: Record<string, unknown> = {
      metadata: newMetadata,
      currency: body.currency ?? 'EUR',
    };
    if (body.force_confirm) {
      updates.confirmed_at = now;
      updates.current_step = 1; // pretend Email 1 was sent
      updates.scheduled_next_at = now; // due immediately
    }
    const { data: updated, error } = await sb
      .from('newsletter_subscribers')
      .update(updates)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) {
      console.error('[admin/newsletter-test-subscribe] update failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    row = updated;
  } else {
    // Fresh insert
    const insert: Record<string, unknown> = {
      email,
      source: 'admin_test_subscribe',
      currency: body.currency ?? 'EUR',
      country: null,
      sequence_id: 'welcome_v1',
      current_step: body.force_confirm ? 1 : 0,
      metadata: newMetadata,
    };
    if (body.force_confirm) {
      insert.confirmed_at = now;
      insert.scheduled_next_at = now;
    }
    const { data: inserted, error } = await sb
      .from('newsletter_subscribers')
      .insert(insert)
      .select()
      .single();
    if (error) {
      console.error('[admin/newsletter-test-subscribe] insert failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    row = inserted;
  }

  // Optionally send Email 1 (welcome-1) directly + record it
  let email1Result: { ok: boolean; message?: string } | null = null;
  if (body.send_email_1) {
    try {
      const rates = await fetchFxRates(sb);
      const confirmToken = signToken(row.id, 'confirm');
      const unsubToken = signToken(row.id, 'unsub');
      const model = buildLocalizedModel(row.currency || 'EUR', rates, {
        confirm_url: `https://mrprops.io/api/newsletter/confirm?token=${confirmToken}`,
        unsubscribe_url: `https://mrprops.io/newsletter/unsubscribed?token=${unsubToken}`,
        first_name: 'there',
      });

      const sendResult = await sendTemplate({
        To: row.email,
        TemplateAlias: 'welcome-1',
        TemplateModel: model,
        MessageStream: 'broadcast',
        Tag: 'welcome-step-1-test',
        Metadata: { subscriber_id: row.id, sequence_id: 'welcome_v1', step: '1', test: 'true' },
        TrackOpens: true,
        TrackLinks: 'HtmlAndText',
      });

      // Record the send + advance state so cron picks up Email 2 next
      const newMsgIds = [
        ...((row.postmark_message_ids as Array<unknown>) ?? []),
        { step: 1, message_id: sendResult.MessageID, sent_at: sendResult.SubmittedAt },
      ];
      await sb
        .from('newsletter_subscribers')
        .update({
          last_email_sent_at: now,
          postmark_message_ids: newMsgIds,
          // scheduled_next_at already set to now by force_confirm; leave as is so cron picks up Email 2 immediately on next tick
        })
        .eq('id', row.id);

      email1Result = { ok: true, message: sendResult.MessageID };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      email1Result = { ok: false, message: msg };
    }
  }

  return NextResponse.json({
    ok: true,
    upserted: existing ? 'updated' : 'inserted',
    force_confirmed: !!body.force_confirm,
    email_1_sent: email1Result,
    subscriber: row,
    note: 'Once Postmark approval lands: re-call this endpoint with send_email_1=true to ship Email 1 immediately. Daily cron at 10 UTC will then ship Emails 2-10 at +24h cadence (test_compressed_daily=true).',
  });
}
