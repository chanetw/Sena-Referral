-- ============================================
-- Migration: Clean up admin users
-- Date: 2025-12-04
-- Description: ลบ users ทั้งหมด เหลือเฉพาะ admin ที่ระบุใน ag_admin_final.xlsx + admin@test.com
-- ============================================

USE sena_referral;

-- Step 1: สำรองข้อมูล users ก่อนลบ
CREATE TABLE IF NOT EXISTS users_backup_20251204 AS SELECT * FROM users;

-- Step 2: ดูจำนวน users ที่จะลบ
SELECT
    'Total users before cleanup' as description,
    COUNT(*) as count
FROM users
UNION ALL
SELECT
    'Admin users to keep' as description,
    COUNT(*) as count
FROM users
WHERE email IN (
    'prapaphant@sena.co.th', 'admin_bud2', 'admin_bud1', 'info@sena.co.th',
    'sudaj@sena.co.th', 'jantimak@sena.co.th', 'chatchawarns@sena.co.th',
    'sthongtungsai@gmail.com', 'malim@sena.co.th', 'watiny@sena.co.th',
    'phakphums@sena.co.th', 'kasamap@sena.co.th', 'lakanar@sena.co.th',
    'suchawadeet@sena.co.th', 'thitipanp@sena.co.th', 'thitimak@sena.co.th',
    'pichetc@sena.co.th', 'sakulkanc@sena.co.th', 'sangteanp@sena.co.th',
    'warunnitthas@sena.co.th', 'thanawank@sena.co.th', 'petcharat@acuterealty.com',
    'sirinchaw@sena.co.th', 'thitapas@acuterealty.com', 'kittiyaphans@sena.co.th',
    'kittiyaphan.sena@gmail.com', 'chattraporns@sena.co.th', 'nichetaopoon@sena.co.th',
    'auchariyas@sena.co.th', 'minyay@sena.co.th', 'nutthanunp@sena.co.th',
    'natthaphatr@sena.co.th', 'minthitaj@sena.co.th', 'lalitac@sena.co.th',
    'chanisas@sena.co.th', 'thunpitchaw@sena.co.th', 'nichemonobearing@acuterealty.com',
    'nichepridetaopoon@acuterealty.com', 'surachaip.sena@gmail.com', 'thitapas_2022',
    'napatratc@sena.co.th', 'warissarinv@sena.co.th', 'natthakijs@sena.co.th',
    'pimprapaiu@sena.co.th', 'kanokrata@sena.co.th', 'pacharapornd@sena.co.th',
    'duanghataip@sena.co.th', 'busakornp@sena.co.th', 'wipapornk@sena.co.th',
    'wilawanp@sena.co.th', 'sawitreet@sena.co.th', 'phatcharib@sena.co.th',
    'lucksaprono@sena.co.th', 'issareev@sena.co.th', 'chatchawarns@sena.co.th',
    'nittayap@sena.co.th', 'thitiraty@sena.co.th', 'kanyapaksu@sena.co.th',
    'jiraphipatd@sena.co.th', 'phudthisank@sena.co.th', 'phaphatsarink@sena.co.th',
    'chatreek@sena.co.th', 'rattikornr@sena.co.th', 'chakhriyas@sena.co.th',
    'sukanyas@sena.co.th', 'pawast@sena.co.th', 'krissapornp@sena.co.th',
    'psd.happyrefer@gmail.com', 'admin@test.com'
)
UNION ALL
SELECT
    'Users to delete' as description,
    COUNT(*) as count
FROM users
WHERE email NOT IN (
    'prapaphant@sena.co.th', 'admin_bud2', 'admin_bud1', 'info@sena.co.th',
    'sudaj@sena.co.th', 'jantimak@sena.co.th', 'chatchawarns@sena.co.th',
    'sthongtungsai@gmail.com', 'malim@sena.co.th', 'watiny@sena.co.th',
    'phakphums@sena.co.th', 'kasamap@sena.co.th', 'lakanar@sena.co.th',
    'suchawadeet@sena.co.th', 'thitipanp@sena.co.th', 'thitimak@sena.co.th',
    'pichetc@sena.co.th', 'sakulkanc@sena.co.th', 'sangteanp@sena.co.th',
    'warunnitthas@sena.co.th', 'thanawank@sena.co.th', 'petcharat@acuterealty.com',
    'sirinchaw@sena.co.th', 'thitapas@acuterealty.com', 'kittiyaphans@sena.co.th',
    'kittiyaphan.sena@gmail.com', 'chattraporns@sena.co.th', 'nichetaopoon@sena.co.th',
    'auchariyas@sena.co.th', 'minyay@sena.co.th', 'nutthanunp@sena.co.th',
    'natthaphatr@sena.co.th', 'minthitaj@sena.co.th', 'lalitac@sena.co.th',
    'chanisas@sena.co.th', 'thunpitchaw@sena.co.th', 'nichemonobearing@acuterealty.com',
    'nichepridetaopoon@acuterealty.com', 'surachaip.sena@gmail.com', 'thitapas_2022',
    'napatratc@sena.co.th', 'warissarinv@sena.co.th', 'natthakijs@sena.co.th',
    'pimprapaiu@sena.co.th', 'kanokrata@sena.co.th', 'pacharapornd@sena.co.th',
    'duanghataip@sena.co.th', 'busakornp@sena.co.th', 'wipapornk@sena.co.th',
    'wilawanp@sena.co.th', 'sawitreet@sena.co.th', 'phatcharib@sena.co.th',
    'lucksaprono@sena.co.th', 'issareev@sena.co.th', 'chatchawarns@sena.co.th',
    'nittayap@sena.co.th', 'thitiraty@sena.co.th', 'kanyapaksu@sena.co.th',
    'jiraphipatd@sena.co.th', 'phudthisank@sena.co.th', 'phaphatsarink@sena.co.th',
    'chatreek@sena.co.th', 'rattikornr@sena.co.th', 'chakhriyas@sena.co.th',
    'sukanyas@sena.co.th', 'pawast@sena.co.th', 'krissapornp@sena.co.th',
    'psd.happyrefer@gmail.com', 'admin@test.com'
);

-- Step 3: ลบ users ที่ไม่อยู่ใน list
DELETE FROM users
WHERE email NOT IN (
    'prapaphant@sena.co.th', 'admin_bud2', 'admin_bud1', 'info@sena.co.th',
    'sudaj@sena.co.th', 'jantimak@sena.co.th', 'chatchawarns@sena.co.th',
    'sthongtungsai@gmail.com', 'malim@sena.co.th', 'watiny@sena.co.th',
    'phakphums@sena.co.th', 'kasamap@sena.co.th', 'lakanar@sena.co.th',
    'suchawadeet@sena.co.th', 'thitipanp@sena.co.th', 'thitimak@sena.co.th',
    'pichetc@sena.co.th', 'sakulkanc@sena.co.th', 'sangteanp@sena.co.th',
    'warunnitthas@sena.co.th', 'thanawank@sena.co.th', 'petcharat@acuterealty.com',
    'sirinchaw@sena.co.th', 'thitapas@acuterealty.com', 'kittiyaphans@sena.co.th',
    'kittiyaphan.sena@gmail.com', 'chattraporns@sena.co.th', 'nichetaopoon@sena.co.th',
    'auchariyas@sena.co.th', 'minyay@sena.co.th', 'nutthanunp@sena.co.th',
    'natthaphatr@sena.co.th', 'minthitaj@sena.co.th', 'lalitac@sena.co.th',
    'chanisas@sena.co.th', 'thunpitchaw@sena.co.th', 'nichemonobearing@acuterealty.com',
    'nichepridetaopoon@acuterealty.com', 'surachaip.sena@gmail.com', 'thitapas_2022',
    'napatratc@sena.co.th', 'warissarinv@sena.co.th', 'natthakijs@sena.co.th',
    'pimprapaiu@sena.co.th', 'kanokrata@sena.co.th', 'pacharapornd@sena.co.th',
    'duanghataip@sena.co.th', 'busakornp@sena.co.th', 'wipapornk@sena.co.th',
    'wilawanp@sena.co.th', 'sawitreet@sena.co.th', 'phatcharib@sena.co.th',
    'lucksaprono@sena.co.th', 'issareev@sena.co.th', 'chatchawarns@sena.co.th',
    'nittayap@sena.co.th', 'thitiraty@sena.co.th', 'kanyapaksu@sena.co.th',
    'jiraphipatd@sena.co.th', 'phudthisank@sena.co.th', 'phaphatsarink@sena.co.th',
    'chatreek@sena.co.th', 'rattikornr@sena.co.th', 'chakhriyas@sena.co.th',
    'sukanyas@sena.co.th', 'pawast@sena.co.th', 'krissapornp@sena.co.th',
    'psd.happyrefer@gmail.com', 'admin@test.com'
);

-- Step 4: ตรวจสอบผลลัพธ์
SELECT
    'Total users after cleanup' as description,
    COUNT(*) as count
FROM users
UNION ALL
SELECT
    'Admin users' as description,
    COUNT(*) as count
FROM users
WHERE role = 'admin'
UNION ALL
SELECT
    'Agent users' as description,
    COUNT(*) as count
FROM users
WHERE role = 'agent';

-- Step 5: แสดงรายชื่อ users ที่เหลือ
SELECT id, email, role, is_active
FROM users
ORDER BY role, email;
