-- Reset projects AUTO_INCREMENT to MAX(id)+1
-- ใช้หลังจาก import/update ที่คง project id เดิม

USE sena_referral;

SET @next_id := (SELECT COALESCE(MAX(id), 0) + 1 FROM projects);
SET @stmt := CONCAT('ALTER TABLE projects AUTO_INCREMENT = ', @next_id);
PREPARE s FROM @stmt;
EXECUTE s;
DEALLOCATE PREPARE s;

SELECT @next_id AS next_auto_increment;
