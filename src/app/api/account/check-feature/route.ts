import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { hasFeatureAccess } from '@/lib/subscription'

/**
 * POST /api/account/check-feature
 * Проверить доступ к функции
 * Body: { feature: string }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { feature } = await request.json()
    if (!feature) {
      return NextResponse.json({ error: 'Feature name required' }, { status: 400 })
    }

    const hasAccess = await hasFeatureAccess(user.accountId, feature)
    
    return NextResponse.json({
      hasAccess,
      feature
    })
  } catch (error) {
    console.error('Error checking feature access:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
