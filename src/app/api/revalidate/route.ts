import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const secret = body.secret || request.nextUrl.searchParams.get("secret");
  const paths = body.paths || (body.path ? [body.path] : []);

  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  if (!paths.length) {
    return NextResponse.json({ error: "No paths provided" }, { status: 400 });
  }

  const results: { path: string; revalidated: boolean }[] = [];
  for (const path of paths) {
    try {
      revalidatePath(path);
      results.push({ path, revalidated: true });
    } catch (err) {
      results.push({ path, revalidated: false });
    }
  }

  return NextResponse.json({ results, revalidatedAt: Date.now() });
}
