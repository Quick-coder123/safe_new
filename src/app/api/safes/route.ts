import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'
import { logAction } from '@/lib/audit'

// GET - Отримати всі сейфи з інформацією про блоки
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response
    const supabase = getSupabase()
    
    const { data: safes, error } = await supabase
      .from('safes')
      .select(`
        *,
        block:safe_blocks(*)
      `)
      .order('block_id', { ascending: true })
      .order('number', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Помилка отримання сейфів з бази даних' },
        { status: 500 }
      )
    }

    return NextResponse.json({ safes })
  } catch (error) {
    console.error('Error fetching safes:', error)
    return NextResponse.json(
      { error: 'Внутрішня помилка сервера' },
      { status: 500 }
    )
  }
}

// POST - Створити новий сейф
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response
    const supabase = getSupabase()
    const { number, block_id, category, size } = await request.json()

    if (!number || !number.trim()) {
      return NextResponse.json(
        { error: 'Номер сейфа є обов\'язковим' },
        { status: 400 }
      )
    }

    if (!block_id) {
      return NextResponse.json(
        { error: 'Блок є обов\'язковим' },
        { status: 400 }
      )
    }

    // Перевіряємо, чи блок існує
    const { data: blockExists, error: blockError } = await supabase
      .from('safe_blocks')
      .select('id')
      .eq('id', block_id)
      .single()

    if (blockError || !blockExists) {
      return NextResponse.json(
        { error: 'Вказаний блок не існує' },
        { status: 400 }
      )
    }

    // Перевіряємо, чи сейф з таким номером вже існує
    const { data: existingSafe } = await supabase
      .from('safes')
      .select('id')
      .eq('number', number.trim())
      .single()

    if (existingSafe) {
      return NextResponse.json(
        { error: 'Сейф з таким номером вже існує' },
        { status: 409 }
      )
    }

    // Створюємо новий сейф
    const { data: newSafe, error } = await supabase
      .from('safes')
      .insert([
        {
          number: number.trim(),
          block_id: block_id,
          category: category || null,
          size: size?.trim() || null,
          is_occupied: false,
          maintenance_status: false,
          maintenance_comment: null,
        },
      ])
      .select(`
        *,
        block:safe_blocks(*)
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Помилка створення сейфа в базі даних' },
        { status: 500 }
      )
    }

    await logAction(auth.admin, 'safe.create', { id: newSafe.id, number: newSafe.number })
    return NextResponse.json({ safe: newSafe })
  } catch (error) {
    console.error('Error creating safe:', error)
    return NextResponse.json(
      { error: 'Внутрішня помилка сервера' },
      { status: 500 }
    )
  }
}
