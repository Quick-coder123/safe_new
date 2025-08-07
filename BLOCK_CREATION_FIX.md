# Виправлення Помилки Створення Блоків

## Діагностика
Помилка створення блоків зазвичай пов'язана з RLS (Row-Level Security) в Supabase.

## Типові помилки:
```
new row violates row-level security policy for table "safe_blocks"
```

## Швидке виправлення

### 1. Вимкнути RLS (Рекомендовано для розробки)
Виконайте в Supabase SQL Editor:
```sql
ALTER TABLE safe_blocks DISABLE ROW LEVEL SECURITY;
ALTER TABLE safes DISABLE ROW LEVEL SECURITY;
```

### 2. Або використайте готовий скрипт
Виконайте вміст файлу `database/fix_rls.sql`

### 3. Перевірка через API
```bash
# Тест отримання блоків
curl -X GET http://localhost:3001/api/safe-blocks

# Тест створення блоку  
curl -X POST http://localhost:3001/api/safe-blocks \
  -H "Content-Type: application/json" \
  -d '{"name":"Тестовий блок","description":"Опис"}'
```

## Альтернативні рішення

### Якщо потрібно залишити RLS:
```sql
-- Видалити старі політики
DROP POLICY IF EXISTS "Allow admin read access to safe_blocks" ON safe_blocks;
DROP POLICY IF EXISTS "Allow admin full access to safe_blocks" ON safe_blocks;

-- Створити дозволяючі політики
CREATE POLICY "Allow all operations on safe_blocks" ON safe_blocks 
FOR ALL USING (true);
```

## Статус
✅ API працює коректно після виправлення
✅ Створення блоків тестовано успішно
✅ Готовий SQL-скрипт для виправлення

## Примітка
Проблема може бути тимчасовою через налаштування Supabase. Якщо виникає знову - використайте наведені скрипти.
