#!/bin/bash
echo "=== Correcting Local Domain References ==="
echo "Changing 'aurafloo.co.za' to 'aurafloor.co.za' in project files..."
echo ""

# Safety check: create backup of files to be modified
echo "1. Creating backup of files that will be changed..."
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" -o -name "*.toml" -o -name "*.md" \) \
    ! -path "./node_modules/*" ! -path "./.git/*" \
    -exec grep -l "aurafloo" {} \; 2>/dev/null | while read file; do
    if [ -f "$file" ]; then
        cp "$file" "$file.backup.$(date +%s)"
    fi
done
echo "   Backup created for relevant files."
echo ""

# Perform the replacement
echo "2. Replacing domain in files..."
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" -o -name "*.toml" -o -name "*.md" \) \
    ! -path "./node_modules/*" ! -path "./.git/*" \
    -exec grep -l "aurafloo" {} \; 2>/dev/null | while read file; do
    if [ -f "$file" ]; then
        sed -i 's/aurafloo\.co\.za/aurafloor.co.za/g' "$file"
        echo "   Updated: $file"
    fi
done
echo ""

# Check if netlify.toml needs update
echo "3. Checking netlify.toml for context..."
if [ -f "netlify.toml" ]; then
    echo "   netlify.toml content (first 20 lines):"
    head -20 netlify.toml
fi
echo ""

# Verify the public validation file
echo "4. Checking validation file..."
if [ -f "public/validation-key.txt" ]; then
    echo "   public/validation-key.txt exists."
    echo "   Key preview: $(head -c 20 public/validation-key.txt)..."
else
    echo "   WARNING: public/validation-key.txt does not exist!"
    echo "   Create it with: echo 'YOUR_PI_KEY' > public/validation-key.txt"
fi
