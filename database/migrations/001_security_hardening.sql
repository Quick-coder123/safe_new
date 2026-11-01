-- =====================================================================
-- Міграція 001: посилення безпеки + журнал змін
-- Для ІСНУЮЧОЇ бази. Виконати один раз у Supabase → SQL Editor.
-- Скрипт ідемпотентний (можна запускати повторно).
--
-- ВАЖЛИВО: перед виконанням додайте у Vercel змінну SUPABASE_SERVICE_ROLE_KEY
-- (Supabase → Project Settings → API → service_role). Після цієї міграції
-- anon key може лише ЧИТАТИ тарифи й налаштування.
-- =====================================================================

-- 1. Журнал змін адмін-панелі
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id BIGSERIAL PRIMARY KEY,
  admin_id INTEGER,
  admin_login VARCHAR(50),
  action VARCHAR(50) NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log (created_at DESC);

-- 2. Вмикаємо RLS на всіх таблицях
ALTER TABLE IF EXISTS safe_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS insurance_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS settings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS administrators  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS safes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS safe_blocks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS change_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log           ENABLE ROW LEVEL SECURITY;

-- 3. Прибираємо ВСІ наявні політики на цих таблицях (зокрема "USING (true)")
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('safe_categories', 'insurance_rates', 'settings', 'administrators',
                        'safes', 'safe_blocks', 'change_logs', 'admin_audit_log')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- 4. Публічне читання лише для даних калькулятора.
--    administrators, safes, safe_blocks, admin_audit_log — без політик:
--    доступ лише через service_role (серверні API з перевіркою сесії).
CREATE POLICY "public read safe_categories" ON safe_categories FOR SELECT USING (true);
CREATE POLICY "public read insurance_rates" ON insurance_rates FOR SELECT USING (true);
CREATE POLICY "public read settings"        ON settings        FOR SELECT USING (true);

-- 5. Небезпечна функція exec_sql (якщо створювалась раніше) — видаляємо
DROP FUNCTION IF EXISTS exec_sql(text);

-- 6. Тарифи страхування — без дублікатів діапазонів
DO $$
BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS uq_insurance_rates_range ON insurance_rates (min_days, max_days);
EXCEPTION WHEN unique_violation THEN
  RAISE NOTICE 'У insurance_rates є дублікати діапазонів — індекс не створено. Збережіть тарифи в адмінці та повторіть.';
END $$;

-- 7. Рядки налаштувань для реквізитів (якщо їх ще немає)
INSERT INTO settings (key, value, description) VALUES
  ('company_name',          '', 'Отримувач платежу'),
  ('company_edrpou',        '', 'Код ЄДРПОУ отримувача'),
  ('company_iban',          '', 'IBAN отримувача'),
  ('payment_purpose',       'Оплата за оренду індивідуального сейфу', 'Призначення платежу'),
  ('insurance_payment_url', '', 'Посилання для оплати страхування ключа')
ON CONFLICT (key) DO NOTHING;
