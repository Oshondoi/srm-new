import { NextResponse } from 'next/server'
import { query } from '../../../lib/db'

export async function GET() {
  try {
    const pipelinesResult = await query('SELECT * FROM pipelines ORDER BY created_at')
    const result = []

    for (const p of pipelinesResult.rows) {
      const stagesResult = await query(
        'SELECT * FROM stages WHERE pipeline_id = $1 ORDER BY position',
        [p.id]
      )

      const stagesWithCounts = []
      for (const s of stagesResult.rows) {
        const countResult = await query(
          'SELECT COUNT(*) as count FROM deals WHERE stage_id = $1',
          [s.id]
        )
        stagesWithCounts.push({ ...s, deals_count: parseInt(countResult.rows[0].count) })
      }

      result.push({ ...p, stages: stagesWithCounts })
    }

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('API /api/pipelines error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
