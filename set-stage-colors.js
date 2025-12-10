const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const colors = [
  '#ef4444', // red
  '#f59e0b', // orange
  '#10b981', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
];

(async () => {
  try {
    // Получаем все этапы
    const { rows } = await pool.query(`
      SELECT id, name, position 
      FROM stages 
      ORDER BY pipeline_id, position
    `);
    
    console.log(`Найдено ${rows.length} этапов`);
    
    // Назначаем цвета
    for (let i = 0; i < rows.length; i++) {
      const color = colors[i % colors.length];
      await pool.query(`UPDATE stages SET color = $1 WHERE id = $2`, [color, rows[i].id]);
      console.log(`✅ ${rows[i].name} → ${color}`);
    }
    
    console.log('\n✅ Цвета успешно назначены всем этапам');
    await pool.end();
    process.exit(0);
  } catch (e) {
    console.error('❌ Ошибка:', e.message);
    await pool.end();
    process.exit(1);
  }
})();
