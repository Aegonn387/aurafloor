export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { homepageAggregator } from '@/lib/services/homepage-aggregator'
import { homepageCache } from '@/lib/redis'

export async function GET() {
  try {
    console.log('🔍 Testing aggregator via API...')
    await homepageAggregator.updateHomepageCache()

    const emptyFallback = async () => []
    const promoted = await homepageCache.get('promoted', emptyFallback)
    const featured = await homepageCache.get('featured', emptyFallback)
    const trending = await homepageCache.get('trending', emptyFallback)

    return NextResponse.json({
      success: true,
      message: 'Cache updated successfully',
      data: {
        promotedCount: promoted?.length || 0,
        featuredCount: featured?.length || 0,
        trendingCount: trending?.length || 0,
        hasData: !!(promoted || featured || trending)
      }
    })
  } catch (error: any) {
    console.error('❌ API test failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      hint: 'Check server logs for detailed error'
    }, { status: 500 })
  }
}
