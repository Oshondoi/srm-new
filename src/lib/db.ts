import { Client } from 'pg'

export async function query(text: string, params?: any[]) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })
  
  await client.connect()
  
  try {
    const result = await client.query(text, params)
    return result
  } finally {
    await client.end()
  }
}
