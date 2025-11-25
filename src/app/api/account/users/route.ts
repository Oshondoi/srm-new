import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Получаем всех пользователей аккаунта
    const result = await query(
      `SELECT id, email, full_name, role 
       FROM users 
       WHERE account_id = $1 
       ORDER BY full_name`,
      [user.accountId]
    )

    return NextResponse.json(result.rows)
  } catch (error: any) {
    console.error('Error fetching account users:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
