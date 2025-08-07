# Виправлення Помилки Тригерів

## Проблема
```
ERROR: 42703: column "user_id" of relation "change_logs" does not exist
```

## Причина
SQL-скрипт містив тригери логування, які намагаються записувати в неіснуючу таблицю `change_logs`.

## Рішення

### Варіант 1: Через Supabase SQL Editor
1. Увійдіть у ваш Supabase проект
2. Перейдіть до SQL Editor
3. Скопіюйте та виконайте цей код:

```sql
-- Видалення проблемних тригерів логування
DROP TRIGGER IF EXISTS log_safes_changes ON safes;
DROP TRIGGER IF EXISTS log_safe_blocks_changes ON safe_blocks;

-- Видалення функції логування, якщо вона існує
DROP FUNCTION IF EXISTS log_changes();
```

### Варіант 2: Використати готовий файл
Виконайте вміст файлу `database/fix_triggers.sql` в Supabase SQL Editor.

### Варіант 3: Через API
Перейдіть на `/api/fix-triggers` для отримання готового скрипта.

## Результат
Після виправлення система буде працювати без помилок тригерів, але з функціональними тригерами оновлення часу.

## Оновлений SQL-файл
Файл `database/updated_safes_schema.sql` вже оновлено і більше не містить проблемних тригерів.
