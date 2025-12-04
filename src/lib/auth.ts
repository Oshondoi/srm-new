// Auth utilities for client-side
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'

export interface User {
  id: string
  account_id: string
  email: string
  full_name: string | null
  role: string
}

export interface JWTPayload {
  userId: string
  accountId?: string // Опционально для обратной совместимости
  email: string
}

// Server-side: Extract user info from JWT token in request headers
export function getUserFromRequest(request: Request): { userId: string; accountId: string } | null {
  try {
    // Try to get token from Cookie header
    const cookieHeader = request.headers.get('cookie')
    if (!cookieHeader) {
      return null
    }
    
    const cookies = cookieHeader.split(';').map(c => c.trim())
    const authCookie = cookies.find(c => c.startsWith('auth_token='))
    
    if (!authCookie) {
      return null
    }
    
    const token = authCookie.split('=')[1]
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    
    // В текущей схеме БД каждый user = отдельный account
    // Если нет accountId в токене, используем userId
    return {
      userId: decoded.userId,
      accountId: decoded.accountId || decoded.userId
    }
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
}

export function setAuth(token: string, user: User) {
  if (typeof window === 'undefined') return
  localStorage.setItem('auth_token', token)
  localStorage.setItem('user', JSON.stringify(user))
  
  // Also set as cookie for middleware
  document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Strict`
}

export function clearAuth() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('auth_token')
  localStorage.removeItem('user')
  
  // Clear cookie
  document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
}

export function logout() {
  clearAuth()
  window.location.href = '/login'
}

// Fetch wrapper that includes auth token
export async function authFetch(url: string, options: RequestInit = {}) {
  const token = getAuthToken()
  
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
  
  const response = await fetch(url, { ...options, headers })
  
  // If unauthorized, logout
  if (response.status === 401) {
    logout()
    throw new Error('Unauthorized')
  }
  
  return response
}
