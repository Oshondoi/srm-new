import { NextResponse } from 'next/server'
import { query } from '../../../lib/db'

export async function GET() {
  try {
    const result = await query(
      `SELECT c.*, comp.name as company_name 
       FROM contacts c
       LEFT JOIN companies comp ON c.company_id = comp.id
       ORDER BY c.first_name, c.last_name`
    )
    return NextResponse.json(result.rows)
  } catch (err: any) {
    console.error('API /api/contacts error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { first_name, last_name, email, phone, company_id, position } = body

    if (!first_name) {
      return NextResponse.json({ error: 'First name is required' }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO contacts (first_name, last_name, email, phone, company_id, position)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [first_name, last_name || '', email || null, phone || null, company_id || null, position || null]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (err: any) {
    console.error('API /api/contacts POST error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}

