import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolPageClient } from "@/components/tools/ToolPageClient";
import { buildMetadata } from "@/lib/metadata";
import { fetchToolPage, resolveToolFallback, toolFallbacks } from "@/lib/template-tools";

export const revalidate = 3600;

export async function generateStaticParams() {
  const fromFallbacks = toolFallbacks.map((page) => ({ category: page.category, slug: page.slug }));
  // Include aliased routes so they pre-render at build time
  const aliases = [
    { category: "renovations", slug: "renovation-calculator" },
  ];
  return [...fromFallbacks, ...aliases];
}

export async function generateMetadata({ params }: { params: Promise<{ category: string; slug: string }> }): Promise<Metadata> {
  const { category, slug } = await params;
  const page = (await fetchToolPage(category, slug)) || resolveToolFallback(category, slug);
  return buildMetadata(page?.seoTitle || "Tools", page?.seoDescription || "Tool page.", `/tools/${category}/${slug}`);
}

export default async function ToolPage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  const page = (await fetchToolPage(category, slug)) || resolveToolFallback(category, slug);

  if (!page) notFound();

  return <ToolPageClient page={page} />;
}
