const https = require('https');

const SUPABASE_URL = 'nywsibcnngcexjbotsaq.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55d3NpYmNubmdjZXhqYm90c2FxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIzMjI2OCwiZXhwIjoyMDc4ODA4MjY4fQ.Xy_3LpMce5d-59rdESUKLkXHjP912HhhOECFvGF0wDI';

async function deleteTable(table) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_URL,
      path: `/rest/v1/${table}?id=neq.00000000-0000-0000-0000-000000000000`,
      method: 'DELETE',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true });
        } else {
          resolve({ success: false, error: body });
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function clearAll() {
  console.log('🗑️  Очищаю все таблицы в Supabase...\n');
  
  // Обратный порядок из-за внешних ключей
  const tables = ['tasks', 'deal_contacts', 'deals', 'contacts', 'companies', 'stages', 'pipelines', 'users', 'accounts'];
  
  for (const table of tables) {
    process.stdout.write(`📝 ${table}... `);
    const result = await deleteTable(table);
    if (result.success) {
      console.log('✅');
    } else {
      console.log(`❌ ${result.error}`);
    }
  }
  
  console.log('\n✅ Готово! Таблицы очищены');
}

clearAll();
