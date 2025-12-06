import { NextResponse } from 'next/server'
import { query } from '../../../../../lib/db'
import { getUserFromRequest } from '../../../../../lib/auth'

// GET /api/deals/[id]/contacts - получить все контакты сделки
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

    const result = await query(
      `SELECT c.*, dc.created_at as linked_at
       FROM deal_contacts dc
       JOIN contacts c ON dc.contact_id = c.id
       JOIN deals d ON dc.deal_id = d.id
       WHERE dc.deal_id = $1 AND d.account_id = $2
       ORDER BY dc.created_at ASC`,
      [dealId, user.accountId]
    )

    return NextResponse.json(result.rows)
  } catch (err: any) {
    console.error('GET /api/deals/[id]/contacts error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/deals/[id]/contacts - добавить контакт к сделке
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: dealId } = await params
    const { contact_id } = await request.json()

    if (!contact_id) {
      return NextResponse.json({ error: 'contact_id required' }, { status: 400 })
    }

    // Проверяем что сделка принадлежит аккаунту
    const dealCheck = await query('SELECT id FROM deals WHERE id = $1 AND account_id = $2', [dealId, user.accountId])
    if (dealCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    // Проверяем что контакт принадлежит аккаунту
    const contactCheck = await query('SELECT id FROM contacts WHERE id = $1 AND account_id = $2', [contact_id, user.accountId])
    if (contactCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    await query(
      `INSERT INTO deal_contacts (deal_id, contact_id)
       VALUES ($1, $2)
       ON CONFLICT (deal_id, contact_id) DO NOTHING`,
      [dealId, contact_id]
    )

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('POST /api/deals/[id]/contacts error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE /api/deals/[id]/contacts - удалить контакт из сделки
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: dealId } = await params
    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contact_id')

    if (!contactId) {
      return NextResponse.json({ error: 'contact_id required' }, { status: 400 })
    }

    // Проверяем что сделка принадлежит аккаунту
    const dealCheck = await query('SELECT id FROM deals WHERE id = $1 AND account_id = $2', [dealId, user.accountId])
    if (dealCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    await query(
      `DELETE FROM deal_contacts
       WHERE deal_id = $1 AND contact_id = $2`,
      [dealId, contactId]
    )

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('DELETE /api/deals/[id]/contacts error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
