import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PUT(request: NextRequest) {
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

    const { administratorId } = await request.json()

    // Отримуємо дані адміністратора
    const { data: adminToReset } = await supabase
      .from('administrators')
      .select('user_id, email')
      .eq('id', administratorId)
      .single()

    if (!adminToReset) {
      return NextResponse.json({ error: 'Administrator not found' }, { status: 404 })
    }

    // Не дозволяємо скидати пароль самому собі
    if (adminToReset.user_id === user.id) {
      return NextResponse.json({ error: 'Cannot reset your own password' }, { status: 400 })
    }

    // Генеруємо новий тимчасовий пароль
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase() + '!'

    // Оновлюємо пароль через auth update (це потребує особливих прав)
    // Альтернативно можемо надіслати email для скидання пароля
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(adminToReset.email)

    if (resetError) {
      console.error('Error sending reset email:', resetError)
      // Якщо не вдалося надіслати email, повертаємо помилку
      return NextResponse.json({ 
        error: 'Не вдалося скинути пароль. Спробуйте надіслати лист для скидання пароля.',
        suggestion: 'Використайте функцію "Забули пароль?" на сторінці входу.'
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Лист для скидання пароля надіслано на email адміністратора.'
    })
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
