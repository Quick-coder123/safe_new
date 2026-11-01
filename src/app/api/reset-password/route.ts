import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSupabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'
import { logAction } from '@/lib/audit'
import { generateTempPassword } from '@/lib/password'

// PUT — скинути пароль іншого адміністратора (тільки супер-адмін)
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin(request, { superAdmin: true })
    if (!auth.ok) return auth.response

    const { administratorId } = await request.json().catch(() => ({}))
    const id = Number(administratorId)
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: 'Некоректний ID адміністратора' }, { status: 400 })
    }
    if (id === auth.admin.id) {
      return NextResponse.json({ error: 'Для зміни власного пароля скористайтеся "Змінити пароль"' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { data: target } = await supabase
      .from('administrators')
      .select('id, login')
      .eq('id', id)
      .maybeSingle()
    if (!target) return NextResponse.json({ error: 'Адміністратора не знайдено' }, { status: 404 })

    const temporaryPassword = generateTempPassword()
    const { error } = await supabase
      .from('administrators')
      .update({ password_hash: await bcrypt.hash(temporaryPassword, 10), is_temp_password: true })
      .eq('id', id)

    if (error) {
      console.error('Reset password error:', error.message)
      return NextResponse.json({ error: 'Не вдалося скинути пароль' }, { status: 500 })
    }

    await logAction(auth.admin, 'admin.password_reset', { targetId: id, targetLogin: target.login })
    return NextResponse.json({ success: true, login: target.login, temporaryPassword })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Внутрішня помилка сервера' }, { status: 500 })
  }
}
