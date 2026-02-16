const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment. Please check your .env.local file.');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function checkBlogTable() {
  try {
    console.log('🔍 Checking blog_posts table...\n');

    // Check if table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'blog_posts'
      )
    `;

    console.log('✅ Table exists:', tableCheck[0].exists);

    if (tableCheck[0].exists) {
      // Get table structure
      console.log('\n📋 Table Structure:');
      const columns = await sql`
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_name = 'blog_posts'
        ORDER BY ordinal_position
      `;
      console.table(columns);

      // Count total posts
      const count = await sql`
        SELECT COUNT(*) as total FROM blog_posts
      `;
      console.log('\n📊 Total posts:', count[0].total);

      // Get featured posts
      const featured = await sql`
        SELECT
          id,
          title,
          category,
          is_published,
          is_featured,
          published_at
        FROM blog_posts
        WHERE is_featured = true
        ORDER BY published_at DESC
      `;
      console.log('\n⭐ Featured Posts:');
      console.table(featured);

      // Get all posts
      const allPosts = await sql`
        SELECT
          id,
          title,
          category,
          is_published,
          is_featured,
          created_at
        FROM blog_posts
        ORDER BY created_at DESC
      `;
      console.log('\n📝 All Posts:');
      console.table(allPosts);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkBlogTable();
