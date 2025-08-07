-- Виправлення RLS політик для safe_blocks та safes

-- Варіант 1: Вимкнути RLS (простіше для розробки)
ALTER TABLE safe_blocks DISABLE ROW LEVEL SECURITY;
ALTER TABLE safes DISABLE ROW LEVEL SECURITY;

-- Або Варіант 2: Виправити політики для роботи з сервер-сайд API
-- Видалити старі політики
-- DROP POLICY IF EXISTS "Allow admin read access to safes" ON safes;
-- DROP POLICY IF EXISTS "Allow admin full access to safes" ON safes;
-- DROP POLICY IF EXISTS "Allow admin read access to safe_blocks" ON safe_blocks;
-- DROP POLICY IF EXISTS "Allow admin full access to safe_blocks" ON safe_blocks;

-- Створити нові політики що дозволяють все (для розробки)
-- CREATE POLICY "Allow all operations on safes" ON safes FOR ALL USING (true);
-- CREATE POLICY "Allow all operations on safe_blocks" ON safe_blocks FOR ALL USING (true);
