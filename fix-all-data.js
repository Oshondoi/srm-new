const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.nywsibcnngcexjbotsaq:Tux6EebSLR9qG9R9@aws-1-eu-central-1.pooler.supabase.com:5432/postgres'
});

async function fixAllData() {
  try {
    const correctAccountId = 'ae030c0f-cc5a-4863-8422-476d597c03aa';
    const wrongAccountId = 'ee7d1865-8e7d-4342-81aa-1fb7e23bb05a';
    
    console.log('🔧 Исправляю все данные...\n');
    
    // 1. Исправляем сделки
    const dealsResult = await pool.query(
      'UPDATE deals SET account_id = $1 WHERE account_id = $2 AND deleted_at IS NULL RETURNING id, title',
      [correctAccountId, wrongAccountId]
    );
    console.log(`✅ Исправлено сделок: ${dealsResult.rows.length}`);
    dealsResult.rows.forEach(d => console.log(`   - ${d.title}`));
    
    // 2. Исправляем компании
    const companiesResult = await pool.query(
      'UPDATE companies SET account_id = $1 WHERE account_id = $2 AND deleted_at IS NULL RETURNING id, name',
      [correctAccountId, wrongAccountId]
    );
    console.log(`\n✅ Исправлено компаний: ${companiesResult.rows.length}`);
    companiesResult.rows.forEach(c => console.log(`   - ${c.name}`));
    
    // 3. Исправляем контакты
    const contactsResult = await pool.query(
      'UPDATE contacts SET account_id = $1 WHERE account_id = $2 AND deleted_at IS NULL RETURNING id, first_name, last_name',
      [correctAccountId, wrongAccountId]
    );
    console.log(`\n✅ Исправлено контактов: ${contactsResult.rows.length}`);
    contactsResult.rows.forEach(c => console.log(`   - ${c.first_name} ${c.last_name}`));
    
    console.log('\n🎉 ВСЕ ДАННЫЕ ИСПРАВЛЕНЫ!');
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await pool.end();
  }
}

fixAllData();
