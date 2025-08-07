import { NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

// PUT - Оновити сейф
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createSupabaseClient()
    const { id } = await context.params
    const safeId = parseInt(id)
    const body = await request.json()
    const { is_occupied, number, category, size, maintenance_status, maintenance_comment } = body

    if (isNaN(safeId)) {
      return NextResponse.json(
        { error: 'Невірний ID сейфа' },
        { status: 400 }
      )
    }

    // Перевіряємо, чи сейф існує
    const { data: existingSafe, error: checkError } = await supabase
      .from('safes')
      .select('*')
      .eq('id', safeId)
      .single()

    if (checkError || !existingSafe) {
      return NextResponse.json(
        { error: 'Сейф не знайдено' },
        { status: 404 }
      )
    }

    // Створюємо об'єкт оновлень
    const updates: any = {
      updated_at: new Date().toISOString(),
    }

    // Додаємо поля, які потрібно оновити
    if (typeof is_occupied === 'boolean') {
      updates.is_occupied = is_occupied
    }

    if (number && number.trim() && number.trim() !== existingSafe.number) {
      // Перевіряємо, чи номер не зайнятий іншим сейфом
      const { data: conflictSafe } = await supabase
        .from('safes')
        .select('id')
        .eq('number', number.trim())
        .neq('id', safeId)
        .single()

      if (conflictSafe) {
        return NextResponse.json(
          { error: 'Сейф з таким номером вже існує' },
          { status: 409 }
        )
      }

      updates.number = number.trim()
    }

    if (category !== undefined) {
      updates.category = category || null
    }

    if (size !== undefined) {
      updates.size = size?.trim() || null
    }

    if (typeof maintenance_status === 'boolean') {
      updates.maintenance_status = maintenance_status
    }

    if (maintenance_comment !== undefined) {
      updates.maintenance_comment = maintenance_comment?.trim() || null
    }

    // Оновлюємо сейф
    const { data: updatedSafe, error } = await supabase
      .from('safes')
      .update(updates)
      .eq('id', safeId)
      .select(`
        *,
        block:safe_blocks(*)
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Помилка оновлення сейфа в базі даних' },
        { status: 500 }
      )
    }

    return NextResponse.json({ safe: updatedSafe })
  } catch (error) {
    console.error('Error updating safe:', error)
    return NextResponse.json(
      { error: 'Внутрішня помилка сервера' },
      { status: 500 }
    )
  }
}

// DELETE - Видалити сейф
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createSupabaseClient()
    const { id } = await context.params
    const safeId = parseInt(id)

    if (isNaN(safeId)) {
      return NextResponse.json(
        { error: 'Невірний ID сейфа' },
        { status: 400 }
      )
    }

    // Перевіряємо, чи сейф існує
    const { data: existingSafe, error: checkError } = await supabase
      .from('safes')
      .select('id')
      .eq('id', safeId)
      .single()

    if (checkError || !existingSafe) {
      return NextResponse.json(
        { error: 'Сейф не знайдено' },
        { status: 404 }
      )
    }

    // Видаляємо сейф
    const { error } = await supabase
      .from('safes')
      .delete()
      .eq('id', safeId)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Помилка видалення сейфа з бази даних' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting safe:', error)
    return NextResponse.json(
      { error: 'Внутрішня помилка сервера' },
      { status: 500 }
    )
  }
}
