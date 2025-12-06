const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.nywsibcnngcexjbotsaq:Tux6EebSLR9qG9R9@aws-1-eu-central-1.pooler.supabase.com:5432/postgres'
});

async function checkDeals() {
  try {
    console.log('Checking deals...');
    const result = await pool.query(
      'SELECT id, title, account_id, stage_id, pipeline_id FROM deals WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 5'
    );
    
    console.log('\nFound deals:', result.rows.length);
    result.rows.forEach(deal => {
      console.log(`- ${deal.title} (ID: ${deal.id.substring(0, 8)}...)`);
      console.log(`  Account: ${deal.account_id.substring(0, 8)}...`);
      console.log(`  Pipeline: ${deal.pipeline_id ? deal.pipeline_id.substring(0, 8) + '...' : 'NULL'}`);
      console.log(`  Stage: ${deal.stage_id ? deal.stage_id.substring(0, 8) + '...' : 'NULL'}`);
    });
    
    // Check user account
    console.log('\n\nChecking admin@test.com account...');
    const userResult = await pool.query(
      'SELECT account_id FROM users WHERE email = $1 AND deleted_at IS NULL',
      ['admin@test.com']
    );
    
    if (userResult.rows.length > 0) {
      const accountId = userResult.rows[0].account_id;
      console.log('User account_id:', accountId.substring(0, 8) + '...');
      
      // Check deals for this account
      const accountDeals = await pool.query(
        'SELECT COUNT(*) as count FROM deals WHERE account_id = $1 AND deleted_at IS NULL',
        [accountId]
      );
      console.log('Deals for this account:', accountDeals.rows[0].count);
    } else {
      console.log('User not found!');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDeals();
