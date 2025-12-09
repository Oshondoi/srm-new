import { NextResponse } from 'next/server'
import { query } from '../../../lib/db'
import { getUserFromRequest } from '../../../lib/auth'

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Один оптимизированный запрос со всеми данными
    const result = await query(`
      WITH stats AS (
        SELECT 
          COUNT(d.id) as total_deals,
          SUM(d.budget) FILTER (WHERE d.is_closed = false) as total_value,
          (SELECT COUNT(*) FROM contacts WHERE account_id = $1 AND deleted_at IS NULL) as total_contacts,
          (SELECT COUNT(*) FROM companies WHERE account_id = $1 AND deleted_at IS NULL) as total_companies
        FROM deals d
        WHERE d.account_id = $1 AND d.deleted_at IS NULL
      ),
      deals_by_stage AS (
        SELECT json_agg(
          json_build_object(
            'stage_id', stage_id,
            'stage_name', stage_name,
            'count', deal_count
          ) ORDER BY stage_position
        ) as data
        FROM (
          SELECT 
            s.id as stage_id,
            s.name as stage_name,
            s.position as stage_position,
            COUNT(d.id) as deal_count
          FROM stages s
          INNER JOIN pipelines p ON s.pipeline_id = p.id
          LEFT JOIN deals d ON d.stage_id = s.id AND d.account_id = $1 AND d.deleted_at IS NULL
          WHERE p.account_id = $1
          GROUP BY s.id, s.name, s.position
        ) sub
      ),
      recent_deals AS (
        SELECT json_agg(
          json_build_object(
            'id', id,
            'title', title,
            'value', budget,
            'company_name', company_name,
            'stage_name', stage_name
          )
        ) as data
        FROM (
          SELECT 
            d.id,
            d.title,
            d.budget,
            c.name as company_name,
            s.name as stage_name
          FROM deals d
          LEFT JOIN companies c ON d.company_id = c.id
          LEFT JOIN stages s ON d.stage_id = s.id
          WHERE d.account_id = $1 AND d.deleted_at IS NULL
          ORDER BY d.created_at DESC
          LIMIT 5
        ) sub
      ),
      task_stats AS (
        SELECT 
          COUNT(*) FILTER (WHERE NOT completed) as active_tasks,
          COUNT(*) FILTER (WHERE NOT completed AND due_date < NOW()) as overdue_tasks,
          COUNT(*) FILTER (WHERE NOT completed AND DATE(due_date) = CURRENT_DATE) as today_tasks
        FROM tasks
        WHERE account_id = $1
      ),
      recent_tasks AS (
        SELECT json_agg(
          json_build_object(
            'id', id,
            'title', title,
            'due_at', due_date,
            'deal_title', deal_title
          )
        ) as data
        FROM (
          SELECT 
            t.id,
            t.title,
            t.due_date,
            d.title as deal_title
          FROM tasks t
          LEFT JOIN deals d ON t.deal_id = d.id
          WHERE t.account_id = $1 AND NOT t.completed
          ORDER BY t.due_date ASC NULLS LAST
          LIMIT 5
        ) sub
      )
      SELECT 
        s.total_deals,
        s.total_value,
        s.total_contacts,
        s.total_companies,
        dbs.data as deals_by_stage,
        rd.data as recent_deals,
        ts.active_tasks,
        ts.overdue_tasks,
        ts.today_tasks,
        rt.data as recent_tasks
      FROM stats s
      CROSS JOIN deals_by_stage dbs
      CROSS JOIN recent_deals rd
      CROSS JOIN task_stats ts
      CROSS JOIN recent_tasks rt
    `, [user.accountId])

    const row = result.rows[0]
    
    return NextResponse.json({
      totalDeals: parseInt(row.total_deals || 0),
      totalValue: parseFloat(row.total_value || 0),
      totalContacts: parseInt(row.total_contacts || 0),
      totalCompanies: parseInt(row.total_companies || 0),
      dealsByStage: row.deals_by_stage || [],
      recentDeals: row.recent_deals || [],
      tasks: {
        active: parseInt(row.active_tasks || 0),
        overdue: parseInt(row.overdue_tasks || 0),
        today: parseInt(row.today_tasks || 0)
      },
      recentTasks: row.recent_tasks || []
    })
  } catch (err: any) {
    console.error('API /api/stats error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
