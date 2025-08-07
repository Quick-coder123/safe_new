-- Додаємо поля для статусу обслуговування та коментаря
ALTER TABLE safes 
ADD COLUMN IF NOT EXISTS maintenance_status BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS maintenance_comment TEXT;

-- Додаємо індекс для швидкого пошуку сейфів на обслуговуванні
CREATE INDEX IF NOT EXISTS idx_safes_maintenance_status ON safes(maintenance_status);

-- Коментарі до нових полів
COMMENT ON COLUMN safes.maintenance_status IS 'Чи знаходиться сейф на обслуговуванні';
COMMENT ON COLUMN safes.maintenance_comment IS 'Коментар до обслуговування сейфа';
