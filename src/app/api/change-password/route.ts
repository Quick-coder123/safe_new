import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSupabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'
import { logAction } from '@/lib/audit'
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from '@/lib/session'
import { validatePasswordStrength } from '@/utils/validation'

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin(request, { allowTempPassword: true })
    if (!auth.ok) return auth.response

    const { currentPassword, newPassword } = await request.json().catch(() => ({}))
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || !currentPassword || !newPassword) {
      return NextResponse.json({ error: "Поточний та новий пароль є обов'язковими" }, { status: 400 })
    }

    const strength = validatePasswordStrength(newPassword)
    if (!strength.valid) return NextResponse.json({ error: strength.error }, { status: 400 })
    if (currentPassword === newPassword) {
      return NextResponse.json({ error: 'Новий пароль має відрізнятися від поточного' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { data: admin } = await supabase
      .from('administrators')
      .select('password_hash')
      .eq('id', auth.admin.id)
      .single()

    if (!admin || !(await bcrypt.compare(currentPassword, admin.password_hash))) {
      return NextResponse.json({ error: 'Неправильний поточний пароль' }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('administrators')
      .update({
        password_hash: await bcrypt.hash(newPassword, 10),
        is_temp_password: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', auth.admin.id)

    if (updateError) {
      console.error('Error updating password:', updateError.message)
      return NextResponse.json({ error: 'Помилка оновлення пароля' }, { status: 500 })
    }

    await logAction(auth.admin, 'admin.password_change')

    const response = NextResponse.json({ success: true, message: 'Пароль успішно змінено' })
    const token = await createSessionToken({
      adminId: auth.admin.id,
      login: auth.admin.login,
      role: auth.admin.role,
      isTempPassword: false,
    })
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions())
    return response
  } catch (error) {
    console.error('Error changing password:', error)
    return NextResponse.json({ error: 'Внутрішня помилка сервера' }, { status: 500 })
  }
}
