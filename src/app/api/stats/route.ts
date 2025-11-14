import { NextResponse } from 'next/server'
import { query } from '../../../lib/db'

export async function GET() {
  try {
    // Total deals
    const totalDealsResult = await query('SELECT COUNT(*) as count FROM deals')
    const totalDeals = parseInt(totalDealsResult.rows[0].count)

    // Total value in pipeline
    const totalValueResult = await query('SELECT SUM(value) as total FROM deals WHERE closed = false')
    const totalValue = parseFloat(totalValueResult.rows[0].total || 0)

    // Deals by stage
    const dealsByStageResult = await query(`
      SELECT s.name as stage_name, COUNT(d.id) as count
      FROM stages s
      LEFT JOIN deals d ON d.stage_id = s.id
      GROUP BY s.id, s.name, s.position
      ORDER BY s.position
    `)

    // Recent deals
    const recentDealsResult = await query(`
      SELECT d.*, c.name as company_name, p.name as pipeline_name, s.name as stage_name
      FROM deals d
      LEFT JOIN companies c ON d.company_id = c.id
      LEFT JOIN pipelines p ON d.pipeline_id = p.id
      LEFT JOIN stages s ON d.stage_id = s.id
      ORDER BY d.created_at DESC
      LIMIT 5
    `)

    // Total contacts and companies
    const contactsResult = await query('SELECT COUNT(*) as count FROM contacts')
    const companiesResult = await query('SELECT COUNT(*) as count FROM companies')

    // Tasks stats
    const tasksResult = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE NOT completed) as active_tasks,
        COUNT(*) FILTER (WHERE NOT completed AND due_at < NOW()) as overdue_tasks,
        COUNT(*) FILTER (WHERE NOT completed AND DATE(due_at) = DATE(NOW())) as today_tasks
      FROM tasks
    `)

    // Recent tasks
    const recentTasksResult = await query(`
      SELECT t.*, d.title as deal_title
      FROM tasks t
      LEFT JOIN deals d ON t.deal_id = d.id
      WHERE NOT t.completed
      ORDER BY t.due_at ASC NULLS LAST
      LIMIT 5
    `)

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
