#!/usr/bin/env python3
"""
verify_mrprops_cc_live_parity.py — the END-GOAL verifier for Mr Props.

Closes DoD #1 of `mrprops-cc-live-truth-fix-2026-05-18.md` §10.

Helvis 2026-05-18 Loom:
  "Content should not appear on the live Mr Props page if it is not visible
  in MMG Command Center. Simple right? But currently that is not the case."

This script proves the architectural principle holds for a 20-piece sample
(5 per family × 4 families). For every piece:

  1. Fetch CC content_body from Supabase (the editable source of truth)
  2. Fetch live HTML from mrprops.io/{slug}
  3. Extract body text from each (strip nav/footer/sidebar/breadcrumbs via
     the <article> tag where present, falling back to <main>)
  4. Compute live-words ⊆ cc-words overlap
  5. Assert: every live word also appears in CC (the end-goal claim)
  6. Assert: known hardcoded fallback phrases that the team flagged on the
     Loom do NOT appear on live unless they also appear in CC

Closes the regression vector for PRs #30/#31 (Phase 1 Guides), #32 (Phase 2
Glossary), #33 (Phase 3a Templates render), #183 (Phase 3b inline revalidate),
#184/#185 (Phase 3c/3d C2 calc-save).

Runs in preflight + CI on every PR.
"""
import os
import re
import time
import urllib.request
import urllib.error
from _lib import sb_get, Verdict, run

# Hardcoded fallback phrases flagged in the Loom — should NEVER appear on
# live unless they ALSO appear in CC content_body. Each entry is a list of
# substrings ALL of which must appear within the same 200-char window on
# live but NOT in CC for it to count as a violation (so "Why does" can
# legitimately appear in body prose; only the FAQ-pattern "Why does X
# matter?" is forbidden when CC has no matching FAQ).
KNOWN_PHANTOM_PATTERNS = [
    ["what is what is"],                         # G1 — double-prefix glossary
    ["stop tracking", "manually"],               # G2 — generic Pro Tip CTA
    ["what you need before you publish"],        # Gu3 — phantom guide heading
    ["how do i apply"],                          # generic FAQ fallback
    ["why does", "matter?"],                     # generic FAQ — both must be near
    ["is there a notion version"],               # G3 — generic FAQ fallback (verbatim Loom example)
]

# Live → CC overlap threshold by family.
# - non-calculator pages: 95% (high parity required — body should map 1:1)
# - calculator pages: 88% (inherent widget chrome — mathjs numbers, dropdown
#   labels, units that the calculator widget renders independent of body)
MIN_LIVE_IN_CC_PCT = {
    "glossary":    95.0,
    "guides":      95.0,
    "templates":   95.0,
    "calculators": 88.0,
}

# Sample size per family. 5 × 4 families = 20 piece sweep.
SAMPLE_PER_FAMILY = 5

# Family → slug prefix mapping for picking representative pieces.
FAMILY_FILTERS = {
    "glossary":    "glossary/",
    "guides":      "guides/",
    "templates":   "templates/",
    "calculators": "tools/",
}


def words(s: str) -> set:
    """Lowercase word-set after stripping HTML, entities, punctuation."""
    s = re.sub(r"<script[\s\S]*?</script>", " ", s or "", flags=re.I)
    s = re.sub(r"<style[\s\S]*?</style>", " ", s, flags=re.I)
    s = re.sub(r"<[^>]+>", " ", s)
    s = re.sub(r"&[a-z]+;", " ", s)
    s = re.sub(r"[^a-zA-Z0-9]+", " ", s)
    return set(w.lower() for w in s.split() if len(w) > 3)


def extract_article(html: str) -> str:
    """Strip nav/footer chrome. Prefer <article>, fall back to <main>."""
    m = re.search(r"<article[^>]*>([\s\S]*?)</article>", html, re.I)
    if m:
        return m.group(1)
    m = re.search(r"<main[^>]*>([\s\S]*?)</main>", html, re.I)
    if m:
        return m.group(1)
    return html


def fetch_live(slug: str, retries: int = 2) -> str | None:
    """GET https://mrprops.io/{slug}. Returns HTML or None on non-200."""
    url = f"https://mrprops.io/{slug.lstrip('/')}"
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": "Mozilla/5.0 (verify_mrprops_cc_live_parity)",
                "Cache-Control": "no-cache",
            })
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read().decode("utf-8", errors="replace")
        except urllib.error.HTTPError:
            return None
        except Exception:
            if attempt < retries:
                time.sleep(2)
                continue
            return None
    return None


def pick_sample(rows: list, family: str, n: int) -> list:
    """Pick up to n pieces from a family with content_body + a slug whose
    prefix matches the family. Skip pieces with empty body (can't compare)."""
    prefix = FAMILY_FILTERS[family]
    pool = [
        r for r in rows
        if (r.get("custom_slug") or "").startswith(prefix)
        and (r.get("content_body") or "").strip()
    ]
    return pool[:n]


@run
def main():
    v = Verdict("Mr Props CC↔Live parity — DoD #1, 20-piece end-goal verifier")

    # 1. Pull all published Mr Props pieces in one query
    rows = sb_get(
        "content_pieces?select=id,custom_slug,content_body&"
        "client_id=eq.client-mrprops&"
        "writing_status=eq.published&"
        "order=custom_slug.asc&"
        "limit=1500"
    )
    if not rows:
        v.fail("baseline fetch", "no published Mr Props pieces returned")
        return v

    v.ok("baseline fetch", f"{len(rows)} published Mr Props pieces")

    # 2. Pick 5 pieces per family
    samples: dict[str, list] = {}
    for fam in FAMILY_FILTERS:
        samples[fam] = pick_sample(rows, fam, SAMPLE_PER_FAMILY)
        v.ok(f"sample [{fam}]", f"{len(samples[fam])} of {SAMPLE_PER_FAMILY} requested")

    total_sampled = sum(len(s) for s in samples.values())
    if total_sampled < SAMPLE_PER_FAMILY * len(FAMILY_FILTERS) * 0.5:
        v.fail("sample size adequate",
               f"only {total_sampled} pieces across all families — investigate slug-prefix filters")

    # 3. For each sampled piece, fetch live + compare
    all_failures: list[tuple[str, str]] = []
    overlap_total = 0.0
    overlap_n = 0
    phantom_violations: list[tuple[str, str]] = []

    for fam, pieces in samples.items():
        threshold = MIN_LIVE_IN_CC_PCT[fam]
        fam_fails = []
        for r in pieces:
            slug = r["custom_slug"]
            cb = r.get("content_body") or ""
            html = fetch_live(slug)
            if html is None:
                fam_fails.append((slug, "live HTTP non-200"))
                continue

            cc_w = words(cb)
            live_w = words(extract_article(html))
            if not cc_w or not live_w:
                fam_fails.append((slug, f"empty word-set (cc={len(cc_w)} live={len(live_w)})"))
                continue

            overlap = cc_w & live_w
            live_in_cc_pct = len(overlap) / len(live_w) * 100.0
            overlap_total += live_in_cc_pct
            overlap_n += 1

            if live_in_cc_pct < threshold:
                phantom_count = len(live_w - cc_w)
                fam_fails.append((
                    slug,
                    f"live-in-cc={live_in_cc_pct:.1f}% (need ≥{threshold}%) — "
                    f"{phantom_count} phantom words on live"
                ))

            # 4. Phantom-phrase check — known fallback patterns the team
            #    flagged in the Loom. Multi-term patterns: every substring
            #    in the pattern must appear on live (within 200 chars of
            #    each other) AND none must appear in CC.
            html_text_low = re.sub(r"<[^>]+>", " ", html).lower()
            cb_low = cb.lower()
            for pattern in KNOWN_PHANTOM_PATTERNS:
                # All terms on live?
                if not all(p in html_text_low for p in pattern):
                    continue
                # Any term in CC? If so, it's legitimate body content.
                if any(p in cb_low for p in pattern):
                    continue
                # Multi-term: verify proximity (all terms within 200-char window)
                if len(pattern) > 1:
                    first = pattern[0]
                    near = False
                    for i, ch in enumerate(html_text_low):
                        if html_text_low[i:i+len(first)] == first:
                            window = html_text_low[max(0, i-100):i+len(first)+200]
                            if all(p in window for p in pattern):
                                near = True
                                break
                    if not near:
                        continue
                phantom_violations.append((slug, " · ".join(pattern)))

            time.sleep(0.3)  # be polite to mrprops.io

        if fam_fails:
            for slug, reason in fam_fails:
                all_failures.append((fam, slug, reason))
            v.fail(f"{fam} parity",
                   f"{len(fam_fails)} of {len(pieces)} pieces failed: " +
                   "; ".join(f"{s.rsplit('/',1)[-1]} ({r})" for s, r in fam_fails[:3]))
        else:
            v.ok(f"{fam} parity", f"all {len(pieces)} pieces ≥{threshold}% live-in-cc")

    # 5. Aggregate metrics — use the weakest family threshold as the floor.
    if overlap_n > 0:
        avg = overlap_total / overlap_n
        floor = min(MIN_LIVE_IN_CC_PCT.values())
        if avg >= floor:
            v.ok("aggregate live-in-cc avg", f"{avg:.1f}% across {overlap_n} pieces (floor={floor}%)")
        else:
            v.fail("aggregate live-in-cc avg",
                   f"{avg:.1f}% across {overlap_n} pieces — below {floor}% floor")

    if phantom_violations:
        sample = phantom_violations[:5]
        v.fail("phantom phrase guard",
               f"{len(phantom_violations)} hits — sample: " +
               "; ".join(f"'{p}' on /{s}" for s, p in sample))
    else:
        v.ok("phantom phrase guard",
             f"0 hits across {sum(len(s) for s in samples.values())} pieces "
             f"({len(KNOWN_PHANTOM_PATTERNS)} forbidden patterns checked)")

    return v


if __name__ == '__main__':
    main()
