-- ===============================================
-- SENA Referral System - Database Initialization
-- ===============================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Create additional sample data for testing
INSERT INTO users (email, password, role, is_active) VALUES
('admin@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', true),
('agent1@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'agent', true),
('agent2@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'agent', true),
('manager@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager', true);

INSERT INTO agent_types (id, code, name_th, is_active, sort_order) VALUES
(1, 'resident', 'ลูกบ้าน', true, 1),
(2, 'livnex_customer', 'ลูกค้า LIvnex', true, 2),
(3, 'rentnex_customer', 'ลูกค้า Rentnex', true, 3),
(4, 'sena_staff', 'พนักงานบริษัทเสนาฯ และบริษัทในเครือ', true, 4),
(5, 'partner', 'พันธมิตร คู่ค้า', true, 5),
(6, 'general', 'บุคคลทั่วไป', true, 6)
ON DUPLICATE KEY UPDATE
name_th = VALUES(name_th),
is_active = VALUES(is_active),
sort_order = VALUES(sort_order);

-- Insert sample agents
INSERT INTO agents (user_id, agent_type_id, agent_code, agent_id_card, id_card, first_name, last_name, phone, address, registration_date, status, email, duplicate_lead_id, created_at) VALUES
(2, 6, 'AG001', '1234567890123', '1234567890123', 'สมชาย', 'ใจดี', '0801234567', '123 ถนนสุขุมวิท กรุงเทพฯ', '2024-01-01', 'active', 'agent1@test.com', NULL, NOW()),
(3, 6, 'AG002', '2345678901234', '2345678901234', 'สมหญิง', 'รักงาน', '0812345678', '456 ถนนพหลโยธิน กรุงเทพฯ', '2024-01-15', 'active', 'agent2@test.com', NULL, NOW()),
(4, 6, 'AG003', '3456789012345', '3456789012345', 'วิชัย', 'ขยันขันแข็ง', '0823456789', '789 ถนนรัชดาภิเษก กรุงเทพฯ', '2024-02-01', 'inactive', 'manager@test.com', NULL, NOW());

-- Insert sample projects (เพิ่มเติมจากที่มีอยู่)
INSERT INTO projects (project_code, project_name, project_type, location, price_range_min, price_range_max, sales_team, is_active) VALUES
('PROJ004', 'Sena Park Grand', 'condo', 'Lat Phrao, Bangkok', 2900000.00, 6500000.00, 'Team A', true),
('PROJ005', 'The Privacy Raminthra', 'house', 'Raminthra, Bangkok', 5500000.00, 15000000.00, 'Team B', true),
('PROJ006', 'Town Avenue Sukhumvit', 'townhome', 'Sukhumvit, Bangkok', 3200000.00, 5800000.00, 'Team C', true);

-- Insert sample customers
INSERT INTO customers (agent_id, first_name, last_name, phone, id_card, email, project_id, budget_min, budget_max, status, source, notes, created_by, created_at) VALUES
(1, 'จิรายุ', 'มั่งมี', '0901234567', '1111111111111', 'jirayu@email.com', 1, 3000000.00, 5000000.00, 'new', 'referral', 'ลูกค้าสนใจคอนโด วิวดี', 2, NOW()),
(1, 'นันทนา', 'สวยงาม', '0912345678', '2222222222222', 'nantana@email.com', 2, 6000000.00, 10000000.00, 'contacted', 'walk_in', 'สนใจบ้านเดี่ยว มีสวน', 2, NOW()),
(2, 'ธนากร', 'รวยเร็ว', '0923456789', '3333333333333', 'thanakorn@email.com', 3, 2500000.00, 4000000.00, 'interested', 'online', 'หาทาวน์โฮม ใกล้ BTS', 3, NOW()),
(2, 'อารียา', 'ปราดเปรื่อง', '0934567890', '4444444444444', 'ariya@email.com', 1, 4000000.00, 7000000.00, 'visit_scheduled', 'referral', 'นัดชมห้องตัวอย่าง วันเสาร์', 3, NOW()),
(1, 'ศิริพร', 'เก่งกาจ', '0945678901', '5555555555555', 'siriporn@email.com', 4, 3500000.00, 6000000.00, 'visited', 'phone', 'ชมแล้ว พอใจมาก', 2, NOW());

-- Insert sample visits
INSERT INTO visits (customer_id, visit_date, visit_time, status, notes, created_by, created_at) VALUES
(4, '2024-09-21', '14:00:00', 'scheduled', 'นัดชมห้องตัวอย่าง วันเสาร์', 3, NOW()),
(5, '2024-09-18', '10:30:00', 'completed', 'ชมห้องตัวอย่างเรียบร้อย ลูกค้าประทับใจ', 2, NOW());

-- Insert sample leads
INSERT INTO leads (first_name, last_name, phone, email, source, interest_project_id, budget_range, status, notes, assigned_to, created_at) VALUES
('มานิต', 'ใฝ่หา', '0956789012', 'manit@email.com', 'website', 1, '3-5 ล้าน', 'new', 'สนใจคอนโด กรอกข้อมูลจากเว็บ', 1, NOW()),
('ปิยะดา', 'มีฝัน', '0967890123', 'piyada@email.com', 'facebook', 2, '8-12 ล้าน', 'contacted', 'ติดต่อผ่าน Facebook', 2, NOW());

-- Set session variable for trigger (example usage)
SET @current_user_id = 1;

-- Update customers table ให้ครบ required fields สำหรับ triggers
UPDATE customers SET updated_by = created_by WHERE updated_by IS NULL;

-- ===============================================
-- Sample Queries for Testing
-- ===============================================

-- Test query: ดูข้อมูลลูกค้าพร้อมชื่อเอเจนต์และโครงการ
-- SELECT
--     c.id,
--     CONCAT(c.first_name, ' ', c.last_name) as customer_name,
--     c.phone,
--     c.status,
--     CONCAT(a.first_name, ' ', a.last_name) as agent_name,
--     p.project_name,
--     c.budget_min,
--     c.budget_max,
--     c.created_at
-- FROM customers c
-- LEFT JOIN agents a ON c.agent_id = a.id
-- LEFT JOIN projects p ON c.project_id = p.id
-- ORDER BY c.created_at DESC;