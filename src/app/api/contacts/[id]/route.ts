import { NextResponse } from 'next/server'
import { query } from '../../../../lib/db'
import { getUserFromRequest } from '../../../../lib/auth'

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
    // Auth & multi-tenancy enforcement
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params
    const body = await request.json()
    const { first_name, last_name, email, phone, position, company_id, budget2 } = body

    // Нормализация company_id: пустая строка означает очистку, иначе UUID или null
    const normalizedCompanyId = company_id === '' ? null : company_id || null

    const result = await query(
      `UPDATE contacts 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           email = COALESCE($3, email),
           phone = COALESCE($4, phone),
           position = COALESCE($5, position),
           company_id = $6,
           budget2 = COALESCE($7, budget2)
       WHERE id = $8 AND account_id = $9
       RETURNING *`,
      [
        first_name,
        last_name,
        email,
        phone,
        position,
        normalizedCompanyId,
        budget2,
        id,
        user.accountId
      ]
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
