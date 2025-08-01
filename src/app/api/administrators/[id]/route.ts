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

    const { administratorId, role } = await request.json()

    // Не дозволяємо змінювати свою роль
    const { data: adminToUpdate } = await supabase
      .from('administrators')
      .select('user_id')
      .eq('id', administratorId)
      .single()

    if (adminToUpdate?.user_id === user.id) {
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
