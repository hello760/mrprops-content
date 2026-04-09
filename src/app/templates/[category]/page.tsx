import { TemplatesIndexClient } from "@/components/client/TemplatesIndexClient";
import { fetchTemplates, splitNestedSlug } from "@/lib/content-pages";
import { buildMetadata } from "@/lib/metadata";

export const revalidate = 3600;

function titleCaseCategory(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function generateStaticParams() {
  const pages = await fetchTemplates();
  return Array.from(new Set(pages.map((page) => splitNestedSlug(page.slug, "templates", 2)[0]).filter(Boolean))).map((category) => ({ category }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const label = titleCaseCategory(category);
  return buildMetadata(`${label} Templates`, `Browse ${label.toLowerCase()} templates for hosts and property managers.`, `/templates/${category}`);
}

export default async function TemplatesCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const pages = await fetchTemplates();
  const mapped = pages
    .map((page) => {
      const [pageCategory, slug] = splitNestedSlug(page.slug, "templates", 2);
      return { ...page, category: pageCategory, href: `/templates/${pageCategory}/${slug}` };
    })
    .filter((page) => page.category === category);

  return <TemplatesIndexClient pages={mapped} initialCategory={titleCaseCategory(category)} />;
}
