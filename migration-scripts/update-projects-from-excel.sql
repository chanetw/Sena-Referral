-- ============================================
-- Migration: Update projects from tbl_project_final.xlsx
-- Date: 2025-12-04
-- Description: อัปเดต project_code และตรวจสอบ project_name, project_type
-- ============================================

USE sena_referral;

-- Step 1: สำรองข้อมูลก่อนอัปเดต
CREATE TABLE IF NOT EXISTS projects_backup_20251204 AS SELECT * FROM projects;

-- Step 2: อัปเดต projects จาก Excel

UPDATE projects 
SET 
    project_code = 'PROJ001',
    project_name = 'นิช ไอดี แอท ปากเกร็ด สเตชั่น',
    project_type = 'condo',
    is_active = 1
WHERE id = 1;

UPDATE projects 
SET 
    project_code = 'PROJ002',
    project_name = 'นิช ไอดี เพชรเกษม - บางแค',
    project_type = 'condo',
    is_active = 0
WHERE id = 2;

UPDATE projects 
SET 
    project_code = 'PROJ003',
    project_name = 'นิช ไอดี พระราม 2 - ดาวคะนอง',
    project_type = 'condo',
    is_active = 0
WHERE id = 3;

UPDATE projects 
SET 
    project_code = 'PROJ004',
    project_name = 'นิช ไอดี เสรีไทย - วงแหวน',
    project_type = 'condo',
    is_active = 0
WHERE id = 4;

UPDATE projects 
SET 
    project_code = 'PROJ005',
    project_name = 'นิช ไพรด์ เตาปูน - อินเตอร์เชนจ์',
    project_type = 'condo',
    is_active = 1
WHERE id = 5;

UPDATE projects 
SET 
    project_code = 'PROJ006',
    project_name = 'พัทยา คันทรี คลับ โฮม แอนด์ เรสซิเดนซ์',
    project_type = 'home',
    is_active = 0
WHERE id = 6;

UPDATE projects 
SET 
    project_code = 'PROJ007',
    project_name = 'เสนาพาร์ค แกรนด์ รามอินทรา - วงแหวน',
    project_type = 'home',
    is_active = 1
WHERE id = 7;

UPDATE projects 
SET 
    project_code = 'PROJ008',
    project_name = 'เสนา แกรนด์โฮม รามอินทรา กม.8',
    project_type = 'home',
    is_active = 0
WHERE id = 8;

UPDATE projects 
SET 
    project_code = 'PROJ009',
    project_name = 'นิช โมโน รัชวิภา',
    project_type = 'condo',
    is_active = 0
WHERE id = 9;

UPDATE projects 
SET 
    project_code = 'PROJ010',
    project_name = 'นิช โมโน สุขุมวิท - แบริ่ง',
    project_type = 'condo',
    is_active = 1
WHERE id = 10;

UPDATE projects 
SET 
    project_code = 'PROJ011',
    project_name = 'นิช โมโน สุขุมวิท - ปู่เจ้า',
    project_type = 'condo',
    is_active = 1
WHERE id = 11;

UPDATE projects 
SET 
    project_code = 'PROJ012',
    project_name = 'นิช ไพรด์ ทองหล่อ-เพชรบุรี',
    project_type = 'condo',
    is_active = 0
WHERE id = 12;

UPDATE projects 
SET 
    project_code = 'PROJ013',
    project_name = 'เดอะคิทท์ พลัส พหลโยธิน-คูคต',
    project_type = 'condo',
    is_active = 0
WHERE id = 13;

UPDATE projects 
SET 
    project_code = 'PROJ015',
    project_name = 'เสนา แกรนด์โฮม รังสิต-ติวานนท์',
    project_type = 'home',
    is_active = 1
WHERE id = 15;

UPDATE projects 
SET 
    project_code = 'PROJ016',
    project_name = 'เสนาทาวน์ รามอินทรา',
    project_type = 'townhome',
    is_active = 0
WHERE id = 16;

UPDATE projects 
SET 
    project_code = 'PROJ017',
    project_name = 'เสนาทาวน์ นวมินทร์',
    project_type = 'townhome',
    is_active = 0
WHERE id = 17;

UPDATE projects 
SET 
    project_code = 'PROJ018',
    project_name = 'เสนา วีว่า เพชรเกษม - พุทธมณฑล สาย 7',
    project_type = 'townhome',
    is_active = 1
WHERE id = 18;

UPDATE projects 
SET 
    project_code = 'PROJ019',
    project_name = 'นิช โมโน เจริญนคร',
    project_type = 'condo',
    is_active = 1
WHERE id = 19;

UPDATE projects 
SET 
    project_code = 'PROJ020',
    project_name = 'นิช โมโน แจ้งวัฒนะ',
    project_type = 'condo',
    is_active = 1
WHERE id = 20;

UPDATE projects 
SET 
    project_code = 'PROJ021',
    project_name = 'นิช โมโน พระราม 9',
    project_type = 'condo',
    is_active = 1
WHERE id = 21;

UPDATE projects 
SET 
    project_code = 'PROJ022',
    project_name = 'นิช โมโน เมกะ สเปซ บางนา',
    project_type = 'condo',
    is_active = 1
WHERE id = 22;

UPDATE projects 
SET 
    project_code = 'PROJ023',
    project_name = 'นิช โมโน รามคำแหง',
    project_type = 'condo',
    is_active = 1
WHERE id = 23;

UPDATE projects 
SET 
    project_code = 'PROJ024',
    project_name = 'นิช โมโน อิสรภาพ',
    project_type = 'condo',
    is_active = 0
WHERE id = 24;

UPDATE projects 
SET 
    project_code = 'PROJ025',
    project_name = 'นิช ไอดี พระราม 2',
    project_type = 'condo',
    is_active = 0
WHERE id = 25;

UPDATE projects 
SET 
    project_code = 'PROJ026',
    project_name = 'เฟล็กซี่ รัตนาธิเบศร์',
    project_type = 'condo',
    is_active = 1
WHERE id = 26;

UPDATE projects 
SET 
    project_code = 'PROJ027',
    project_name = 'เฟล็กซี่ สาทร - เจริญนคร ',
    project_type = 'condo',
    is_active = 1
WHERE id = 27;

UPDATE projects 
SET 
    project_code = 'PROJ028',
    project_name = 'เสนา อีโค ทาวน์ รังสิต สเตชั่น',
    project_type = 'condo',
    is_active = 1
WHERE id = 28;

UPDATE projects 
SET 
    project_code = 'PROJ029',
    project_name = 'เดอะคิทท์ พลัส พหลโยธิน คูคต เฟส 2',
    project_type = 'condo',
    is_active = 1
WHERE id = 29;

UPDATE projects 
SET 
    project_code = 'PROJ030',
    project_name = 'เดอะคิทท์ รังสิต - ติวานนท์ เฟส 3 ',
    project_type = 'condo',
    is_active = 1
WHERE id = 30;

UPDATE projects 
SET 
    project_code = 'PROJ031',
    project_name = 'เจ คอนโด สาทร - กัลปพฤกษ์ ',
    project_type = 'condo',
    is_active = 1
WHERE id = 31;

UPDATE projects 
SET 
    project_code = 'PROJ032',
    project_name = 'เสนา พาร์ค วิลล์ รามอินทรา - วงแหวน ',
    project_type = 'home',
    is_active = 1
WHERE id = 32;

UPDATE projects 
SET 
    project_code = 'PROJ033',
    project_name = 'เสนา วิลล์ บรมราชชนนี - สาย 5',
    project_type = 'home',
    is_active = 1
WHERE id = 33;

UPDATE projects 
SET 
    project_code = 'PROJ034',
    project_name = 'เสนา วิลล์ ลำลูกกา - คลอง 6',
    project_type = 'home',
    is_active = 1
WHERE id = 34;

UPDATE projects 
SET 
    project_code = 'PROJ036',
    project_name = 'เสนา อเวนิว รัตนาธิเบศร์ - บางบัวทอง',
    project_type = 'townhome',
    is_active = 1
WHERE id = 36;

UPDATE projects 
SET 
    project_code = 'PROJ037',
    project_name = 'เสนา อเวนิว บางปะกง - บ้านโพธิ์',
    project_type = 'shophouse',
    is_active = 1
WHERE id = 37;

UPDATE projects 
SET 
    project_code = 'PROJ038',
    project_name = 'เสนา วิลเลจ รังสิต - ติวานนท์',
    project_type = 'home',
    is_active = 1
WHERE id = 38;

UPDATE projects 
SET 
    project_code = 'PROJ039',
    project_name = 'เฟล็กซี่ เตาปูน - อินเตอร์เชนจ์',
    project_type = 'condo',
    is_active = 1
WHERE id = 39;

UPDATE projects 
SET 
    project_code = 'PROJ040',
    project_name = 'เฟล็กซี่ สุขสวัสดิ์',
    project_type = 'condo',
    is_active = 1
WHERE id = 40;

UPDATE projects 
SET 
    project_code = 'PROJ041',
    project_name = 'เสนา วีว่า ศรีราชา - อัสสัมชัญ',
    project_type = 'townhome',
    is_active = 1
WHERE id = 41;

UPDATE projects 
SET 
    project_code = 'PROJ042',
    project_name = 'เสนาคิทท์ รัตนาธิเบศร์-บางบัวทอง',
    project_type = 'condo',
    is_active = 0
WHERE id = 42;

UPDATE projects 
SET 
    project_code = 'PROJ043',
    project_name = 'เสนาคิทท์ ฉลองกรุง - ลาดกระบัง',
    project_type = 'condo',
    is_active = 1
WHERE id = 43;

UPDATE projects 
SET 
    project_code = 'PROJ044',
    project_name = 'เสนาคิทท์ รัตนาธิเบศร์-บางบัวทอง',
    project_type = 'condo',
    is_active = 1
WHERE id = 44;

UPDATE projects 
SET 
    project_code = 'PROJ045',
    project_name = 'เสนาคิทท์ ศรีนครินทร์-ศรีด่าน',
    project_type = 'condo',
    is_active = 1
WHERE id = 45;

UPDATE projects 
SET 
    project_code = 'PROJ046',
    project_name = 'เสนาคิทท์ สำโรง อินเตอร์เชนจ์',
    project_type = 'condo',
    is_active = 1
WHERE id = 46;

UPDATE projects 
SET 
    project_code = 'PROJ047',
    project_name = 'เสนาคิทท์ รังสิต - ติวานนท์',
    project_type = 'condo',
    is_active = 1
WHERE id = 47;

UPDATE projects 
SET 
    project_code = 'PROJ048',
    project_name = 'เสนาคิทท์ สุขุมวิท - บางปู',
    project_type = 'condo',
    is_active = 1
WHERE id = 48;

UPDATE projects 
SET 
    project_code = 'PROJ049',
    project_name = 'เสนาคิทท์ เพชรเกษม 120',
    project_type = 'condo',
    is_active = 1
WHERE id = 49;

UPDATE projects 
SET 
    project_code = 'PROJ050',
    project_name = 'เสนาคิทท์ สาทร - กัลปพฤกษ์',
    project_type = 'condo',
    is_active = 1
WHERE id = 50;

UPDATE projects 
SET 
    project_code = 'PROJ051',
    project_name = 'ปีติ สุขุมวิท 101',
    project_type = 'condo',
    is_active = 1
WHERE id = 51;

UPDATE projects 
SET 
    project_code = 'PROJ052',
    project_name = 'เสนาคิทท์ พหลโยธิน - นวนคร',
    project_type = 'condo',
    is_active = 1
WHERE id = 52;

UPDATE projects 
SET 
    project_code = 'PROJ053',
    project_name = 'เสนาคิทท์ บีช ฟรอนท์',
    project_type = 'condo',
    is_active = 1
WHERE id = 53;

UPDATE projects 
SET 
    project_code = 'PROJ054',
    project_name = 'เสนาคิทท์ บางนา กม.29 เฟส 2',
    project_type = 'condo',
    is_active = 1
WHERE id = 54;

UPDATE projects 
SET 
    project_code = 'PROJ055',
    project_name = 'เสนา วีว่า ฉลองกรุง - ลาดกระบัง',
    project_type = 'townhome',
    is_active = 1
WHERE id = 55;

UPDATE projects 
SET 
    project_code = 'PROJ056',
    project_name = 'นิช ไพรด์ เอกมัย',
    project_type = 'condo',
    is_active = 1
WHERE id = 56;

UPDATE projects 
SET 
    project_code = 'PROJ057',
    project_name = 'เฟล็กซี่ เมกะ สเปซ บางนา',
    project_type = 'condo',
    is_active = 1
WHERE id = 57;

UPDATE projects 
SET 
    project_code = 'PROJ058',
    project_name = 'เฟล็กซี่ ริเวอร์วิว - เจริญนคร',
    project_type = 'condo',
    is_active = 1
WHERE id = 58;

UPDATE projects 
SET 
    project_code = 'PROJ059',
    project_name = 'นิช โมโน บางโพ',
    project_type = 'condo',
    is_active = 1
WHERE id = 59;

UPDATE projects 
SET 
    project_code = 'PROJ060',
    project_name = 'โคซี่ บีทีเอส สะพานใหม่',
    project_type = 'condo',
    is_active = 1
WHERE id = 60;

UPDATE projects 
SET 
    project_code = 'PROJ061',
    project_name = 'โคซี่ เอ็มอาร์ที เพชรเกษม 48',
    project_type = 'condo',
    is_active = 1
WHERE id = 61;

UPDATE projects 
SET 
    project_code = 'PROJ062',
    project_name = 'โคซี่ รามฯ 189 สเตชั่น',
    project_type = 'condo',
    is_active = 1
WHERE id = 62;

UPDATE projects 
SET 
    project_code = 'PROJ063',
    project_name = 'เสนา ช็อปเฮ้าส์ สุขุมวิท -แพรกษา',
    project_type = 'shophouse',
    is_active = 1
WHERE id = 63;

UPDATE projects 
SET 
    project_code = 'PROJ064',
    project_name = 'เสนา อเวนิว บางกะดี - ติวานนท์',
    project_type = 'commercial',
    is_active = 1
WHERE id = 64;

UPDATE projects 
SET 
    project_code = 'PROJ065',
    project_name = 'เสนา อเวนิว บางปะกง - บ้านโพธิ์',
    project_type = 'commercial',
    is_active = 0
WHERE id = 65;

UPDATE projects 
SET 
    project_code = 'PROJ066',
    project_name = 'เสนา อเวนิว 1 รังสิต - คลอง 1',
    project_type = 'commercial',
    is_active = 1
WHERE id = 66;

UPDATE projects 
SET 
    project_code = 'PROJ067',
    project_name = 'เสนา วิลเลจ บางนา - กม.29',
    project_type = 'home',
    is_active = 1
WHERE id = 67;

UPDATE projects 
SET 
    project_code = 'PROJ068',
    project_name = 'เสนา วิลเลจ รามอินทรา กม.9',
    project_type = 'home',
    is_active = 1
WHERE id = 68;

UPDATE projects 
SET 
    project_code = 'PROJ069',
    project_name = 'เสนา วิลเลจ สุขุมวิท - แพรกษา',
    project_type = 'home',
    is_active = 1
WHERE id = 69;

UPDATE projects 
SET 
    project_code = 'PROJ070',
    project_name = 'เสนาคิทท์ เอ็มอาร์ที บางแค เฟส2',
    project_type = 'condo',
    is_active = 1
WHERE id = 70;

UPDATE projects 
SET 
    project_code = 'PROJ071',
    project_name = 'เสนา วิลเลจ บางปะกง - บ้านโพธิ์',
    project_type = 'home',
    is_active = 1
WHERE id = 71;

UPDATE projects 
SET 
    project_code = 'PROJ072',
    project_name = 'เสนา เวล่า เทพารักษ์ - บางบ่อ',
    project_type = 'townhome',
    is_active = 1
WHERE id = 72;

UPDATE projects 
SET 
    project_code = 'PROJ073',
    project_name = 'เสนา วีว่า เทพารักษ์ - บางบ่อ',
    project_type = 'townhome',
    is_active = 1
WHERE id = 73;

UPDATE projects 
SET 
    project_code = 'PROJ074',
    project_name = 'เสนา เวล่า สุขุมวิท - บางปู',
    project_type = 'townhome',
    is_active = 1
WHERE id = 74;

UPDATE projects 
SET 
    project_code = 'PROJ075',
    project_name = 'เสนา เวล่า สิริโสธร',
    project_type = 'townhome',
    is_active = 1
WHERE id = 75;

UPDATE projects 
SET 
    project_code = 'PROJ076',
    project_name = 'เจ ทาวน์ เอ็กคลูซีพ บางปะกง - บ้านโพธิ์',
    project_type = 'townhome',
    is_active = 1
WHERE id = 76;

UPDATE projects 
SET 
    project_code = 'PROJ077',
    project_name = 'เสนา ช็อปเฮ้าส์ ลำลูกกา - คลอง 6',
    project_type = 'shophouse',
    is_active = 1
WHERE id = 77;

UPDATE projects 
SET 
    project_code = 'PROJ078',
    project_name = 'เสนา เวล่า วงแหวน - บางบัวทอง',
    project_type = 'townhome',
    is_active = 1
WHERE id = 78;

UPDATE projects 
SET 
    project_code = 'PROJ079',
    project_name = 'เสนา เวล่า รัตนาธิเบศร์ - บางบัวทอง',
    project_type = 'townhome',
    is_active = 1
WHERE id = 79;

UPDATE projects 
SET 
    project_code = 'PROJ080',
    project_name = 'เสนาคิทท์ เทพารักษ์ - บางบ่อ 2',
    project_type = 'condo',
    is_active = 1
WHERE id = 80;

UPDATE projects 
SET 
    project_code = 'PROJ081',
    project_name = 'เสนา เวล่า รังสิต - คลอง 1',
    project_type = 'townhome',
    is_active = 1
WHERE id = 81;

UPDATE projects 
SET 
    project_code = 'PROJ082',
    project_name = 'เสนาคิทท์ รังสิต - คลอง 4',
    project_type = 'condo',
    is_active = 1
WHERE id = 82;

UPDATE projects 
SET 
    project_code = 'PROJ083',
    project_name = 'โคซี่ รามอินทรา - คู้บอน',
    project_type = 'condo',
    is_active = 1
WHERE id = 83;

UPDATE projects 
SET 
    project_code = 'PROJ084',
    project_name = 'เสนาคิทท์ เวสต์เกต-บางบัวทอง',
    project_type = 'condo',
    is_active = 1
WHERE id = 84;

UPDATE projects 
SET 
    project_code = 'PROJ085',
    project_name = 'โคซี่ ตากสิน - จอมทอง',
    project_type = 'condo',
    is_active = 1
WHERE id = 85;

-- Step 3: ตรวจสอบผลลัพธ์
SELECT 
    'Updated 83 projects' as status,
    COUNT(*) as total,
    COUNT(CASE WHEN project_code IS NOT NULL THEN 1 END) as with_code
FROM projects;

-- Step 4: แสดงตัวอย่างโครงการ
SELECT id, project_code, project_name, project_type, is_active
FROM projects
ORDER BY id
LIMIT 10;
