/**
 * Weekly cron — refresh the sitemap.xml CDN edge cache.
 *
 * Why this exists: market-me-good's `publishMrPropsDirect` already calls
 * `/api/revalidate?path=/sitemap.xml` on every Mr Props publish (PR #50), but
 * Vercel's CDN edge has been observed to keep `x-vercel-cache: HIT` on
 * `/sitemap.xml` for 30-60+ minutes after the function-level revalidate fires
 * (confirmed 2026-05-01 with Barcelona regs + NY taxes). The reason isn't
 * fully understood — the in-memory cache invalidation works, but the CDN
 * layer doesn't always honor it for sitemap.xml specifically.
 *
 * This cron forces a definitive sitemap refresh once per week regardless of
 * publish events. Combined with the per-publish trigger, it closes the gap.
 *
 * Schedule: Sundays 03:00 UTC (Vercel cron in vercel.json).
 *
 * Auth: Bearer REVALIDATE_SECRET. We reuse the existing env var (already
 * configured in mrprops-content) instead of provisioning a separate
 * CRON_SECRET — both serve the same trust boundary.
 *
 * Schema: GET (Vercel cron triggers GET requests).
 *
 * 2026-05-01 — Helvis directive: "weekly cron jobs to close both gaps".
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

// Paths to refresh on every cron run. Listed explicitly so this is auditable.
// /sitemap.xml is the load-bearing one; the listing roots are a belt-and-
// suspenders pass to ensure newly-published cards always show.
const PATHS = [
  '/sitemap.xml',
  '/guides',
  '/tools',
  '/templates',
  '/regulations',
  '/taxes',
  '/alternatives',
  '/compare',
  '/glossary',
];

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.REVALIDATE_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Array<{ path: string; ok: boolean; error?: string }> = [];
  for (const path of PATHS) {
    try {
      revalidatePath(path);
      results.push({ path, ok: true });
    } catch (err) {
      results.push({
        path,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({
    ok: true,
    revalidated_at: new Date().toISOString(),
    results,
    summary: {
      total: results.length,
      succeeded: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
    },
  });
}
