import { NextResponse } from 'next/server'
import { query } from '../../../../lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dealId } = await params

    // Get deal with related data
    const dealResult = await query(
      `SELECT d.*, 
        c.name as company_name,
        p.name as pipeline_name,
        s.name as stage_name
      FROM deals d
      LEFT JOIN companies c ON d.company_id = c.id
      LEFT JOIN pipelines p ON d.pipeline_id = p.id
      LEFT JOIN stages s ON d.stage_id = s.id
      WHERE d.id = $1`,
      [dealId]
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
    const { id: dealId } = await params
    const body = await request.json()
    
    const { title, value, currency, company_id, closed, stage_id, responsible_user_id } = body

    await query(
        `UPDATE deals 
       SET title = COALESCE($1, title),
           budget = COALESCE($2, budget),
           currency = COALESCE($3, currency),
           company_id = $4,
           is_closed = COALESCE($5, is_closed),
           stage_id = COALESCE($6, stage_id),
           responsible_user_id = COALESCE($7, responsible_user_id)
         WHERE id = $8`,
        [title, value, currency, company_id || null, closed, stage_id || null, responsible_user_id || null, dealId]
    )

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
    const { id: dealId } = await params
    await query('DELETE FROM deals WHERE id = $1', [dealId])
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('API /api/deals/[id] DELETE error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
