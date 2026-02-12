// scripts/test-aggregator.ts
// 1. LOAD ENVIRONMENT VARIABLES BEFORE ANY IMPORTS
import { config } from 'dotenv';
import path from 'path';

// Explicitly load the .env.local file from the project root
config({ path: path.resolve(process.cwd(), '.env.local') });

// 2. Now import and run your test
import { homepageAggregator } from "@/lib/services/homepage-aggregator";

async function test() {
  console.log("🧪 Testing homepage aggregator...");
  // Quick debug log to confirm the variable is loaded
  console.log("Contract ID from env:", process.env.NEXT_PUBLIC_SOROBAN_CONTRACT_ID || 'NOT LOADED');
  await homepageAggregator.updateHomepageCache();
  console.log("✅ Test complete!");
}

test().catch(console.error);
