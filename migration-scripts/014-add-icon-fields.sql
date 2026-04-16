-- Migration 014: Add ICON REM integration fields
-- Date: 2026-04-01
-- -------------------------------------------------------

-- 1. projects: ICON project code (filled via sheet mapping migration 015)
ALTER TABLE projects
  ADD COLUMN icon_project_code VARCHAR(20) NULL DEFAULT NULL
    COMMENT 'รหัสโครงการใน ICON REM system';

-- 2. customers: ICON lead sync tracking columns
ALTER TABLE customers
  ADD COLUMN icon_lead_id VARCHAR(50) NULL DEFAULT NULL
    COMMENT 'Lead ID ที่ได้รับกลับจาก ICON REM หลัง sync สำเร็จ',
  ADD COLUMN icon_sync_status ENUM('pending', 'success', 'failed') NULL DEFAULT NULL
    COMMENT 'สถานะการ sync ไป ICON REM: NULL=ยังไม่ส่ง, pending=กำลังส่ง, success=สำเร็จ, failed=ล้มเหลว',
  ADD COLUMN icon_sync_error TEXT NULL DEFAULT NULL
    COMMENT 'Error message จาก ICON REM กรณี sync ล้มเหลว';
