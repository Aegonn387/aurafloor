// Test script for verifying NeonDB connection with .env loading
// Run with: node scripts/test-db-connection.js

// Load environment variables from .env file
require('dotenv').config({ path: '.env' });

const { neon } = require('@neondatabase/serverless');

async function testDatabaseConnection() {
  console.log('Testing NeonDB connection...\n');

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.log('Make sure to set it in your .env file or Netlify environment variables');
    console.log('Current .env path:', require('path').resolve('.env'));
    return;
  }

  console.log('✅ DATABASE_URL found in environment');
  console.log('URL starts with:', process.env.DATABASE_URL.substring(0, 50) + '...');

  try {
    // Initialize connection
    const sql = neon(process.env.DATABASE_URL);
    
    // Test 1: Basic connection test
    console.log('\n1. Testing basic connection...');
    const result = await sql`SELECT NOW() as current_time, version() as db_version`;
    console.log(`   ✅ Connected at: ${result[0].current_time}`);
    console.log(`   ✅ Database: ${result[0].db_version.substring(0, 50)}...`);

    // Test 2: Check if pending_nft_mints table exists
    console.log('\n2. Checking pending_nft_mints table...');
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'pending_nft_mints'
      ) as exists
    `;
    
    if (tableExists[0].exists) {
      console.log('   ✅ pending_nft_mints table exists');
      
      // Test 3: Check table structure
      console.log('\n3. Checking table structure...');
      const columns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'pending_nft_mints'
        ORDER BY ordinal_position
      `;
      
      console.log(`   ✅ Table has ${columns.length} columns (first 5 shown):`);
      columns.slice(0, 5).forEach(col => {
        console.log(`     - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
      if (columns.length > 5) {
        console.log(`     ... and ${columns.length - 5} more columns`);
      }
      
      // Test 4: Count any existing records (informational)
      console.log('\n4. Checking existing records...');
      const count = await sql`SELECT COUNT(*) as total FROM pending_nft_mints`;
      console.log(`   ✅ Table has ${count[0].total} record(s)`);
      
      // Test 5: Try a simple insert/delete test (only if table is empty or you want to)
      if (count[0].total === 0) {
        console.log('\n5. Testing write operations (safe test - table is empty)...');
        const testPaymentId = 'test_' + Date.now();
        
        await sql`
          INSERT INTO pending_nft_mints (
            payment_id, creator_wallet, title, audio_data, 
            audio_filename, audio_content_type, resale_fee
          ) VALUES (
            ${testPaymentId}, 
            ${'test_wallet'}, 
            ${'Test NFT'}, 
            ${Buffer.from('test audio data')}, 
            ${'test.mp3'}, 
            ${'audio/mpeg'}, 
            ${1000}
          )
        `;
        console.log('   ✅ Insert test passed');
        
        const inserted = await sql`
          SELECT title FROM pending_nft_mints WHERE payment_id = ${testPaymentId}
        `;
        console.log(`   ✅ Read test passed: "${inserted[0].title}"`);
        
        await sql`DELETE FROM pending_nft_mints WHERE payment_id = ${testPaymentId}`;
        console.log('   ✅ Delete test passed');
      } else {
        console.log('   ⚠️  Skipping write test - table has existing records');
      }
      
    } else {
      console.log('   ❌ pending_nft_mints table does not exist');
      console.log('   Please run the SQL from create_pending_nft_mints.sql in your Neon dashboard');
    }

    console.log('\n✅ Database tests completed!');
    
  } catch (error) {
    console.error('\n❌ Database test failed:', error.message);
    
    if (error.message.includes('connection refused') || error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Check if your Neon database is paused. Go to Neon console and activate it.');
    } else if (error.message.includes('password authentication')) {
      console.error('\n💡 Check your DATABASE_URL credentials in the .env file');
    } else if (error.message.includes('getaddrinfo ENOTFOUND')) {
      console.error('\n💡 Check the hostname in your DATABASE_URL - it might be incorrect');
    }
    
    console.error('\nFull error:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testDatabaseConnection().catch(console.error);
} else {
  module.exports = testDatabaseConnection;
}
