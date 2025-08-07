import { NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

// GET - Отримати всі блоки
export async function GET() {
  try {
    const supabase = createSupabaseClient()
    
    const { data: blocks, error } = await supabase
      .from('safe_blocks')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Помилка отримання блоків з бази даних' },
        { status: 500 }
      )
    }

    return NextResponse.json(blocks)
  } catch (error) {
    console.error('Error fetching blocks:', error)
    return NextResponse.json(
      { error: 'Внутрішня помилка сервера' },
      { status: 500 }
    )
  }
}

// POST - Створити новий блок
export async function POST(request: Request) {
  try {
    const supabase = createSupabaseClient()
    const { name, description } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Назва блоку є обов\'язковою' },
        { status: 400 }
      )
    }

    // Перевіряємо, чи блок з такою назвою вже існує
    const { data: existingBlock } = await supabase
      .from('safe_blocks')
      .select('id')
      .eq('name', name.trim())
      .single()

    if (existingBlock) {
      return NextResponse.json(
        { error: 'Блок з такою назвою вже існує' },
        { status: 409 }
      )
    }

    // Створюємо новий блок
    const { data: newBlock, error } = await supabase
      .from('safe_blocks')
      .insert([
        {
          name: name.trim(),
          description: description?.trim() || null,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Помилка створення блоку в базі даних' },
        { status: 500 }
      )
    }

    return NextResponse.json(newBlock)
  } catch (error) {
    console.error('Error creating block:', error)
    return NextResponse.json(
      { error: 'Внутрішня помилка сервера' },
      { status: 500 }
    )
  }
}
