import { NextResponse } from 'next/server';

// Required for static export
export const dynamic = 'force-static';
export const revalidate = 3600; // Optional: revalidate data every hour

export async function GET() {
  // Static placeholder response
  const staticAnalyticsData = {
    message: "Analytics data is statically generated for deployment.",
    period: "static-build",
    creators: [],
    total: 0
  };
  
  return NextResponse.json(staticAnalyticsData);
}
