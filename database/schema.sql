-- Створення таблиць для системи розрахунку вартості оренди сейфів

-- Таблиця категорій сейфів з тарифами
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

-- Таблиця тарифів страхування ключа
CREATE TABLE insurance_rates (
  id SERIAL PRIMARY KEY,
  min_days INTEGER NOT NULL,
  max_days INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблиця налаштувань системи
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- Таблиця адміністраторів з ролями
CREATE TABLE administrators (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id)
);

-- Таблиця індивідуальних сейфів
CREATE TABLE safes (
  id SERIAL PRIMARY KEY,
  number VARCHAR(50) NOT NULL UNIQUE,
  row_number INTEGER,
  column_number INTEGER,
  is_occupied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Додавання індексів для оптимізації запитів таблиці safes
CREATE INDEX IF NOT EXISTS idx_safes_number ON safes(number);
CREATE INDEX IF NOT EXISTS idx_safes_occupied ON safes(is_occupied);
CREATE INDEX IF NOT EXISTS idx_safes_position ON safes(row_number, column_number);

-- Функція для автоматичного оновлення updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Тригери для автоматичного оновлення updated_at
CREATE TRIGGER update_safe_categories_updated_at 
  BEFORE UPDATE ON safe_categories 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insurance_rates_updated_at 
  BEFORE UPDATE ON insurance_rates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at 
  BEFORE UPDATE ON settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_safes_updated_at 
  BEFORE UPDATE ON safes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();






-- Початкові дані для категорій сейфів
INSERT INTO safe_categories (id, name, rate_up_to_30, rate_31_to_90, rate_91_to_180, rate_181_to_365) VALUES
('I', 'І категорія', 39.00, 25.00, 22.00, 20.00),
('II', 'ІІ категорія', 51.00, 26.00, 24.00, 22.00),
('III', 'ІІІ категорія', 63.00, 28.00, 26.00, 24.00),
('IV', 'ІV категорія', 63.00, 35.00, 33.00, 29.00),
('V', 'V категорія', 75.00, 40.00, 38.00, 35.00);

-- Початкові дані для страхування ключа
INSERT INTO insurance_rates (min_days, max_days, price) VALUES
(1, 90, 285.00),
(91, 180, 370.00),
(181, 270, 430.00),
(271, 365, 500.00);

-- Початкові налаштування
INSERT INTO settings (key, value, description) VALUES
('trust_document_price', '300', 'Вартість довіреності в грн'),
('package_price', '50', 'Вартість пакету в грн'),
('guarantee_amount', '5000', 'Сума грошового забезпечення в грн'),
('company_name', 'ТОВ "Сейф-Банк"', 'Назва компанії'),
('company_edrpou', '12345678', 'Код ЄДРПОУ'),
('company_iban', 'UA123456789012345678901234567', 'IBAN рахунок'),
('payment_purpose', 'Оплата за оренду індивідуального сейфу', 'Призначення платежу');

-- Початкові дані для сейфів (приклад)
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

-- RLS (Row Level Security) політики
ALTER TABLE safe_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE safes ENABLE ROW LEVEL SECURITY;

-- Політики доступу для анонімних користувачів (тільки читання)
CREATE POLICY "Allow anonymous read access to safe_categories" ON safe_categories
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous read access to insurance_rates" ON insurance_rates
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous read access to settings" ON settings
  FOR SELECT USING (true);


CREATE POLICY "Allow authenticated full access to insurance_rates" ON insurance_rates
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated full access to settings" ON settings
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access to change_logs" ON change_logs
  FOR SELECT USING (auth.role() = 'authenticated');

-- Політики доступу для сейфів (тільки адміністратори)
CREATE POLICY "Allow admin read access to safes" ON safes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin full access to safes" ON safes
  FOR ALL USING (auth.role() = 'authenticated');
