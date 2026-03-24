-- ============================================
-- Migration: Add bud and name columns to users table
-- Date: 2025-12-05
-- Description: เพิ่ม columns bud และ name ใน users table และอัปเดตข้อมูลจาก ag_admin_final.xlsx
-- ============================================

USE sena_referral;

-- Step 1: เพิ่ม columns ใหม่ใน users table (ใช้ stored procedure เพื่อหลีกเลี่ยง error ถ้า column มีอยู่แล้ว)
DELIMITER $$

DROP PROCEDURE IF EXISTS add_user_columns$$
CREATE PROCEDURE add_user_columns()
BEGIN
    -- Add bud column
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = 'sena_referral'
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'bud'
    ) THEN
        ALTER TABLE users ADD COLUMN bud VARCHAR(10) DEFAULT NULL AFTER updated_at;
    END IF;

    -- Add name column
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = 'sena_referral'
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'name'
    ) THEN
        ALTER TABLE users ADD COLUMN name VARCHAR(255) DEFAULT NULL AFTER bud;
    END IF;
END$$

DELIMITER ;

CALL add_user_columns();
DROP PROCEDURE add_user_columns;

-- Step 2: อัปเดตข้อมูล bud และ name จาก Excel
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

UPDATE users SET bud = '3', name = 'prapaphant@sena.co.th' WHERE email = 'prapaphant@sena.co.th';
UPDATE users SET bud = '2', name = 'admin_bud2' WHERE email = 'admin_bud2';
UPDATE users SET bud = '2', name = 'admin_bud1' WHERE email = 'admin_bud1';
UPDATE users SET bud = '2', name = 'admin_bud3' WHERE email = 'info@sena.co.th';
UPDATE users SET bud = '2', name = 'sudaj' WHERE email = 'sudaj@sena.co.th';
UPDATE users SET bud = '2', name = 'jantimak' WHERE email = 'jantimak@sena.co.th';
UPDATE users SET bud = '2', name = 'chatchawarns' WHERE email = 'chatchawarns@sena.co.th';
UPDATE users SET bud = '2', name = 'sucheran' WHERE email = 'sthongtungsai@gmail.com';
UPDATE users SET bud = '2', name = 'malim' WHERE email = 'malim@sena.co.th';
UPDATE users SET bud = '2', name = 'watiny' WHERE email = 'watiny@sena.co.th';
UPDATE users SET bud = '2', name = 'phakphums' WHERE email = 'phakphums@sena.co.th';
UPDATE users SET bud = '2', name = 'kasamap' WHERE email = 'kasamap@sena.co.th';
UPDATE users SET bud = '2', name = 'lakanar' WHERE email = 'lakanar@sena.co.th';
UPDATE users SET bud = '2', name = 'suchawadeet' WHERE email = 'suchawadeet@sena.co.th';
UPDATE users SET bud = '2', name = 'thitipanp' WHERE email = 'thitipanp@sena.co.th';
UPDATE users SET bud = '2', name = 'thitimak' WHERE email = 'thitimak@sena.co.th';
UPDATE users SET bud = '2', name = 'pichetc' WHERE email = 'pichetc@sena.co.th';
UPDATE users SET bud = '2', name = 'sakulkanc' WHERE email = 'sakulkanc@sena.co.th';
UPDATE users SET bud = '2', name = 'sangteanp' WHERE email = 'sangteanp@sena.co.th';
UPDATE users SET bud = '2', name = 'warunnitthas' WHERE email = 'warunnitthas@sena.co.th';
UPDATE users SET bud = '2', name = 'thanawank' WHERE email = 'thanawank@sena.co.th';
UPDATE users SET bud = '2', name = 'petcharat' WHERE email = 'petcharat@acuterealty.com';
UPDATE users SET bud = '2', name = 'sirinchaw' WHERE email = 'sirinchaw@sena.co.th';
UPDATE users SET bud = '0', name = 'thitapas' WHERE email = 'thitapas@acuterealty.com';
UPDATE users SET bud = '1', name = 'kittiyaphans' WHERE email = 'kittiyaphans@sena.co.th';
UPDATE users SET bud = '1', name = 'kittiyaphan' WHERE email = 'kittiyaphan.sena@gmail.com';
UPDATE users SET bud = '1', name = 'chattraporns' WHERE email = 'chattraporns@sena.co.th';
UPDATE users SET bud = '1', name = 'nichetaopoon' WHERE email = 'nichetaopoon@sena.co.th';
UPDATE users SET bud = '3', name = 'auchariyas' WHERE email = 'auchariyas@sena.co.th';
UPDATE users SET bud = '3', name = 'minyay' WHERE email = 'minyay@sena.co.th';
UPDATE users SET bud = '3', name = 'nutthanunp' WHERE email = 'nutthanunp@sena.co.th';
UPDATE users SET bud = '3', name = 'natthaphatr' WHERE email = 'natthaphatr@sena.co.th';
UPDATE users SET bud = '3', name = 'minthitaj' WHERE email = 'minthitaj@sena.co.th';
UPDATE users SET bud = '2', name = 'lalitac' WHERE email = 'lalitac@sena.co.th';
UPDATE users SET bud = '2', name = 'chanisas' WHERE email = 'chanisas@sena.co.th';
UPDATE users SET bud = '2', name = 'thunpitchaw' WHERE email = 'thunpitchaw@sena.co.th';
UPDATE users SET bud = '2', name = 'nichemonobearing' WHERE email = 'nichemonobearing@acuterealty.com';
UPDATE users SET bud = '1', name = 'nichepridetaopoon' WHERE email = 'nichepridetaopoon@acuterealty.com';
UPDATE users SET bud = '2', name = 'surachaip.sena' WHERE email = 'surachaip.sena@gmail.com';
UPDATE users SET bud = '2', name = 'thitapas_2022' WHERE email = 'thitapas_2022';
UPDATE users SET bud = '3', name = 'napatratc' WHERE email = 'napatratc@sena.co.th';
UPDATE users SET bud = '22', name = 'warissarinv' WHERE email = 'warissarinv@sena.co.th';
UPDATE users SET bud = '2', name = 'Natthakijs' WHERE email = 'natthakijs@sena.co.th';
UPDATE users SET bud = '21', name = 'Pimprapaiu' WHERE email = 'pimprapaiu@sena.co.th';
UPDATE users SET bud = '21', name = 'Kanokrata' WHERE email = 'kanokrata@sena.co.th';
UPDATE users SET bud = '41', name = 'pacharapornd' WHERE email = 'pacharapornd@sena.co.th';
UPDATE users SET bud = '41', name = 'Duanghataip' WHERE email = 'duanghataip@sena.co.th';
UPDATE users SET bud = '41', name = 'busakornp' WHERE email = 'busakornp@sena.co.th';
UPDATE users SET bud = '3', name = 'wipapornk' WHERE email = 'wipapornk@sena.co.th';
UPDATE users SET bud = '3', name = 'wilawanp' WHERE email = 'wilawanp@sena.co.th';
UPDATE users SET bud = '2', name = 'sawitreet' WHERE email = 'sawitreet@sena.co.th';
UPDATE users SET bud = '2', name = 'phatcharib' WHERE email = 'phatcharib@sena.co.th';
UPDATE users SET bud = '2', name = 'lucksaprono' WHERE email = 'lucksaprono@sena.co.th';
UPDATE users SET bud = '2', name = 'issareev' WHERE email = 'issareev@sena.co.th';
UPDATE users SET bud = '2', name = 'chatchawarns' WHERE email = 'chatchawarns@sena.co.th';
UPDATE users SET bud = '1', name = 'nittayap' WHERE email = 'nittayap@sena.co.th';
UPDATE users SET bud = '1', name = 'thitiraty' WHERE email = 'thitiraty@sena.co.th';
UPDATE users SET bud = '2', name = 'kanyapaksu' WHERE email = 'kanyapaksu@sena.co.th';
UPDATE users SET bud = '2', name = 'jiraphipatd' WHERE email = 'jiraphipatd@sena.co.th';
UPDATE users SET bud = '2', name = 'phudthisank' WHERE email = 'phudthisank@sena.co.th';
UPDATE users SET bud = '2', name = 'phaphatsarink' WHERE email = 'phaphatsarink@sena.co.th';
UPDATE users SET bud = '4', name = 'chatreek' WHERE email = 'chatreek@sena.co.th';
UPDATE users SET bud = '3', name = 'rattikornr' WHERE email = 'rattikornr@sena.co.th';
UPDATE users SET bud = '3', name = 'chakhriyas' WHERE email = 'chakhriyas@sena.co.th';
UPDATE users SET bud = '2', name = 'sukanyas' WHERE email = 'sukanyas@sena.co.th';
UPDATE users SET bud = '2', name = 'pawast' WHERE email = 'pawast@sena.co.th';
UPDATE users SET bud = '4', name = 'krissapornp' WHERE email = 'krissapornp@sena.co.th';
UPDATE users SET bud = '1', name = 'psd.happyrefer' WHERE email = 'psd.happyrefer@gmail.com';
UPDATE users SET bud = '3', name = 'prapaphant' WHERE email = 'prapaphant@sena.co.th';

-- Step 3: ตรวจสอบผลลัพธ์
SELECT
    'Total admin users updated' as info,
    COUNT(*) as count
FROM users
WHERE role = 'admin' AND bud IS NOT NULL;

-- แสดงข้อมูล 10 คนแรก
SELECT id, email, bud, name, role, is_active
FROM users
WHERE role = 'admin'
ORDER BY id
LIMIT 10;