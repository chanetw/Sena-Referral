-- Migration: Create email_logs table for tracking sent emails
-- Created: 2026-03-20

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
    
    INDEX idx_recipient_email (recipient_email),
    INDEX idx_template_name (template_name),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comment for documentation
ALTER TABLE email_logs COMMENT = 'บันทึกประวัติการส่งอีเมลจากระบบ SENA HAPPY REFER';
