const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.nywsibcnngcexjbotsaq:Tux6EebSLR9qG9R9@aws-1-eu-central-1.pooler.supabase.com:5432/postgres'
});

async function fixDeals() {
  try {
    // Get correct account_id
    const userResult = await pool.query(
      'SELECT account_id FROM users WHERE email = $1',
      ['admin@test.com']
    );
    
    if (userResult.rows.length === 0) {
      console.log('User not found!');
      return;
    }
    
    const correctAccountId = userResult.rows[0].account_id;
    console.log('Correct account_id:', correctAccountId);
    
    // Update all deals to correct account
    const updateResult = await pool.query(
      'UPDATE deals SET account_id = $1 WHERE deleted_at IS NULL RETURNING id, title',
      [correctAccountId]
    );
    
    console.log(`\nUpdated ${updateResult.rows.length} deals:`);
    updateResult.rows.forEach(deal => {
      console.log(`- ${deal.title}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixDeals();
