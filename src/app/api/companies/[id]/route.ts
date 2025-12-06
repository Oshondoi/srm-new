import { NextResponse } from 'next/server'
import { query } from '../../../../lib/db'
import { getUserFromRequest } from '../../../../lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const result = await query('SELECT * FROM companies WHERE id = $1 AND account_id = $2 AND deleted_at IS NULL', [id, user.accountId])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }
    
    return NextResponse.json(result.rows[0])
  } catch (err: any) {
    console.error('API /api/companies/[id] GET error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, website, phone, email, address } = body

    const result = await query(
      `UPDATE companies 
       SET name = COALESCE($1, name),
           website = COALESCE($2, website),
           phone = COALESCE($3, phone),
           email = COALESCE($4, email),
           address = COALESCE($5, address)
       WHERE id = $6 AND account_id = $7
       RETURNING *`,
      [name, website, phone, email, address, id, user.accountId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (err: any) {
    console.error('API /api/companies/[id] PUT error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const result = await query(
      'UPDATE companies SET deleted_at = NOW() WHERE id = $1 AND account_id = $2 AND deleted_at IS NULL RETURNING id',
      [id, user.accountId]
    )
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('API /api/companies/[id] DELETE error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
