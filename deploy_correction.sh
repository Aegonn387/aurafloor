#!/bin/bash
echo "=== Deploying Domain Correction ==="
echo ""

# Check git status
echo "1. Checking git status..."
git status --short

echo ""
echo "2. Adding corrected files..."
git add netlify.toml public/validation-key.txt 2>/dev/null

echo ""
echo "3. Committing changes..."
git commit -m "Correct domain to aurafloor.co.za for Pi verification" 2>/dev/null || echo "No new changes or already committed."

echo ""
echo "4. Pushing to trigger Netlify build..."
echo "   Run manually: git push origin main"
echo ""
echo "5. After pushing, check Netlify dashboard:"
echo "   - Go to https://app.netlify.com"
echo "   - Select your site"
echo "   - Check that the latest deploy is for aurafloor.co.za"
