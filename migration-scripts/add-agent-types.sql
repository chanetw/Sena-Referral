SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS agent_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL UNIQUE,
    name_th VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO agent_types (id, code, name_th, is_active, sort_order)
VALUES
    (1, 'resident', 'ลูกบ้าน', true, 1),
    (2, 'livnex_customer', 'ลูกค้า LIvnex', true, 2),
    (3, 'rentnex_customer', 'ลูกค้า Rentnex', true, 3),
    (4, 'sena_staff', 'พนักงานบริษัทเสนาฯ และบริษัทในเครือ', true, 4),
    (5, 'partner', 'พันธมิตร คู่ค้า', true, 5),
    (6, 'general', 'บุคคลทั่วไป', true, 6),
    (7, 'legacy_unknown', 'ไม่ระบุ (Agent เก่า)', true, 99)
ON DUPLICATE KEY UPDATE
    name_th = VALUES(name_th),
    is_active = VALUES(is_active),
    sort_order = VALUES(sort_order);

SET @has_agent_type_id := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'agents'
      AND COLUMN_NAME = 'agent_type_id'
);

SET @add_agent_type_id_sql := IF(
    @has_agent_type_id = 0,
    'ALTER TABLE agents ADD COLUMN agent_type_id INT NULL AFTER user_id',
    'SELECT 1'
);
PREPARE add_agent_type_id_stmt FROM @add_agent_type_id_sql;
EXECUTE add_agent_type_id_stmt;
DEALLOCATE PREPARE add_agent_type_id_stmt;

UPDATE agents
SET agent_type_id = 6
WHERE agent_type_id IS NULL;

ALTER TABLE agents
    MODIFY COLUMN agent_type_id INT NOT NULL;
