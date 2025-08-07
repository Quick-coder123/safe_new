import { NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

export async function POST() {
  try {
    const supabase = createSupabaseClient()

    // Спробуємо отримати дані з таблиць для перевірки їх існування
    const [safesResult, blocksResult] = await Promise.all([
      supabase.from('safes').select('id').limit(1),
      supabase.from('safe_blocks').select('id').limit(1)
    ])

    const safesTableExists = !safesResult.error
    const blocksTableExists = !blocksResult.error

    if (safesTableExists && blocksTableExists) {
      return NextResponse.json({
        tableExists: true,
        message: 'Таблиці сейфів та блоків існують'
      })
    }

    // Створюємо SQL-скрипт для створення таблиць
    const sqlScript = `
-- Створення таблиці блоків сейфів
CREATE TABLE IF NOT EXISTS safe_blocks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Створення таблиці сейфів
CREATE TABLE IF NOT EXISTS safes (
  id SERIAL PRIMARY KEY,
  number VARCHAR(50) NOT NULL UNIQUE,
  block_id INTEGER NOT NULL REFERENCES safe_blocks(id) ON DELETE CASCADE,
  category VARCHAR(10),
  size VARCHAR(100),
  is_occupied BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Створення індексів для кращої продуктивності
CREATE INDEX IF NOT EXISTS idx_safes_block_id ON safes(block_id);
CREATE INDEX IF NOT EXISTS idx_safes_number ON safes(number);
CREATE INDEX IF NOT EXISTS idx_safes_is_occupied ON safes(is_occupied);
CREATE INDEX IF NOT EXISTS idx_safe_blocks_name ON safe_blocks(name);

-- Додавання тригера для автоматичного оновлення updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Тригери для таблиць
DROP TRIGGER IF EXISTS update_safe_blocks_updated_at ON safe_blocks;
CREATE TRIGGER update_safe_blocks_updated_at
    BEFORE UPDATE ON safe_blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_safes_updated_at ON safes;
CREATE TRIGGER update_safes_updated_at
    BEFORE UPDATE ON safes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Налаштування RLS (Row Level Security) - закоментовано для простоти
-- ALTER TABLE safe_blocks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE safes ENABLE ROW LEVEL SECURITY;

-- Створення початкового блоку (опціонально)
INSERT INTO safe_blocks (name, description) 
VALUES ('Блок A', 'Перший блок сейфів') 
ON CONFLICT (name) DO NOTHING;

-- Додавання коментарів до таблиць
COMMENT ON TABLE safe_blocks IS 'Таблиця блоків сейфів';
COMMENT ON TABLE safes IS 'Таблиця індивідуальних сейфів';
COMMENT ON COLUMN safes.category IS 'Категорія сейфа (I, II, III, IV, V)';
COMMENT ON COLUMN safes.size IS 'Розмір сейфа (текстовий опис)';
`

    const instructions = `
Для роботи з індивідуальними сейфами потрібно створити таблиці в базі даних Supabase.

Кроки налаштування:

1. Увійдіть у свій Supabase проект
2. Перейдіть до SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql)
3. Вставте наданий SQL-скрипт і натисніть "Run"
4. Після успішного виконання поверніться на цю сторінку та натисніть "Перевірити ще раз"

Структура, що буде створена:
- Таблиця 'safe_blocks': для управління блоками сейфів
- Таблиця 'safes': для індивідуальних сейфів з посиланням на блоки
- Сейфи додаються вільно до блоків (без фіксованих позицій)
- Автоматичні тригери для оновлення часових міток
- Індекси для оптимізації продуктивності

Після створення таблиць ви зможете:
- Створювати та редагувати блоки сейфів
- Додавати сейфи до блоків без обмежень по позиціях
- Керувати статусом зайнятості сейфів
- Переглядати статистику по блоках та сейфах
`

    return NextResponse.json({
      tableExists: false,
      safesTableExists,
      blocksTableExists,
      instructions,
      sqlScript,
      message: 'Таблиці сейфів не існують. Потрібно виконати початкове налаштування.'
    })

  } catch (error) {
    console.error('Error checking safes tables:', error)
    return NextResponse.json({
      tableExists: false,
      error: 'Помилка перевірки таблиць сейфів',
      instructions: 'Будь ласка, переконайтеся, що ваші змінні середовища Supabase налаштовані правильно.'
    }, { status: 500 })
  }
}
