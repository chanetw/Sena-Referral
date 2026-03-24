-- ============================================
-- Migration: Update bud and name for EXISTING admin users only
-- Date: 2025-12-08
-- Description: Update เฉพาะ admin users ที่มีอยู่จริงใน production database
-- ============================================

USE sena_referral;

-- ตรวจสอบ admin users ที่มีอยู่ในระบบ
SELECT 'Current admin users before update:' as info;
SELECT id, email, bud, name, role FROM users WHERE role = 'admin';

-- Update เฉพาะ admin users ที่มีอยู่จริงๆ
-- อ้างอิงจากผลลัพธ์ที่เห็น: admin@sena.co.th และ admin@test.com

-- Update admin@sena.co.th (ถ้ามี)
UPDATE users
SET bud = '0', name = 'Admin SENA'
WHERE email = 'admin@sena.co.th' AND role = 'admin';

-- Update admin@test.com (ถ้ามี)
UPDATE users
SET bud = '0', name = 'Admin Test'
WHERE email = 'admin@test.com' AND role = 'admin';

-- แสดงผลลัพธ์หลัง update
SELECT 'Admin users after update:' as info;
SELECT id, email, bud, name, role, is_active
FROM users
WHERE role = 'admin'
ORDER BY id;

-- แสดงสถิติการ update
SELECT
    COUNT(*) as total_admin_users,
    SUM(CASE WHEN bud IS NOT NULL THEN 1 ELSE 0 END) as users_with_bud,
    SUM(CASE WHEN name IS NOT NULL THEN 1 ELSE 0 END) as users_with_name
FROM users
WHERE role = 'admin';
