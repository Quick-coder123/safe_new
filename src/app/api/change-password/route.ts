import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function PUT(request: NextRequest) {
  try {
    // Отримуємо сесію з cookies
    const sessionCookie = request.cookies.get('admin_session')
    
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ error: 'Не авторизований' }, { status: 401 })
    }

    const adminData = JSON.parse(sessionCookie.value)
    
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Поточний та новий пароль є обов\'язковими' }, { status: 400 })
    }

    // Знаходимо адміністратора по ID
    const { data: admin, error: adminError } = await supabase
      .from('administrators')
      .select('*')
      .eq('id', adminData.adminId)
      .single()

    if (adminError || !admin) {
      return NextResponse.json({ error: 'Адміністратор не знайдений' }, { status: 404 })
    }

    // Перевіряємо поточний пароль
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password_hash)

    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: 'Неправильний поточний пароль' }, { status: 400 })
    }

    // Хешуємо новий пароль
    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    // Оновлюємо пароль і статус тимчасового пароля
    const { error: updateError } = await supabase
      .from('administrators')
      .update({
        password_hash: newPasswordHash,
        is_temp_password: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', adminData.adminId)

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json({ error: 'Помилка оновлення пароля' }, { status: 500 })
    }

    // Оновлюємо сесію (прибираємо статус тимчасового пароля)
    const updatedSessionData = {
      ...adminData,
      isTempPassword: false
    }

    const response = NextResponse.json({ success: true, message: 'Пароль успішно змінено' })
    
    // Оновлюємо cookie сесії
    response.cookies.set('admin_session', JSON.stringify(updatedSessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 7 днів
    })

    return response

  } catch (error) {
    console.error('Error changing password:', error)
    return NextResponse.json({ error: 'Внутрішня помилка сервера' }, { status: 500 })
  }
}
