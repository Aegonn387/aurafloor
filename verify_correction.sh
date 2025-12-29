#!/bin/bash
echo "=== Verification of Domain Correction ==="
echo ""

# Check for any remaining old domain references
echo "1. Searching for any remaining 'aurafloo' references..."
REMAINING=$(grep -r "aurafloo" . --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null | grep -v ".backup." | head -10)
if [ -z "$REMAINING" ]; then
    echo "   ✓ No remaining 'aurafloo' references found."
else
    echo "   ⚠️  Some references still found:"
    echo "$REMAINING"
fi
echo ""

# Test the validation file locally
echo "2. Local validation file check..."
if [ -f "public/validation-key.txt" ]; then
    KEY_CONTENT=$(cat public/validation-key.txt | tr -d '[:space:]')
    KEY_LENGTH=${#KEY_CONTENT}
    echo "   File exists. Key length: $KEY_LENGTH characters"
    
    if [ $KEY_LENGTH -lt 10 ]; then
        echo "   ⚠️  Key seems very short. Ensure it's the full key from Pi Network."
    else
        echo "   ✓ Key appears to be valid length."
    fi
else
    echo "   ✗ File missing! Pi verification will fail."
fi
echo ""

# Check build configuration
echo "3. Checking build configuration..."
if [ -f "package.json" ]; then
    echo "   Package.json scripts:"
    grep -A5 '"scripts"' package.json || echo "   No scripts found"
fi
echo ""

echo "=== Next Steps ==="
echo "1. Review the changes made: git diff"
echo "2. Commit and push:"
echo "   git add ."
echo "   git commit -m 'Update domain references to aurafloor.co.za'"
echo "   git push origin main"
echo "3. Wait for Netlify to deploy (1-2 minutes)"
echo "4. Test the verification URL:"
echo "   curl -I https://aurafloor.co.za/validation-key.txt"
echo "5. If HTTP 200, proceed with Pi Network verification."
