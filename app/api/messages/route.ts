import { NextResponse } from 'next/server';

// CRITICAL: Required for static export builds [citation:2]
export const dynamic = 'force-static';
export const revalidate = 3600; // Optional: Cache for 1 hour

export async function GET() {
  // Static placeholder response for deployment
  const staticResponse = {
    message: "Messages endpoint is statically generated.",
    note: "Dynamic features are unavailable in static export.",
    data: []
  };

  return NextResponse.json(staticResponse);
}

// Handle other HTTP methods if needed
export async function POST() {
  return NextResponse.json(
    { error: "Method not available in static build" },
    { status: 405 }
  );
}
