import { Client } from 'pg'
import bcrypt from 'bcryptjs'

async function seed() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/srm'
  })

  await client.connect()

  try {
    console.log('🌱 Seeding database...')

    // Hash password for test users
    const passwordHash = await bcrypt.hash('123456', 10)

    // Insert users with password
    const userResult = await client.query(`
      INSERT INTO users (email, password_hash, full_name, role) 
      VALUES 
        ('admin@srm.dev', $1, 'Администратор', 'admin'),
        ('manager1@srm.dev', $1, 'Менеджер Иван', 'manager'),
        ('manager2@srm.dev', $1, 'Менеджер Мария', 'manager')
      RETURNING id
    `, [passwordHash])
    console.log('✓ Users created (password: 123456)')

    const user1Id = userResult.rows[0].id

    // Insert companies (linked to first user)
    const companyResult = await client.query(`
      INSERT INTO companies (name, website, user_id) 
      VALUES 
        ('Яндекс', 'https://yandex.ru', $1),
        ('ООО "Технологии"', 'https://tech.ru', $1),
        ('ИП Петров', null, $1)
      RETURNING id
    `, [user1Id])
    console.log('✓ Companies created')

    // Insert contacts (linked to first user)
    await client.query(`
      INSERT INTO contacts (company_id, first_name, last_name, phone, email, user_id) 
      VALUES 
        ($1, 'Иван', 'Иванов', '+79991234567', 'ivan@yandex.ru', $3),
        ($1, 'Петр', 'Петров', '+79991234568', 'petr@yandex.ru', $3),
        ($2, 'Мария', 'Сидорова', '+79991234569', 'maria@tech.ru', $3)
    `, [companyResult.rows[0].id, companyResult.rows[1].id, user1Id])
    console.log('✓ Contacts created')

    // Note: Pipelines are auto-created by trigger, but we'll get the one created for user1
    const pipelineResult = await client.query(`
      SELECT id FROM pipelines WHERE user_id = $1 LIMIT 1
    `, [user1Id])
    
    let mainPipelineId
    if (pipelineResult.rows.length === 0) {
      // Fallback: create manually if trigger didn't work
      const newPipeline = await client.query(`
        INSERT INTO pipelines (name, user_id) VALUES ('Основная воронка', $1) RETURNING id
      `, [user1Id])
      mainPipelineId = newPipeline.rows[0].id
    } else {
      mainPipelineId = pipelineResult.rows[0].id
    }
    console.log('✓ Pipeline ready')

    // Insert stages (or get existing ones from trigger)
    const existingStages = await client.query(`
      SELECT id FROM stages WHERE pipeline_id = $1
    `, [mainPipelineId])
    
    let stagesResult
    if (existingStages.rows.length === 0) {
      // Create stages manually if trigger didn't work
      stagesResult = await client.query(`
        INSERT INTO stages (pipeline_id, name, position) 
        VALUES 
          ($1, 'Новые', 0),
          ($1, 'Первичный контакт', 1),
          ($1, 'Переговоры', 2),
          ($1, 'Принимают решение', 3),
          ($1, 'Успешно реализовано', 4)
        RETURNING id, name
      `, [mainPipelineId])
    } else {
      stagesResult = await client.query(`
        SELECT id, name FROM stages WHERE pipeline_id = $1 ORDER BY position
      `, [mainPipelineId])
    }
    console.log('✓ Stages ready')

    // Insert deals
    const stage1 = stagesResult.rows[0].id
    const stage2 = stagesResult.rows[1].id
    const stage3 = stagesResult.rows[2].id

    const dealResult = await client.query(`
      INSERT INTO deals (title, company_id, pipeline_id, stage_id, value, currency, closed) 
      VALUES 
        ('Внедрение CRM системы', $1, $2, $3, 500000, 'RUB', false),
        ('Консультация по маркетингу', $1, $2, $4, 150000, 'RUB', false),
        ('Разработка сайта', $5, $2, $6, 300000, 'RUB', false),
        ('SEO продвижение', $5, $2, $3, 80000, 'RUB', false)
      RETURNING id
    `, [companyResult.rows[0].id, mainPipelineId, stage1, stage2, companyResult.rows[1].id, stage3])
    console.log('✓ Deals created')

    // Insert tasks
    const deal1 = dealResult.rows[0].id
    const deal2 = dealResult.rows[1].id
    const user1 = userResult.rows[1].id

    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    await client.query(`
      INSERT INTO tasks (title, description, deal_id, assigned_to, due_at, completed) 
      VALUES 
        ('Подготовить коммерческое предложение', 'Сделать презентацию продукта для клиента', $1, $2, $3, false),
        ('Созвониться с клиентом', 'Согласовать дату встречи', $1, $2, $4, false),
        ('Подготовить договор', 'Отправить на согласование юристам', $5, $2, $6, false),
        ('Провести демо', 'Показать систему в действии', $5, $2, $7, true),
        ('Собрать требования', 'Узнать потребности клиента', $1, $2, $8, false)
    `, [
      deal1, user1, yesterday.toISOString(), 
      today.toISOString(),
      deal2, tomorrow.toISOString(),
      yesterday.toISOString(),
      tomorrow.toISOString()
    ])
    console.log('✓ Tasks created')

    console.log('✅ Database seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  } finally {
    await client.end()
  }
}

seed().catch(console.error)
