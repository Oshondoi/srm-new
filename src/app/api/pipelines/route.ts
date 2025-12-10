import { NextResponse } from 'next/server'
import { query } from '../../../lib/db'
import { getUserFromRequest } from '../../../lib/auth'

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Супер оптимизированный запрос - подсчёт сделок через LEFT JOIN с GROUP BY
    const result = await query(
      `SELECT 
        p.*,
        json_agg(
          json_build_object(
            'id', s.id,
            'name', s.name,
            'position', s.position,
            'pipeline_id', s.pipeline_id,
            'is_visible', COALESCE(s.is_visible, true),
            'color', COALESCE(s.color, '#3b82f6'),
            'deals_count', COALESCE(deal_counts.count, 0)
          ) ORDER BY s.position
        ) FILTER (WHERE s.id IS NOT NULL) as stages
      FROM pipelines p
      LEFT JOIN stages s ON s.pipeline_id = p.id
      LEFT JOIN (
        SELECT stage_id, COUNT(*)::int as count 
        FROM deals 
        GROUP BY stage_id
      ) deal_counts ON deal_counts.stage_id = s.id
      WHERE p.account_id = $1
      GROUP BY p.id
      ORDER BY p.created_at`,
      [user.accountId]
    )

    return NextResponse.json(result.rows)
  } catch (err: any) {
    console.error('API /api/pipelines error', err)
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
    const { name } = body

    if (!name) {
      return NextResponse.json({ error: 'Pipeline name is required' }, { status: 400 })
    }

    // Создаём воронку - триггер автоматически создаст дефолтные этапы
    const result = await query(
      `INSERT INTO pipelines (account_id, name, is_default)
       VALUES ($1, $2, false)
       RETURNING *`,
      [user.accountId, name]
    )

    // Получаем созданные этапы
    const stagesResult = await query(
      'SELECT * FROM stages WHERE pipeline_id = $1 ORDER BY position',
      [result.rows[0].id]
    )

    return NextResponse.json(
      { ...result.rows[0], stages: stagesResult.rows },
      { status: 201 }
    )
  } catch (err: any) {
    console.error('API /api/pipelines POST error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
