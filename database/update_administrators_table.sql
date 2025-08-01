-- Скрипт для оновлення існуючої таблиці administrators
-- Виконувати в Supabase SQL Editor

-- 1. Спочатку додаємо нові колонки (якщо вони не існують)
ALTER TABLE administrators 
ADD COLUMN IF NOT EXISTS login VARCHAR(50),
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_temp_password BOOLEAN DEFAULT false;

-- 2. Видаляємо старі обмеження унікальності (якщо існують)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'administrators_email_key' 
               AND table_name = 'administrators') THEN
        ALTER TABLE administrators DROP CONSTRAINT administrators_email_key;
    END IF;
END $$;

-- 3. Додаємо нові обмеження унікальності
ALTER TABLE administrators 
ADD CONSTRAINT administrators_login_key UNIQUE (login);

-- 4. Якщо таблиця не порожня, заповнюємо login значеннями з email (тимчасово)
UPDATE administrators 
SET login = SUBSTRING(email FROM 1 FOR POSITION('@' IN email) - 1)
WHERE login IS NULL AND email IS NOT NULL;

-- 5. Встановлюємо NOT NULL для нових колонок (після заповнення даних)
ALTER TABLE administrators 
ALTER COLUMN login SET NOT NULL,
ALTER COLUMN password_hash SET NOT NULL;

-- 6. Можемо видалити колонку email (якщо більше не потрібна)
-- УВАГА: Цей крок незворотний! Закоментовано для безпеки
-- ALTER TABLE administrators DROP COLUMN IF EXISTS email;

-- 7. Перевіряємо результат
SELECT id, login, role, is_temp_password, created_at 
FROM administrators 
ORDER BY created_at;
