import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category") || "operations";
  const slug = request.nextUrl.searchParams.get("slug") || "airbnb-turnover-cost-calculator";
  
  const results: Record<string, any> = {
    category,
    slug,
    envCheck: {
      hasUrl: !!process.env.SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
      hasClientId: !!process.env.MR_PROPS_CLIENT_ID,
      clientId: process.env.MR_PROPS_CLIENT_ID,
    }
  };
  
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
    results.keyUsed = key.substring(0, 15) + "...";
    
    const sb = createClient(process.env.SUPABASE_URL!, key);
    
    const slugVariants = [`tools/${category}/${slug}`, `tools/${slug}`, slug];
    results.slugVariants = slugVariants;
    
    const { data, error } = await sb
      .from("content_pieces")
      .select("id, custom_slug, writing_status, client_id")
      .eq("client_id", process.env.MR_PROPS_CLIENT_ID!)
      .eq("writing_status", "published")
      .not("structured_data", "is", null)
      .in("custom_slug", slugVariants)
      .single();
    
    results.queryResult = data ? { id: data.id, slug: data.custom_slug, status: data.writing_status } : null;
    results.queryError = error ? error.message : null;
    
  } catch (e: any) {
    results.error = e.message;
  }
  
  return NextResponse.json(results);
}
