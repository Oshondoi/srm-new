import { Client } from 'pg'

async function seed() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/srm'
  })

  await client.connect()

  try {
    console.log('🌱 Seeding database...')

    // Insert users
    const userResult = await client.query(`
      INSERT INTO users (email, full_name, role) 
      VALUES 
        ('admin@srm.dev', 'Администратор', 'admin'),
        ('manager1@srm.dev', 'Менеджер Иван', 'manager'),
        ('manager2@srm.dev', 'Менеджер Мария', 'manager')
      RETURNING id
    `)
    console.log('✓ Users created')

    // Insert companies
    const companyResult = await client.query(`
      INSERT INTO companies (name, website) 
      VALUES 
        ('Яндекс', 'https://yandex.ru'),
        ('ООО "Технологии"', 'https://tech.ru'),
        ('ИП Петров', null)
      RETURNING id
    `)
    console.log('✓ Companies created')

    // Insert contacts
    await client.query(`
      INSERT INTO contacts (company_id, first_name, last_name, phone, email) 
      VALUES 
        ($1, 'Иван', 'Иванов', '+79991234567', 'ivan@yandex.ru'),
        ($1, 'Петр', 'Петров', '+79991234568', 'petr@yandex.ru'),
        ($2, 'Мария', 'Сидорова', '+79991234569', 'maria@tech.ru')
    `, [companyResult.rows[0].id, companyResult.rows[1].id])
    console.log('✓ Contacts created')

    // Insert pipelines
    const pipelineResult = await client.query(`
      INSERT INTO pipelines (name) 
      VALUES 
        ('Основной'),
        ('VIP-клиенты')
      RETURNING id
    `)
    console.log('✓ Pipelines created')

    const mainPipelineId = pipelineResult.rows[0].id

    // Insert stages
    const stagesResult = await client.query(`
      INSERT INTO stages (pipeline_id, name, position) 
      VALUES 
        ($1, 'Новые', 0),
        ($1, 'Первичный контакт', 1),
        ($1, 'Переговоры', 2),
        ($1, 'Принимают решение', 3),
        ($1, 'Успешно реализовано', 4)
      RETURNING id, name
    `, [mainPipelineId])
    console.log('✓ Stages created')

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
