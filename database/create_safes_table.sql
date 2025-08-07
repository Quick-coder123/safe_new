-- Створення таблиці для індивідуальних сейфів
CREATE TABLE IF NOT EXISTS safes (
    id SERIAL PRIMARY KEY,
    number VARCHAR(50) NOT NULL UNIQUE,
    row_number INTEGER,
    column_number INTEGER,
    is_occupied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Додавання індексів для оптимізації запитів
CREATE INDEX IF NOT EXISTS idx_safes_number ON safes(number);
CREATE INDEX IF NOT EXISTS idx_safes_occupied ON safes(is_occupied);
CREATE INDEX IF NOT EXISTS idx_safes_position ON safes(row_number, column_number);

-- Коментар до таблиці
COMMENT ON TABLE safes IS 'Таблиця для зберігання інформації про індивідуальні сейфи';
COMMENT ON COLUMN safes.number IS 'Унікальний номер сейфа (наприклад: A001, B015)';
COMMENT ON COLUMN safes.row_number IS 'Номер ряду для позиційування в інтерфейсі (опціонально)';
COMMENT ON COLUMN safes.column_number IS 'Номер стовпця для позиційування в інтерфейсі (опціонально)';
COMMENT ON COLUMN safes.is_occupied IS 'Статус зайнятості сейфа (false = вільний, true = зайнятий)';

-- Тригер для оновлення поля updated_at
CREATE OR REPLACE FUNCTION update_safes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_safes_updated_at
    BEFORE UPDATE ON safes
    FOR EACH ROW
    EXECUTE FUNCTION update_safes_updated_at();

-- Приклад додавання тестових сейфів (можна видалити після налаштування)
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
('A010', 5, 2, false)
ON CONFLICT (number) DO NOTHING;
