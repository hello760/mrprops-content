import { TemplatesIndexClient } from "@/components/client/TemplatesIndexClient";
import { fetchTemplates, splitNestedSlug } from "@/lib/content-pages";
import { buildMetadata } from "@/lib/metadata";

export const revalidate = 3600;
export const metadata = buildMetadata("Templates", "Lead magnet templates and resource pages for hosts.", "/templates");

export default async function TemplatesIndexPage() {
  const pages = await fetchTemplates();
  const mapped = pages.map((page) => {
    const [category, slug] = splitNestedSlug(page.slug, "templates", 2);
    return { ...page, category, href: `/templates/${category}/${slug}` };
  });
  return <TemplatesIndexClient pages={mapped} />;
}
