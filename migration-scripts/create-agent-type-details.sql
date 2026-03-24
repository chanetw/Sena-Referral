-- Migration: Create agent_type_details table
-- สร้างตาราง agent_type_details สำหรับเก็บข้อมูลเฉพาะประเภท agent
-- รันบน database ที่มีอยู่แล้ว:
--   docker exec -i sena_mysql mysql -usena_user -psena_password sena_referral < migration-scripts/create-agent-type-details.sql

CREATE TABLE IF NOT EXISTS agent_type_details (
    id              INT            PRIMARY KEY AUTO_INCREMENT,
    agent_id        INT            NOT NULL UNIQUE,

    -- ทุกประเภท
    referral_code   VARCHAR(50)    DEFAULT NULL COMMENT 'รหัสแนะนำที่ผู้ใช้กรอกเอง',

    -- ลูกบ้าน / ลูกค้า Livnex / ลูกค้า Rentnex
    house_number    VARCHAR(50)    DEFAULT NULL COMMENT 'บ้านเลขที่',
    project_id      INT            DEFAULT NULL COMMENT 'FK → projects (โครงการที่อาศัย)',

    -- พนักงานบริษัทเสนาฯ และบริษัทในเครือ
    department      VARCHAR(100)   DEFAULT NULL COMMENT 'สังกัด / หน่วยงาน',
    division        VARCHAR(100)   DEFAULT NULL COMMENT 'แผนก',

    -- พันธมิตร คู่ค้า
    company_name    VARCHAR(100)   DEFAULT NULL COMMENT 'ชื่อบริษัท',

    -- บุคคลทั่วไป
    occupation      VARCHAR(100)   DEFAULT NULL COMMENT 'อาชีพ',
    know_sena_from  VARCHAR(50)    DEFAULT NULL COMMENT 'รู้จักเสนาจากช่องทางใด (Facebook/Youtube/Website/Line โครงการ/ป้ายบอกทาง/เพื่อนแนะนำ)',

    created_at      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_atd_agent
        FOREIGN KEY (agent_id)  REFERENCES agents(id)   ON DELETE CASCADE,
    CONSTRAINT fk_atd_project
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);
