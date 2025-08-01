-- S-- Додавання таблиці адміністраторів
CREATE TABLE IF NOT EXISTS administrators (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'super_admin')),
  is_temp_password BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id)
);авання супер-адміністратора
-- User ID: 215012da-2600-473a-af7d-b1fa31b49764
-- Email: vitaliihaika@gmail.com

-- Спочатку переконайтеся, що таблиця адміністраторів існує
CREATE TABLE IF NOT EXISTS administrators (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id)
);

-- Додавання тригера для автоматичного оновлення updated_at (якщо ще не існує)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Видаляємо тригер якщо існує і створюємо новий
DROP TRIGGER IF EXISTS update_administrators_updated_at ON administrators;
CREATE TRIGGER update_administrators_updated_at 
BEFORE UPDATE ON administrators 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Додавання колонки is_temp_password до існуючої таблиці (якщо таблиця вже існує)
ALTER TABLE administrators ADD COLUMN IF NOT EXISTS is_temp_password BOOLEAN DEFAULT false;

-- Додавання vitaliihaika@gmail.com як супер-адміністратора
INSERT INTO administrators (user_id, email, role) 
VALUES ('215012da-2600-473a-af7d-b1fa31b49764', 'vitaliihaika@gmail.com', 'super_admin')
ON CONFLICT (email) DO UPDATE SET 
  role = 'super_admin',
  updated_at = CURRENT_TIMESTAMP;
