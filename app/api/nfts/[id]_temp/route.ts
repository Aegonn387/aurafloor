import { NextResponse } from 'next/server';

// ABSOLUTELY CRITICAL: This function must exist for dynamic routes with output: 'export'
export async function generateStaticParams() {
  return [];
}

// Also required for static export
export const dynamic = 'force-static';
export const revalidate = 3600;

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({
    endpoint: '/api/nfts/[id]',
    nftId: params.id,
    static: true,
    timestamp: new Date().toISOString(),
    note: "This route now has generateStaticParams()"
  });
}
