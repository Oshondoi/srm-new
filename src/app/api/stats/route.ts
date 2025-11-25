import { NextResponse } from 'next/server'
import { query } from '../../../lib/db'
import { getUserFromRequest } from '../../../lib/auth'

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Total deals
    const totalDealsResult = await query('SELECT COUNT(*) as count FROM deals WHERE account_id = $1', [user.accountId])
    const totalDeals = parseInt(totalDealsResult.rows[0].count)

    // Total value in pipeline
    const totalValueResult = await query('SELECT SUM(budget) as total FROM deals WHERE account_id = $1 AND is_closed = false', [user.accountId])
    const totalValue = parseFloat(totalValueResult.rows[0].total || 0)

    // Deals by stage
    const dealsByStageResult = await query(`
      SELECT s.name as stage_name, COUNT(d.id) as count
      FROM stages s
      INNER JOIN pipelines p ON s.pipeline_id = p.id
      LEFT JOIN deals d ON d.stage_id = s.id AND d.account_id = $1
      WHERE p.account_id = $1
      GROUP BY s.id, s.name, s.position
      ORDER BY s.position
    `, [user.accountId])

    // Recent deals
    const recentDealsResult = await query(`
      SELECT d.*, c.name as company_name, p.name as pipeline_name, s.name as stage_name
      FROM deals d
      LEFT JOIN companies c ON d.company_id = c.id
      LEFT JOIN pipelines p ON d.pipeline_id = p.id
      LEFT JOIN stages s ON d.stage_id = s.id
      WHERE d.account_id = $1
      ORDER BY d.created_at DESC
      LIMIT 5
    `, [user.accountId])

    // Total contacts and companies
    const contactsResult = await query('SELECT COUNT(*) as count FROM contacts WHERE account_id = $1', [user.accountId])
    const companiesResult = await query('SELECT COUNT(*) as count FROM companies WHERE account_id = $1', [user.accountId])

    // Tasks stats
    const tasksResult = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE NOT completed) as active_tasks,
        COUNT(*) FILTER (WHERE NOT completed AND due_date < NOW()) as overdue_tasks,
        COUNT(*) FILTER (WHERE NOT completed AND DATE(due_date) = DATE(NOW())) as today_tasks
      FROM tasks
      WHERE account_id = $1
    `, [user.accountId])

    // Recent tasks
    const recentTasksResult = await query(`
      SELECT t.*, d.title as deal_title
      FROM tasks t
      LEFT JOIN deals d ON t.deal_id = d.id
      WHERE t.account_id = $1 AND NOT t.completed
      ORDER BY t.due_date ASC NULLS LAST
      LIMIT 5
    `, [user.accountId])

    return NextResponse.json({
      totalDeals,
      totalValue,
      totalContacts: parseInt(contactsResult.rows[0].count),
      totalCompanies: parseInt(companiesResult.rows[0].count),
      dealsByStage: dealsByStageResult.rows,
      recentDeals: recentDealsResult.rows,
      tasks: {
        active: parseInt(tasksResult.rows[0].active_tasks || 0),
        overdue: parseInt(tasksResult.rows[0].overdue_tasks || 0),
        today: parseInt(tasksResult.rows[0].today_tasks || 0)
      },
      recentTasks: recentTasksResult.rows
    })
  } catch (err: any) {
    console.error('API /api/stats error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
