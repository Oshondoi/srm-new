import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'

// Convert secret to Uint8Array for jose
const secret = new TextEncoder().encode(JWT_SECRET)

// Public routes that don't require authentication
const publicRoutes = ['/login', '/api/auth/login', '/api/auth/register']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log('[Middleware] Checking:', pathname)

  // Skip middleware for Next.js internals and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    console.log('[Middleware] Static file/internal, skipping')
    return NextResponse.next()
  }

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    console.log('[Middleware] Public route, allowing')
    return NextResponse.next()
  }

  // Check for auth token in cookies or header
  const token = request.cookies.get('auth_token')?.value

  console.log('[Middleware] Token present:', !!token)
  if (token) {
    console.log('[Middleware] Token preview:', token.substring(0, 20) + '...')
  }

  if (!token) {
    console.log('[Middleware] No token found, redirecting to /login')
    // Redirect to login if no token
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    // Verify token using jose (Edge-compatible)
    const { payload } = await jwtVerify(token, secret)
    console.log('[Middleware] Token valid, user:', payload)
    return NextResponse.next()
  } catch (error: any) {
    console.log('[Middleware] Token verification error:', error.message)
    // Invalid token - redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    '/',
    '/leads/:path*',
    '/contacts/:path*',
    '/companies/:path*',
    '/tasks/:path*',
    '/api/deals/:path*',
    '/api/companies/:path*',
    '/api/contacts/:path*',
    '/api/tasks/:path*',
    '/api/pipelines/:path*',
    '/api/stats',
    '/api/account/:path*'
  ]
}
