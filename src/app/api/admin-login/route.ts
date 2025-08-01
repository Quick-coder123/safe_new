import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { login, password } = await request.json()

    if (!login || !password) {
      return NextResponse.json(
        { error: 'Логін та пароль є обов\'язковими' },
        { status: 400 }
      )
    }

    // Знаходимо адміністратора по логіну
    const { data: admin, error: adminError } = await supabase
      .from('administrators')
      .select('*')
      .eq('login', login)
      .single()

    if (adminError || !admin) {
      return NextResponse.json(
        { error: 'Неправильний логін або пароль' },
        { status: 401 }
      )
    }

    // Перевіряємо пароль
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Неправильний логін або пароль' },
        { status: 401 }
      )
    }

    // Створюємо сесію для адміністратора
    const sessionData = {
      adminId: admin.id,
      login: admin.login,
      role: admin.role,
      isTempPassword: admin.is_temp_password
    }

    const response = NextResponse.json({
      success: true,
      admin: sessionData
    })

    // Встановлюємо cookie з сесією (в реальному проекті краще використовувати JWT)
    response.cookies.set('admin_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 7 днів
    })

    return response

  } catch (error) {
    console.error('Error during admin login:', error)
    return NextResponse.json(
      { error: 'Внутрішня помилка сервера' },
      { status: 500 }
    )
  }
}
