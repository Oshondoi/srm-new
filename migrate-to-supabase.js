#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'nywsibcnngcexjbotsaq.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55d3NpYmNubmdjZXhqYm90c2FxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIzMjI2OCwiZXhwIjoyMDc4ODA4MjY4fQ.Xy_3LpMce5d-59rdESUKLkXHjP912HhhOECFvGF0wDI';

console.log('🎯 Миграция данных из локальной БД в Supabase\n');

// Экспортируем данные из локальной БД
async function exportLocalData() {
  console.log('📤 Экспортирую данные из локальной БД...');
  
  const { Client } = require('pg');
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/srm'
  });
  
  try {
    await client.connect();
    
    const data = {};
    
    // Accounts
    const accounts = await client.query('SELECT * FROM accounts ORDER BY created_at');
    data.accounts = accounts.rows;
    console.log(`✅ Accounts: ${accounts.rows.length}`);
    
    // Users
    const users = await client.query('SELECT * FROM users ORDER BY created_at');
    data.users = users.rows;
    console.log(`✅ Users: ${users.rows.length}`);
    
    // Pipelines
    const pipelines = await client.query('SELECT * FROM pipelines ORDER BY created_at');
    data.pipelines = pipelines.rows;
    console.log(`✅ Pipelines: ${pipelines.rows.length}`);
    
    // Stages
    const stages = await client.query('SELECT * FROM stages ORDER BY pipeline_id, position');
    data.stages = stages.rows;
    console.log(`✅ Stages: ${stages.rows.length}`);
    
    // Companies
    const companies = await client.query('SELECT * FROM companies ORDER BY created_at');
    data.companies = companies.rows;
    console.log(`✅ Companies: ${companies.rows.length}`);
    
    // Contacts
    const contacts = await client.query('SELECT * FROM contacts ORDER BY created_at');
    data.contacts = contacts.rows;
    console.log(`✅ Contacts: ${contacts.rows.length}`);
    
    // Deals
    const deals = await client.query('SELECT * FROM deals ORDER BY created_at');
    data.deals = deals.rows;
    console.log(`✅ Deals: ${deals.rows.length}`);
    
    // Deal contacts
    const dealContacts = await client.query('SELECT * FROM deal_contacts');
    data.deal_contacts = dealContacts.rows;
    console.log(`✅ Deal Contacts: ${dealContacts.rows.length}`);
    
    // Tasks
    const tasks = await client.query('SELECT * FROM tasks ORDER BY created_at');
    data.tasks = tasks.rows;
    console.log(`✅ Tasks: ${tasks.rows.length}`);
    
    await client.end();
    
    // Сохраняем в файл
    fs.writeFileSync('/tmp/local_db_export.json', JSON.stringify(data, null, 2));
    console.log('\n💾 Данные сохранены в /tmp/local_db_export.json\n');
    
    return data;
  } catch (error) {
    console.error('❌ Ошибка экспорта:', error.message);
    await client.end();
    return null;
  }
}

// Импортируем в Supabase через REST API
async function importToSupabase(data) {
  console.log('📥 Импортирую данные в Supabase...\n');
  
  const tables = ['accounts', 'users', 'pipelines', 'stages', 'companies', 'contacts', 'deals', 'deal_contacts', 'tasks'];
  
  for (const table of tables) {
    if (!data[table] || data[table].length === 0) {
      console.log(`⏭️  ${table}: пусто, пропускаю`);
      continue;
    }
    
    console.log(`📝 ${table}: загружаю ${data[table].length} записей...`);
    
    try {
      const options = {
        hostname: SUPABASE_URL,
        path: `/rest/v1/${table}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Prefer': 'resolution=merge-duplicates'
        }
      };
      
      const response = await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ success: true, status: res.statusCode });
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${body}`));
            }
          });
        });
        
        req.on('error', reject);
        req.write(JSON.stringify(data[table]));
        req.end();
      });
      
      console.log(`   ✅ Успешно (${response.status})`);
    } catch (error) {
      console.log(`   ❌ Ошибка: ${error.message}`);
    }
  }
  
  console.log('\n✅ Импорт завершён!');
}

async function main() {
  const data = await exportLocalData();
  
  if (!data) {
    console.log('❌ Не удалось экспортировать данные');
    process.exit(1);
  }
  
  console.log('='  .repeat(60));
  await importToSupabase(data);
  console.log('='.repeat(60));
  
  console.log('\n🎉 ГОТОВО! Данные мигрированы в Supabase');
  console.log('\n📝 Теперь обнови DATABASE_URL в .env.local на Supabase');
  console.log('🔄 И перезапусти: npm run dev\n');
}

main().catch(error => {
  console.error('\n💥 Ошибка:', error);
  process.exit(1);
});
