const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.nywsibcnngcexjbotsaq:Tux6EebSLR9qG9R9@aws-1-eu-central-1.pooler.supabase.com:5432/postgres'
});

async function diagnose() {
  try {
    console.log('=== ДИАГНОСТИКА СИСТЕМЫ ===\n');
    
    // 1. Проверяем пользователя
    const userResult = await pool.query(
      'SELECT id, account_id, email, full_name FROM users WHERE email = $1',
      ['admin@test.com']
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ Пользователь admin@test.com не найден!');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('✅ Пользователь найден:');
    console.log('   Email:', user.email);
    console.log('   User ID:', user.id);
    console.log('   Account ID:', user.account_id);
    
    // 2. Проверяем сделки
    console.log('\n=== СДЕЛКИ ===');
    const dealsResult = await pool.query(
      'SELECT id, title, account_id, pipeline_id, stage_id, company_id FROM deals WHERE deleted_at IS NULL ORDER BY created_at DESC'
    );
    
    console.log(`Всего сделок в БД: ${dealsResult.rows.length}`);
    dealsResult.rows.forEach((deal, i) => {
      console.log(`\n${i + 1}. ${deal.title}`);
      console.log('   Deal ID:', deal.id);
      console.log('   Account ID:', deal.account_id);
      console.log('   Принадлежит admin?', deal.account_id === user.account_id ? '✅ ДА' : '❌ НЕТ');
      console.log('   Pipeline ID:', deal.pipeline_id || 'NULL');
      console.log('   Stage ID:', deal.stage_id || 'NULL');
      console.log('   Company ID:', deal.company_id || 'NULL');
    });
    
    // 3. Проверяем контакты сделок
    console.log('\n=== КОНТАКТЫ СДЕЛОК ===');
    const dealContactsResult = await pool.query(
      `SELECT dc.deal_id, dc.contact_id, d.title as deal_title, c.first_name, c.last_name, c.account_id as contact_account_id
       FROM deal_contacts dc
       JOIN deals d ON dc.deal_id = d.id
       JOIN contacts c ON dc.contact_id = c.id
       ORDER BY d.created_at DESC`
    );
    
    console.log(`Всего связей deal_contacts: ${dealContactsResult.rows.length}`);
    dealContactsResult.rows.forEach((dc, i) => {
      console.log(`\n${i + 1}. Сделка "${dc.deal_title}" → Контакт "${dc.first_name} ${dc.last_name}"`);
      console.log('   Deal ID:', dc.deal_id);
      console.log('   Contact ID:', dc.contact_id);
      console.log('   Contact Account:', dc.contact_account_id);
      console.log('   Правильный account?', dc.contact_account_id === user.account_id ? '✅ ДА' : '❌ НЕТ');
    });
    
    // 4. Проверяем компании
    console.log('\n=== КОМПАНИИ ===');
    const companiesResult = await pool.query(
      'SELECT id, name, account_id FROM companies WHERE deleted_at IS NULL ORDER BY created_at DESC'
    );
    
    console.log(`Всего компаний: ${companiesResult.rows.length}`);
    companiesResult.rows.forEach((comp, i) => {
      console.log(`\n${i + 1}. ${comp.name}`);
      console.log('   Company ID:', comp.id);
      console.log('   Account ID:', comp.account_id);
      console.log('   Принадлежит admin?', comp.account_id === user.account_id ? '✅ ДА' : '❌ НЕТ');
    });
    
    // 5. Проверяем контакты
    console.log('\n=== КОНТАКТЫ ===');
    const contactsResult = await pool.query(
      'SELECT id, first_name, last_name, account_id, company_id FROM contacts WHERE deleted_at IS NULL ORDER BY created_at DESC'
    );
    
    console.log(`Всего контактов: ${contactsResult.rows.length}`);
    contactsResult.rows.forEach((contact, i) => {
      console.log(`\n${i + 1}. ${contact.first_name} ${contact.last_name}`);
      console.log('   Contact ID:', contact.id);
      console.log('   Account ID:', contact.account_id);
      console.log('   Company ID:', contact.company_id || 'NULL');
      console.log('   Принадлежит admin?', contact.account_id === user.account_id ? '✅ ДА' : '❌ НЕТ');
    });
    
    // 6. ИТОГО
    console.log('\n\n=== ИТОГО ===');
    const correctDeals = dealsResult.rows.filter(d => d.account_id === user.account_id).length;
    const correctCompanies = companiesResult.rows.filter(c => c.account_id === user.account_id).length;
    const correctContacts = contactsResult.rows.filter(c => c.account_id === user.account_id).length;
    
    console.log(`✅ Правильных сделок: ${correctDeals} из ${dealsResult.rows.length}`);
    console.log(`✅ Правильных компаний: ${correctCompanies} из ${companiesResult.rows.length}`);
    console.log(`✅ Правильных контактов: ${correctContacts} из ${contactsResult.rows.length}`);
    
    if (correctDeals !== dealsResult.rows.length || 
        correctCompanies !== companiesResult.rows.length || 
        correctContacts !== contactsResult.rows.length) {
      console.log('\n❌ ПРОБЛЕМА: Есть данные с неправильным account_id!');
    } else {
      console.log('\n✅ ВСЁ ХОРОШО: Все данные принадлежат правильному аккаунту!');
    }
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await pool.end();
  }
}

diagnose();
