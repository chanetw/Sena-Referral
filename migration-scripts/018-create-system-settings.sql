-- Migration: Create system_settings table for global system configuration
-- Created: 2026-04-07

CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_type ENUM('string', 'number', 'boolean', 'json') NOT NULL DEFAULT 'string',
    description TEXT NULL,
    updated_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_system_settings_key (setting_key),

    CONSTRAINT fk_system_settings_updated_by
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE system_settings COMMENT = 'ตั้งค่าระบบ (key-value) สำหรับ admin ปรับเปลี่ยนพฤติกรรมระบบ';

-- Seed default settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('customer_approval_mode', 'manual', 'string', 'โหมดอนุมัติลูกค้า: auto = ตรวจสอบซ้ำและอนุมัติอัตโนมัติ, manual = รอ admin ตรวจสอบเอง'),
('lead_sync_enabled', 'false', 'boolean', 'เปิด/ปิดการ sync lead ไปยัง ICON REM API')
ON DUPLICATE KEY UPDATE setting_key = setting_key;
