-- Додавання таблиці адміністраторів
CREATE TABLE IF NOT EXISTS administrators (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id)
);

-- Додавання тригера для автоматичного оновлення updated_at
CREATE TRIGGER update_administrators_updated_at 
BEFORE UPDATE ON administrators 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Додавання першого супер-адміністратора (потрібно замінити email та user_id)
-- Для створення першого адміністратора використовуйте сторінку /create-admin
