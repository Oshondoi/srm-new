const https = require('https');

const SUPABASE_URL = 'nywsibcnngcexjbotsaq.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55d3NpYmNubmdjZXhqYm90c2FxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIzMjI2OCwiZXhwIjoyMDc4ODA4MjY4fQ.Xy_3LpMce5d-59rdESUKLkXHjP912HhhOECFvGF0wDI';

// ID тестовых аккаунтов для удаления
const TEST_ACCOUNTS = [
  '1beb5219-9fbe-4511-afc7-5a3146b19951', // test
  '1c532756-92dd-4676-ab85-f11f0fcb15d0'  // second
];

async function deleteByAccountId(table, accountId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_URL,
      path: `/rest/v1/${table}?account_id=eq.${accountId}`,
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

async function deleteByPipelineId(pipelineId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_URL,
      path: `/rest/v1/stages?pipeline_id=eq.${pipelineId}`,
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

async function getPipelines(accountId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_URL,
      path: `/rest/v1/pipelines?account_id=eq.${accountId}&select=id`,
      method: 'GET',
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
          resolve(JSON.parse(body));
        } else {
          reject(new Error(body));
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function getDeals(accountId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_URL,
      path: `/rest/v1/deals?account_id=eq.${accountId}&select=id`,
      method: 'GET',
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
          resolve(JSON.parse(body));
        } else {
          reject(new Error(body));
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function deleteDealContacts(dealId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_URL,
      path: `/rest/v1/deal_contacts?deal_id=eq.${dealId}`,
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

async function cleanup() {
  console.log('🗑️  Удаляю тестовые аккаунты...\n');
  
  for (const accountId of TEST_ACCOUNTS) {
    console.log(`📝 Аккаунт ${accountId}:`);
    
    // Получаем все deals для удаления deal_contacts
    const deals = await getDeals(accountId);
    for (const deal of deals) {
      process.stdout.write(`   - deal_contacts для deal ${deal.id}... `);
      await deleteDealContacts(deal.id);
      console.log('✅');
    }
    
    // Удаляем deals
    process.stdout.write('   - deals... ');
    await deleteByAccountId('deals', accountId);
    console.log('✅');
    
    // Удаляем contacts
    process.stdout.write('   - contacts... ');
    await deleteByAccountId('contacts', accountId);
    console.log('✅');
    
    // Удаляем companies
    process.stdout.write('   - companies... ');
    await deleteByAccountId('companies', accountId);
    console.log('✅');
    
    // Получаем pipelines и удаляем stages
    const pipelines = await getPipelines(accountId);
    for (const pipeline of pipelines) {
      process.stdout.write(`   - stages для pipeline ${pipeline.id}... `);
      await deleteByPipelineId(pipeline.id);
      console.log('✅');
    }
    
    // Удаляем pipelines
    process.stdout.write('   - pipelines... ');
    await deleteByAccountId('pipelines', accountId);
    console.log('✅');
    
    // Удаляем tasks
    process.stdout.write('   - tasks... ');
    await deleteByAccountId('tasks', accountId);
    console.log('✅');
    
    // Удаляем users
    process.stdout.write('   - users... ');
    await deleteByAccountId('users', accountId);
    console.log('✅');
    
    // Удаляем сам account
    process.stdout.write('   - account... ');
    const options = {
      hostname: SUPABASE_URL,
      path: `/rest/v1/accounts?id=eq.${accountId}`,
      method: 'DELETE',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      }
    };
    
    await new Promise((resolve) => {
      const req = https.request(options, (res) => {
        res.on('data', () => {});
        res.on('end', resolve);
      });
      req.on('error', resolve);
      req.end();
    });
    console.log('✅');
    
    console.log('');
  }
  
  console.log('✅ Тестовые аккаунты удалены!');
}

cleanup();
