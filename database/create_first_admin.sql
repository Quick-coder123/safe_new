-- Скрипт для створення першого адміністратора (виконувати в Supabase SQL Editor)

-- 1. Спочатку створіть функцію для автоматичного оновлення updated_at (якщо ще не створена)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Видаляємо стару таблицю (якщо потрібно почати заново)
-- УВАГА: Цей крок видалить всі дані! Розкоментуйте тільки якщо це необхідно
-- DROP TABLE IF EXISTS administrators;

-- 3. Створіть таблицю адміністраторів
CREATE TABLE IF NOT EXISTS administrators (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  login VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'super_admin')),
  is_temp_password BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id)
);

-- 4. Додайте тригер для автоматичного оновлення updated_at
DROP TRIGGER IF EXISTS update_administrators_updated_at ON administrators;
CREATE TRIGGER update_administrators_updated_at 
BEFORE UPDATE ON administrators 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Додайте першого супер-адміністратора
-- ВАЖЛИВО: Замініть значення нижче на ваші власні!
-- Пароль 'password' хешований bcrypt
INSERT INTO administrators (login, password_hash, role, is_temp_password)
VALUES (
  'admin',  -- Замініть на ваш логін
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',  -- Це хеш для пароля 'password'
  'super_admin',
  true  -- Встановіть false, якщо не хочете, щоб пароль вважався тимчасовим
);

-- 6. Перевірте результат
SELECT * FROM administrators;

-- ПРИМІТКА: Для генерації власного хешу паролю використовуйте онлайн bcrypt генератор
-- або Node.js: const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('your-password', 10));
