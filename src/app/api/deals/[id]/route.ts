import { NextResponse } from 'next/server'
import { query } from '../../../../lib/db'
import { getUserFromRequest } from '../../../../lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: dealId } = await params

    // Get deal with related data - проверяем account_id для безопасности
    const dealResult = await query(
      `SELECT d.*, 
        c.name as company_name,
        p.name as pipeline_name,
        s.name as stage_name
      FROM deals d
      LEFT JOIN companies c ON d.company_id = c.id
      LEFT JOIN pipelines p ON d.pipeline_id = p.id
      LEFT JOIN stages s ON d.stage_id = s.id
      WHERE d.id = $1 AND d.account_id = $2`,
      [dealId, user.accountId]
    )

    if (dealResult.rows.length === 0) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    const deal = dealResult.rows[0]

    // Map budget to value for frontend compatibility
    const dealWithValue = {
      ...deal,
      value: deal.budget,
      closed: deal.is_closed
    }

    // Get tasks for this deal
    const tasksResult = await query(
      `SELECT t.*, u.full_name as assigned_user_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.deal_id = $1
       ORDER BY t.due_date ASC`,
      [dealId]
    )

    // Get notes for this deal
    const notesResult = await query(
      `SELECT n.*, u.full_name as author_name
       FROM notes n
       LEFT JOIN users u ON n.created_by = u.id
       WHERE n.deal_id = $1
       ORDER BY n.created_at DESC`,
      [dealId]
    )

    // Get activity logs
    const activityResult = await query(
      `SELECT a.*, u.full_name as user_name
       FROM activity_logs a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.entity_type = 'deal' AND a.entity_id = $1
       ORDER BY a.created_at DESC
       LIMIT 20`,
      [dealId]
    )

    return NextResponse.json({
      ...dealWithValue,
      tasks: tasksResult.rows,
      notes: notesResult.rows,
      activity: activityResult.rows
    })
  } catch (err: any) {
    console.error('API /api/deals/[id] GET error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: dealId } = await params
    const body = await request.json()
    
    const { title, value, company_id, closed, stage_id, responsible_user_id } = body

    const result = await query(
        `UPDATE deals 
       SET title = COALESCE($1, title),
           budget = COALESCE($2, budget),
           company_id = $3,
           is_closed = COALESCE($4, is_closed),
           stage_id = COALESCE($5, stage_id),
           responsible_user_id = COALESCE($6, responsible_user_id)
         WHERE id = $7 AND account_id = $8
         RETURNING *`,
        [title, value, company_id || null, closed, stage_id || null, responsible_user_id || null, dealId, user.accountId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('API /api/deals/[id] PUT error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const result = await query(
      'UPDATE deals SET deleted_at = NOW() WHERE id = $1 AND account_id = $2 AND deleted_at IS NULL RETURNING id',
      [id, user.accountId]
    )
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('API /api/deals/[id] DELETE error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
