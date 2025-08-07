import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

// GET - отримати всі блоки сейфів
export async function GET() {
  try {
    const supabase = createSupabaseClient()

    const { data: blocks, error } = await supabase
      .from('safe_blocks')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching safe blocks:', error)
      return NextResponse.json({ error: 'Помилка завантаження блоків' }, { status: 500 })
    }

    return NextResponse.json({ blocks })
  } catch (error) {
    console.error('Error in safe-blocks GET:', error)
    return NextResponse.json({ error: 'Внутрішня помилка сервера' }, { status: 500 })
  }
}

// POST - створити новий блок сейфів
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient()

    const body = await request.json()
    const { name, description } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Назва блоку є обов\'язковою' }, { status: 400 })
    }

    // Перевіряємо, чи блок з такою назвою вже існує
    const { data: existingBlock } = await supabase
      .from('safe_blocks')
      .select('id')
      .eq('name', name.trim())
      .single()

    if (existingBlock) {
      return NextResponse.json({ error: 'Блок з такою назвою вже існує' }, { status: 400 })
    }

    const { data: newBlock, error } = await supabase
      .from('safe_blocks')
      .insert({
        name: name.trim(),
        description: description?.trim() || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating safe block:', error)
      return NextResponse.json({ error: 'Помилка створення блоку' }, { status: 500 })
    }

    return NextResponse.json({ block: newBlock }, { status: 201 })
  } catch (error) {
    console.error('Error in safe-blocks POST:', error)
    return NextResponse.json({ error: 'Внутрішня помилка сервера' }, { status: 500 })
  }
}
