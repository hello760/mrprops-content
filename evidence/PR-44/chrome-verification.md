# NAILS evidence — live preview verification (commit cf3084a)

Preview (Vercel build READY, verified via API on HEAD sha cf3084a):
https://mrprops-content-f5wj90oy2-helvijs-schmoteks-projects.vercel.app/regulations/general/airbnb-rules-tennessee

Verified by Chrome MCP crawl (get_page_text document order) + read_page (interactive)
+ screenshots (top card, bottom detailed checklist). Screenshots are viewable live
at the URL above (this session cannot persist PNGs into the repo).

Document order observed (top → bottom):
1. Table of Contents — "1. Regulatory Overview" … "11. Resources" … "Disclaimer".
   Clean: no duplicate title entry, no double-numbering, no checklist entry. (Req 3 PASS)
2. "Tennessee STR Compliance Checklist" — SHORT interactive card, real <input type=checkbox>
   (8 ORIGINAL automated items: municipal permit, $10k business license, zoning,
   safety equipment, $1M insurance, 60-min agent, combined tax rate, census-tract cap),
   positioned directly after the TOC. (Req 2 top PASS — interactive, original content)
3. Body — "1. Regulatory Overview" … "Disclaimer". No ☐ boxes; no overview teaser /
   repeated title / injected meta description. (Req 2 strip + Req 3 PASS)
4. "Tennessee Airbnb Compliance Checklist" — DETAILED ☐ list (9 items w/ sub-bullets)
   rendered AFTER the Disclaimer (with a top-border divider) and BEFORE the FAQ. (Req 2 bottom PASS)
5. Sidebar newsletter — headline "Join hosts running smarter portfolios" + approved body
   copy "…from Helvis and our community, who run 100s of STRs + LTRs around the Globe.";
   email + Subscribe wired to /api/newsletter/subscribe. (Req 1 PASS)
6. FAQ accordion (below the grid).

read_page(interactive): newsletter textbox[type=email] + Subscribe[type=submit] present;
TOC links resolve to body section ids.
