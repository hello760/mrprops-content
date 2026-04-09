import type { Metadata } from "next";

export function buildMetadata(title: string, description: string, path: string): Metadata {
  const canonical = path.startsWith("/") ? path : `/${path}`;
  // Strip existing "| Mr. Props" suffix to prevent double append from layout template
  const cleanTitle = title.replace(/\s*\|\s*Mr\.?\s*Props\s*$/i, '').trim();

  return {
    title: cleanTitle,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}
