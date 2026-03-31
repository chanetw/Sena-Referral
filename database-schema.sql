-- ===============================================
-- Agent Referral System Database Schema
-- Tech Stack: React + Node.js + MySQL/PostgreSQL
-- ===============================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Users table สำหรับ Authentication
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'agent', 'manager') DEFAULT 'agent',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    bud VARCHAR(10),
    name VARCHAR(255)
);

-- Agent types table สำหรับประเภทเอเจนต์
CREATE TABLE agent_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    name_th VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Agents table สำหรับข้อมูลเอเจนต์
CREATE TABLE agents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    agent_type_id INT NOT NULL,
    agent_code VARCHAR(20) UNIQUE NOT NULL,
    ref_code VARCHAR(10) UNIQUE NULL,
    agent_id_card VARCHAR(13),
    id_card VARCHAR(13) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(15),
    address TEXT,
    registration_date DATE NOT NULL,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    email VARCHAR(100),
    duplicate_lead_id VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_type_id) REFERENCES agent_types(id)
);

-- Agent Type Details table สำหรับข้อมูลเพิ่มเติมตามประเภท agent
CREATE TABLE IF NOT EXISTS agent_type_details (
    id              INT            PRIMARY KEY AUTO_INCREMENT,
    agent_id        INT            NOT NULL UNIQUE,
    referral_code   VARCHAR(50)    DEFAULT NULL COMMENT 'รหัสแนะนำที่ผู้ใช้กรอกเอง',
    house_number    VARCHAR(50)    DEFAULT NULL COMMENT 'บ้านเลขที่',
    project_id      INT            DEFAULT NULL COMMENT 'FK → projects (โครงการที่อาศัย)',
    department      VARCHAR(100)   DEFAULT NULL COMMENT 'สังกัด / หน่วยงาน',
    division        VARCHAR(100)   DEFAULT NULL COMMENT 'แผนก',
    company_name    VARCHAR(100)   DEFAULT NULL COMMENT 'ชื่อบริษัท',
    occupation      VARCHAR(100)   DEFAULT NULL COMMENT 'อาชีพ',
    know_sena_from  VARCHAR(50)    DEFAULT NULL COMMENT 'รู้จักเสนาจากช่องทางใด',
    created_at      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_atd_agent   FOREIGN KEY (agent_id)   REFERENCES agents(id)   ON DELETE CASCADE,
    CONSTRAINT fk_atd_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- Projects table สำหรับโครงการ
CREATE TABLE projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_code VARCHAR(20) UNIQUE NOT NULL,
    project_name VARCHAR(100) NOT NULL,
    project_type ENUM('condo', 'house', 'townhome', 'commercial') NOT NULL,
    location VARCHAR(255),
    price_range_min DECIMAL(15,2),
    price_range_max DECIMAL(15,2),
    sales_team VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    project_sale VARCHAR(100),
    bud INT
);

CREATE TABLE product_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Customers table สำหรับข้อมูลลูกค้า
CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    agent_id INT NOT NULL,
    customer_code VARCHAR(20) UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(15),
    id_card VARCHAR(13),
    email VARCHAR(100),
    project_id INT,
    budget_min DECIMAL(15,2),
    budget_max DECIMAL(15,2),
    status ENUM('pending', 'duplicate', 'approved') DEFAULT 'pending',
    referral_type ENUM('self', 'friend'),
    source ENUM('referral', 'walk_in', 'online', 'phone', 'other') DEFAULT 'referral',
    notes TEXT,
    is_duplicate BOOLEAN DEFAULT false,
    duplicate_customer_id INT,
    sena_approved BOOLEAN DEFAULT false,
    approved_by INT,
    approved_at TIMESTAMP NULL,
    created_by INT,
    registration_date DATE,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents(id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (duplicate_customer_id) REFERENCES customers(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE TABLE customer_product_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    product_type_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_customer_product_type (customer_id, product_type_id),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (product_type_id) REFERENCES product_types(id) ON DELETE CASCADE
);

CREATE TABLE notification_rules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    action_type ENUM('customer_created', 'agent_registered') NOT NULL,
    recipient_emails TEXT NOT NULL COMMENT 'JSON array ของอีเมลผู้รับ',
    is_active BOOLEAN DEFAULT true,
    created_by INT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Visits table สำหรับข้อมูลการนัดหมายชมโครงการ
CREATE TABLE visits (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    visit_date DATE NOT NULL,
    visit_time TIME,
    status ENUM('scheduled', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Sales table สำหรับข้อมูลการขาย
CREATE TABLE sales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    unit_number VARCHAR(20),
    sale_price DECIMAL(15,2) NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 3.00,
    commission_amount DECIMAL(15,2),
    contract_date DATE,
    transfer_date DATE,
    status ENUM('reserved', 'contracted', 'transferred', 'cancelled') DEFAULT 'reserved',
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Leads table สำหรับข้อมูล Lead ที่ยังไม่ได้เป็นลูกค้า
CREATE TABLE leads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(15),
    email VARCHAR(100),
    source ENUM('website', 'facebook', 'google', 'referral', 'walk_in', 'other') DEFAULT 'other',
    interest_project_id INT,
    budget_range VARCHAR(50),
    status ENUM('new', 'contacted', 'qualified', 'converted', 'lost') DEFAULT 'new',
    notes TEXT,
    assigned_to INT,
    converted_customer_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (interest_project_id) REFERENCES projects(id),
    FOREIGN KEY (assigned_to) REFERENCES agents(id),
    FOREIGN KEY (converted_customer_id) REFERENCES customers(id)
);

-- Requests table สำหรับคำร้องต่างๆ
CREATE TABLE requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    request_type ENUM('commission', 'transfer', 'cancellation', 'other') NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('pending', 'in_review', 'approved', 'rejected') DEFAULT 'pending',
    approved_by INT,
    approved_at TIMESTAMP NULL,
    rejection_reason TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Activity logs table สำหรับ audit trail
CREATE TABLE activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id INT NOT NULL,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ===============================================
-- Create Indexes for Performance
-- ===============================================
CREATE INDEX idx_agents_agent_code ON agents(agent_code);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_customers_agent_id ON customers(agent_id);
CREATE INDEX idx_customers_project_id ON customers(project_id);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_created_at ON customers(created_at);
CREATE INDEX idx_visits_customer_id ON visits(customer_id);
CREATE INDEX idx_visits_visit_date ON visits(visit_date);
CREATE INDEX idx_sales_customer_id ON sales(customer_id);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_requests_customer_id ON requests(customer_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_table_record ON activity_logs(table_name, record_id);
CREATE INDEX idx_notification_rules_action ON notification_rules(action_type);
CREATE INDEX idx_notification_rules_active ON notification_rules(is_active);

-- ===============================================
-- Sample Data
-- ===============================================

-- Insert sample users
INSERT INTO users (email, password, role) VALUES 
('admin@sena.co.th', '$2b$10$hashedpassword', 'admin'),
('agent001@sena.co.th', '$2b$10$hashedpassword', 'agent'),
('manager@sena.co.th', '$2b$10$hashedpassword', 'manager');

-- Insert agent types
INSERT INTO agent_types (id, code, name_th, is_active, sort_order) VALUES
(1, 'resident', 'ลูกบ้าน', true, 1),
(2, 'livnex_customer', 'ลูกค้า LIvnex', true, 2),
(3, 'rentnex_customer', 'ลูกค้า Rentnex', true, 3),
(4, 'sena_staff', 'พนักงานบริษัทเสนาฯ และบริษัทในเครือ', true, 4),
(5, 'partner', 'พันธมิตร คู่ค้า', true, 5),
(6, 'general', 'บุคคลทั่วไป', true, 6);

-- Insert sample projects
INSERT INTO projects (project_code, project_name, project_type, location, price_range_min, price_range_max, sales_team) VALUES
('PROJ001', 'The Reserve Phahol-Pradipat', 'condo', 'Phahol-Pradipat, Bangkok', 3500000.00, 8500000.00, 'Team A'),
('PROJ002', 'Baan Sena Ville', 'house', 'Rangsit, Pathum Thani', 4500000.00, 12000000.00, 'Team B'),
('PROJ003', 'Town Plus Ramkhamhaeng', 'townhome', 'Ramkhamhaeng, Bangkok', 2800000.00, 4200000.00, 'Team C');