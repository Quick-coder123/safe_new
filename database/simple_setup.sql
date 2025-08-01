-- ПРОСТИЙ SQL СКРИПТ БЕЗ RLS ДЛЯ ШВИДКОГО ЗАПУСКУ
-- Виконувати в Supabase SQL Editor

-- =====================================================
-- 1. ФУНКЦІЯ ДЛЯ ТРИГЕРІВ
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- 2. ВИДАЛЯЄМО ІСНУЮЧІ ТАБЛИЦІ (ЯКЩО ПОТРІБНО ПОЧАТИ ЗАНОВО)
-- =====================================================

DROP TABLE IF EXISTS change_logs CASCADE;
DROP TABLE IF EXISTS administrators CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS insurance_rates CASCADE;
DROP TABLE IF EXISTS safe_categories CASCADE;

-- =====================================================
-- 3. СТВОРЮЄМО ТАБЛИЦІ
-- =====================================================

-- Категорії сейфів
CREATE TABLE safe_categories (
  id VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  rate_up_to_30 DECIMAL(10,2) NOT NULL,
  rate_31_to_90 DECIMAL(10,2) NOT NULL,
  rate_91_to_180 DECIMAL(10,2) NOT NULL,
  rate_181_to_365 DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Тарифи страхування
CREATE TABLE insurance_rates (
  id SERIAL PRIMARY KEY,
  min_days INTEGER NOT NULL,
  max_days INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Налаштування системи
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Адміністратори (БЕЗ EMAIL)
CREATE TABLE administrators (
  id SERIAL PRIMARY KEY,
  login VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'super_admin')),
  is_temp_password BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES administrators(id)
);

-- Журнал змін
CREATE TABLE change_logs (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(100) NOT NULL,
  action VARCHAR(20) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  admin_id INTEGER REFERENCES administrators(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. ТРИГЕРИ
-- =====================================================

CREATE TRIGGER update_safe_categories_updated_at 
BEFORE UPDATE ON safe_categories 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insurance_rates_updated_at 
BEFORE UPDATE ON insurance_rates 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at 
BEFORE UPDATE ON settings 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_administrators_updated_at 
BEFORE UPDATE ON administrators 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. ПОЧАТКОВІ ДАНІ
-- =====================================================

-- Категорії сейфів
INSERT INTO safe_categories (id, name, rate_up_to_30, rate_31_to_90, rate_91_to_180, rate_181_to_365) 
VALUES 
  ('XS', 'XS (Extra Small)', 50.00, 45.00, 40.00, 35.00),
  ('S', 'S (Small)', 75.00, 70.00, 65.00, 60.00),
  ('M', 'M (Medium)', 100.00, 95.00, 90.00, 85.00),
  ('L', 'L (Large)', 150.00, 140.00, 130.00, 120.00),
  ('XL', 'XL (Extra Large)', 200.00, 190.00, 180.00, 170.00);

-- Тарифи страхування
INSERT INTO insurance_rates (min_days, max_days, price) 
VALUES 
  (1, 30, 100.00),
  (31, 90, 200.00),
  (91, 180, 350.00),
  (181, 365, 500.00);

-- Налаштування
INSERT INTO settings (key, value, description) 
VALUES 
  ('trust_document_price', '300', 'Вартість оформлення довірчого документа'),
  ('package_price', '50', 'Вартість пакування'),
  ('guarantee_amount', '5000', 'Сума грошового забезпечення');

-- Перший супер-адміністратор
-- Логін: admin, Пароль: password
INSERT INTO administrators (login, password_hash, role, is_temp_password)
VALUES (
  'admin',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'super_admin',
  true
);

-- =====================================================
-- 6. ПЕРЕВІРКА
-- =====================================================

SELECT 'Створено таблиць:' as info, count(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('safe_categories', 'insurance_rates', 'settings', 'administrators', 'change_logs');

SELECT 'Адміністраторів:' as info, count(*) as count FROM administrators;

SELECT id, login, role, is_temp_password FROM administrators;

-- ГОТОВО! Увійдіть з логіном: admin, паролем: password
