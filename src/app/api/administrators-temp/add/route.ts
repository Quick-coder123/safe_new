import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'
import bcrypt from 'bcrypt'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient()
    const body = await request.json()
    const { login, password } = body

    if (!login || !password) {
      return NextResponse.json(
        { error: 'Логін і пароль обов\'язкові' },
        { status: 400 }
      )
    }

    // Перевіряємо чи не існує вже такий логін
    const { data: existingAdmin } = await supabase
      .from('administrators')
      .select('id')
      .eq('login', login)
      .single()

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Адміністратор з таким логіном вже існує' },
        { status: 400 }
      )
    }

    // Хешуємо пароль
    const password_hash = await bcrypt.hash(password, 10)

    // Додаємо нового адміністратора
    const { data, error } = await supabase
      .from('administrators')
      .insert([{ 
        login, 
        password_hash,
        role: 'admin',
        is_temp_password: true
      }])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Помилка бази даних', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Внутрішня помилка сервера' },
      { status: 500 }
    )
  }
}
