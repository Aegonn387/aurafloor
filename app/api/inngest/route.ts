import { NextResponse } from 'next/server';

// Required for static export
export const dynamic = 'force-static';
export const revalidate = 3600; // Revalidate every hour

// Inngest is a background job system - can't run in static build
// This is a placeholder for deployment
export async function GET() {
  return NextResponse.json({ 
    message: "Inngest endpoint is not available in static export.",
    note: "This route requires serverless functions to work properly."
  });
}

export async function POST() {
  return NextResponse.json({ 
    message: "Inngest endpoint is not available in static export.",
    note: "This route requires serverless functions to work properly."
  }, { status: 405 });
}
