import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSupabase } from '@/lib/supabase'
import { logAction } from '@/lib/audit'
import { LOGIN_PATTERN, validatePasswordStrength } from '@/utils/validation'

/**
 * Створення ПЕРШОГО супер-адміністратора.
 * Працює лише тоді, коли в базі ще немає жодного адміністратора.
 * Далі адміністраторів додає супер-адмін через /api/administrators.
 */

async function countAdmins(): Promise<number | null> {
  try {
    const { count, error } = await getSupabase()
      .from('administrators')
      .select('id', { count: 'exact', head: true })
    if (error) {
      console.error('create-admin: count error', error.message)
      return null
    }
    return count ?? 0
  } catch (error) {
    console.error('create-admin: count exception', error)
    return null
  }
}

// GET — чи доступне початкове налаштування
export async function GET() {
  const count = await countAdmins()
  return NextResponse.json({ setupAvailable: count === 0 })
}

export async function POST(request: NextRequest) {
  try {
    const count = await countAdmins()
    if (count === null) return NextResponse.json({ error: 'Помилка бази даних' }, { status: 500 })
    if (count > 0) {
      return NextResponse.json(
        { error: 'Адміністратор вже існує. Нових адміністраторів додає супер-адміністратор в адмін-панелі.' },
        { status: 403 }
      )
    }

    const { login, password } = await request.json().catch(() => ({}))
    if (typeof login !== 'string' || !LOGIN_PATTERN.test(login)) {
      return NextResponse.json(
        { error: 'Логін: 3–50 символів, лише латиниця, цифри, "_" та "-"' },
        { status: 400 }
      )
    }
    const strength = validatePasswordStrength(password)
    if (!strength.valid) return NextResponse.json({ error: strength.error }, { status: 400 })

    const { data: newAdmin, error } = await getSupabase()
      .from('administrators')
      .insert({
        login,
        password_hash: await bcrypt.hash(password, 10),
        role: 'super_admin',
        is_temp_password: false,
      })
      .select('id, login, role')
      .single()

    if (error) {
      console.error('Error creating admin:', error.message)
      return NextResponse.json({ error: 'Помилка створення адміністратора' }, { status: 500 })
    }

    await logAction(newAdmin, 'admin.create', { login: newAdmin.login, role: newAdmin.role, bootstrap: true })
    return NextResponse.json({ success: true, admin: newAdmin })
  } catch (error) {
    console.error('Error in create-admin API:', error)
    return NextResponse.json({ error: 'Внутрішня помилка сервера' }, { status: 500 })
  }
}
