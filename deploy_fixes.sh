#!/bin/bash
echo "=== Deploying Domain Fixes ==="
echo ""

echo "1. Checking git status..."
git status --short
echo ""

echo "2. Adding all corrected files..."
git add .
echo ""

echo "3. Committing changes..."
git commit -m "Fix: Update domain references from aurafloo.co.za to aurafloor.co.za for Pi Network verification"
echo ""

echo "4. Pushing to GitHub..."
git push origin main
echo ""

echo "5. Deployment triggered!"
echo "   Netlify will now build and deploy with the corrected domain."
echo "   Wait 1-2 minutes for deployment to complete."
echo ""
echo "6. After deployment, test with:"
echo "   curl -s -o /dev/null -w '%{http_code}' https://aurafloor.co.za/validation-key.txt"
echo "   Should return '200'"
