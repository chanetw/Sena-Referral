-- ===============================================
-- SENA Agent Referral System
-- Setup Script สำหรับ External MySQL Database
--
-- วิธีใช้:
--   mysql -uroot -p < setup-external-db.sql
--
-- Script นี้จะ:
--   1. สร้าง database sena_referral (utf8mb4)
--   2. สร้าง user sena_user พร้อม grant permissions
--   3. สร้างตารางทั้งหมด
--   4. สร้าง triggers สำหรับ audit trail
--   5. สร้าง views สำหรับรายงาน
--   6. ใส่ข้อมูล seed เบื้องต้น
--
-- หมายเหตุ:
--   - ถ้าต้องการ import ข้อมูลจริง ให้รัน backups/sena_referral_current.sql แยก
--   - ต้องรันด้วย root หรือ user ที่มี CREATE DATABASE / GRANT privileges
--   - Requires MySQL 8.0+
-- ===============================================

-- ----- Step 1: สร้าง Database -----
CREATE DATABASE IF NOT EXISTS sena_referral
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- ----- Step 2: สร้าง User & Grant Permissions -----
-- แก้ password ตามต้องการ
CREATE USER IF NOT EXISTS 'sena_user'@'%' IDENTIFIED BY 'sena_password';
GRANT ALL PRIVILEGES ON sena_referral.* TO 'sena_user'@'%';
FLUSH PRIVILEGES;

USE sena_referral;

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ===============================================
-- Step 3: สร้างตารางทั้งหมด
-- ===============================================

-- Users table สำหรับ Authentication
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'agent', 'manager') DEFAULT 'agent',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    bud VARCHAR(10),
    name VARCHAR(255)
);

-- Agent types table สำหรับประเภทเอเจนต์
CREATE TABLE IF NOT EXISTS agent_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    name_th VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Projects table สำหรับโครงการ
CREATE TABLE IF NOT EXISTS projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_code VARCHAR(20) UNIQUE NOT NULL,
    project_name VARCHAR(100) NOT NULL,
    project_type ENUM('condo', 'house', 'townhome', 'commercial') NOT NULL,
    location VARCHAR(255),
    price_range_min DECIMAL(15,2),
    price_range_max DECIMAL(15,2),
    sales_team VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    project_sale VARCHAR(100),
    bud INT
);

-- Agents table สำหรับข้อมูลเอเจนต์
CREATE TABLE IF NOT EXISTS agents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    agent_type_id INT NOT NULL,
    agent_code VARCHAR(20) UNIQUE NOT NULL,
    agent_id_card VARCHAR(13),
    id_card VARCHAR(13) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(15),
    address TEXT,
    registration_date DATE NOT NULL,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    email VARCHAR(100),
    duplicate_lead_id VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_type_id) REFERENCES agent_types(id)
);

-- Agent Type Details table สำหรับข้อมูลเพิ่มเติมตามประเภท agent
CREATE TABLE IF NOT EXISTS agent_type_details (
    id              INT            PRIMARY KEY AUTO_INCREMENT,
    agent_id        INT            NOT NULL UNIQUE,
    referral_code   VARCHAR(50)    DEFAULT NULL COMMENT 'รหัสแนะนำที่ผู้ใช้กรอกเอง',
    house_number    VARCHAR(50)    DEFAULT NULL COMMENT 'บ้านเลขที่',
    project_id      INT            DEFAULT NULL COMMENT 'FK → projects (โครงการที่อาศัย)',
    department      VARCHAR(100)   DEFAULT NULL COMMENT 'สังกัด / หน่วยงาน',
    division        VARCHAR(100)   DEFAULT NULL COMMENT 'แผนก',
    company_name    VARCHAR(100)   DEFAULT NULL COMMENT 'ชื่อบริษัท',
    occupation      VARCHAR(100)   DEFAULT NULL COMMENT 'อาชีพ',
    know_sena_from  VARCHAR(50)    DEFAULT NULL COMMENT 'รู้จักเสนาจากช่องทางใด',
    created_at      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_atd_agent   FOREIGN KEY (agent_id)   REFERENCES agents(id)   ON DELETE CASCADE,
    CONSTRAINT fk_atd_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- Product types table
CREATE TABLE IF NOT EXISTS product_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Customers table สำหรับข้อมูลลูกค้า
CREATE TABLE IF NOT EXISTS customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    agent_id INT NOT NULL,
    customer_code VARCHAR(20) UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(15),
    id_card VARCHAR(13),
    email VARCHAR(100),
    project_id INT,
    budget_min DECIMAL(15,2),
    budget_max DECIMAL(15,2),
    status ENUM('pending', 'duplicate', 'approved') DEFAULT 'pending',
    referral_type ENUM('self', 'friend'),
    source ENUM('referral', 'walk_in', 'online', 'phone', 'other') DEFAULT 'referral',
    notes TEXT,
    is_duplicate BOOLEAN DEFAULT false,
    duplicate_customer_id INT,
    sena_approved BOOLEAN DEFAULT false,
    approved_by INT,
    approved_at TIMESTAMP NULL,
    created_by INT,
    registration_date DATE,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents(id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (duplicate_customer_id) REFERENCES customers(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Customer-ProductType junction table
CREATE TABLE IF NOT EXISTS customer_product_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    product_type_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_customer_product_type (customer_id, product_type_id),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (product_type_id) REFERENCES product_types(id) ON DELETE CASCADE
);

-- Notification rules table
CREATE TABLE IF NOT EXISTS notification_rules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    action_type ENUM('customer_created', 'agent_registered', 'customer_approved', 'customer_rejected') NOT NULL,
    recipient_emails TEXT NOT NULL COMMENT 'JSON array ของอีเมลผู้รับ',
    is_active BOOLEAN DEFAULT true,
    created_by INT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Email logs table
CREATE TABLE IF NOT EXISTS email_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    template_name VARCHAR(100) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    data JSON,
    error_message TEXT,
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email_recipient (recipient_email),
    INDEX idx_email_template (template_name),
    INDEX idx_email_status (status),
    INDEX idx_email_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Visits table สำหรับข้อมูลการนัดหมายชมโครงการ
CREATE TABLE IF NOT EXISTS visits (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    visit_date DATE NOT NULL,
    visit_time TIME,
    status ENUM('scheduled', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Sales table สำหรับข้อมูลการขาย
CREATE TABLE IF NOT EXISTS sales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    unit_number VARCHAR(20),
    sale_price DECIMAL(15,2) NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 3.00,
    commission_amount DECIMAL(15,2),
    contract_date DATE,
    transfer_date DATE,
    status ENUM('reserved', 'contracted', 'transferred', 'cancelled') DEFAULT 'reserved',
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Leads table สำหรับข้อมูล Lead
CREATE TABLE IF NOT EXISTS leads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(15),
    email VARCHAR(100),
    source ENUM('website', 'facebook', 'google', 'referral', 'walk_in', 'other') DEFAULT 'other',
    interest_project_id INT,
    budget_range VARCHAR(50),
    status ENUM('new', 'contacted', 'qualified', 'converted', 'lost') DEFAULT 'new',
    notes TEXT,
    assigned_to INT,
    converted_customer_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (interest_project_id) REFERENCES projects(id),
    FOREIGN KEY (assigned_to) REFERENCES agents(id),
    FOREIGN KEY (converted_customer_id) REFERENCES customers(id)
);

-- Requests table สำหรับคำร้องต่างๆ
CREATE TABLE IF NOT EXISTS requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    request_type ENUM('commission', 'transfer', 'cancellation', 'other') NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('pending', 'in_review', 'approved', 'rejected') DEFAULT 'pending',
    approved_by INT,
    approved_at TIMESTAMP NULL,
    rejection_reason TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Activity logs table สำหรับ audit trail
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id INT NOT NULL,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ===============================================
-- Indexes
-- ===============================================
CREATE INDEX idx_agents_agent_code ON agents(agent_code);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_customers_agent_id ON customers(agent_id);
CREATE INDEX idx_customers_project_id ON customers(project_id);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_created_at ON customers(created_at);
CREATE INDEX idx_visits_customer_id ON visits(customer_id);
CREATE INDEX idx_visits_visit_date ON visits(visit_date);
CREATE INDEX idx_sales_customer_id ON sales(customer_id);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_requests_customer_id ON requests(customer_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_table_record ON activity_logs(table_name, record_id);
CREATE INDEX idx_notification_rules_action ON notification_rules(action_type);
CREATE INDEX idx_notification_rules_active ON notification_rules(is_active);

-- ===============================================
-- Step 4: Triggers & Stored Procedures (Audit Trail)
-- ===============================================

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
        user_id, action, table_name, record_id,
        old_values, new_values, created_at
    ) VALUES (
        p_user_id, p_action, 'customers', p_customer_id,
        p_old_values, p_new_values, NOW()
    );
END //

DELIMITER ;

-- Trigger: INSERT customer
DELIMITER //
CREATE TRIGGER customer_after_insert
    AFTER INSERT ON customers
    FOR EACH ROW
BEGIN
    CALL LogCustomerActivity(
        NEW.created_by, 'CREATE', NEW.id, NULL,
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

-- Trigger: UPDATE customer
DELIMITER //
CREATE TRIGGER customer_after_update
    AFTER UPDATE ON customers
    FOR EACH ROW
BEGIN
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
            NEW.updated_by, 'UPDATE', NEW.id,
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

-- Trigger: DELETE customer
DELIMITER //
CREATE TRIGGER customer_after_delete
    AFTER DELETE ON customers
    FOR EACH ROW
BEGIN
    CALL LogCustomerActivity(
        @current_user_id, 'DELETE', OLD.id,
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
-- Step 5: Views
-- ===============================================

CREATE OR REPLACE VIEW customer_history AS
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

CREATE OR REPLACE VIEW daily_customer_changes AS
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
-- Step 6: Seed Data (Agent Types — จำเป็นต้องมี)
-- ===============================================

INSERT IGNORE INTO agent_types (id, code, name_th, is_active, sort_order) VALUES
(1, 'resident', 'ลูกบ้าน', true, 1),
(2, 'livnex_customer', 'ลูกค้า LIvnex', true, 2),
(3, 'rentnex_customer', 'ลูกค้า Rentnex', true, 3),
(4, 'sena_staff', 'พนักงานบริษัทเสนาฯ และบริษัทในเครือ', true, 4),
(5, 'partner', 'พันธมิตร คู่ค้า', true, 5),
(6, 'general', 'บุคคลทั่วไป', true, 6);

-- ===============================================
-- เสร็จสิ้น!
--
-- ขั้นตอนถัดไป:
--   1. ตรวจสอบ: mysql -usena_user -p sena_referral -e "SHOW TABLES;"
--   2. Import ข้อมูลจริง (ถ้ามี): mysql -usena_user -p sena_referral < backups/sena_referral_current.sql
--   3. แก้ไข backend/.env.extdb ให้ DB_HOST ชี้ไปที่ MySQL server นี้
--   4. Start API: docker compose -f docker-compose.extdb.yml up api -d
--   5. ทดสอบ: curl http://SERVER_IP:4000/api/test-db
-- ===============================================
