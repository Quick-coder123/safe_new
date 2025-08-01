import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { login, password_hash, role, is_temp_password } = await request.json()

    if (!login || !password_hash || !role) {
      return NextResponse.json(
        { error: 'Логін, хеш паролю та роль є обов\'язковими' },
        { status: 400 }
      )
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
        password_hash,
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
