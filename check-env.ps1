# API Keys Verification Script
Write-Host "
🔍 Checking .env.local configuration...
" -ForegroundColor Cyan

$envFile = ".env.local"
if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    
    # Check Pi Network
    if ($content -match "NEXT_PUBLIC_PI_APP_ID=app_") { 
        Write-Host "✅ Pi App ID configured" -ForegroundColor Green 
    } else { 
        Write-Host "❌ Pi App ID missing or invalid" -ForegroundColor Red 
    }
    
    # Check R2
    if ($content -match "R2_ACCOUNT_ID=\w+" -and $content -match "R2_ACCESS_KEY_ID=\w+") { 
        Write-Host "✅ Cloudflare R2 configured" -ForegroundColor Green 
    } else { 
        Write-Host "❌ Cloudflare R2 incomplete" -ForegroundColor Red 
    }
    
    # Check Pinata
    if ($content -match "PINATA_JWT=eyJ") { 
        Write-Host "✅ Pinata IPFS configured" -ForegroundColor Green 
    } else { 
        Write-Host "❌ Pinata IPFS missing" -ForegroundColor Red 
    }
    
    # Check Upstash
    if ($content -match "UPSTASH_REDIS_REST_URL=https://") { 
        Write-Host "✅ Upstash Redis configured" -ForegroundColor Green 
    } else { 
        Write-Host "❌ Upstash Redis missing" -ForegroundColor Red 
    }
    
    # Check NeonDB
    if ($content -match "DATABASE_URL=postgresql://") { 
        Write-Host "✅ NeonDB configured" -ForegroundColor Green 
    } else { 
        Write-Host "❌ NeonDB missing" -ForegroundColor Red 
    }
    
    Write-Host "
✨ Verification complete!
" -ForegroundColor Cyan
} else {
    Write-Host "❌ .env.local file not found!" -ForegroundColor Red
}
