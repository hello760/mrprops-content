import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolPageClient } from "@/components/tools/ToolPageClient";
import { buildMetadata } from "@/lib/metadata";
import { fetchToolPage, getToolFallback, toolFallbacks } from "@/lib/template-tools";

export const revalidate = 3600;

export async function generateStaticParams() {
  return toolFallbacks.map((page) => ({ category: page.category, slug: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string; slug: string }> }): Promise<Metadata> {
  const { category, slug } = await params;
  const page = (await fetchToolPage(category, slug)) || getToolFallback(category, slug);
  return buildMetadata(page?.seoTitle || "Tools", page?.seoDescription || "Tool page.", `/tools/${category}/${slug}`);
}

export default async function ToolPage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  const page = (await fetchToolPage(category, slug)) || getToolFallback(category, slug);

  if (!page) notFound();

  return <ToolPageClient page={page} />;
}
