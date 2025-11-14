import { NextResponse } from 'next/server'
import { query } from '../../../../../lib/db'

// GET /api/deals/[id]/contacts - получить все контакты сделки
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dealId } = await params

    const result = await query(
      `SELECT c.*, dc.created_at as linked_at
       FROM deal_contacts dc
       JOIN contacts c ON dc.contact_id = c.id
       WHERE dc.deal_id = $1
       ORDER BY dc.created_at ASC`,
      [dealId]
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
    const { id: dealId } = await params
    const { contact_id } = await request.json()

    if (!contact_id) {
      return NextResponse.json({ error: 'contact_id required' }, { status: 400 })
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
    const { id: dealId } = await params
    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contact_id')

    if (!contactId) {
      return NextResponse.json({ error: 'contact_id required' }, { status: 400 })
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
