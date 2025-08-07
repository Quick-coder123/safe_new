-- Оновлена структура для системи індивідуальних сейфів з блоками

-- Таблиця блоків сейфів
CREATE TABLE IF NOT EXISTS safe_blocks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Оновлена таблиця сейфів з посиланням на блок та додатковими полями
DROP TABLE IF EXISTS safes;
CREATE TABLE safes (
    id SERIAL PRIMARY KEY,
    number VARCHAR(50) NOT NULL UNIQUE,
    block_id INTEGER REFERENCES safe_blocks(id) ON DELETE CASCADE,
    category VARCHAR(10) REFERENCES safe_categories(id),
    size VARCHAR(50),
    is_occupied BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Додавання індексів для оптимізації запитів
CREATE INDEX IF NOT EXISTS idx_safes_number ON safes(number);
CREATE INDEX IF NOT EXISTS idx_safes_occupied ON safes(is_occupied);
CREATE INDEX IF NOT EXISTS idx_safes_block ON safes(block_id);
CREATE INDEX IF NOT EXISTS idx_safes_category ON safes(category);
CREATE INDEX IF NOT EXISTS idx_safe_blocks_name ON safe_blocks(name);

-- Тригери для оновлення updated_at
CREATE OR REPLACE FUNCTION update_safes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_safe_blocks_updated_at()
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

CREATE TRIGGER trigger_update_safe_blocks_updated_at
    BEFORE UPDATE ON safe_blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_safe_blocks_updated_at();

-- Увімкнення RLS (закоментовано для простоти розробки)
-- ALTER TABLE safes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE safe_blocks ENABLE ROW LEVEL SECURITY;

-- Політики доступу (закоментовано для простоти розробки)
-- CREATE POLICY "Allow admin read access to safes" ON safes
--     FOR SELECT USING (auth.role() = 'authenticated');

-- CREATE POLICY "Allow admin full access to safes" ON safes
--     FOR ALL USING (auth.role() = 'authenticated');

-- CREATE POLICY "Allow admin read access to safe_blocks" ON safe_blocks
--     FOR SELECT USING (auth.role() = 'authenticated');

-- CREATE POLICY "Allow admin full access to safe_blocks" ON safe_blocks
--     FOR ALL USING (auth.role() = 'authenticated');

-- Початкові дані - блоки сейфів
INSERT INTO safe_blocks (name, description) VALUES
('Блок A', 'Перший блок індивідуальних сейфів'),
('Блок B', 'Другий блок індивідуальних сейфів')
ON CONFLICT DO NOTHING;

-- Початкові дані - сейфи з додатковою інформацією
INSERT INTO safes (number, block_id, category, size, is_occupied) VALUES
-- Блок A (ID = 1)
('A001', 1, 'I', 'Малий (20x15x25)', false),
('A002', 1, 'I', 'Малий (20x15x25)', true),
('A003', 1, 'II', 'Середній (30x25x35)', false),
('A004', 1, 'II', 'Середній (30x25x35)', false),
('A005', 1, 'III', 'Великий (40x35x45)', true),
('A006', 1, 'I', 'Малий (20x15x25)', false),
('A007', 1, 'II', 'Середній (30x25x35)', false),
('A008', 1, 'III', 'Великий (40x35x45)', false),
('A009', 1, 'I', 'Малий (20x15x25)', false),
('A010', 1, 'II', 'Середній (30x25x35)', false),
-- Блок B (ID = 2)
('B001', 2, 'II', 'Середній (30x25x35)', false),
('B002', 2, 'III', 'Великий (40x35x45)', false),
('B003', 2, 'I', 'Малий (20x15x25)', true),
('B004', 2, 'II', 'Середній (30x25x35)', false),
('B005', 2, 'III', 'Великий (40x35x45)', false)
ON CONFLICT (number) DO NOTHING;

COMMENT ON TABLE safe_blocks IS 'Таблиця блоків індивідуальних сейфів';
COMMENT ON COLUMN safe_blocks.name IS 'Назва блоку сейфів';
COMMENT ON COLUMN safe_blocks.description IS 'Опис блоку сейфів';

COMMENT ON TABLE safes IS 'Таблиця індивідуальних сейфів';
COMMENT ON COLUMN safes.number IS 'Унікальний номер сейфа';
COMMENT ON COLUMN safes.block_id IS 'ID блоку, до якого належить сейф';
COMMENT ON TABLE safes IS 'Таблиця індивідуальних сейфів';
COMMENT ON COLUMN safes.number IS 'Унікальний номер сейфа';
COMMENT ON COLUMN safes.block_id IS 'ID блоку, до якого належить сейф';
COMMENT ON COLUMN safes.category IS 'Категорія сейфа (I, II, III, IV, V)';
COMMENT ON COLUMN safes.size IS 'Розмір сейфа в см';
COMMENT ON COLUMN safes.is_occupied IS 'Статус зайнятості сейфа';
