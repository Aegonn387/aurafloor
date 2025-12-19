#!/bin/bash
echo "🧹 NUCLEAR CLEAN: Removing all cached files..."
rm -rf node_modules .next .vercel 2>/dev/null || true
echo "✅ Cache cleared!"
