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

  let body: { email?: string; currency?: string; force_confirm?: boolean };
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

  return NextResponse.json({
    ok: true,
    upserted: existing ? 'updated' : 'inserted',
    force_confirmed: !!body.force_confirm,
    subscriber: row,
    note: 'After Postmark approval lands, hit POST /api/cron/newsletter-sequence with REVALIDATE_SECRET to ship the next email. Daily cron at 10 UTC will do this automatically.',
  });
}
