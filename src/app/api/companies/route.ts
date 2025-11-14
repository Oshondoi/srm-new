import { NextResponse } from 'next/server'
import { query } from '../../../lib/db'

export async function GET() {
  try {
    const result = await query('SELECT * FROM companies ORDER BY name')
    return NextResponse.json(result.rows)
  } catch (err: any) {
    console.error('API /api/companies GET error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, website } = body

    if (!name) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO companies (name, website)
       VALUES ($1, $2)
       RETURNING *`,
      [name, website || null]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (err: any) {
    console.error('API /api/companies POST error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
