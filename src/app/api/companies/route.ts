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
      'SELECT * FROM companies WHERE account_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [user.accountId, limit, offset]
    )
    return NextResponse.json(result.rows)
  } catch (err: any) {
    console.error('API /api/companies GET error', err)
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
    const { name, website } = body

    if (!name) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO companies (account_id, created_by, name, website)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user.accountId, user.userId, name, website || null]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (err: any) {
    console.error('API /api/companies POST error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
