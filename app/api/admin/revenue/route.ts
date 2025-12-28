import { NextResponse } from 'next/server';

// These configurations are KEY for static export
export const dynamic = 'force-static';
export const revalidate = 3600; // Optional: revalidate every hour

export async function GET() {
  // Static placeholder response
  const staticRevenueData = {
    message: "Revenue data is statically generated for deployment.",
    revenue: 0,
    period: "static-build"
  };
  
  return NextResponse.json(staticRevenueData);
}
