import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session'

/**
 * Перший рубіж захисту API: усі маршрути, крім публічних, вимагають
 * валідну підписану сесію. Ролі та актуальність адміністратора додатково
 * перевіряються в кожному обробнику через requireAdmin().
 */
const PUBLIC_API = new Set(['/api/admin-login', '/api/admin-session', '/api/get-settings', '/api/create-admin'])

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (PUBLIC_API.has(pathname)) return NextResponse.next()

  // Захист від CSRF: запити, що змінюють дані, мають йти з нашого ж origin
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const origin = request.headers.get('origin')
    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json({ error: 'Недозволене джерело запиту' }, { status: 403 })
    }
  }

  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)
  if (!session) {
    return NextResponse.json({ error: 'Не авторизований' }, { status: 401 })
  }
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
