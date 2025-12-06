#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionStrings = [
  // Transaction mode
  'postgresql://postgres.nywsibcnngcexjbotsaq:c5aXMbxyAJh9WDyj@aws-0-us-east-1.pooler.supabase.com:5432/postgres',
  // Session mode
  'postgresql://postgres.nywsibcnngcexjbotsaq:c5aXMbxyAJh9WDyj@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
  // Direct connection
  'postgresql://postgres.nywsibcnngcexjbotsaq:c5aXMbxyAJh9WDyj@db.nywsibcnngcexjbotsaq.supabase.co:5432/postgres'
];

async function tryConnection(connString) {
  console.log(`\n🔄 Пробую подключение: ${connString.split('@')[1]}...`);
  
  const client = new Client({
    connectionString: connString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Подключение успешно!');
    
    // Проверка версии
    const res = await client.query('SELECT version()');
    console.log(`📊 PostgreSQL: ${res.rows[0].version.split(' ')[1]}`);
    
    // Проверка существующих таблиц
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log(`📋 Существующие таблицы: ${tables.rows.length}`);
    if (tables.rows.length > 0) {
      console.log('   ', tables.rows.map(r => r.table_name).join(', '));
    }
    
    return { client, success: true };
  } catch (error) {
    console.log(`❌ Ошибка: ${error.message}`);
    return { client: null, success: false, error };
  } finally {
    if (client) {
      await client.end().catch(() => {});
    }
  }
}

async function applySchema(connString) {
  console.log('\n🚀 Применяю схему к Supabase...\n');
  
  const client = new Client({
    connectionString: connString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Читаем SQL файл
    const schemaPath = path.join(__dirname, 'new_schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log(`📄 Читаю schema из ${schemaPath}...`);
    console.log(`📏 Размер: ${(sql.length / 1024).toFixed(2)} KB`);
    
    // Выполняем
    console.log('⚙️  Выполняю SQL...');
    await client.query(sql);
    
    console.log('✅ Схема успешно применена!');
    
    // Проверка
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`\n📊 Создано таблиц: ${tables.rows.length}`);
    console.log('📋 Список таблиц:');
    tables.rows.forEach(r => console.log(`   - ${r.table_name}`));
    
    return true;
  } catch (error) {
    console.error(`\n❌ Ошибка при применении схемы:`);
    console.error(error.message);
    if (error.position) {
      console.error(`Позиция в SQL: ${error.position}`);
    }
    return false;
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('🎯 Настройка Supabase PostgreSQL\n');
  console.log('='  .repeat(60));
  
  let workingConnection = null;
  
  // Пробуем все варианты подключения
  for (const connString of connectionStrings) {
    const result = await tryConnection(connString);
    if (result.success) {
      workingConnection = connString;
      break;
    }
  }
  
  if (!workingConnection) {
    console.log('\n❌ Не удалось подключиться ни к одному из вариантов');
    console.log('\n💡 Возможные причины:');
    console.log('   1. Неверный пароль - проверь в Supabase Dashboard');
    console.log('   2. IP не в whitelist (если есть ограничения)');
    console.log('   3. Проект приостановлен из-за неактивности');
    process.exit(1);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Рабочее подключение найдено!\n');
  
  // Применяем схему
  const success = await applySchema(workingConnection);
  
  if (success) {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ГОТОВО! Supabase настроен и готов к работе!');
    console.log('\n📝 Обнови .env.local:');
    console.log(`DATABASE_URL=${workingConnection}`);
    console.log('\n🔄 Перезапусти dev server: npm run dev');
    console.log('='  .repeat(60) + '\n');
  } else {
    console.log('\n❌ Не удалось применить схему');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n💥 Критическая ошибка:', error);
  process.exit(1);
});
