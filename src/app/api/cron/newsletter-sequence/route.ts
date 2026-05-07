/**
 * POST /api/cron/newsletter-sequence
 *
 * Daily cron (10:00 UTC). Iterates confirmed-and-active subscribers whose
 * scheduled_next_at is past, sends the next email in their sequence via
 * Postmark broadcast stream, advances current_step + scheduled_next_at.
 *
 * Auth: Authorization: Bearer ${REVALIDATE_SECRET}
 *
 * Sequence cadence (welcome_v1) — days from confirmation:
 *   step 1 → confirmed (Email 1 already sent on subscribe)
 *   step 2 → +2  days
 *   step 3 → +4  days
 *   step 4 → +7  days
 *   step 5 → +10 days
 *   step 6 → +14 days
 *   step 7 → +18 days
 *   step 8 → +23 days
 *   step 9 → +28 days
 *   step 10 → +35 days
 *
 * Idempotency: each row's update is atomic. If Postmark send fails partway,
 * the row's current_step doesn't advance — next cron run retries.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTemplate } from '@/lib/postmark';
import { signToken } from '@/lib/newsletter-tokens';
import { fetchFxRates, buildLocalizedModel } from '@/lib/newsletter-localize';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60s for batch sends

// Days offset from CONFIRMATION for each step (Email 1 already sent on subscribe → confirmed counts as anchor)
const STEP_DAYS_OFFSET: Record<number, number> = {
  2: 2, 3: 4, 4: 7, 5: 10, 6: 14, 7: 18, 8: 23, 9: 28, 10: 35,
};

const SEQUENCE_TEMPLATES: Record<number, string> = {
  2: 'welcome-2', 3: 'welcome-3', 4: 'welcome-4', 5: 'welcome-5',
  6: 'welcome-6', 7: 'welcome-7', 8: 'welcome-8', 9: 'welcome-9', 10: 'welcome-10',
};

const MAX_BATCH = 50; // soft warming cap — we won't send more than 50/run during the first 2 weeks

function checkCronAuth(req: NextRequest): boolean {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected) return false;
  return req.headers.get('authorization') === `Bearer ${expected}`;
}

interface DueRow {
  id: string;
  email: string;
  current_step: number;
  currency: string;
  sequence_id: string;
  postmark_message_ids: Array<{ step: number; message_id: string; sent_at: string }> | null;
}

async function POST_handler(req: NextRequest) {
  if (!checkCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  if (!process.env.POSTMARK_SERVER_TOKEN) return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
  if (!process.env.NEWSLETTER_CONFIRM_SECRET) return NextResponse.json({ error: 'Token secret not configured' }, { status: 500 });

  const sb = createClient(url, key);
  const now = new Date().toISOString();

  // Fetch FX rates once per run
  const rates = await fetchFxRates(sb);

  // Query due-and-confirmed-and-active subscribers (cap to MAX_BATCH for warming)
  const { data, error } = await sb
    .from('newsletter_subscribers')
    .select('id, email, current_step, currency, sequence_id, postmark_message_ids')
    .lte('scheduled_next_at', now)
    .is('unsubscribed_at', null)
    .is('bounced_at', null)
    .eq('paused', false)
    .not('confirmed_at', 'is', null)
    .gte('current_step', 1)         // already received Email 1
    .lt('current_step', 10)         // sequence not exhausted
    .order('scheduled_next_at', { ascending: true })
    .limit(MAX_BATCH);

  if (error) {
    console.error('[cron/newsletter-sequence] query failed:', error);
    return NextResponse.json({ error: 'query failed' }, { status: 500 });
  }

  const rows = (data ?? []) as DueRow[];
  const results: Array<{ id: string; step: number; ok: boolean; message?: string }> = [];

  for (const row of rows) {
    const nextStep = row.current_step + 1;
    const templateAlias = SEQUENCE_TEMPLATES[nextStep];
    if (!templateAlias) {
      results.push({ id: row.id, step: nextStep, ok: false, message: 'no template for step' });
      continue;
    }

    try {
      const confirmToken = signToken(row.id, 'confirm'); // not used after step 1 but harmless
      const unsubToken = signToken(row.id, 'unsub');
      const model = buildLocalizedModel(row.currency || 'EUR', rates, {
        confirm_url: `https://mrprops.io/api/newsletter/confirm?token=${confirmToken}`,
        unsubscribe_url: `https://mrprops.io/newsletter/unsubscribed?token=${unsubToken}`,
        first_name: 'there',
      });

      const sendResult = await sendTemplate({
        To: row.email,
        TemplateAlias: templateAlias,
        TemplateModel: model,
        MessageStream: 'broadcast',
        Tag: `welcome-step-${nextStep}`,
        Metadata: { subscriber_id: row.id, sequence_id: row.sequence_id, step: String(nextStep) },
        TrackOpens: true,
        TrackLinks: 'HtmlAndText',
      });

      const newMsgIds = [...(row.postmark_message_ids ?? []), { step: nextStep, message_id: sendResult.MessageID, sent_at: sendResult.SubmittedAt }];

      // Compute next scheduled_next_at if there IS a next step
      const nextNextStep = nextStep + 1;
      let nextScheduled: string | null = null;
      if (nextNextStep <= 10) {
        // Days offset from CURRENT step's send to NEXT step's send
        // = STEP_DAYS_OFFSET[nextNextStep] - STEP_DAYS_OFFSET[nextStep]
        const daysFromNow = (STEP_DAYS_OFFSET[nextNextStep] ?? 0) - (STEP_DAYS_OFFSET[nextStep] ?? 0);
        nextScheduled = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000).toISOString();
      }

      const { error: updErr } = await sb
        .from('newsletter_subscribers')
        .update({
          current_step: nextStep,
          last_email_sent_at: now,
          scheduled_next_at: nextScheduled,
          postmark_message_ids: newMsgIds,
        })
        .eq('id', row.id);

      if (updErr) {
        results.push({ id: row.id, step: nextStep, ok: false, message: `update failed: ${updErr.message}` });
      } else {
        results.push({ id: row.id, step: nextStep, ok: true, message: sendResult.MessageID });
      }
    } catch (sendErr: unknown) {
      const msg = sendErr instanceof Error ? sendErr.message : String(sendErr);
      results.push({ id: row.id, step: nextStep, ok: false, message: msg });
      console.error(`[cron/newsletter-sequence] send failed for ${row.email} step ${nextStep}:`, msg);
    }
  }

  return NextResponse.json({
    ran_at: now,
    eligible: rows.length,
    sent: results.filter(r => r.ok).length,
    failed: results.filter(r => !r.ok).length,
    results,
  });
}

export { POST_handler as POST };
// Vercel cron sends GET; provide GET handler that delegates to POST handler
export const GET = POST_handler;
