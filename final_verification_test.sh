#!/bin/bash
echo "=== Final Pi Network Verification Test ==="
echo ""

# Check if curl is available
if ! command -v curl &> /dev/null; then
    echo "Installing curl..."
    pkg install curl -y
fi

echo "Testing verification file accessibility..."
echo "URL: https://aurafloor.co.za/validation-key.txt"
echo ""

# Test with retry logic
for i in {1..3}; do
    echo "Attempt $i/3..."
    status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://aurafloor.co.za/validation-key.txt")
    
    if [ "$status_code" = "200" ]; then
        echo "✓ SUCCESS: File accessible (HTTP 200)"
        echo ""
        echo "Fetching file content for verification..."
        remote_content=$(curl -s --max-time 10 "https://aurafloor.co.za/validation-key.txt")
        local_content=$(cat public/validation-key.txt 2>/dev/null)
        
        if [ "$remote_content" = "$local_content" ]; then
            echo "✓ Content matches local file"
            echo ""
            echo "✅ READY FOR PI NETWORK VERIFICATION"
            echo ""
            echo "Steps to complete:"
            echo "1. Go to Pi Developer Portal"
            echo "2. Navigate to your app"
            echo "3. Find 'Verify Domain Ownership' (usually Step 8)"
            echo "4. Click 'Verify domain'"
            echo "5. The system should now succeed"
        else
            echo "⚠️  Content mismatch!"
            echo "   Local: $(echo "$local_content" | head -c 20)..."
            echo "   Remote: $(echo "$remote_content" | head -c 20)..."
            echo "   Wait for deployment or check file."
        fi
        break
    elif [ "$status_code" = "404" ]; then
        echo "✗ File not found (HTTP 404)"
        echo "   Netlify deployment may still be in progress."
        if [ $i -lt 3 ]; then
            echo "   Waiting 30 seconds before retry..."
            sleep 30
        fi
    elif [ "$status_code" = "000" ]; then
        echo "✗ Connection failed"
        echo "   Check internet or DNS propagation"
        sleep 10
    else
        echo "? Received HTTP $status_code"
        sleep 10
    fi
done

if [ "$status_code" != "200" ]; then
    echo ""
    echo "⚠️  Verification file not accessible yet."
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Check Netlify dashboard for deployment status"
    echo "2. Ensure domain 'aurafloor.co.za' is set in Netlify"
    echo "3. Check DNS configuration:"
    echo "   - Should point to Netlify load balancer"
    echo "   - CNAME to your-site.netlify.app"
    echo "4. SSL certificate may take time to issue"
    echo ""
    echo "Wait 5-10 minutes and retest."
fi
