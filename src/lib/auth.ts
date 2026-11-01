import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { SESSION_COOKIE, verifySessionToken, type AdminRole } from '@/lib/session'

export interface AuthenticatedAdmin {
  id: number
  login: string
  role: AdminRole
  is_temp_password: boolean
}

type AuthResult =
  | { ok: true; admin: AuthenticatedAdmin }
  | { ok: false; response: NextResponse }

const unauthorized = () =>
  NextResponse.json({ error: 'Не авторизований' }, { status: 401 })
const forbidden = () =>
  NextResponse.json({ error: 'Недостатньо прав' }, { status: 403 })

/**
 * Перевіряє підписану сесію та актуальний стан адміністратора в базі
 * (адміністратора могли видалити або змінити йому роль).
 */
export async function requireAdmin(
  request: NextRequest,
  options: { superAdmin?: boolean; allowTempPassword?: boolean } = {}
): Promise<AuthResult> {
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)
  if (!session) return { ok: false, response: unauthorized() }

  const { data: admin, error } = await getSupabase()
    .from('administrators')
    .select('id, login, role, is_temp_password')
    .eq('id', session.adminId)
    .maybeSingle()

  if (error) {
    console.error('Auth: помилка читання адміністратора', error.message)
    return { ok: false, response: NextResponse.json({ error: 'Помилка бази даних' }, { status: 500 }) }
  }
  if (!admin) return { ok: false, response: unauthorized() }

  // Поки пароль тимчасовий — дозволено лише змінити пароль
  if (admin.is_temp_password && !options.allowTempPassword) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Потрібно змінити тимчасовий пароль', code: 'TEMP_PASSWORD' },
        { status: 403 }
      ),
    }
  }

  if (options.superAdmin && admin.role !== 'super_admin') {
    return { ok: false, response: forbidden() }
  }

  return { ok: true, admin: admin as AuthenticatedAdmin }
}
