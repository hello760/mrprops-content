/**
 * GET /api/newsletter/confirm?token=<signed-token>
 *
 * Soft double opt-in confirmation. Subscriber clicks the "keep getting these"
 * CTA in Email 1 → lands here → token verified → confirmed_at set →
 * redirected to /newsletter/confirmed thank-you page.
 *
 * Without confirmation, the sequence engine cron skips them entirely
 * (Email 2-10 never ship). This is the engagement-rate-protecting layer.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from '@/lib/newsletter-tokens';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.redirect(new URL('/newsletter/confirmed?status=invalid', req.url));
  }

  const payload = verifyToken(token, 'confirm');
  if (!payload) {
    return NextResponse.redirect(new URL('/newsletter/confirmed?status=invalid', req.url));
  }

  try {
    const sb = createClient(url, key);

    // Lookup subscriber to check for test_compressed_daily override
    const { data: subRow } = await sb
      .from('newsletter_subscribers')
      .select('metadata')
      .eq('id', payload.sub)
      .single();
    const meta = (subRow?.metadata ?? {}) as Record<string, unknown>;
    const testCompressed = meta.test_compressed_daily === true;
    const daysOffset = testCompressed ? 1 : 2;

    const { error } = await sb
      .from('newsletter_subscribers')
      .update({
        confirmed_at: new Date().toISOString(),
        // First scheduled-next: Day 2 from confirmation (not from subscribe).
        // Test mode (Helvis review): Day 1 to compress cadence to 1/day.
        scheduled_next_at: new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq('id', payload.sub)
      .is('unsubscribed_at', null);

    if (error) {
      console.error('[newsletter/confirm] update failed:', error);
      return NextResponse.redirect(new URL('/newsletter/confirmed?status=error', req.url));
    }
  } catch (err) {
    console.error('[newsletter/confirm] unexpected error:', err);
    return NextResponse.redirect(new URL('/newsletter/confirmed?status=error', req.url));
  }

  return NextResponse.redirect(new URL('/newsletter/confirmed?status=ok', req.url));
}
