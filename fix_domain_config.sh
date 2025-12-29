#!/bin/bash
echo "=== Correcting Domain Configuration ==="
echo "Old domain: aurafloo.co.za"
echo "New domain: aurafloor.co.za"
echo ""

# 1. Check for incorrect domain in files
echo "1. Searching for references to the old domain..."
grep -r "aurafloo\.co\.za" . --exclude-dir=node_modules 2>/dev/null | head -10
echo ""

# 2. Create a new netlify.toml with the correct references
echo "2. Creating corrected netlify.toml..."
cat > netlify.toml << 'NETLIFY'
[build]
  command = "npm run build"
  publish = "out"

[build.environment]
  NODE_VERSION = "22"

# Domain verification for aurafloor.co.za
[[redirects]]
  from = "/validation-key.txt"
  to = "/validation-key.txt"
  status = 200
  force = true

# Main SPA redirect
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
NETLIFY
echo "   ✓ Created new netlify.toml"
echo ""

# 3. Ensure validation file exists
echo "3. Creating/verifying validation-key.txt..."
echo "   Place your Pi Network validation key in this file."
echo "   The key should be provided in the Pi Developer Portal."
echo ""
echo "   To create the file, run:"
echo "   echo 'YOUR_PI_NETWORK_VALIDATION_KEY_HERE' > public/validation-key.txt"
echo ""
echo "   Current file content (if exists):"
if [ -f "public/validation-key.txt" ]; then
    head -c 50 public/validation-key.txt
    echo "..."
else
    echo "   File doesn't exist yet."
fi
