-- ============================================
-- Migration: Update projects from tbl_project_final.xlsx
-- Date: 2025-12-04
-- Description: อัปเดต project_code และ project data
-- ============================================

USE sena_referral;

-- Step 1: Extend project_name column to support longer names
ALTER TABLE projects MODIFY COLUMN project_name VARCHAR(255) NOT NULL;

-- Step 2: สำรองข้อมูลก่อนอัปเดต
CREATE TABLE IF NOT EXISTS projects_backup_20251204_v2 AS SELECT * FROM projects;

-- Step 3: Clear และ Re-insert ข้อมูล projects
DELETE FROM projects;

-- Step 4: Insert projects จาก Excel

INSERT INTO projects (id, project_code, project_name, project_type, is_active, created_at, updated_at)
VALUES
(1, 'PROJ001', 'นิช ไอดี แอท ปากเกร็ด สเตชั่น', 'condo', 1, NOW(), NOW()),
(2, 'PROJ002', 'นิช ไอดี เพชรเกษม - บางแค', 'condo', 0, NOW(), NOW()),
(3, 'PROJ003', 'นิช ไอดี พระราม 2 - ดาวคะนอง', 'condo', 0, NOW(), NOW()),
(4, 'PROJ004', 'นิช ไอดี เสรีไทย - วงแหวน', 'condo', 0, NOW(), NOW()),
(5, 'PROJ005', 'นิช ไพรด์ เตาปูน - อินเตอร์เชนจ์', 'condo', 1, NOW(), NOW()),
(6, 'PROJ006', 'พัทยา คันทรี คลับ โฮม แอนด์ เรสซิเดนซ์', 'home', 0, NOW(), NOW()),
(7, 'PROJ007', 'เสนาพาร์ค แกรนด์ รามอินทรา - วงแหวน', 'home', 1, NOW(), NOW()),
(8, 'PROJ008', 'เสนา แกรนด์โฮม รามอินทรา กม.8', 'home', 0, NOW(), NOW()),
(9, 'PROJ009', 'นิช โมโน รัชวิภา', 'condo', 0, NOW(), NOW()),
(10, 'PROJ010', 'นิช โมโน สุขุมวิท - แบริ่ง', 'condo', 1, NOW(), NOW()),
(11, 'PROJ011', 'นิช โมโน สุขุมวิท - ปู่เจ้า', 'condo', 1, NOW(), NOW()),
(12, 'PROJ012', 'นิช ไพรด์ ทองหล่อ-เพชรบุรี', 'condo', 0, NOW(), NOW()),
(13, 'PROJ013', 'เดอะคิทท์ พลัส พหลโยธิน-คูคต', 'condo', 0, NOW(), NOW()),
(15, 'PROJ015', 'เสนา แกรนด์โฮม รังสิต-ติวานนท์', 'home', 1, NOW(), NOW()),
(16, 'PROJ016', 'เสนาทาวน์ รามอินทรา', 'townhome', 0, NOW(), NOW()),
(17, 'PROJ017', 'เสนาทาวน์ นวมินทร์', 'townhome', 0, NOW(), NOW()),
(18, 'PROJ018', 'เสนา วีว่า เพชรเกษม - พุทธมณฑล สาย 7', 'townhome', 1, NOW(), NOW()),
(19, 'PROJ019', 'นิช โมโน เจริญนคร', 'condo', 1, NOW(), NOW()),
(20, 'PROJ020', 'นิช โมโน แจ้งวัฒนะ', 'condo', 1, NOW(), NOW()),
(21, 'PROJ021', 'นิช โมโน พระราม 9', 'condo', 1, NOW(), NOW()),
(22, 'PROJ022', 'นิช โมโน เมกะ สเปซ บางนา', 'condo', 1, NOW(), NOW()),
(23, 'PROJ023', 'นิช โมโน รามคำแหง', 'condo', 1, NOW(), NOW()),
(24, 'PROJ024', 'นิช โมโน อิสรภาพ', 'condo', 0, NOW(), NOW()),
(25, 'PROJ025', 'นิช ไอดี พระราม 2', 'condo', 0, NOW(), NOW()),
(26, 'PROJ026', 'เฟล็กซี่ รัตนาธิเบศร์', 'condo', 1, NOW(), NOW()),
(27, 'PROJ027', 'เฟล็กซี่ สาทร - เจริญนคร ', 'condo', 1, NOW(), NOW()),
(28, 'PROJ028', 'เสนา อีโค ทาวน์ รังสิต สเตชั่น', 'condo', 1, NOW(), NOW()),
(29, 'PROJ029', 'เดอะคิทท์ พลัส พหลโยธิน คูคต เฟส 2', 'condo', 1, NOW(), NOW()),
(30, 'PROJ030', 'เดอะคิทท์ รังสิต - ติวานนท์ เฟส 3 ', 'condo', 1, NOW(), NOW()),
(31, 'PROJ031', 'เจ คอนโด สาทร - กัลปพฤกษ์ ', 'condo', 1, NOW(), NOW()),
(32, 'PROJ032', 'เสนา พาร์ค วิลล์ รามอินทรา - วงแหวน ', 'home', 1, NOW(), NOW()),
(33, 'PROJ033', 'เสนา วิลล์ บรมราชชนนี - สาย 5', 'home', 1, NOW(), NOW()),
(34, 'PROJ034', 'เสนา วิลล์ ลำลูกกา - คลอง 6', 'home', 1, NOW(), NOW()),
(36, 'PROJ036', 'เสนา อเวนิว รัตนาธิเบศร์ - บางบัวทอง', 'townhome', 1, NOW(), NOW()),
(37, 'PROJ037', 'เสนา อเวนิว บางปะกง - บ้านโพธิ์', 'shophouse', 1, NOW(), NOW()),
(38, 'PROJ038', 'เสนา วิลเลจ รังสิต - ติวานนท์', 'home', 1, NOW(), NOW()),
(39, 'PROJ039', 'เฟล็กซี่ เตาปูน - อินเตอร์เชนจ์', 'condo', 1, NOW(), NOW()),
(40, 'PROJ040', 'เฟล็กซี่ สุขสวัสดิ์', 'condo', 1, NOW(), NOW()),
(41, 'PROJ041', 'เสนา วีว่า ศรีราชา - อัสสัมชัญ', 'townhome', 1, NOW(), NOW()),
(42, 'PROJ042', 'เสนาคิทท์ รัตนาธิเบศร์-บางบัวทอง', 'condo', 0, NOW(), NOW()),
(43, 'PROJ043', 'เสนาคิทท์ ฉลองกรุง - ลาดกระบัง', 'condo', 1, NOW(), NOW()),
(44, 'PROJ044', 'เสนาคิทท์ รัตนาธิเบศร์-บางบัวทอง', 'condo', 1, NOW(), NOW()),
(45, 'PROJ045', 'เสนาคิทท์ ศรีนครินทร์-ศรีด่าน', 'condo', 1, NOW(), NOW()),
(46, 'PROJ046', 'เสนาคิทท์ สำโรง อินเตอร์เชนจ์', 'condo', 1, NOW(), NOW()),
(47, 'PROJ047', 'เสนาคิทท์ รังสิต - ติวานนท์', 'condo', 1, NOW(), NOW()),
(48, 'PROJ048', 'เสนาคิทท์ สุขุมวิท - บางปู', 'condo', 1, NOW(), NOW()),
(49, 'PROJ049', 'เสนาคิทท์ เพชรเกษม 120', 'condo', 1, NOW(), NOW()),
(50, 'PROJ050', 'เสนาคิทท์ สาทร - กัลปพฤกษ์', 'condo', 1, NOW(), NOW()),
(51, 'PROJ051', 'ปีติ สุขุมวิท 101', 'condo', 1, NOW(), NOW()),
(52, 'PROJ052', 'เสนาคิทท์ พหลโยธิน - นวนคร', 'condo', 1, NOW(), NOW()),
(53, 'PROJ053', 'เสนาคิทท์ บีช ฟรอนท์', 'condo', 1, NOW(), NOW()),
(54, 'PROJ054', 'เสนาคิทท์ บางนา กม.29 เฟส 2', 'condo', 1, NOW(), NOW()),
(55, 'PROJ055', 'เสนา วีว่า ฉลองกรุง - ลาดกระบัง', 'townhome', 1, NOW(), NOW()),
(56, 'PROJ056', 'นิช ไพรด์ เอกมัย', 'condo', 1, NOW(), NOW()),
(57, 'PROJ057', 'เฟล็กซี่ เมกะ สเปซ บางนา', 'condo', 1, NOW(), NOW()),
(58, 'PROJ058', 'เฟล็กซี่ ริเวอร์วิว - เจริญนคร', 'condo', 1, NOW(), NOW()),
(59, 'PROJ059', 'นิช โมโน บางโพ', 'condo', 1, NOW(), NOW()),
(60, 'PROJ060', 'โคซี่ บีทีเอส สะพานใหม่', 'condo', 1, NOW(), NOW()),
(61, 'PROJ061', 'โคซี่ เอ็มอาร์ที เพชรเกษม 48', 'condo', 1, NOW(), NOW()),
(62, 'PROJ062', 'โคซี่ รามฯ 189 สเตชั่น', 'condo', 1, NOW(), NOW()),
(63, 'PROJ063', 'เสนา ช็อปเฮ้าส์ สุขุมวิท -แพรกษา', 'shophouse', 1, NOW(), NOW()),
(64, 'PROJ064', 'เสนา อเวนิว บางกะดี - ติวานนท์', 'commercial', 1, NOW(), NOW()),
(65, 'PROJ065', 'เสนา อเวนิว บางปะกง - บ้านโพธิ์', 'commercial', 0, NOW(), NOW()),
(66, 'PROJ066', 'เสนา อเวนิว 1 รังสิต - คลอง 1', 'commercial', 1, NOW(), NOW()),
(67, 'PROJ067', 'เสนา วิลเลจ บางนา - กม.29', 'home', 1, NOW(), NOW()),
(68, 'PROJ068', 'เสนา วิลเลจ รามอินทรา กม.9', 'home', 1, NOW(), NOW()),
(69, 'PROJ069', 'เสนา วิลเลจ สุขุมวิท - แพรกษา', 'home', 1, NOW(), NOW()),
(70, 'PROJ070', 'เสนาคิทท์ เอ็มอาร์ที บางแค เฟส2', 'condo', 1, NOW(), NOW()),
(71, 'PROJ071', 'เสนา วิลเลจ บางปะกง - บ้านโพธิ์', 'home', 1, NOW(), NOW()),
(72, 'PROJ072', 'เสนา เวล่า เทพารักษ์ - บางบ่อ', 'townhome', 1, NOW(), NOW()),
(73, 'PROJ073', 'เสนา วีว่า เทพารักษ์ - บางบ่อ', 'townhome', 1, NOW(), NOW()),
(74, 'PROJ074', 'เสนา เวล่า สุขุมวิท - บางปู', 'townhome', 1, NOW(), NOW()),
(75, 'PROJ075', 'เสนา เวล่า สิริโสธร', 'townhome', 1, NOW(), NOW()),
(76, 'PROJ076', 'เจ ทาวน์ เอ็กคลูซีพ บางปะกง - บ้านโพธิ์', 'townhome', 1, NOW(), NOW()),
(77, 'PROJ077', 'เสนา ช็อปเฮ้าส์ ลำลูกกา - คลอง 6', 'shophouse', 1, NOW(), NOW()),
(78, 'PROJ078', 'เสนา เวล่า วงแหวน - บางบัวทอง', 'townhome', 1, NOW(), NOW()),
(79, 'PROJ079', 'เสนา เวล่า รัตนาธิเบศร์ - บางบัวทอง', 'townhome', 1, NOW(), NOW()),
(80, 'PROJ080', 'เสนาคิทท์ เทพารักษ์ - บางบ่อ 2', 'condo', 1, NOW(), NOW()),
(81, 'PROJ081', 'เสนา เวล่า รังสิต - คลอง 1', 'townhome', 1, NOW(), NOW()),
(82, 'PROJ082', 'เสนาคิทท์ รังสิต - คลอง 4', 'condo', 1, NOW(), NOW()),
(83, 'PROJ083', 'โคซี่ รามอินทรา - คู้บอน', 'condo', 1, NOW(), NOW()),
(84, 'PROJ084', 'เสนาคิทท์ เวสต์เกต-บางบัวทอง', 'condo', 1, NOW(), NOW()),
(85, 'PROJ085', 'โคซี่ ตากสิน - จอมทอง', 'condo', 1, NOW(), NOW());

-- Step 5: ตรวจสอบผลลัพธ์
SELECT 
    'Total projects' as item,
    COUNT(*) as count
FROM projects
UNION ALL
SELECT 'With project_code', COUNT(*) FROM projects WHERE project_code IS NOT NULL
UNION ALL
SELECT 'Active', COUNT(*) FROM projects WHERE is_active = 1
UNION ALL
SELECT 'Inactive', COUNT(*) FROM projects WHERE is_active = 0;

-- Step 6: แสดงตัวอย่าง
SELECT id, project_code, project_name, project_type, is_active
FROM projects
ORDER BY id
LIMIT 15;
