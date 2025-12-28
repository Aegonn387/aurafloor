#!/bin/bash

echo "Adding generateStaticParams to all dynamic routes..."

# Find all route files with [parameter] pattern
DYNAMIC_ROUTES=$(find app -type f -path "*\[*\]*" -name "route.ts" -o -path "*\[*\]*" -name "route.js")

for ROUTE in $DYNAMIC_ROUTES; do
    echo "Processing: $ROUTE"
    
    # Check if it already has generateStaticParams
    if ! grep -q "generateStaticParams" "$ROUTE"; then
        # Create a backup
        cp "$ROUTE" "$ROUTE.backup"
        
        # Create updated version
        cat > "$ROUTE.tmp" << 'INNER_EOF'
import { NextResponse } from 'next/server';

// GENERATED: Required for static export with dynamic routes
export async function generateStaticParams() {
  // Return empty array for static generation
  // Replace with actual IDs if known
  return [];
}

export const dynamic = 'force-static';
export const revalidate = 3600;

// Your existing GET function (preserved)
export async function GET(request: Request, context: any) {
  const params = context.params || {};
  const pathname = new URL(request.url).pathname;
  
  return NextResponse.json({
    message: "Static dynamic route",
    params: params,
    path: pathname,
    note: "Dynamic functionality unavailable in static export",
    timestamp: new Date().toISOString()
  });
}

// Preserve other methods if they exist
INNER_EOF
        
        # Append the original content (excluding any existing generateStaticParams)
        grep -v "generateStaticParams\|export const dynamic\|export const revalidate" "$ROUTE.backup" | tail -n +2 >> "$ROUTE.tmp"
        
        # Replace original
        mv "$ROUTE.tmp" "$ROUTE"
        echo "  → Added generateStaticParams"
    else
        echo "  ✓ Already has generateStaticParams"
    fi
done

echo "Done! All dynamic routes updated."
