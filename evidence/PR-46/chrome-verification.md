# NAILS evidence — live verification, PR #46 (sha dfe135c1)

Preview (Vercel build READY via API): 
https://mrprops-content-ec8kbv6js-helvijs-schmoteks-projects.vercel.app/regulations/general/airbnb-rules-tennessee

Chrome MCP (read_page interactive + find + screenshot), Tennessee:
- TOC: "1. Regulatory Overview" … "Disclaimer" → "Tennessee Airbnb Compliance Checklist"
  (the relocated detailed checklist is listed as the final TOC entry; clean, no overview dup).
- find() → 3 headings: ref_56 "Tennessee STR Compliance Checklist" (SHORT interactive card,
  upper area, after TOC) · ref_357 "Tennessee Airbnb Compliance Checklist" (DETAILED ☐ list,
  near bottom, after Disclaimer) · ref_414 "Track Tennessee STR Compliance Across All Your
  Properties" (sidebar = ORIGINAL per-page CTA — newsletter is NOT in this PR).
- Screenshot: short card checkboxes uniform 24x24 across 1–3 line labels (shrink-0).

mergeable: True (clean on main; no #45 conflict).

Committed test (run in this session): npx tsx --test src/lib/markdown-to-html.test.ts → 6/6 pass,
incl. "DEFAULT (no flag) does NOT strip the checklist" (blast-radius guarantee).
