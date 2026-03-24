-- Migration: Create notification_rules table for configurable system email notifications
-- Created: 2026-03-24

CREATE TABLE IF NOT EXISTS notification_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action_type ENUM('customer_created', 'agent_registered') NOT NULL,
    recipient_emails TEXT NOT NULL COMMENT 'JSON array of recipients',
    is_active BOOLEAN DEFAULT true,
    created_by INT NULL,
    updated_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_notification_rules_action (action_type),
    INDEX idx_notification_rules_active (is_active),

    CONSTRAINT fk_notification_rules_created_by
        FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_notification_rules_updated_by
        FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE notification_rules COMMENT = 'กติกาการส่งอีเมลแจ้งเตือนตามเหตุการณ์ในระบบ';
