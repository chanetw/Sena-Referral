# SENA Agent Referral System

ระบบจัดการเอเจนต์และลูกค้าสำหรับธุรกิจอสังหาริมทรัพย์ โดยเน้นการทำงานแบบครบวงจรทั้งฝั่ง Admin และ Agent พร้อม Dashboard, Project Management, Email Notification และ Activity Logging

## Overview

SENA Agent Referral System เป็นระบบที่ช่วยบริหารงานแนะนำลูกค้า (Referral) ตั้งแต่การลงทะเบียนเอเจนต์ การจัดการข้อมูลลูกค้า ไปจนถึงติดตามผลผ่านหน้าแดชบอร์ดแบบเรียลไทม์

จุดเด่นของระบบ:

- แยกสิทธิ์การใช้งานตามบทบาท Admin/Agent
- จัดการข้อมูล Agent, Customer, Project แบบ CRUD
- รองรับสถานะลูกค้าแบบย่อ 3 สถานะ: active, inactive, pending
- มีหน้า Dashboard พร้อมกราฟสถิติ (Recharts)
- มีระบบส่งอีเมลตามเงื่อนไขธุรกิจ
- มี Activity Logging และฐานข้อมูล MySQL ผ่าน Docker

## Main Features

### 1) Authentication & Authorization

- Login/Logout ด้วย JWT
- Protected routes ตามสิทธิ์ผู้ใช้งาน
- Data filtering ตาม role และ owner

### 2) Agent Management

- เพิ่ม แก้ไข ลบ เอเจนต์
- ระบบอนุมัติ/ปฏิเสธเอเจนต์
- รหัสเอเจนต์ auto-increment ผ่าน API

### 3) Customer Management

- จัดการข้อมูลลูกค้าแบบครบถ้วน
- เชื่อมโยงกับเอเจนต์และโครงการ
- แสดงข้อมูลสำคัญ เช่น งบประมาณ, วันที่ลงทะเบียน, สถานะ

### 4) Project Management

- จัดการโครงการจากฐานข้อมูลจริง
- รองรับ project code, project type, price range
- validation ฝั่งฟอร์มและ backend

### 5) Dashboard & Charts

- Bar, Pie, Line, Area charts
- มุมมองภาพรวมสำหรับผู้ดูแลระบบ
- มุมมองสถิติส่วนตัวสำหรับเอเจนต์

### 6) Email Service

- รองรับการส่งด้วย template
- มี test mode สำหรับความปลอดภัยก่อนส่งจริง
- มี endpoint สำหรับตรวจสอบสถานะ SMTP และสถิติการส่ง

## Tech Stack

- Frontend: React + Vite + Ant Design + Redux Toolkit + Recharts
- Backend: Node.js + Express + Sequelize
- Database: MySQL 8.0
- Infra: Docker + Docker Compose

## Architecture

- Frontend container: sena_web (Port 3000)
- Backend container: sena_api (Port 4000)
- MySQL container: sena_mysql (Port 3306)
- phpMyAdmin container: sena_phpmyadmin (Port 8080)

## Project Structure

```text
referralsena-main/
├── backend/                      # API และ business logic
├── frontend/                     # React web app
├── docs/                         # คู่มือและเอกสารเชิงเทคนิค
├── migration-scripts/            # SQL/Python scripts สำหรับ migration
├── database-schema.sql           # โครงสร้างฐานข้อมูลหลัก
├── customer-audit-triggers.sql   # trigger สำหรับ audit/activity log
├── init-database.sql             # ข้อมูลตั้งต้น
├── docker-compose.yml            # compose หลักสำหรับ local/prod-like
└── README.md
```

## Quick Start (Docker First)

### Prerequisites

- Docker Desktop (หรือ Docker Engine + Docker Compose)
- Git

### 1) Clone Repository

```bash
git clone https://github.com/karnworkspace/referralsena.git
cd referralsena
```

### 2) Configure Environment

ตั้งค่าไฟล์ environment ตามสภาพแวดล้อมที่ต้องการ:

- Backend template: backend/.env.example
- Backend options: backend/.env.local, backend/.env.prod, backend/.env.extdb
- Frontend env: frontend/.env.prod

หมายเหตุ:

- ใน production ควรเปลี่ยนทุก secret และ password ทันที
- ตรวจสอบ CORS_ORIGIN ให้ตรงกับโดเมน/ไอพีที่ใช้งานจริง

### 3) Start Services

```bash
docker-compose up -d --build
```

### 4) Access Services

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Health Check: http://localhost:4000/health
- phpMyAdmin: http://localhost:8080

### 5) Default Login

- Email: admin@test.com
- Password: password

## Useful Docker Commands

```bash
# Start all services
docker-compose up -d

# Start with rebuild
docker-compose up -d --build

# Stop services
docker-compose down

# Stop and remove volumes (reset DB)
docker-compose down -v

# Check running containers
docker-compose ps

# View logs
docker-compose logs -f
```

## Database

ระบบจะ initialize database อัตโนมัติจากไฟล์:

- database-schema.sql
- customer-audit-triggers.sql
- init-database.sql

หากต้องการนำเข้าข้อมูลเพิ่มเติม:

- ใช้ phpMyAdmin Import
- หรือใช้คำสั่ง mysql ภายใน container

ตัวอย่าง:

```bash
docker exec -i sena_mysql mysql -usena_user -psena_password sena_referral < your-data.sql
```

## API Overview

กลุ่ม endpoint หลัก:

- Auth: /api/auth/*
- Agents: /api/agents/*
- Customers: /api/customers/*
- Projects: /api/projects/*
- Dashboard: /api/dashboard/*
- Emails: /api/emails/*

เอกสาร API เพิ่มเติม:

- docs/guides/API_QUICK_START.md
- docs/guides/API_QUICK_START_SIMPLE.md

## Email Configuration

ระบบรองรับ SMTP และมี test mode เพื่อกันการส่งจริงโดยไม่ตั้งใจ

ตัวแปรสำคัญใน backend env:

- MAIL_HOST
- MAIL_PORT
- MAIL_USERNAME
- MAIL_PASSWORD
- MAIL_ENCRYPTION
- MAIL_FROM_ADDRESS
- MAIL_FROM_NAME
- MAIL_TEST_MODE_RECIPIENT

## Development Notes

- โปรเจกต์นี้ออกแบบให้รันผ่าน Docker เป็นหลัก
- ใช้ URL admin dashboard ที่ /admin/dashboard
- ตรวจสอบ docker-compose logs หากพบปัญหาการเชื่อมต่อ
- สำหรับการแก้ปัญหาเชิงลึก ดูเอกสารใน docs/guides และ CLAUDE.md

## Production Notes

มีไฟล์ compose และคู่มือสำหรับ production/deployment:

- docker-compose.prod.yml
- docker-compose.extdb.yml
- docs/guides/DEPLOY-PRODUCTION-2026.md
- docs/guides/DEPLOY-EXTERNAL-DB.md

ควรตั้งค่าเพิ่มเติมก่อนใช้งานจริง:

- HTTPS/SSL
- Firewall และ network policy
- Secret management
- Backup/Restore automation
- Monitoring และ Alerting

## Documentation

- CLAUDE.md
- docs/activity-logging.md
- docs/guides/API_QUICK_START.md
- docs/guides/DEPLOY-PRODUCTION-2026.md

## License

MIT License