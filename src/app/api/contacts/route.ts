import { NextResponse } from 'next/server'
import { query } from '../../../lib/db'
import { getUserFromRequest } from '../../../lib/auth'

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '100')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    const result = await query(
      `SELECT c.*, comp.name as company_name 
       FROM contacts c
       LEFT JOIN companies comp ON c.company_id = comp.id
       WHERE c.account_id = $1
       ORDER BY c.first_name, c.last_name
       LIMIT $2 OFFSET $3`,
      [user.accountId, limit, offset]
    )
    return NextResponse.json(result.rows)
  } catch (err: any) {
    console.error('API /api/contacts error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { first_name, last_name, email, phone, company_id, position } = body

    if (!first_name) {
      return NextResponse.json({ error: 'First name is required' }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO contacts (account_id, created_by, first_name, last_name, email, phone, company_id, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [user.accountId, user.userId, first_name, last_name || '', email || null, phone || null, company_id || null, position || null]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (err: any) {
    console.error('API /api/contacts POST error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}

