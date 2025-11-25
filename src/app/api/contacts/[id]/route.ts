import { NextResponse } from 'next/server'
import { query } from '../../../../lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await query(
      `SELECT c.*, comp.name as company_name 
       FROM contacts c
       LEFT JOIN companies comp ON c.company_id = comp.id
       WHERE c.id = $1`,
      [id]
    )
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }
    
    return NextResponse.json(result.rows[0])
  } catch (err: any) {
    console.error('API /api/contacts/[id] GET error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { first_name, last_name, email, phone, position, company_id, budget2, meeting_date } = body

    const result = await query(
      `UPDATE contacts 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           email = COALESCE($3, email),
           phone = COALESCE($4, phone),
           position = COALESCE($5, position),
           company_id = COALESCE($6, company_id),
           budget2 = COALESCE($7, budget2),
           meeting_date = COALESCE($8, meeting_date)
       WHERE id = $9
       RETURNING *`,
      [first_name, last_name, email, phone, position, company_id, budget2, meeting_date, id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (err: any) {
    console.error('API /api/contacts/[id] PUT error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await query('DELETE FROM contacts WHERE id = $1', [id])
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('API /api/contacts/[id] DELETE error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
