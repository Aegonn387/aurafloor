import { NextResponse } from 'next/server';

// MANDATORY for dynamic routes with output: 'export'
export async function generateStaticParams() {
  // Empty array = no pre-generated pages for specific IDs
  return [];
}

// MANDATORY for static export
export const dynamic = 'force-static';

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  return NextResponse.json({
    endpoint: 'nft-like',
    nftId: context.params.id,
    static: true,
    timestamp: new Date().toISOString()
  });
}
