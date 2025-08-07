# Швидке налаштування сейфів

## 1. Створення таблиці в Supabase

Виконайте цей SQL-скрипт в Supabase Dashboard (SQL Editor):

```sql
-- Створення таблиці для індивідуальних сейфів
CREATE TABLE safes (
    id SERIAL PRIMARY KEY,
    number VARCHAR(50) NOT NULL UNIQUE,
    row_number INTEGER,
    column_number INTEGER,
    is_occupied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Додавання індексів для оптимізації запитів
CREATE INDEX idx_safes_number ON safes(number);
CREATE INDEX idx_safes_occupied ON safes(is_occupied);
CREATE INDEX idx_safes_position ON safes(row_number, column_number);

-- Тригер для оновлення updated_at
CREATE OR REPLACE FUNCTION update_safes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_safes_updated_at
    BEFORE UPDATE ON safes
    FOR EACH ROW
    EXECUTE FUNCTION update_safes_updated_at();

-- Тригер для логування змін (якщо функція log_changes існує)
CREATE TRIGGER log_safes_changes
    AFTER INSERT OR UPDATE OR DELETE ON safes
    FOR EACH ROW
    EXECUTE FUNCTION log_changes();

-- Увімкнення RLS
ALTER TABLE safes ENABLE ROW LEVEL SECURITY;

-- Політики доступу
CREATE POLICY "Allow admin read access to safes" ON safes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin full access to safes" ON safes
    FOR ALL USING (auth.role() = 'authenticated');

-- Початкові дані (приклад)
INSERT INTO safes (number, row_number, column_number, is_occupied) VALUES
('A001', 1, 1, false),
('A002', 1, 2, true),
('A003', 2, 1, false),
('A004', 2, 2, false),
('A005', 3, 1, true),
('A006', 3, 2, false),
('A007', 4, 1, false),
('A008', 4, 2, false),
('A009', 5, 1, false),
('A010', 5, 2, false),
('B001', 1, 1, false),
('B002', 1, 2, false),
('B003', 2, 1, true),
('B004', 2, 2, false),
('B005', 3, 1, false);
```

## 2. Доступ до функціональності

1. Увійдіть як адміністратор
2. Адмін-панель → "🏧 Індивідуальні сейфи"
3. При першому відвідуванні система автоматично перевірить таблицю

## 3. Основні дії

- **Додати сейф**: кнопка "➕ Додати сейф"
- **Змінити статус**: кнопки "✓ Звільнити" / "✗ Зайняти"
- **Видалити сейф**: кнопка "🗑️ Видалити"

## 4. Відображення

- ✅ **Зелений** = вільний сейф
- ❌ **Червоний** = зайнятий сейф
- 📭 **Сірий** = немає сейфа

## Готово! 🎉

Система індивідуальних сейфів готова до використання.
