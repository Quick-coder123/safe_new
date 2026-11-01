import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSupabase } from '@/lib/supabase'
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from '@/lib/session'
import { checkRateLimit } from '@/lib/rateLimit'

// Хеш-заглушка, щоб час відповіді не видавав, чи існує логін
const DUMMY_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8.Gk0p9pXKuK3V2D6Jr4YyFhP8JQ6e'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Забагато спроб входу. Спробуйте пізніше.' },
        { status: 429 }
      )
    }

    const { login, password } = await request.json().catch(() => ({}))
    if (typeof login !== 'string' || typeof password !== 'string' || !login || !password) {
      return NextResponse.json({ error: "Логін та пароль є обов'язковими" }, { status: 400 })
    }

    const { data: admin } = await getSupabase()
      .from('administrators')
      .select('id, login, role, is_temp_password, password_hash')
      .eq('login', login.trim())
      .maybeSingle()

    const passwordValid = await bcrypt.compare(password, admin?.password_hash || DUMMY_HASH)
    if (!admin || !passwordValid) {
      return NextResponse.json({ error: 'Неправильний логін або пароль' }, { status: 401 })
    }

    const sessionData = {
      adminId: admin.id,
      login: admin.login,
      role: admin.role,
      isTempPassword: !!admin.is_temp_password,
    }

    const response = NextResponse.json({ success: true, admin: sessionData })
    response.cookies.set(SESSION_COOKIE, await createSessionToken(sessionData), sessionCookieOptions())
    return response
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json({ error: 'Внутрішня помилка сервера' }, { status: 500 })
  }
}
