import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'

export async function POST(req: NextRequest) {
  try {
    const { email, password, full_name } = await req.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 }
      )
    }

    // Password strength validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Пароль должен содержать минимум 8 символов' },
        { status: 400 }
      )
    }

    // Check for common weak passwords
    const weakPasswords = ['12345678', '123456789', '1234567890', 'password', 'qwerty123', '87654321']
    if (weakPasswords.includes(password.toLowerCase())) {
      return NextResponse.json(
        { error: 'Этот пароль слишком простой. Используйте более сложную комбинацию' },
        { status: 400 }
      )
    }

    // Check if email already exists globally
    const emailLc = email.toLowerCase().trim()
    const existing = await query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [emailLc]
    )

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 409 }
      )
    }

    // Hash password (convert to lowercase for case-insensitive login)
    const password_hash = await bcrypt.hash(password.toLowerCase(), 10)

    // 1. Create ACCOUNT (владелец бизнеса регистрируется)
    const subdomain = emailLc.split('@')[0].replace(/[^a-z0-9-]/g, '-') || 'account'
    const accountResult = await query(
      `INSERT INTO accounts (name, subdomain)
       VALUES ($1, $2)
       RETURNING id`,
      [full_name || 'Мой бизнес', subdomain]
    )
    const accountId = accountResult.rows[0].id

    // 2. Create first USER (admin/owner) for this account
    const userResult = await query(
      `INSERT INTO users (account_id, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, account_id, email, full_name, role`,
      [accountId, emailLc, password_hash, full_name || '', 'admin']
    )
    
    const user = userResult.rows[0]
    
    // Generate JWT token with both userId and accountId
    const token = jwt.sign(
      { 
        userId: user.id,
        accountId: user.account_id,
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    )

    return NextResponse.json({ user, token })
  } catch (error: any) {
    const msg = error?.message || String(error)
    console.error('Registration error:', msg)
    
    // Common duplicate email
    if (msg && msg.toLowerCase().includes('unique') && msg.toLowerCase().includes('email')) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Ошибка регистрации', details: msg },
      { status: 500 }
    )
  }
}
