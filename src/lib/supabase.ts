/**
 * supabase.ts
 *
 * Supabase client for mrprops-content (mrprops.io).
 * Reads content directly from the MMG Supabase database.
 * Replaces Sanity client for all content fetching.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ContentPiece {
  id: string;
  client_id: string;
  custom_slug: string;
  title: string;
  content_type: string;
  content_body: string;
  structured_data: Record<string, unknown> | null;
  writing_status: string;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  primary_keyword: string | null;
  category: string | null;
}

// ─── Content Type Mapping ────────────────────────────────────────────────────

/** Map URL content types to DB content_type values */
const CONTENT_TYPE_MAP: Record<string, string[]> = {
  'glossary': ['glossary_term'],
  'features': ['landing_page', 'features_page'],
  'services': ['landing_page', 'services_page'],
  'tools': ['calculator_tool_page', 'tool_page'],
  'templates': ['lead_gen_template_page', 'template_page'],
};

// ─── Mr Props Client ID ─────────────────────────────────────────────────────
// This should be fetched once or set as env var
const MR_PROPS_CLIENT_ID = process.env.MR_PROPS_CLIENT_ID || '';

async function getMrPropsClientId(): Promise<string> {
  if (MR_PROPS_CLIENT_ID) return MR_PROPS_CLIENT_ID;

  const { data } = await supabase
    .from('clients')
    .select('id')
    .or('slug.eq.mr-props,slug.eq.mrprops')
    .single();

  return data?.id || '';
}

// ─── Fetch functions ─────────────────────────────────────────────────────────

/**
 * Fetch a single content piece by type and slug.
 * This is the main function used by page components.
 */
export async function fetchContentBySlug(
  urlType: string,
  slug: string
): Promise<ContentPiece | null> {
  const clientId = await getMrPropsClientId();
  if (!clientId) {
    console.error('[supabase] Mr Props client ID not found');
    return null;
  }

  const dbTypes = CONTENT_TYPE_MAP[urlType];
  if (!dbTypes) {
    console.error(`[supabase] Unknown URL type: ${urlType}`);
    return null;
  }

  const { data, error } = await supabase
    .from('content_pieces')
    .select('id, client_id, custom_slug, title, content_type, content_body, structured_data, writing_status, published_at, seo_title, seo_description, primary_keyword, category')
    .eq('client_id', clientId)
    .eq('custom_slug', slug)
    .in('content_type', dbTypes)
    .eq('writing_status', 'published')
    .not('structured_data', 'is', null)
    .single();

  if (error || !data) {
    console.error(`[supabase] Content not found: ${urlType}/${slug}`, error?.message);
    return null;
  }

  return data;
}

/**
 * Fetch all published content pieces for a content type (listing pages).
 */
export async function fetchContentList(
  urlType: string,
  category?: string
): Promise<ContentPiece[]> {
  const clientId = await getMrPropsClientId();
  if (!clientId) return [];

  const dbTypes = CONTENT_TYPE_MAP[urlType];
  if (!dbTypes) return [];

  let query = supabase
    .from('content_pieces')
    .select('id, custom_slug, title, content_type, structured_data, writing_status, published_at, seo_title, seo_description, category')
    .eq('client_id', clientId)
    .in('content_type', dbTypes)
    .eq('writing_status', 'published')
    .not('structured_data', 'is', null)
    .order('published_at', { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`[supabase] Failed to fetch ${urlType} list:`, error.message);
    return [];
  }

  return (data || []) as ContentPiece[];
}

/**
 * Fetch all unique categories for a content type (for tools, templates).
 */
export async function fetchCategories(urlType: string): Promise<string[]> {
  const clientId = await getMrPropsClientId();
  if (!clientId) return [];

  const dbTypes = CONTENT_TYPE_MAP[urlType];
  if (!dbTypes) return [];

  const { data, error } = await supabase
    .from('content_pieces')
    .select('category')
    .eq('client_id', clientId)
    .in('content_type', dbTypes)
    .eq('writing_status', 'published')
    .not('category', 'is', null);

  if (error || !data) return [];

  // Deduplicate
  return [...new Set(data.map(d => d.category).filter(Boolean))] as string[];
}
