import { NextResponse } from 'next/server'
import { query } from '../../../lib/db'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const dealId = url.searchParams.get('dealId')
    const completed = url.searchParams.get('completed')

    let sql = `
      SELECT t.*, 
        d.title as deal_title,
        u.full_name as assigned_user_name
      FROM tasks t
      LEFT JOIN deals d ON t.deal_id = d.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE 1=1
    `
    const params: any[] = []
    let paramCount = 0

    if (dealId) {
      paramCount++
      sql += ` AND t.deal_id = $${paramCount}`
      params.push(dealId)
    }

    if (completed !== null) {
      paramCount++
      sql += ` AND t.completed = $${paramCount}`
      params.push(completed === 'true')
    }

    sql += ' ORDER BY t.due_at ASC NULLS LAST, t.created_at DESC'

    const result = await query(sql, params)
    return NextResponse.json(result.rows)
  } catch (err: any) {
    console.error('API /api/tasks GET error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, deal_id, assigned_to, due_at } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO tasks (title, description, deal_id, assigned_to, due_at, completed)
       VALUES ($1, $2, $3, $4, $5, false)
       RETURNING *`,
      [title, description, deal_id, assigned_to, due_at]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (err: any) {
    console.error('API /api/tasks POST error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
