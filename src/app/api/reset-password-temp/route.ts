import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function PUT(request: NextRequest) {
  console.log('🔄 Reset-password TEMP API: Starting request...')
  
  try {
    console.log('⚠️ TEMPORARY: Skipping authentication for reset-password')
    
    const { administratorId } = await request.json()
    console.log('📝 Administrator ID to reset:', administratorId)

    if (!administratorId) {
      return NextResponse.json({ error: 'Administrator ID is required' }, { status: 400 })
    }

    // Перевіряємо чи існує адміністратор
    const { data: admin, error: fetchError } = await supabase
      .from('administrators')
      .select('id, login')
      .eq('id', administratorId)
      .single()

    if (fetchError || !admin) {
      console.error('❌ Administrator not found:', fetchError)
      return NextResponse.json({ error: 'Administrator not found' }, { status: 404 })
    }

    // Генеруємо новий тимчасовий пароль
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase() + '!'
    console.log('🔑 Generated new temporary password for:', admin.login)
    
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
      console.error('❌ Error updating password:', updateError)
      throw updateError
    }

    console.log('✅ Password reset successfully for administrator:', admin.login)

    return NextResponse.json({ 
      success: true,
      message: `Пароль для адміністратора "${admin.login}" успішно скинуто! Новий тимчасовий пароль: ${tempPassword}`,
      temporaryPassword: tempPassword
    })

  } catch (error) {
    console.error('❌ Reset password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
