# การทำงานของระบบ Activity Logging

## ภาพรวมระบบ

ระบบ Activity Logging ใน SENA Agent Referral System ถูกออกแบบมาเพื่อติดตามการเปลี่ยนแปลงข้อมูลลูกค้าอย่างละเอียด โดยใช้ **MySQL Triggers** ร่วมกับการจัดเก็บข้อมูลแบบ JSON เพื่อบันทึกทุกการกระทำที่เกิดขึ้นกับข้อมูลลูกค้า

## โครงสร้างฐานข้อมูล

### ตาราง activity_logs

```sql
CREATE TABLE activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,                     -- ผู้ใช้ที่ทำการแก้ไข
    action VARCHAR(50) NOT NULL,     -- ประเภทการกระทำ (CREATE, UPDATE, DELETE)
    table_name VARCHAR(50) NOT NULL, -- ชื่อตารางที่ถูกแก้ไข
    record_id INT NOT NULL,          -- ID ของ record ที่ถูกแก้ไข
    old_values JSON,                 -- ข้อมูลก่อนการแก้ไข (JSON format)
    new_values JSON,                 -- ข้อมูลหลังการแก้ไข (JSON format)
    ip_address VARCHAR(45),          -- IP address ของผู้ใช้
    user_agent TEXT,                 -- ข้อมูล Browser
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### View customer_history

```sql
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
```

## MySQL Triggers

### 1. Stored Procedure สำหรับบันทึก Log

```sql
DELIMITER //
CREATE PROCEDURE LogCustomerActivity(
    IN p_user_id INT,
    IN p_action VARCHAR(50),
    IN p_record_id INT,
    IN p_old_values JSON,
    IN p_new_values JSON
)
BEGIN
    INSERT INTO activity_logs (
        user_id, action, table_name, record_id,
        old_values, new_values, created_at
    ) VALUES (
        p_user_id, p_action, 'customers', p_record_id,
        p_old_values, p_new_values, NOW()
    );
END //
DELIMITER ;
```

### 2. Trigger สำหรับการสร้างลูกค้าใหม่

```sql
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
            'first_name', NEW.first_name,
            'last_name', NEW.last_name,
            'phone', NEW.phone,
            'email', NEW.email,
            'status', NEW.status,
            'agent_id', NEW.agent_id,
            'project_id', NEW.project_id,
            'project_name', NEW.project_name,
            'budget', NEW.budget
        )
    );
END //
DELIMITER ;
```

### 3. Trigger สำหรับการแก้ไขข้อมูลลูกค้า

```sql
DELIMITER //
CREATE TRIGGER customer_after_update
AFTER UPDATE ON customers
FOR EACH ROW
BEGIN
    CALL LogCustomerActivity(
        NEW.updated_by,
        'UPDATE',
        NEW.id,
        JSON_OBJECT(
            'first_name', OLD.first_name,
            'last_name', OLD.last_name,
            'phone', OLD.phone,
            'email', OLD.email,
            'status', OLD.status,
            'agent_id', OLD.agent_id,
            'project_id', OLD.project_id,
            'project_name', OLD.project_name,
            'budget', OLD.budget
        ),
        JSON_OBJECT(
            'first_name', NEW.first_name,
            'last_name', NEW.last_name,
            'phone', NEW.phone,
            'email', NEW.email,
            'status', NEW.status,
            'agent_id', NEW.agent_id,
            'project_id', NEW.project_id,
            'project_name', NEW.project_name,
            'budget', NEW.budget
        )
    );
END //
DELIMITER ;
```

### 4. Trigger สำหรับการลบลูกค้า

```sql
DELIMITER //
CREATE TRIGGER customer_after_delete
AFTER DELETE ON customers
FOR EACH ROW
BEGIN
    CALL LogCustomerActivity(
        @current_user_id,
        'DELETE',
        OLD.id,
        JSON_OBJECT(
            'first_name', OLD.first_name,
            'last_name', OLD.last_name,
            'phone', OLD.phone,
            'email', OLD.email,
            'status', OLD.status,
            'agent_id', OLD.agent_id,
            'project_id', OLD.project_id,
            'project_name', OLD.project_name,
            'budget', OLD.budget
        ),
        NULL
    );
END //
DELIMITER ;
```

## การใช้งานผ่าน API

### 1. ดูประวัติการเปลี่ยนแปลงของลูกค้า

```javascript
// GET /api/customers/:id/history
app.get('/api/customers/:id/history', authenticateToken, async (req, res) => {
  try {
    const customerId = req.params.id;

    const [results] = await sequelize.query(`
      SELECT
        id, action, customer_name, changed_by,
        old_values, new_values, created_at
      FROM customer_history
      WHERE customer_id = ?
      ORDER BY created_at DESC
    `, {
      replacements: [customerId]
    });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงประวัติ'
    });
  }
});
```

### 2. การตั้งค่า User ID สำหรับ Triggers

```javascript
// ตั้งค่า user_id ก่อนทำการแก้ไขข้อมูล
const setCurrentUser = async (userId) => {
  await sequelize.query('SET @current_user_id = ?', {
    replacements: [userId]
  });
};

// ใช้งานใน controller
app.put('/api/customers/:id', authenticateToken, async (req, res) => {
  try {
    // ตั้งค่า current user สำหรับ trigger
    await setCurrentUser(req.user.id);

    // อัพเดทข้อมูลลูกค้า (trigger จะทำงานอัตโนมัติ)
    await Customer.update(req.body, {
      where: { id: req.params.id }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

## ตัวอย่างการใช้งาน

### 1. ดูประวัติการเปลี่ยนแปลงล่าสุด

```sql
-- ดู 10 การเปลี่ยนแปลงล่าสุด
SELECT * FROM customer_history LIMIT 10;
```

### 2. ติดตามการเปลี่ยนแปลงสถานะลูกค้า

```sql
-- ดูการเปลี่ยนแปลงสถานะลูกค้า
SELECT
    customer_name,
    JSON_UNQUOTE(JSON_EXTRACT(old_values, '$.status')) as old_status,
    JSON_UNQUOTE(JSON_EXTRACT(new_values, '$.status')) as new_status,
    changed_by,
    created_at
FROM customer_history
WHERE action = 'UPDATE'
AND JSON_EXTRACT(old_values, '$.status') != JSON_EXTRACT(new_values, '$.status')
ORDER BY created_at DESC;
```

### 3. ดูประวัติของลูกค้าคนใดคนหนึ่ง

```sql
-- ดูประวัติของลูกค้า ID = 1
SELECT
    action,
    old_values,
    new_values,
    changed_by,
    created_at
FROM customer_history
WHERE customer_id = 1
ORDER BY created_at DESC;
```

### 4. สถิติการใช้งานระบบ

```sql
-- นับจำนวนการกระทำแต่ละประเภท
SELECT
    action,
    COUNT(*) as count,
    DATE(created_at) as date
FROM activity_logs
WHERE table_name = 'customers'
GROUP BY action, DATE(created_at)
ORDER BY date DESC, action;
```

## ข้อดีของระบบ Activity Logging

1. **ติดตามอัตโนมัติ**: ไม่ต้องเขียนโค้ดเพิ่มเติมใน application layer
2. **ความปลอดภัย**: ข้อมูล log จะถูกบันทึกแม้ว่าจะมีการแก้ไขข้อมูลโดยตรงในฐานข้อมูล
3. **ประสิทธิภาพ**: Triggers ทำงานในระดับฐานข้อมูล ทำให้เร็วและเสถียร
4. **ข้อมูลครบถ้วน**: บันทึกทั้ง before และ after values ในรูปแบบ JSON
5. **การตรวจสอบ**: สามารถตรวจสอบใครแก้ไขอะไรเมื่อไหร่ได้อย่างละเอียด

## การบำรุงรักษา

### 1. การทำความสะอาดข้อมูล Log เก่า

```sql
-- ลบ log ที่เก่ากว่า 1 ปี
DELETE FROM activity_logs
WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
```

### 2. การสำรองข้อมูล Log

```bash
# Export activity logs
mysqldump -u sena_user -p sena_referral activity_logs > activity_logs_backup.sql
```

### 3. การตรวจสอบประสิทธิภาพ

```sql
-- ตรวจสอบขนาดตาราง activity_logs
SELECT
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.tables
WHERE table_schema = 'sena_referral'
AND table_name = 'activity_logs';
```

## สรุป

ระบบ Activity Logging ใน SENA Agent Referral System ให้การติดตามที่ครอบคลุมและเชื่อถือได้สำหรับการเปลี่ยนแปลงข้อมูลลูกค้า ด้วยการใช้ MySQL Triggers และการจัดเก็บข้อมูลแบบ JSON ทำให้สามารถติดตามการเปลี่ยนแปลงได้อย่างละเอียดและมีประสิทธิภาพ