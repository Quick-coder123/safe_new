import { NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

export async function POST() {
  try {
    const supabase = createSupabaseClient()

    // SQL для виправлення проблем з тригерами
    const fixScript = `
-- Видалення проблемних тригерів логування
DROP TRIGGER IF EXISTS log_safes_changes ON safes;
DROP TRIGGER IF EXISTS log_safe_blocks_changes ON safe_blocks;

-- Видалення функції логування, якщо вона існує
DROP FUNCTION IF EXISTS log_changes();

-- Переконуємося, що тригери оновлення часу працюють
CREATE OR REPLACE FUNCTION update_safes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_safe_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Переконуємося, що тригери існують
DROP TRIGGER IF EXISTS trigger_update_safes_updated_at ON safes;
CREATE TRIGGER trigger_update_safes_updated_at
    BEFORE UPDATE ON safes
    FOR EACH ROW
    EXECUTE FUNCTION update_safes_updated_at();

DROP TRIGGER IF EXISTS trigger_update_safe_blocks_updated_at ON safe_blocks;
CREATE TRIGGER trigger_update_safe_blocks_updated_at
    BEFORE UPDATE ON safe_blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_safe_blocks_updated_at();
`

    return NextResponse.json({
      success: true,
      message: 'SQL-скрипт для виправлення тригерів готовий',
      fixScript,
      instructions: `
Щоб виправити помилку з тригерами:

1. Увійдіть у Supabase SQL Editor
2. Виконайте наданий SQL-скрипт
3. Це видалить проблемні тригери логування та залишить тільки тригери оновлення часу

Або скористайтеся файлом database/fix_triggers.sql
      `
    })

  } catch (error) {
    console.error('Error generating fix script:', error)
    return NextResponse.json({
      success: false,
      error: 'Помилка генерації скрипта виправлення'
    }, { status: 500 })
  }
}
