#!/bin/bash
# Check current domain configuration and Netlify setup
echo "Checking domain configuration..."
echo ""
echo "1. Checking current branch:"
git branch --show-current
echo ""
echo "2. Checking Netlify related files:"
find . -name "netlify.toml" -o -name "_redirects" -o -name "_headers" 2>/dev/null
echo ""
echo "3. Checking public folder for verification files:"
ls -la public/ 2>/dev/null || echo "No public folder found"
echo ""
echo "4. Checking for any .well-known directory:"
find . -name ".well-known" -type d 2>/dev/null
echo ""
echo "5. Checking package.json for build scripts:"
cat package.json | grep -A5 -B5 "scripts" || echo "package.json not found or no scripts"
