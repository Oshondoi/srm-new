import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 }
      )
    }

    // Find user (case-insensitive email)
    const result = await query(
      'SELECT id, account_id, email, password_hash, full_name, role FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      )
    }

    const user = result.rows[0]

    // Check password (case-insensitive comparison)
    // Convert both to lowercase before comparing
    const storedHash = user.password_hash
    const isValidPassword = await bcrypt.compare(password.toLowerCase(), storedHash)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      )
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, accountId: user.account_id, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    )

    // Return user data and token
    return NextResponse.json({
      user: {
        id: user.id,
        account_id: user.account_id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      },
      token
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Ошибка входа' },
      { status: 500 }
    )
  }
}
