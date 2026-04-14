/**
 * ISR Revalidation API for mrprops.io
 * Called by MMG Command Center after publishing content.
 *
 * Usage: POST /api/revalidate?secret=xxx&path=/glossary/dynamic-pricing
 */

import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  const path = request.nextUrl.searchParams.get('path');

  // Validate secret
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  if (!path) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
  }

  try {
    revalidatePath(path);
    return NextResponse.json({ revalidated: true, path });
  } catch (err) {
    return NextResponse.json(
      { error: 'Revalidation failed', message: (err as Error).message },
      { status: 500 }
    );
  }
}

// Also support GET for simpler integration
export async function GET(request: NextRequest) {
  return POST(request);
}
