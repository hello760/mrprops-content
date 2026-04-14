/**
 * Content API for mrprops.io
 * Returns structured_data + content_body for a content piece.
 * GET /api/content/glossary/dynamic-pricing
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchContentBySlug } from "@/lib/supabase";

export const revalidate = 60;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; slug: string }> }
) {
  const { type, slug } = await params;

  const piece = await fetchContentBySlug(type, slug);

  if (!piece) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: piece.id,
    slug: piece.custom_slug,
    title: piece.title,
    contentType: piece.content_type,
    contentBody: piece.content_body,
    structuredData: piece.structured_data,
    seoTitle: piece.seo_title,
    seoDescription: piece.seo_description,
    publishedAt: piece.published_at,
  });
}

