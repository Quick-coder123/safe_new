import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createSupabaseClient()
    
    // Extract ID from URL path
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const id = pathParts[pathParts.length - 1]

    if (!id || id === '[id]') {
      return NextResponse.json(
        { error: 'ID адміністратора обов\'язковий' },
        { status: 400 }
      )
    }

    // Перевіряємо чи не є це останнім адміністратором
    const { count } = await supabase
      .from('administrators')
      .select('*', { count: 'exact', head: true })

    if (count && count <= 1) {
      return NextResponse.json(
        { error: 'Не можна видалити останнього адміністратора' },
        { status: 400 }
      )
    }

    // Видаляємо адміністратора
    const { error } = await supabase
      .from('administrators')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Помилка бази даних' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Внутрішня помилка сервера' },
      { status: 500 }
    )
  }
}
