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
    const pipelineId = url.searchParams.get('pipelineId')

    const limit = parseInt(url.searchParams.get('limit') || '1000')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    let sql = 'SELECT * FROM deals WHERE account_id = $1'
    const params: any[] = [user.accountId]
    
    if (pipelineId) {
      sql += ' AND pipeline_id = $2'
      params.push(pipelineId)
    }
    
    params.push(limit, offset)
    sql += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`

    const result = await query(sql, params)
    
    // Map budget to value and is_closed to closed for frontend compatibility
    const dealsWithValue = result.rows.map(deal => ({
      ...deal,
      value: deal.budget,
      closed: deal.is_closed
    }))
    
    return NextResponse.json(dealsWithValue)
  } catch (err: any) {
    console.error('API /api/deals GET error', err)
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
    
    // Check if it's a stage update (drag-and-drop) or new deal creation
    if (body.dealId && body.toStageId) {
      // Stage update (existing functionality)
      await query('UPDATE deals SET stage_id = $1 WHERE id = $2', [body.toStageId, body.dealId])
      return NextResponse.json({ success: true })
    }
    
    // New deal creation
    const { title, value, currency, company_id, pipeline_id, stage_id, closed } = body
    
    if (!title || !pipeline_id || !stage_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO deals (account_id, responsible_user_id, title, budget, currency, company_id, pipeline_id, stage_id, is_closed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [user.accountId, user.userId, title, value || 0, currency || 'RUB', company_id || null, pipeline_id, stage_id, closed || false]
    )
    
    const newDeal = result.rows[0]
    return NextResponse.json({
      ...newDeal,
      value: newDeal.budget,
      closed: newDeal.is_closed
    })
  } catch (err: any) {
    console.error('API /api/deals POST error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
