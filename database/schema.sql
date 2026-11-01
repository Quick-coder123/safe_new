-- =====================================================================
-- Повна схема бази для НОВОГО проєкту Supabase.
-- Виконати один раз у Supabase → SQL Editor.
-- Для вже існуючої бази використовуйте database/migrations/*.sql
--
-- Перший супер-адміністратор створюється через сторінку /create-admin
-- (працює лише поки таблиця administrators порожня).
-- =====================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------- Тарифи ----------
CREATE TABLE IF NOT EXISTS safe_categories (
  id VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  rate_up_to_30   DECIMAL(10,2) NOT NULL CHECK (rate_up_to_30 >= 0),
  rate_31_to_90   DECIMAL(10,2) NOT NULL CHECK (rate_31_to_90 >= 0),
  rate_91_to_180  DECIMAL(10,2) NOT NULL CHECK (rate_91_to_180 >= 0),
  rate_181_to_365 DECIMAL(10,2) NOT NULL CHECK (rate_181_to_365 >= 0),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS insurance_rates (
  id SERIAL PRIMARY KEY,
  min_days INTEGER NOT NULL CHECK (min_days >= 1),
  max_days INTEGER NOT NULL CHECK (max_days >= min_days),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_insurance_rates_range ON insurance_rates (min_days, max_days);

CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ---------- Адміністратори ----------
CREATE TABLE IF NOT EXISTS administrators (
  id SERIAL PRIMARY KEY,
  login VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'super_admin')),
  is_temp_password BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ---------- Індивідуальні сейфи ----------
CREATE TABLE IF NOT EXISTS safe_blocks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS safes (
  id SERIAL PRIMARY KEY,
  number VARCHAR(50) NOT NULL UNIQUE,
  block_id INTEGER REFERENCES safe_blocks(id) ON DELETE RESTRICT,
  category VARCHAR(10),
  size VARCHAR(50),
  is_occupied BOOLEAN DEFAULT FALSE,
  maintenance_status BOOLEAN DEFAULT FALSE,
  maintenance_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_safes_block ON safes(block_id);

-- ---------- Журнал змін ----------
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id BIGSERIAL PRIMARY KEY,
  admin_id INTEGER,
  admin_login VARCHAR(50),
  action VARCHAR(50) NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log (created_at DESC);

-- ---------- Тригери updated_at ----------
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['safe_categories', 'insurance_rates', 'settings', 'administrators', 'safe_blocks', 'safes']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%1$s_updated_at ON %1$I', t);
    EXECUTE format('CREATE TRIGGER trg_%1$s_updated_at BEFORE UPDATE ON %1$I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t);
  END LOOP;
END $$;

-- ---------- RLS ----------
-- Сервер працює з service_role (обходить RLS). Anon може лише читати тарифи.
ALTER TABLE safe_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE administrators  ENABLE ROW LEVEL SECURITY;
ALTER TABLE safe_blocks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE safes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read safe_categories" ON safe_categories;
DROP POLICY IF EXISTS "public read insurance_rates" ON insurance_rates;
DROP POLICY IF EXISTS "public read settings" ON settings;
CREATE POLICY "public read safe_categories" ON safe_categories FOR SELECT USING (true);
CREATE POLICY "public read insurance_rates" ON insurance_rates FOR SELECT USING (true);
CREATE POLICY "public read settings"        ON settings        FOR SELECT USING (true);

-- ---------- Початкові дані (тарифи з ТЗ) ----------
INSERT INTO safe_categories (id, name, rate_up_to_30, rate_31_to_90, rate_91_to_180, rate_181_to_365) VALUES
  ('I',   'І категорія',   39.00, 25.00, 22.00, 20.00),
  ('II',  'ІІ категорія',  51.00, 26.00, 24.00, 22.00),
  ('III', 'ІІІ категорія', 63.00, 28.00, 26.00, 24.00),
  ('IV',  'ІV категорія',  63.00, 35.00, 33.00, 29.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO insurance_rates (min_days, max_days, price) VALUES
  (1, 90, 285.00),
  (91, 180, 370.00),
  (181, 270, 430.00),
  (271, 365, 500.00)
ON CONFLICT (min_days, max_days) DO NOTHING;

INSERT INTO settings (key, value, description) VALUES
  ('trust_document_price',  '300',  'Вартість довіреності, грн'),
  ('package_price',         '30',   'Вартість пакету, грн'),
  ('guarantee_amount',      '3000', 'Сума грошового забезпечення, грн'),
  ('company_name',          '',     'Отримувач платежу'),
  ('company_edrpou',        '',     'Код ЄДРПОУ отримувача'),
  ('company_iban',          '',     'IBAN отримувача'),
  ('payment_purpose',       'Оплата за оренду індивідуального сейфу', 'Призначення платежу'),
  ('insurance_payment_url', '',     'Посилання для оплати страхування ключа')
ON CONFLICT (key) DO NOTHING;
