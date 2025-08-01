import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { login, password, password_hash, role, is_temp_password } = await request.json()

    if (!login || (!password && !password_hash) || !role) {
      return NextResponse.json(
        { error: 'Логін, пароль та роль є обов\'язковими' },
        { status: 400 }
      )
    }

    // Хешуємо пароль, якщо передано plain пароль
    let finalPasswordHash = password_hash
    if (password && !password_hash) {
      finalPasswordHash = await bcrypt.hash(password, 10)
    }

    // Перевіряємо, чи не існує вже адміністратор з таким логіном
    const { data: existingAdmin } = await supabase
      .from('administrators')
      .select('id')
      .eq('login', login)
      .single()

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Адміністратор з таким логіном вже існує' },
        { status: 409 }
      )
    }

    // Створюємо нового адміністратора
    const { data: newAdmin, error } = await supabase
      .from('administrators')
      .insert({
        login,
        password_hash: finalPasswordHash,
        role,
        is_temp_password: is_temp_password || false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating admin:', error)
      return NextResponse.json(
        { error: 'Помилка створення адміністратора: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      admin: {
        id: newAdmin.id,
        login: newAdmin.login,
        role: newAdmin.role
      }
    })

  } catch (error) {
    console.error('Error in create-admin API:', error)
    return NextResponse.json(
      { error: 'Внутрішня помилка сервера' },
      { status: 500 }
    )
  }
}
