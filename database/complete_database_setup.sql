-- ПОВНИЙ SQL СКРИПТ ДЛЯ СТВОРЕННЯ ВСІХ ТАБЛИЦЬ В SUPABASE
-- Виконувати в Supabase SQL Editor

-- =====================================================
-- 1. ФУНКЦІЇ ДЛЯ ТРИГЕРІВ
-- =====================================================

-- Функція для автоматичного оновлення updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- 2. ОСНОВНІ ТАБЛИЦІ СИСТЕМИ
-- =====================================================

-- Таблиця категорій сейфів з тарифами
CREATE TABLE IF NOT EXISTS safe_categories (
  id VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  rate_up_to_30 DECIMAL(10,2) NOT NULL,
  rate_31_to_90 DECIMAL(10,2) NOT NULL,
  rate_91_to_180 DECIMAL(10,2) NOT NULL,
  rate_181_to_365 DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Тригер для safe_categories
CREATE TRIGGER update_safe_categories_updated_at 
BEFORE UPDATE ON safe_categories 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Таблиця тарифів страхування ключа
CREATE TABLE IF NOT EXISTS insurance_rates (
  id SERIAL PRIMARY KEY,
  min_days INTEGER NOT NULL,
  max_days INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Тригер для insurance_rates
CREATE TRIGGER update_insurance_rates_updated_at 
BEFORE UPDATE ON insurance_rates 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Таблиця налаштувань системи
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Таблиця журналу змін для аудиту
CREATE TABLE IF NOT EXISTS change_logs (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(100) NOT NULL,
  action VARCHAR(20) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  admin_id INTEGER REFERENCES administrators(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. ПОЧАТКОВІ ДАНІ
-- =====================================================

-- Додавання початкових категорій сейфів
INSERT INTO safe_categories (id, name, rate_up_to_30, rate_31_to_90, rate_91_to_180, rate_181_to_365) 
VALUES 
  ('XS', 'XS (Extra Small)', 50.00, 45.00, 40.00, 35.00),
  ('S', 'S (Small)', 75.00, 70.00, 65.00, 60.00),
  ('M', 'M (Medium)', 100.00, 95.00, 90.00, 85.00),
  ('L', 'L (Large)', 150.00, 140.00, 130.00, 120.00),
  ('XL', 'XL (Extra Large)', 200.00, 190.00, 180.00, 170.00)
ON CONFLICT (id) DO NOTHING;

-- Додавання початкових тарифів страхування
INSERT INTO insurance_rates (min_days, max_days, price) 
VALUES 
  (1, 30, 100.00),
  (31, 90, 200.00),
  (91, 180, 350.00),
  (181, 365, 500.00)
ON CONFLICT DO NOTHING;

-- Додавання початкових налаштувань
INSERT INTO settings (key, value, description) 
VALUES 
  ('trust_document_price', '300', 'Вартість оформлення довірчого документа'),
  ('package_price', '50', 'Вартість пакування'),
  ('guarantee_amount', '5000', 'Сума грошового забезпечення')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description;

-- =====================================================
-- 4. СТВОРЕННЯ ПЕРШОГО СУПЕР-АДМІНІСТРАТОРА
-- =====================================================

-- Додавання першого супер-адміністратора
-- Логін: admin
-- Пароль: password (хеш bcrypt)
INSERT INTO administrators (login, password_hash, role, is_temp_password)
VALUES (
  'admin',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'super_admin',
  true
)
ON CONFLICT (login) DO NOTHING;

-- =====================================================
-- 5. НАЛАШТУВАННЯ RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Увімкнення RLS для захисту даних
ALTER TABLE administrators ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_logs ENABLE ROW LEVEL SECURITY;

-- Видаляємо існуючі політики (якщо є)
DROP POLICY IF EXISTS "Administrators can view all administrators" ON administrators;
DROP POLICY IF EXISTS "Super admins can manage administrators" ON administrators;
DROP POLICY IF EXISTS "Administrators can view change logs" ON change_logs;
DROP POLICY IF EXISTS "Administrators can create change logs" ON change_logs;

-- Простіші політики без рекурсії
CREATE POLICY "Allow all operations on administrators" 
ON administrators FOR ALL 
USING (true) 
WITH CHECK (true);

-- Політики для change_logs
CREATE POLICY "Allow all operations on change_logs" 
ON change_logs FOR ALL 
USING (true) 
WITH CHECK (true);

-- Альтернативно, можна повністю відключити RLS для цих таблиць
-- ALTER TABLE administrators DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE change_logs DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. ІНДЕКСИ ДЛЯ ПРОДУКТИВНОСТІ
-- =====================================================

-- Індекси для швидкого пошуку
CREATE INDEX IF NOT EXISTS idx_administrators_login ON administrators(login);
CREATE INDEX IF NOT EXISTS idx_administrators_role ON administrators(role);
CREATE INDEX IF NOT EXISTS idx_change_logs_table_name ON change_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_change_logs_created_at ON change_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- =====================================================
-- 7. ПЕРЕВІРКА РЕЗУЛЬТАТІВ
-- =====================================================

-- Перевіряємо створені таблиці
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('safe_categories', 'insurance_rates', 'settings', 'administrators', 'change_logs')
ORDER BY table_name;

-- Перевіряємо початкові дані
SELECT 'safe_categories' as table_name, count(*) as records FROM safe_categories
UNION ALL
SELECT 'insurance_rates', count(*) FROM insurance_rates
UNION ALL
SELECT 'settings', count(*) FROM settings
UNION ALL
SELECT 'administrators', count(*) FROM administrators
UNION ALL
SELECT 'change_logs', count(*) FROM change_logs;

-- Перевіряємо створеного адміністратора
SELECT id, login, role, is_temp_password, created_at 
FROM administrators 
ORDER BY created_at;

-- =====================================================
-- ГОТОВО! 
-- =====================================================
-- Тепер ви можете:
-- 1. Перейти на http://localhost:3000/admin
-- 2. Увійти з логіном: admin, паролем: password
-- 3. Змінити пароль при першому вході
-- =====================================================
