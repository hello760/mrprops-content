/**
 * Content API for mrprops.io
 *
 * Returns structured_data + content_body for a content piece.
 * Used by page components for data fetching.
 *
 * GET /api/content/glossary/dynamic-pricing
 * GET /api/content/features/airbnb-dynamic-pricing-tools
 * GET /api/content/tools/cleaning-fee-calculator
 * GET /api/content/templates/airbnb-welcome-letter-template
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchContentBySlug } from '@/lib/supabase';

export const revalidate = 60; // ISR: revalidate every 60 seconds

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string; slug: string } }
) {
  const { type, slug } = params;

  const piece = await fetchContentBySlug(type, slug);

  if (!piece) {
    return NextResponse.json(
      { error: 'Content not found' },
      { status: 404 }
    );
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
