import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

// PUT - оновити блок сейфів
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createSupabaseClient()
    const { id } = await context.params

    const blockId = parseInt(id)
    if (isNaN(blockId)) {
      return NextResponse.json({ error: 'Невірний ID блоку' }, { status: 400 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Назва блоку є обов\'язковою' }, { status: 400 })
    }

    // Перевіряємо, чи блок існує
    const { data: existingBlock, error: checkError } = await supabase
      .from('safe_blocks')
      .select('id')
      .eq('id', blockId)
      .single()

    if (checkError || !existingBlock) {
      return NextResponse.json({ error: 'Блок не знайдено' }, { status: 404 })
    }

    // Перевіряємо, чи інший блок з такою назвою вже існує
    const { data: nameConflict } = await supabase
      .from('safe_blocks')
      .select('id')
      .eq('name', name.trim())
      .neq('id', blockId)
      .single()

    if (nameConflict) {
      return NextResponse.json({ error: 'Блок з такою назвою вже існує' }, { status: 400 })
    }

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
      console.error('Error updating safe block:', error)
      return NextResponse.json({ error: 'Помилка оновлення блоку' }, { status: 500 })
    }

    return NextResponse.json({ block: updatedBlock })
  } catch (error) {
    console.error('Error in safe-blocks PUT:', error)
    return NextResponse.json({ error: 'Внутрішня помилка сервера' }, { status: 500 })
  }
}

// DELETE - видалити блок сейфів
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createSupabaseClient()
    const { id } = await context.params

    const blockId = parseInt(id)
    if (isNaN(blockId)) {
      return NextResponse.json({ error: 'Невірний ID блоку' }, { status: 400 })
    }

    // Перевіряємо, чи є сейфи в цьому блоці
    const { data: safesInBlock, error: safesCheckError } = await supabase
      .from('safes')
      .select('id')
      .eq('block_id', blockId)
      .limit(1)

    if (safesCheckError) {
      console.error('Error checking safes in block:', safesCheckError)
      return NextResponse.json({ error: 'Помилка перевірки сейфів у блоці' }, { status: 500 })
    }

    if (safesInBlock && safesInBlock.length > 0) {
      return NextResponse.json({ 
        error: 'Неможливо видалити блок, оскільки в ньому є сейфи. Спершу видаліть всі сейфи з цього блоку.' 
      }, { status: 400 })
    }

    // Видаляємо блок
    const { error } = await supabase
      .from('safe_blocks')
      .delete()
      .eq('id', blockId)

    if (error) {
      console.error('Error deleting safe block:', error)
      return NextResponse.json({ error: 'Помилка видалення блоку' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Блок успішно видалено' })
  } catch (error) {
    console.error('Error in safe-blocks DELETE:', error)
    return NextResponse.json({ error: 'Внутрішня помилка сервера' }, { status: 500 })
  }
}
