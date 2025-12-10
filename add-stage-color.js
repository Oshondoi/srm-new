const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  try {
    console.log('Добавляем колонку color...');
    
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE stages ADD COLUMN IF NOT EXISTS color varchar(7) DEFAULT '#3b82f6';`
    });
    
    if (alterError) {
      console.log('Попробуем альтернативный способ через pg...');
      const { Pool } = require('pg');
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      
      await pool.query(`ALTER TABLE stages ADD COLUMN IF NOT EXISTS color varchar(7) DEFAULT '#3b82f6';`);
      console.log('✅ Колонка color добавлена');
      
      await pool.query(`UPDATE stages SET color = '#3b82f6' WHERE color IS NULL;`);
      console.log('✅ Цвета установлены для существующих этапов');
      
      await pool.end();
    } else {
      console.log('✅ Колонка добавлена через Supabase');
    }
    
    process.exit(0);
  } catch (e) {
    console.error('❌ Ошибка:', e.message);
    process.exit(1);
  }
})();
