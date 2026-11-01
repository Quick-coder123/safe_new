import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSupabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'
import { logAction } from '@/lib/audit'
import { generateTempPassword } from '@/lib/password'
import { LOGIN_PATTERN } from '@/utils/validation'

const PUBLIC_FIELDS = 'id, login, role, is_temp_password, created_at'

// GET — список адміністраторів (без хешів паролів)
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, { superAdmin: true })
  if (!auth.ok) return auth.response

  const { data, error } = await getSupabase()
    .from('administrators')
    .select(PUBLIC_FIELDS)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Administrators GET error:', error.message)
    return NextResponse.json({ error: 'Помилка бази даних' }, { status: 500 })
  }
  return NextResponse.json({ administrators: data ?? [] })
}

// POST — створити адміністратора з тимчасовим паролем (генерується на сервері)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request, { superAdmin: true })
    if (!auth.ok) return auth.response

    const { login, role } = await request.json().catch(() => ({}))
    if (typeof login !== 'string' || !LOGIN_PATTERN.test(login.trim())) {
      return NextResponse.json(
        { error: 'Логін: 3–50 символів, лише латиниця, цифри, "_" та "-"' },
        { status: 400 }
      )
    }
    const finalRole = role === 'super_admin' ? 'super_admin' : 'admin'
    const supabase = getSupabase()

    const { data: existing } = await supabase
      .from('administrators')
      .select('id')
      .eq('login', login.trim())
      .maybeSingle()
    if (existing) {
      return NextResponse.json({ error: 'Адміністратор з таким логіном вже існує' }, { status: 409 })
    }

    const temporaryPassword = generateTempPassword()
    const { data: created, error } = await supabase
      .from('administrators')
      .insert({
        login: login.trim(),
        password_hash: await bcrypt.hash(temporaryPassword, 10),
        role: finalRole,
        is_temp_password: true,
      })
      .select(PUBLIC_FIELDS)
      .single()

    if (error) {
      console.error('Administrators POST error:', error.message)
      return NextResponse.json({ error: 'Не вдалося створити адміністратора' }, { status: 500 })
    }

    await logAction(auth.admin, 'admin.create', { targetId: created.id, login: created.login, role: finalRole })
    return NextResponse.json({ success: true, administrator: created, temporaryPassword })
  } catch (error) {
    console.error('Administrators POST exception:', error)
    return NextResponse.json({ error: 'Внутрішня помилка сервера' }, { status: 500 })
  }
}
