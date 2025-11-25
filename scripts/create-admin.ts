import { Client } from 'pg'
import bcrypt from 'bcryptjs'

async function createAdmin() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/srm'
  })

  await client.connect()

  try {
    console.log('🔐 Creating admin user...')

    // Hash password
    const passwordHash = await bcrypt.hash('123123', 10)

    // Create admin user (trigger will auto-create pipeline)
    const userResult = await client.query(`
      INSERT INTO users (email, password_hash, full_name, role) 
      VALUES ('Admin', $1, 'Administrator', 'admin')
      RETURNING id, email, full_name
    `, [passwordHash])
    
    const admin = userResult.rows[0]
    console.log('✓ Admin user created:', admin.email)
    console.log('✓ Password: 123123')
    console.log('✓ Pipeline "Основная воронка" auto-created by trigger')

    // Verify pipeline was created
    const pipelineResult = await client.query(`
      SELECT p.name, COUNT(s.id) as stage_count 
      FROM pipelines p 
      LEFT JOIN stages s ON p.id = s.pipeline_id 
      WHERE p.user_id = $1 
      GROUP BY p.id, p.name
    `, [admin.id])

    if (pipelineResult.rows.length > 0) {
      console.log('✓ Pipeline:', pipelineResult.rows[0].name, `(${pipelineResult.rows[0].stage_count} stages)`)
    }

    console.log('✅ Admin setup complete!')
  } catch (error) {
    console.error('❌ Error creating admin:', error)
    throw error
  } finally {
    await client.end()
  }
}

createAdmin().catch(console.error)
