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

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Пароль должен содержать минимум 6 символов' },
        { status: 400 }
      )
    }

    // Check if user already exists (case-insensitive)
    const existing = await query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    )

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 409 }
      )
    }

    // Hash password (convert to lowercase for case-insensitive login)
    const password_hash = await bcrypt.hash(password.toLowerCase(), 10)

    // Create user (trigger will auto-create pipeline)
    // Create new user (store email in lowercase)
    const result = await query(
      'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role',
      [email.toLowerCase().trim(), password_hash, full_name || '', 'manager']
    )

    const user = result.rows[0]

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    )

    // Return user data and token
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      },
      token
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Ошибка регистрации' },
      { status: 500 }
    )
  }
}
