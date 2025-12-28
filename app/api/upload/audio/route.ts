import { NextResponse } from 'next/server';

// ⚠️ CRITICAL FOR STATIC EXPORT - DO NOT REMOVE
export const dynamic = 'force-static';
export const revalidate = 3600; // Revalidate cache every hour

// Static placeholder for all API endpoints
// Note: In static export, API routes return pre-generated JSON
export async function GET() {
  return NextResponse.json({
    message: "API endpoint is statically generated",
    note: "Dynamic features require serverless functions",
    endpoint: "REPLACE_WITH_ENDPOINT_NAME",
    timestamp: new Date().toISOString()
  });
}

// Handle other methods with appropriate responses
export async function POST() {
  return NextResponse.json(
    { error: "POST method not available in static build" },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "PUT method not available in static build" },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "DELETE method not available in static build" },
    { status: 405 }
  );
}
