import { NextResponse } from 'next/server'
import { query } from '../../../lib/db'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const pipelineId = url.searchParams.get('pipelineId')

    let sql = 'SELECT * FROM deals'
    const params = []
    
    if (pipelineId) {
      sql += ' WHERE pipeline_id = $1'
      params.push(pipelineId)
    }
    
    sql += ' ORDER BY created_at DESC'

    const result = await query(sql, params)
    return NextResponse.json(result.rows)
  } catch (err: any) {
    console.error('API /api/deals GET error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Check if it's a stage update (drag-and-drop) or new deal creation
    if (body.dealId && body.toStageId) {
      // Stage update (existing functionality)
      await query('UPDATE deals SET stage_id = $1 WHERE id = $2', [body.toStageId, body.dealId])
      return NextResponse.json({ success: true })
    }
    
    // New deal creation
    const { title, value, currency, company_id, contact_id, pipeline_id, stage_id, closed } = body
    
    if (!title || !pipeline_id || !stage_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO deals (title, value, currency, company_id, contact_id, pipeline_id, stage_id, closed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [title, value || 0, currency || 'RUB', company_id || null, contact_id || null, pipeline_id, stage_id, closed || false]
    )
    
    return NextResponse.json(result.rows[0])
  } catch (err: any) {
    console.error('API /api/deals POST error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
