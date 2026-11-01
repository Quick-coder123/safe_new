import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'
import { logAction } from '@/lib/audit'

// PUT - Оновити блок
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response
    const supabase = getSupabase()
    const { id } = await context.params
    const blockId = parseInt(id)
    const body = await request.json()
    const { name, description } = body

    if (isNaN(blockId)) {
      return NextResponse.json(
        { error: 'Невірний ID блоку' },
        { status: 400 }
      )
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Назва блоку є обов\'язковою' },
        { status: 400 }
      )
    }

    // Перевіряємо, чи блок існує
    const { data: existingBlock, error: checkError } = await supabase
      .from('safe_blocks')
      .select('*')
      .eq('id', blockId)
      .single()

    if (checkError || !existingBlock) {
      return NextResponse.json(
        { error: 'Блок не знайдено' },
        { status: 404 }
      )
    }

    // Перевіряємо, чи блок з такою назвою вже існує (крім поточного)
    const { data: conflictBlock } = await supabase
      .from('safe_blocks')
      .select('id')
      .eq('name', name.trim())
      .neq('id', blockId)
      .single()

    if (conflictBlock) {
      return NextResponse.json(
        { error: 'Блок з такою назвою вже існує' },
        { status: 409 }
      )
    }

    // Оновлюємо блок
    const { data: updatedBlock, error } = await supabase
      .from('safe_blocks')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', blockId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Помилка оновлення блоку в базі даних' },
        { status: 500 }
      )
    }

    await logAction(auth.admin, 'block.update', { id: blockId, name: updatedBlock.name })
    return NextResponse.json({ block: updatedBlock })
  } catch (error) {
    console.error('Error updating block:', error)
    return NextResponse.json(
      { error: 'Внутрішня помилка сервера' },
      { status: 500 }
    )
  }
}

// DELETE - Видалити блок
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return auth.response
    const supabase = getSupabase()
    const { id } = await context.params
    const blockId = parseInt(id)

    if (isNaN(blockId)) {
      return NextResponse.json(
        { error: 'Невірний ID блоку' },
        { status: 400 }
      )
    }

    // Перевіряємо, чи блок існує
    const { data: existingBlock, error: checkError } = await supabase
      .from('safe_blocks')
      .select('id')
      .eq('id', blockId)
      .single()

    if (checkError || !existingBlock) {
      return NextResponse.json(
        { error: 'Блок не знайдено' },
        { status: 404 }
      )
    }

    // Перевіряємо, чи є сейфи в цьому блоці
    const { data: safesInBlock, error: safesError } = await supabase
      .from('safes')
      .select('id')
      .eq('block_id', blockId)
      .limit(1)

    if (safesError) {
      console.error('Database error checking safes:', safesError)
      return NextResponse.json(
        { error: 'Помилка перевірки сейфів в блоці' },
        { status: 500 }
      )
    }

    if (safesInBlock && safesInBlock.length > 0) {
      return NextResponse.json(
        { error: 'Неможливо видалити блок, який містить сейфи. Спочатку видаліть або перемістіть всі сейфи з цього блоку.' },
        { status: 409 }
      )
    }

    // Видаляємо блок
    const { error } = await supabase
      .from('safe_blocks')
      .delete()
      .eq('id', blockId)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Помилка видалення блоку з бази даних' },
        { status: 500 }
      )
    }

    await logAction(auth.admin, 'block.delete', { id: blockId })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting block:', error)
    return NextResponse.json(
      { error: 'Внутрішня помилка сервера' },
      { status: 500 }
    )
  }
}
