import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { hasFeatureAccess, getAccountPlan } from '@/lib/subscription'

/**
 * GET /api/account/subscription
 * Получить информацию о тарифе текущего аккаунта
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const plan = await getAccountPlan(user.accountId)
    
    return NextResponse.json({
      plan: plan || 'free',
      accountId: user.accountId
    })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
