import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Перевірка аутентифікації через cookies
    const cookieHeader = request.headers.get('cookie')
    if (!cookieHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Знаходимо admin_session cookie
    const cookies = cookieHeader.split('; ')
    const sessionCookie = cookies.find(cookie => cookie.startsWith('admin_session='))
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionValue = sessionCookie.split('=')[1]
    if (!sessionValue || sessionValue === '') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Перевірка сесії через API
    const sessionResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin-session`, {
      headers: {
        'Cookie': cookieHeader
      }
    })

    if (!sessionResponse.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Отримуємо список адміністраторів
    const { data: administrators, error } = await supabase
      .from('administrators')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ administrators })
  } catch (error) {
    console.error('Error fetching administrators:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Перевіряємо, чи є поточний користувач супер-адміністратором
    const { data: currentAdmin } = await supabase
      .from('administrators')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!currentAdmin || currentAdmin.role !== 'super_admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { email, role } = await request.json()

    // Генеруємо тимчасовий пароль
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase() + '!'
    
    // Створюємо нового користувача через звичайну реєстрацію
    const { data: newUser, error: createError } = await supabase.auth.signUp({
      email,
      password: tempPassword,
    })

    if (createError) {
      throw createError
    }

    if (!newUser.user) {
      throw new Error('Failed to create user')
    }

    // Додаємо в таблицю адміністраторів
    const { error: insertError } = await supabase
      .from('administrators')
      .insert({
        user_id: newUser.user.id,
        email,
        role,
        is_temp_password: true,
        created_by: user.id
      })

    if (insertError) {
      throw insertError
    }

    return NextResponse.json({ 
      success: true, 
      tempPassword,
      message: `Адміністратор створений. Тимчасовий пароль: ${tempPassword}` 
    })
  } catch (error) {
    console.error('Error creating administrator:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Перевірка аутентифікації через cookies
    const cookieHeader = request.headers.get('cookie')
    if (!cookieHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Знаходимо admin_session cookie
    const cookies = cookieHeader.split('; ')
    const sessionCookie = cookies.find(cookie => cookie.startsWith('admin_session='))
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionValue = sessionCookie.split('=')[1]
    if (!sessionValue || sessionValue === '') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Перевірка сесії та отримання інформації про поточного адміністратора
    const sessionResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin-session`, {
      headers: {
        'Cookie': cookieHeader
      }
    })

    if (!sessionResponse.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionData = await sessionResponse.json()
    const currentAdmin = sessionData.admin

    // Перевіряємо, чи є поточний користувач супер-адміністратором
    if (!currentAdmin || currentAdmin.role !== 'super_admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { administratorId } = await request.json()

    // Не дозволяємо видаляти самого себе
    if (currentAdmin.id === administratorId) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
    }

    // Видаляємо адміністратора
    const { error: deleteError } = await supabase
      .from('administrators')
      .delete()
      .eq('id', administratorId)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting administrator:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
