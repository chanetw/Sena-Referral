-- Migration: Create lead_sync_logs table for ICON lead sync audit and retry
-- Created: 2026-04-01

CREATE TABLE IF NOT EXISTS lead_sync_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NULL,
    customer_code VARCHAR(50) NULL,
    customer_name VARCHAR(255) NULL,
    agent_code VARCHAR(50) NULL,
    agent_name VARCHAR(255) NULL,
    project_name VARCHAR(255) NULL,
    request_url VARCHAR(500) NOT NULL,
    request_payload LONGTEXT NULL,
    response_status_code INT NULL,
    response_body LONGTEXT NULL,
    status ENUM('pending', 'success', 'failed') NOT NULL DEFAULT 'pending',
    error_message TEXT NULL,
    icon_lead_id VARCHAR(100) NULL,
    attempt_no INT NOT NULL DEFAULT 1,
    retried_from_log_id INT NULL,
    triggered_by_user_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_lead_sync_logs_customer_id (customer_id),
    INDEX idx_lead_sync_logs_status (status),
    INDEX idx_lead_sync_logs_created_at (created_at),
    INDEX idx_lead_sync_logs_retried_from (retried_from_log_id),

    CONSTRAINT fk_lead_sync_logs_customer
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    CONSTRAINT fk_lead_sync_logs_retried_from
        FOREIGN KEY (retried_from_log_id) REFERENCES lead_sync_logs(id) ON DELETE SET NULL,
    CONSTRAINT fk_lead_sync_logs_triggered_by_user
        FOREIGN KEY (triggered_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE lead_sync_logs COMMENT = 'ประวัติการยิง ICON lead sync พร้อมข้อมูล request/response และ retry';

INSERT INTO lead_sync_logs (
        customer_id,
        customer_code,
        customer_name,
        agent_code,
        agent_name,
        project_name,
        request_url,
        request_payload,
        response_status_code,
        response_body,
        status,
        error_message,
        icon_lead_id,
        attempt_no,
        retried_from_log_id,
        triggered_by_user_id,
        created_at,
        updated_at
)
SELECT
        c.id AS customer_id,
        c.customer_code,
        TRIM(CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, ''))) AS customer_name,
        a.agent_code,
        TRIM(CONCAT(COALESCE(a.first_name, ''), ' ', COALESCE(a.last_name, ''))) AS agent_name,
        p.project_name,
        'legacy-import' AS request_url,
        NULL AS request_payload,
        NULL AS response_status_code,
        NULL AS response_body,
        c.icon_sync_status AS status,
        c.icon_sync_error AS error_message,
        c.icon_lead_id,
        1 AS attempt_no,
        NULL AS retried_from_log_id,
        NULL AS triggered_by_user_id,
        COALESCE(c.updated_at, c.created_at, NOW()) AS created_at,
        COALESCE(c.updated_at, c.created_at, NOW()) AS updated_at
FROM customers c
LEFT JOIN agents a ON a.id = c.agent_id
LEFT JOIN projects p ON p.id = c.project_id
LEFT JOIN lead_sync_logs l ON l.customer_id = c.id
WHERE c.icon_sync_status IS NOT NULL
    AND l.id IS NULL;