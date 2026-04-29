import { ToolsIndexClient } from "@/components/client/ToolsIndexClient";
import { fetchTools, splitNestedSlug } from "@/lib/content-pages";
import { buildMetadata } from "@/lib/metadata";

export const revalidate = 3600;
export const metadata = buildMetadata(
  "Tools",
  "Calculator tools for real estate operators.",
  "/tools",
);

export default async function ToolsIndexPage() {
  const tools = await fetchTools();
  const cards = tools.map((tool) => {
    const [category, slug] = splitNestedSlug(tool.slug, "tools", 2);
    const href =
      tool.liveUrl || (category && slug ? `/tools/${category}/${slug}` : `/${tool.slug}`);
    return { ...tool, category: category || "", href };
  });
  return <ToolsIndexClient tools={cards} />;
}
