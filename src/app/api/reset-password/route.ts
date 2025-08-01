import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function PUT(request: NextRequest) {
  try {
    // Перевірка аутентифікації через cookies
    const cookieHeader = request.headers.get('cookie')
    const sessionValidation = await validateAdminSession(cookieHeader)
    
    if (!sessionValidation.isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentAdmin = sessionValidation.admin

    // Перевіряємо, чи є поточний користувач супер-адміністратором
    if (!currentAdmin || currentAdmin.role !== 'super_admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { administratorId } = await request.json()

    // Не дозволяємо скидати пароль самому собі
    if (currentAdmin.id === administratorId) {
      return NextResponse.json({ error: 'Cannot reset your own password' }, { status: 400 })
    }

    // Генеруємо новий тимчасовий пароль
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase() + '!'
    
    // Хешуємо пароль
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    // Оновлюємо пароль адміністратора
    const { error: updateError } = await supabase
      .from('administrators')
      .update({ 
        password_hash: hashedPassword,
        is_temp_password: true
      })
      .eq('id', administratorId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ 
      success: true,
      tempPassword,
      message: `Пароль успішно скинуто!\n\nНовий тимчасовий пароль: ${tempPassword}\n\nЗбережіть цей пароль! Адміністратор повинен змінити його при наступному вході.`
    })
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
