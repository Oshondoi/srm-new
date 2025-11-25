import { config } from 'dotenv'
import { resolve } from 'path'
import { query } from '../src/lib/db'
import bcrypt from 'bcryptjs'

// Load .env.local
config({ path: resolve(__dirname, '../.env.local') })

async function seed() {
  console.log('🌱 Starting seed...')
  console.log('DATABASE_URL:', process.env.DATABASE_URL)

  try {
    // 1. Получить или создать тестовый аккаунт
    let accountResult = await query(
      "SELECT id FROM accounts WHERE subdomain = 'test' LIMIT 1"
    )
    
    let accountId: string
    
    if (accountResult.rows.length === 0) {
      console.log('Creating test account...')
      accountResult = await query(
        "INSERT INTO accounts (name, subdomain) VALUES ('Тестовая компания', 'test') RETURNING id"
      )
      accountId = accountResult.rows[0].id
    } else {
      accountId = accountResult.rows[0].id
      console.log(`✓ Account exists: ${accountId}`)
    }

    // 2. Создать тестового юзера
    const passwordHash = await bcrypt.hash('parol123', 10)
    
    const userResult = await query(
      `INSERT INTO users (account_id, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (account_id, email) DO UPDATE 
       SET password_hash = $3
       RETURNING id`,
      [accountId, 'admin@test.com', passwordHash, 'Администратор', 'admin']
    )
    const userId = userResult.rows[0].id
    console.log(`✓ User created: ${userId}`)

    // 3. Проверить или создать воронку
    let pipelineResult = await query(
      'SELECT id FROM pipelines WHERE account_id = $1 LIMIT 1',
      [accountId]
    )
    
    let pipelineId: string
    
    if (pipelineResult.rows.length === 0) {
      console.log('Creating pipeline...')
      pipelineResult = await query(
        `INSERT INTO pipelines (account_id, name, is_default)
         VALUES ($1, 'Основная воронка', true)
         RETURNING id`,
        [accountId]
      )
      pipelineId = pipelineResult.rows[0].id

      // Создать этапы
      await query(
        `INSERT INTO stages (pipeline_id, name, position, color) VALUES
         ($1, 'Первичный контакт', 1, '#3b82f6'),
         ($1, 'Переговоры', 2, '#8b5cf6'),
         ($1, 'Принимают решение', 3, '#f59e0b'),
         ($1, 'Согласование договора', 4, '#10b981'),
         ($1, 'Успешно реализовано', 5, '#22c55e')`,
        [pipelineId]
      )
      console.log('✓ Pipeline and stages created')
    } else {
      pipelineId = pipelineResult.rows[0].id
      console.log(`✓ Pipeline exists: ${pipelineId}`)
    }

    // 4. Получить этапы
    const stagesResult = await query(
      'SELECT id, name FROM stages WHERE pipeline_id = $1 ORDER BY position',
      [pipelineId]
    )
    const stages = stagesResult.rows

    // 5. Создать компании
    const companies = [
      { name: 'Насаат Медиа', phone: '+7 999 123-45-67', email: 'info@nasaat.com' },
      { name: 'ТехноПром', phone: '+7 999 234-56-78', email: 'contact@technoprom.ru' },
      { name: 'Стройинвест', phone: '+7 999 345-67-89', email: 'sales@stroyinvest.ru' }
    ]

    const companyIds: string[] = []
    for (const company of companies) {
      const result = await query(
        `INSERT INTO companies (account_id, name, phone, email, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [accountId, company.name, company.phone, company.email, userId]
      )
      companyIds.push(result.rows[0].id)
    }
    console.log(`✓ Created ${companyIds.length} companies`)

    // 6. Создать контакты
    const contacts = [
      { 
        companyId: companyIds[0], 
        firstName: 'Эльестет', 
        lastName: '', 
        position: 'Директор',
        phone: '+7 999 111-11-11',
        email: 'elestet@nasaat.com'
      },
      { 
        companyId: companyIds[1], 
        firstName: 'Иван', 
        lastName: 'Петров', 
        position: 'Менеджер по закупкам',
        phone: '+7 999 222-22-22',
        email: 'petrov@technoprom.ru'
      },
      { 
        companyId: companyIds[2], 
        firstName: 'Анна', 
        lastName: 'Сидорова', 
        position: 'Генеральный директор',
        phone: '+7 999 333-33-33',
        email: 'sidorova@stroyinvest.ru'
      }
    ]

    const contactIds: string[] = []
    for (const contact of contacts) {
      const result = await query(
        `INSERT INTO contacts (account_id, company_id, first_name, last_name, position, phone, email, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [accountId, contact.companyId, contact.firstName, contact.lastName, contact.position, contact.phone, contact.email, userId]
      )
      contactIds.push(result.rows[0].id)
    }
    console.log(`✓ Created ${contactIds.length} contacts`)

    // 7. Создать сделки
    const deals = [
      {
        title: 'Тест',
        budget: 0,
        stageIndex: 0,
        companyId: companyIds[0],
        contactIds: [contactIds[0]]
      },
      {
        title: 'Поставка оборудования',
        budget: 500000,
        stageIndex: 1,
        companyId: companyIds[1],
        contactIds: [contactIds[1]]
      },
      {
        title: 'Строительство склада',
        budget: 2000000,
        stageIndex: 2,
        companyId: companyIds[2],
        contactIds: [contactIds[2]]
      },
      {
        title: 'Консалтинговые услуги',
        budget: 150000,
        stageIndex: 0,
        companyId: companyIds[0],
        contactIds: [contactIds[0]]
      }
    ]

    for (const deal of deals) {
      const dealResult = await query(
        `INSERT INTO deals (account_id, pipeline_id, stage_id, title, budget, currency, company_id, responsible_user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [accountId, pipelineId, stages[deal.stageIndex].id, deal.title, deal.budget, 'RUB', deal.companyId, userId]
      )
      const dealId = dealResult.rows[0].id

      // Привязать контакты к сделке
      for (const contactId of deal.contactIds) {
        await query(
          `INSERT INTO deal_contacts (deal_id, contact_id, is_primary)
           VALUES ($1, $2, $3)`,
          [dealId, contactId, true]
        )
      }
    }
    console.log(`✓ Created ${deals.length} deals`)

    // 8. Создать задачи
    const dealsResult = await query(
      'SELECT id FROM deals WHERE account_id = $1 LIMIT 2',
      [accountId]
    )

    for (const deal of dealsResult.rows) {
      await query(
        `INSERT INTO tasks (account_id, deal_id, assigned_to, title, description, due_date, created_by)
         VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '3 days', $6)`,
        [accountId, deal.id, userId, 'Позвонить клиенту', 'Обсудить условия сделки', userId]
      )
    }
    console.log('✓ Created tasks')

    console.log('\n✅ Seed completed successfully!')
    console.log(`\nTest credentials:`)
    console.log(`Email: admin@test.com`)
    console.log(`Password: parol123`)

  } catch (error) {
    console.error('❌ Seed failed:', error)
    throw error
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
