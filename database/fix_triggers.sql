-- Видалення проблемних тригерів логування
DROP TRIGGER IF EXISTS log_safes_changes ON safes;
DROP TRIGGER IF EXISTS log_safe_blocks_changes ON safe_blocks;

-- Видалення функції логування, якщо вона існує

-- Переконуємося, що тригери оновлення часу працюють
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

-- Переконуємося, що тригери існують
DROP TRIGGER IF EXISTS trigger_update_safes_updated_at ON safes;
CREATE TRIGGER trigger_update_safes_updated_at
    BEFORE UPDATE ON safes
    FOR EACH ROW
    EXECUTE FUNCTION update_safes_updated_at();

DROP TRIGGER IF EXISTS trigger_update_safe_blocks_updated_at ON safe_blocks;
CREATE TRIGGER trigger_update_safe_blocks_updated_at
    BEFORE UPDATE ON safe_blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_safe_blocks_updated_at();
