import { NextResponse } from 'next/server'
import { query } from '../../../../../lib/db'
import { getUserFromRequest } from '../../../../../lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: pipelineId } = await params

    // Один оптимизированный запрос: воронка + этапы + сделки + контакты
    const result = await query(
      `WITH deal_contacts_agg AS (
        SELECT 
          dc.deal_id,
          json_agg(
            json_build_object(
              'id', ct.id,
              'first_name', ct.first_name,
              'last_name', ct.last_name,
              'full_name', CONCAT(ct.first_name, ' ', ct.last_name)
            ) ORDER BY ct.first_name, ct.last_name
          ) FILTER (WHERE ct.id IS NOT NULL) as contacts
        FROM deal_contacts dc
        LEFT JOIN contacts ct ON ct.id = dc.contact_id AND ct.deleted_at IS NULL
        GROUP BY dc.deal_id
      )
      SELECT 
        s.id as stage_id,
        s.name as stage_name,
        s.position as stage_position,
        s.is_visible as stage_is_visible,
        s.color as stage_color,
        json_agg(
          json_build_object(
            'id', d.id,
            'title', d.title,
            'stage_id', d.stage_id,
            'budget', d.budget,
            'company_id', d.company_id,
            'company_name', c.name,
            'contacts', COALESCE(dca.contacts, '[]'::json),
            'responsible_user_id', d.responsible_user_id,
            'responsible_user_name', u.full_name,
            'created_at', d.created_at,
            'is_closed', d.is_closed
          ) ORDER BY d.created_at DESC
        ) FILTER (WHERE d.id IS NOT NULL) as deals
      FROM stages s
      LEFT JOIN deals d ON d.stage_id = s.id AND d.account_id = $1 AND d.deleted_at IS NULL
      LEFT JOIN companies c ON c.id = d.company_id AND c.deleted_at IS NULL
      LEFT JOIN users u ON u.id = d.responsible_user_id AND u.deleted_at IS NULL
      LEFT JOIN deal_contacts_agg dca ON dca.deal_id = d.id
      WHERE s.pipeline_id = $2
      GROUP BY s.id, s.name, s.position, s.is_visible
      ORDER BY s.position`,
      [user.accountId, pipelineId]
    )

    // Фильтруем только видимые этапы и форматируем для фронтенда
    const stages = result.rows
      .filter(row => row.stage_is_visible !== false)
      .map(row => ({
        id: row.stage_id,
        name: row.stage_name,
        position: row.stage_position,
        is_visible: row.stage_is_visible,
        color: row.stage_color || '#3b82f6',
        deals: (row.deals || []).map((d: any) => ({
          ...d,
          value: d.budget,
          closed: d.is_closed
        }))
      }))

    return NextResponse.json({ stages })
  } catch (err: any) {
    console.error('API /api/pipelines/[id]/deals error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
