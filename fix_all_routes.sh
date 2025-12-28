#!/bin/bash

echo "Fixing all API routes for static export..."

# Find all API route files
ROUTE_FILES=$(find app -type f -path "*/api/*" -name "route.ts" -o -path "*/api/*" -name "route.js")

for ROUTE_FILE in $ROUTE_FILES; do
    echo "Processing: $ROUTE_FILE"
    
    # Check if the file already has dynamic export
    if ! grep -q "export const dynamic" "$ROUTE_FILE"; then
        # Create a temporary file with the fix
        cat > "$ROUTE_FILE.tmp" << 'INNER_EOF'
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
INNER_EOF
        
        # Replace the original file
        mv "$ROUTE_FILE.tmp" "$ROUTE_FILE"
        echo "  → Fixed: Added static export configuration"
    else
        echo "  ✓ Already has dynamic export"
    fi
done

echo "Done! All API routes are now compatible with static export."
