import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateAdminSession } from '@/lib/auth'

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
