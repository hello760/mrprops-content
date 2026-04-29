import { ToolsIndexClient } from "@/components/client/ToolsIndexClient";
import { fetchTools, splitNestedSlug } from "@/lib/content-pages";
import { buildMetadata } from "@/lib/metadata";

export const revalidate = 3600;

function titleCaseCategory(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function generateStaticParams() {
  const tools = await fetchTools();
  const categories = new Set<string>();
  for (const t of tools) {
    const [cat] = splitNestedSlug(t.slug, "tools", 2);
    if (cat) categories.add(cat);
  }
  return Array.from(categories).map((category) => ({ category }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const label = titleCaseCategory(category);
  return buildMetadata(
    `${label} Calculators`,
    `Browse ${label.toLowerCase()} calculators and tools for short-term rental operators.`,
    `/tools/${category}`,
  );
}

export default async function ToolsCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const tools = await fetchTools();
  const cards = tools
    .map((tool) => {
      const [pageCategory, slug] = splitNestedSlug(tool.slug, "tools", 2);
      const href =
        tool.liveUrl || (pageCategory && slug ? `/tools/${pageCategory}/${slug}` : `/${tool.slug}`);
      return { ...tool, category: pageCategory || "", href };
    })
    .filter((card) => card.category === category);

  return <ToolsIndexClient tools={cards} initialCategory={category} />;
}
