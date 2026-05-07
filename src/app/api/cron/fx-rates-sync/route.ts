/**
 * POST /api/cron/fx-rates-sync (also accepts GET for Vercel cron)
 *
 * Daily cron (06:00 UTC). Fetches FX rates from frankfurter.app (free ECB rates,
 * no API key, EUR-base) and upserts into fx_rates table.
 *
 * Currencies fetched: USD, GBP, AUD, CAD, CHF, SEK, NOK, DKK, PLN, CZK, HUF, RON, BGN, JPY
 *
 * Auth: Authorization: Bearer ${REVALIDATE_SECRET}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const TRACKED_CURRENCIES = [
  'USD', 'GBP', 'AUD', 'CAD', 'CHF', 'SEK', 'NOK', 'DKK',
  'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'JPY',
];

function checkCronAuth(req: NextRequest): boolean {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected) return false;
  return req.headers.get('authorization') === `Bearer ${expected}`;
}

async function POST_handler(req: NextRequest) {
  if (!checkCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const sb = createClient(url, key);
  const fetchedAt = new Date().toISOString();

  // frankfurter.app: GET https://api.frankfurter.app/latest?from=EUR&to=USD,GBP,...
  // Returns: { amount: 1, base: "EUR", date: "...", rates: { USD: 1.10, GBP: 0.86, ... } }
  // Their rate value means: 1 EUR = X target. We store rate_to_eur = 1/X (i.e. 1 target = 1/X EUR).
  const fxUrl = `https://api.frankfurter.app/latest?from=EUR&to=${TRACKED_CURRENCIES.join(',')}`;

  let frankfurterResponse: { rates: Record<string, number>; date: string };
  try {
    const res = await fetch(fxUrl);
    if (!res.ok) throw new Error(`frankfurter HTTP ${res.status}`);
    frankfurterResponse = await res.json();
  } catch (err) {
    console.error('[cron/fx-rates-sync] fetch failed:', err);
    return NextResponse.json({ error: 'fetch failed', detail: String(err) }, { status: 500 });
  }

  const updates: Array<{ currency: string; rate_to_eur: number; fetched_at: string }> = [
    { currency: 'EUR', rate_to_eur: 1.0, fetched_at: fetchedAt },
  ];
  for (const [currency, eurToTarget] of Object.entries(frankfurterResponse.rates)) {
    if (eurToTarget > 0) {
      // 1 target = (1/eurToTarget) EUR
      updates.push({ currency, rate_to_eur: 1 / eurToTarget, fetched_at: fetchedAt });
    }
  }

  const { error } = await sb.from('fx_rates').upsert(updates, { onConflict: 'currency' });
  if (error) {
    console.error('[cron/fx-rates-sync] upsert failed:', error);
    return NextResponse.json({ error: 'upsert failed' }, { status: 500 });
  }

  return NextResponse.json({
    ran_at: fetchedAt,
    rate_date: frankfurterResponse.date,
    currencies_updated: updates.length,
    updates: updates.map(u => ({ c: u.currency, r: u.rate_to_eur.toFixed(6) })),
  });
}

export { POST_handler as POST };
export const GET = POST_handler;
