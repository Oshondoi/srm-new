import { NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { query } from '@/lib/db'

// GET - получить активную воронку аккаунта
export async function GET(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await query(
      'SELECT last_active_pipeline_id FROM accounts WHERE id = $1',
      [user.accountId]
    )
    
    const pipelineId = result.rows[0]?.last_active_pipeline_id || null
    return NextResponse.json({ pipelineId })
  } catch (error) {
    console.error('Error fetching active pipeline:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

// POST - сохранить активную воронку
export async function POST(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { pipelineId } = await request.json()
    
    await query(
      'UPDATE accounts SET last_active_pipeline_id = $1 WHERE id = $2',
      [pipelineId, user.accountId]
    )
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving active pipeline:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
