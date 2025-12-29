#!/bin/bash
# Restore deleted API files safely
echo "Restoring deleted files..."
git restore app/api/admin/revenue/route.ts
git restore app/api/analytics/creator/route.ts
git restore app/api/auth/login/route.ts
git restore app/api/auth/logout/route.ts
git restore app/api/community/comments/route.ts
git restore app/api/community/posts/route.ts
git restore app/api/inngest/route.ts
git restore app/api/messages/route.ts
git restore app/api/nfts/route.ts
git restore app/api/notifications/route.ts
git restore app/api/payments/approve/route.ts
git restore app/api/payments/complete/route.ts
git restore app/api/payments/mint/route.ts
git restore app/api/payments/purchase/route.ts
git restore app/api/payments/resale/route.ts
git restore app/api/payments/tip/route.ts
git restore app/api/reports/route.ts
git restore app/api/stream/watch-ad/route.ts
git restore app/api/upload/audio/route.ts
git restore app/api/users/route.ts
git restore app/api/wallet/balance/route.ts
git restore app/api/wallet/transactions/route.ts
git restore app/api/wallet/withdraw/route.ts

echo "Files restored. Checking status..."
git status
