-- Migration: Add referralType column to customers table
-- Date: 2025-12-04
-- Description: เพิ่ม field ประเภทลูกค้า (แนะนำตัวเอง หรือ แนะนำเพื่อน)

USE sena_referral;

-- Add referralType column
ALTER TABLE customers
ADD COLUMN referral_type ENUM('self', 'friend') DEFAULT NULL
COMMENT 'ประเภทลูกค้า: self=แนะนำตัวเอง, friend=แนะนำเพื่อน'
AFTER status;

-- Verify the column was added
SHOW COLUMNS FROM customers LIKE 'referral%';

-- Show sample data
SELECT id, first_name, last_name, status, referral_type
FROM customers
LIMIT 5;
