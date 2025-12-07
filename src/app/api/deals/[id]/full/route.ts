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

    const { id: dealId } = await params

    // Один оптимизированный запрос со всеми данными сделки
    const result = await query(
      `WITH deal_data AS (
        SELECT 
          d.*,
          c.name as company_name,
          s.name as stage_name,
          s.pipeline_id,
          p.name as pipeline_name,
          json_build_object(
            'id', ru.id,
            'email', ru.email,
            'full_name', COALESCE(ru.full_name, ru.email)
          ) as responsible_user
        FROM deals d
        LEFT JOIN companies c ON c.id = d.company_id
        LEFT JOIN stages s ON s.id = d.stage_id
        LEFT JOIN pipelines p ON p.id = s.pipeline_id
        LEFT JOIN users ru ON ru.id = d.responsible_user_id
        WHERE d.id = $1 AND d.account_id = $2
      ),
      deal_contacts_data AS (
        SELECT COALESCE(
          json_agg(
            json_build_object(
              'id', co.id,
              'first_name', co.first_name,
              'last_name', co.last_name,
              'email', co.email,
              'phone', co.phone,
              'position', co.position,
              'company_id', co.company_id,
              'company_name', comp.name
            )
          ) FILTER (WHERE co.id IS NOT NULL),
          '[]'::json
        ) as data
        FROM deals d
        LEFT JOIN deal_contacts dc ON dc.deal_id = d.id
        LEFT JOIN contacts co ON co.id = dc.contact_id
        LEFT JOIN companies comp ON comp.id = co.company_id
        WHERE d.id = $1 AND d.account_id = $2
      ),
      pipeline_stages_data AS (
        SELECT COALESCE(
          json_agg(
            json_build_object(
              'id', st.id,
              'name', st.name,
              'position', st.position,
              'is_visible', st.is_visible
            ) ORDER BY st.position
          ) FILTER (WHERE st.id IS NOT NULL),
          '[]'::json
        ) as data
        FROM deals d
        LEFT JOIN stages s ON s.id = d.stage_id
        LEFT JOIN stages st ON st.pipeline_id = s.pipeline_id
        WHERE d.id = $1 AND d.account_id = $2
      ),
      account_users_data AS (
        SELECT COALESCE(
          json_agg(
            json_build_object(
              'id', u.id,
              'email', u.email,
              'full_name', COALESCE(u.full_name, u.email),
              'role', u.role
            ) ORDER BY u.email
          ) FILTER (WHERE u.id IS NOT NULL),
          '[]'::json
        ) as data
        FROM users u
        WHERE u.account_id = $2
      )
      SELECT 
        dd.*,
        dc.data as contacts,
        ps.data as stages,
        au.data as users
      FROM deal_data dd
      CROSS JOIN deal_contacts_data dc
      CROSS JOIN pipeline_stages_data ps
      CROSS JOIN account_users_data au`,
      [dealId, user.accountId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    const row = result.rows[0]
    
    return NextResponse.json({
      deal: {
        ...row,
        value: row.budget,
        closed: row.is_closed,
        responsible_user: row.responsible_user
      },
      contacts: row.contacts || [],
      stages: row.stages || [],
      users: row.users || []
    })
  } catch (err: any) {
    console.error('API /api/deals/[id]/full error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
