import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("c") || "operations";
  const slug = request.nextUrl.searchParams.get("s") || "airbnb-turnover-cost-calculator";
  
  const result: Record<string, any> = { category, slug, steps: [] };
  
  // Step 1: Import getSupabase
  try {
    const { getSupabase } = await import("@/lib/supabase");
    result.steps.push("1. import OK");
    
    // Step 2: Call getSupabase
    const sb = getSupabase();
    result.steps.push(`2. getSupabase() = ${sb ? "CLIENT" : "NULL"}`);
    
    if (!sb) {
      result.error = "getSupabase() returned null";
      return NextResponse.json(result);
    }
    
    // Step 3: Check env
    result.steps.push(`3. MR_PROPS_CLIENT_ID = ${process.env.MR_PROPS_CLIENT_ID || "MISSING"}`);
    
    // Step 4: Run query
    const slugVariants = [`tools/${category}/${slug}`, `tools/${slug}`, slug];
    result.slugVariants = slugVariants;
    
    const { data, error } = await sb
      .from("content_pieces")
      .select("id, custom_slug, title, type_of_work")
      .eq("client_id", process.env.MR_PROPS_CLIENT_ID || "")
      .eq("writing_status", "published")
      .not("structured_data", "is", null)
      .in("custom_slug", slugVariants)
      .single();
    
    result.steps.push(`4. query: data=${data ? "FOUND" : "NULL"}, error=${error ? error.message : "none"}`);
    result.data = data;
    result.error = error?.message;
    
  } catch (e: any) {
    result.steps.push(`ERROR: ${e.message}`);
    result.error = e.message;
  }
  
  return NextResponse.json(result);
}
