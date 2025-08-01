import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PUT(request: NextRequest) {
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

    const { administratorId, role } = await request.json()

    // Не дозволяємо змінювати свою роль
    if (currentAdmin.id === administratorId) {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 })
    }

    // Оновлюємо роль
    const { error: updateError } = await supabase
      .from('administrators')
      .update({ role })
      .eq('id', administratorId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating administrator role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
