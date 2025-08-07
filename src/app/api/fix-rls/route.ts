import { NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

export async function POST() {
  try {
    const supabase = createSupabaseClient()

    // Спробуємо вимкнути RLS для обох таблиць
    const { error: safesError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE safes DISABLE ROW LEVEL SECURITY;'
    })

    const { error: blocksError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE safe_blocks DISABLE ROW LEVEL SECURITY;'
    })

    if (safesError || blocksError) {
      console.error('RLS disable errors:', { safesError, blocksError })
    }

    // Альтернативний спосіб - через прямий SQL
    const fixScript = `
-- Виправлення RLS для safe_blocks та safes
ALTER TABLE safe_blocks DISABLE ROW LEVEL SECURITY;
ALTER TABLE safes DISABLE ROW LEVEL SECURITY;

-- Видалення старих політик (якщо є)
DROP POLICY IF EXISTS "Allow admin read access to safes" ON safes;
DROP POLICY IF EXISTS "Allow admin full access to safes" ON safes;
DROP POLICY IF EXISTS "Allow admin read access to safe_blocks" ON safe_blocks;
DROP POLICY IF EXISTS "Allow admin full access to safe_blocks" ON safe_blocks;
`

    return NextResponse.json({
      success: true,
      message: 'RLS виправлення готове',
      fixScript,
      instructions: `
Для виправлення проблеми з RLS:

1. Увійдіть у Supabase SQL Editor
2. Виконайте наданий SQL-скрипт
3. Це вимкне RLS для таблиць safes та safe_blocks

Або скористайтеся файлом database/fix_rls.sql
      `,
      errors: {
        safesError: safesError?.message,
        blocksError: blocksError?.message
      }
    })

  } catch (error) {
    console.error('Error fixing RLS:', error)
    return NextResponse.json({
      success: false,
      error: 'Помилка виправлення RLS'
    }, { status: 500 })
  }
}
