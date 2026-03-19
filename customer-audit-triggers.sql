-- ===============================================
-- Customer Audit Trail Triggers
-- สำหรับ track การเปลี่ยนแปลงข้อมูลลูกค้า
-- ===============================================

-- สร้าง stored procedure สำหรับ log activity
DELIMITER //

CREATE PROCEDURE LogCustomerActivity(
    IN p_user_id INT,
    IN p_action VARCHAR(50),
    IN p_customer_id INT,
    IN p_old_values JSON,
    IN p_new_values JSON
)
BEGIN
    INSERT INTO activity_logs (
        user_id,
        action,
        table_name,
        record_id,
        old_values,
        new_values,
        created_at
    ) VALUES (
        p_user_id,
        p_action,
        'customers',
        p_customer_id,
        p_old_values,
        p_new_values,
        NOW()
    );
END //

DELIMITER ;

-- Trigger สำหรับ INSERT customer (สร้างลูกค้าใหม่)
DELIMITER //
CREATE TRIGGER customer_after_insert
    AFTER INSERT ON customers
    FOR EACH ROW
BEGIN
    CALL LogCustomerActivity(
        NEW.created_by,
        'CREATE',
        NEW.id,
        NULL,
        JSON_OBJECT(
            'agent_id', NEW.agent_id,
            'first_name', NEW.first_name,
            'last_name', NEW.last_name,
            'phone', NEW.phone,
            'email', NEW.email,
            'project_id', NEW.project_id,
            'budget_min', NEW.budget_min,
            'budget_max', NEW.budget_max,
            'status', NEW.status,
            'source', NEW.source
        )
    );
END //
DELIMITER ;

-- Trigger สำหรับ UPDATE customer (แก้ไขข้อมูลลูกค้า)
DELIMITER //
CREATE TRIGGER customer_after_update
    AFTER UPDATE ON customers
    FOR EACH ROW
BEGIN
    -- เช็คว่ามีการเปลี่ยนแปลงจริงหรือไม่
    IF (OLD.first_name != NEW.first_name OR
        OLD.last_name != NEW.last_name OR
        OLD.phone != NEW.phone OR
        OLD.email != NEW.email OR
        OLD.project_id != NEW.project_id OR
        OLD.budget_min != NEW.budget_min OR
        OLD.budget_max != NEW.budget_max OR
        OLD.status != NEW.status OR
        OLD.source != NEW.source OR
        OLD.notes != NEW.notes OR
        OLD.sena_approved != NEW.sena_approved) THEN

        CALL LogCustomerActivity(
            NEW.updated_by,
            'UPDATE',
            NEW.id,
            JSON_OBJECT(
                'agent_id', OLD.agent_id,
                'first_name', OLD.first_name,
                'last_name', OLD.last_name,
                'phone', OLD.phone,
                'email', OLD.email,
                'project_id', OLD.project_id,
                'budget_min', OLD.budget_min,
                'budget_max', OLD.budget_max,
                'status', OLD.status,
                'source', OLD.source,
                'notes', OLD.notes,
                'sena_approved', OLD.sena_approved
            ),
            JSON_OBJECT(
                'agent_id', NEW.agent_id,
                'first_name', NEW.first_name,
                'last_name', NEW.last_name,
                'phone', NEW.phone,
                'email', NEW.email,
                'project_id', NEW.project_id,
                'budget_min', NEW.budget_min,
                'budget_max', NEW.budget_max,
                'status', NEW.status,
                'source', NEW.source,
                'notes', NEW.notes,
                'sena_approved', NEW.sena_approved
            )
        );
    END IF;
END //
DELIMITER ;

-- Trigger สำหรับ DELETE customer (ลบลูกค้า)
DELIMITER //
CREATE TRIGGER customer_after_delete
    AFTER DELETE ON customers
    FOR EACH ROW
BEGIN
    CALL LogCustomerActivity(
        @current_user_id, -- ต้องกำหนด session variable ใน application
        'DELETE',
        OLD.id,
        JSON_OBJECT(
            'agent_id', OLD.agent_id,
            'first_name', OLD.first_name,
            'last_name', OLD.last_name,
            'phone', OLD.phone,
            'email', OLD.email,
            'project_id', OLD.project_id,
            'budget_min', OLD.budget_min,
            'budget_max', OLD.budget_max,
            'status', OLD.status,
            'source', OLD.source
        ),
        NULL
    );
END //
DELIMITER ;

-- ===============================================
-- Views สำหรับการ query audit trail ง่ายขึ้น
-- ===============================================

-- View สำหรับดู history ของลูกค้าแต่ละคน
CREATE VIEW customer_history AS
SELECT
    al.id,
    al.action,
    al.record_id as customer_id,
    CONCAT(c.first_name, ' ', c.last_name) as customer_name,
    u.email as changed_by,
    al.old_values,
    al.new_values,
    al.created_at
FROM activity_logs al
LEFT JOIN customers c ON al.record_id = c.id
LEFT JOIN users u ON al.user_id = u.id
WHERE al.table_name = 'customers'
ORDER BY al.created_at DESC;

-- View สำหรับดู summary การเปลี่ยนแปลงรายวัน
CREATE VIEW daily_customer_changes AS
SELECT
    DATE(al.created_at) as change_date,
    al.action,
    COUNT(*) as count,
    GROUP_CONCAT(DISTINCT u.email) as changed_by_users
FROM activity_logs al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.table_name = 'customers'
GROUP BY DATE(al.created_at), al.action
ORDER BY change_date DESC, al.action;

-- ===============================================
-- Sample queries สำหรับการใช้งาน
-- ===============================================

/*
-- ดู history ของลูกค้า ID = 1
SELECT * FROM customer_history WHERE customer_id = 1;

-- ดูการเปลี่ยนแปลงในวันนี้
SELECT * FROM customer_history WHERE DATE(created_at) = CURDATE();

-- ดูว่าใครแก้ไขข้อมูลลูกค้าบ้าง
SELECT changed_by, COUNT(*) as changes_count
FROM customer_history
WHERE action = 'UPDATE'
GROUP BY changed_by;

-- ดูการเปลี่ยนแปลง status ของลูกค้า
SELECT
    customer_id,
    customer_name,
    JSON_UNQUOTE(JSON_EXTRACT(old_values, '$.status')) as old_status,
    JSON_UNQUOTE(JSON_EXTRACT(new_values, '$.status')) as new_status,
    changed_by,
    created_at
FROM customer_history
WHERE action = 'UPDATE'
AND JSON_EXTRACT(old_values, '$.status') != JSON_EXTRACT(new_values, '$.status');
*/