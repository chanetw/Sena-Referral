-- ============================================
-- Migration: Clean up admin users (Version 2)
-- Date: 2025-12-04
-- Description: ลบ users, agents, customers ทั้งหมด เหลือเฉพาะ admin ที่ระบุ + admin@test.com
-- Strategy: ลบตามลำดับ customers → agents → users เพื่อหลีกเลี่ยง FK constraints
-- ============================================

USE sena_referral;

-- Step 1: สำรองข้อมูลก่อนลบ
CREATE TABLE IF NOT EXISTS users_backup_20251204 AS SELECT * FROM users;
CREATE TABLE IF NOT EXISTS agents_backup_20251204 AS SELECT * FROM agents;
CREATE TABLE IF NOT EXISTS customers_backup_20251204 AS SELECT * FROM customers;
CREATE TABLE IF NOT EXISTS leads_backup_20251204 AS SELECT * FROM leads;
CREATE TABLE IF NOT EXISTS activity_logs_backup_20251204 AS SELECT * FROM activity_logs;

-- Step 2: ดูจำนวนข้อมูลก่อนลบ
SELECT 'BEFORE CLEANUP' as status, '' as detail
UNION ALL
SELECT 'Total users', COUNT(*) FROM users
UNION ALL
SELECT 'Total agents', COUNT(*) FROM agents
UNION ALL
SELECT 'Total customers', COUNT(*) FROM customers
UNION ALL
SELECT 'Total leads', COUNT(*) FROM leads
UNION ALL
SELECT '---', '---'
UNION ALL
SELECT 'Admin users to KEEP', COUNT(*)
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
SELECT 'Users to DELETE', COUNT(*)
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

-- Step 3: ลบ activity_logs ที่เชื่อมกับ users ที่ไม่ต้องการ
DELETE FROM activity_logs
WHERE user_id IN (
    SELECT id FROM users
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
    )
);

-- Step 4: ลบ customers ที่เชื่อมกับ agents ที่ไม่ต้องการ
DELETE FROM customers
WHERE agent_id IN (
    SELECT id FROM agents
    WHERE user_id IN (
        SELECT id FROM users
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
        )
    )
);

-- Step 5: ลบ leads ที่เชื่อมกับ agents ที่ไม่ต้องการ
DELETE FROM leads
WHERE assigned_to IN (
    SELECT id FROM agents
    WHERE user_id IN (
        SELECT id FROM users
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
        )
    )
);

-- Step 6: ลบ agents ที่ไม่ต้องการ
DELETE FROM agents
WHERE user_id IN (
    SELECT id FROM users
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
    )
);

-- Step 7: ลบ users ที่ไม่อยู่ใน admin list
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

-- Step 8: ตรวจสอบผลลัพธ์
SELECT 'AFTER CLEANUP' as status, '' as detail
UNION ALL
SELECT 'Total users', COUNT(*) FROM users
UNION ALL
SELECT 'Total agents', COUNT(*) FROM agents
UNION ALL
SELECT 'Total customers', COUNT(*) FROM customers
UNION ALL
SELECT 'Total leads', COUNT(*) FROM leads
UNION ALL
SELECT '---', '---'
UNION ALL
SELECT 'Admin users', COUNT(*) FROM users WHERE role = 'admin'
UNION ALL
SELECT 'Agent users', COUNT(*) FROM users WHERE role = 'agent';

-- Step 9: แสดงรายชื่อ users ที่เหลือ (10 คนแรก)
SELECT id, email, role, is_active
FROM users
ORDER BY role, email
LIMIT 10;
