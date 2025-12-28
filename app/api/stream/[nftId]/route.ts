import { NextResponse } from 'next/server';

export async function generateStaticParams() {
  return [];
}

export const dynamic = 'force-static';

export async function GET(
  request: Request,
  context: { params: { nftId: string } }
) {
  return NextResponse.json({
    endpoint: 'stream',
    nftId: context.params.nftId,
    static: true,
    timestamp: new Date().toISOString()
  });
}
