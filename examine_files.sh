#!/bin/bash
# Examine key files for domain verification

echo "=== Checking validation-key.txt ==="
cat public/validation-key.txt
echo ""

echo "=== Checking netlify.toml ==="
cat netlify.toml
echo ""

echo "=== Checking for Pi Network specific files ==="
find . -type f -name "*pi*" -o -name "*verif*" -o -name "*domain*" 2>/dev/null
echo ""

echo "=== Checking if domain is properly configured ==="
echo "Current domain setup in Netlify:"
echo "Note: You need to check Netlify dashboard for domain configuration"
echo ""
echo "To verify on Netlify:"
echo "1. Go to https://app.netlify.com"
echo "2. Select your site"
echo "3. Go to Domain settings"
echo "4. Check if aurafloo.co.za is configured"
echo ""
echo "Common issues:"
echo "- DNS not pointing to Netlify"
echo "- SSL certificate not issued"
echo "- Missing www/non-www redirects"
