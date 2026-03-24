-- ============================================
-- Migration: Clean up unused backup tables
-- Date: 2025-12-05
-- Description: ลบ backup tables ที่ไม่ได้ใช้งานแล้วเพื่อประหยัด disk space
-- ============================================

USE sena_referral;

-- ===================================
-- SAFETY CHECK: แสดง backup tables ทั้งหมดก่อนลบ
-- ===================================
SELECT 'EXISTING BACKUP TABLES' as info;

SELECT
    TABLE_NAME,
    ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS 'SIZE_MB',
    TABLE_ROWS
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'sena_referral'
AND TABLE_NAME LIKE '%backup%'
ORDER BY TABLE_NAME;

-- ===================================
-- ลบ OLD backup tables ที่ไม่จำเป็น
-- ===================================

-- 1. Projects Backups - ลบ backup รุ่นเก่า (เก็บเฉพาะรุ่นล่าสุด)
DROP TABLE IF EXISTS projects_backup_20251204;      -- ลบ: backup รุ่นแรก (04 ธ.ค.)
DROP TABLE IF EXISTS projects_backup_20251204_v2;   -- ลบ: backup รุ่นสอง (04 ธ.ค.)
-- เก็บไว้: projects_backup_encoding_fix (05 ธ.ค. - รุ่นล่าสุด)

-- 2. Admin Users Backup - ลบเพราะไม่ได้ทำการลบข้อมูลจริง
DROP TABLE IF EXISTS admin_users_backup_20251204_v2;  -- ลบ: ไม่ได้ใช้งาน

-- หมายเหตุ: เก็บ backup tables หลักไว้ทั้งหมด
-- - users_backup_20251204 (1,014 users)
-- - agents_backup_20251204 (949 agents)
-- - customers_backup_20251204 (1,115 customers)
-- - leads_backup_20251204 (2 leads)
-- - activity_logs_backup_20251204 (3,121 logs)
-- เพราะเป็น safety backup ในกรณีที่ต้องการ restore ข้อมูลย้อนหลัง

-- ===================================
-- ตรวจสอบผลลัพธ์
-- ===================================
SELECT 'REMAINING BACKUP TABLES' as info;

SELECT
    TABLE_NAME,
    ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS 'SIZE_MB',
    TABLE_ROWS
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'sena_referral'
AND TABLE_NAME LIKE '%backup%'
ORDER BY TABLE_NAME;

SELECT 'CLEANUP COMPLETED' as status, 'Removed old project backups, kept latest only' as detail;
