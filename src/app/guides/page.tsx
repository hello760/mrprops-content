import type { Metadata } from "next";
import { GuideIndexClient } from "@/components/client/GuideIndexClient";
import { fetchGuides } from "@/lib/content-pages";

export const revalidate = 3600;

const ITEMS_PER_PAGE = 9;
const BASE_DESC = "Mr. Props guides and blog content for property managers.";

/**
 * Per-page metadata.
 *
 * • Page 1 (no `?page=` or `?page=1`) self-canonicalizes to `/guides`.
 * • Pages 2+ self-canonicalize to `/guides?page=N`.
 * • rel=prev / rel=next emitted as plain link tags in the head via
 *   `other` (Next.js Metadata doesn't have first-class fields for these).
 *
 * See `.claude/skills/pagination/SKILL.md` for the rationale behind
 * self-canonical pagination (vs. canonicalizing pages 2+ → page 1).
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { page: pageParam } = await searchParams;
  const guides = await fetchGuides();
  const totalPages = Math.max(1, Math.ceil(guides.length / ITEMS_PER_PAGE));
  const requested = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const page = Math.min(requested, totalPages);

  const canonical = page <= 1 ? "/guides" : `/guides?page=${page}`;
  const title = page <= 1 ? "Guides" : `Guides — Page ${page}`;

  const other: Record<string, string> = {};
  if (page > 1) other["link:prev"] = page - 1 <= 1 ? "/guides" : `/guides?page=${page - 1}`;
  if (page < totalPages) other["link:next"] = `/guides?page=${page + 1}`;

  return {
    title,
    description: BASE_DESC,
    alternates: {
      canonical,
      // Next.js Metadata API doesn't have a first-class field for rel=prev/next,
      // but it does support arbitrary <link> rels via `alternates.types` is no
      // longer the path; the cleanest cross-version approach is the `other`
      // metadata. Because Bing still uses these and they're free, emit them as
      // plain HTML <link> via a small head fragment in `app/guides/layout.tsx`
      // when needed. For now the canonical alone is the load-bearing signal.
    },
    openGraph: {
      title,
      description: BASE_DESC,
      url: canonical,
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description: BASE_DESC },
    other,
  };
}

export default async function GuidesIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const guides = await fetchGuides();
  const requested = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const totalPages = Math.max(1, Math.ceil(guides.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(requested, totalPages);
  return <GuideIndexClient guides={guides} currentPage={currentPage} />;
}
