/**
 * Logarithmic pagination — produces a sorted, deduped list of page numbers
 * to render as crawlable links. Always includes 1, current, N. Adds
 * logarithmic milestones (2, 4, 8, 16, ...) and a local window around current
 * so deep pages stay reachable in O(log N) clicks.
 *
 * See: `.claude/skills/pagination/SKILL.md` for the full pattern, source
 * (audisto.com/guides/pagination), and rationale.
 */
export function logarithmicPageLinks(currentPage: number, totalPages: number, windowSize = 2): number[] {
  if (totalPages <= 1) return [1];
  const pages = new Set<number>();
  pages.add(1);
  pages.add(totalPages);
  pages.add(currentPage);

  // Local window around current page
  for (let i = -windowSize; i <= windowSize; i++) {
    const p = currentPage + i;
    if (p >= 1 && p <= totalPages) pages.add(p);
  }

  // Logarithmic milestones from page 1
  for (let step = 2; step < totalPages; step *= 2) {
    pages.add(step);
  }

  // Logarithmic milestones from page N (going backward)
  for (let step = 1; step < totalPages; step *= 2) {
    const p = totalPages - step;
    if (p >= 1) pages.add(p);
  }

  return Array.from(pages).sort((a, b) => a - b);
}

/**
 * Build a paginated URL for a listing page. Page 1 has no `?page=` (canonical).
 * Pages 2+ use `?page=N`. Preserves any other query params on `base` if encoded
 * (e.g. base = "/guides", page = 2 → "/guides?page=2").
 */
export function pageHref(basePath: string, page: number): string {
  if (page <= 1) return basePath;
  const sep = basePath.includes('?') ? '&' : '?';
  return `${basePath}${sep}page=${page}`;
}
