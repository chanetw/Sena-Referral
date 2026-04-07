# DEPLOY-EXTERNAL-DB.md — คู่มือ Deploy แยก Database ออกจาก Docker

> อัปเดตล่าสุด: 7 เมษายน 2026  
> ถ้าต้องการ deploy แบบมี MySQL อยู่ใน compose เดียวกัน ให้ดู `docs/guides/DEPLOY-PRODUCTION-2026.md`

## Quick Start (2026)

ถ้า server มี MySQL / Managed DB อยู่แล้ว และต้องการรันเฉพาะ `api` + `web`:

```bash
docker compose -f docker-compose.extdb.yml pull
docker compose -f docker-compose.extdb.yml up -d
```

ไฟล์ที่ต้องตรวจให้ถูกก่อนรัน:
- `backend/.env.extdb`
- `frontend/.env.prod`
- `docker-compose.extdb.yml`

## สารบัญ
- [ภาพรวม Architecture](#ภาพรวม-architecture)
- [Prerequisites](#prerequisites)
- [Step 1: สร้าง MySQL Database](#step-1-สร้าง-mysql-database)
- [Step 2: Import ข้อมูล](#step-2-import-ข้อมูล)
- [Step 3: ตั้งค่า Environment](#step-3-ตั้งค่า-environment)
- [Step 4: Deploy Containers](#step-4-deploy-containers)
- [Step 5: ตรวจสอบระบบ](#step-5-ตรวจสอบระบบ)
- [การแยก Start/Stop](#การแยก-startstop)
- [Troubleshooting](#troubleshooting)

---

## ภาพรวม Architecture

```
┌─────────────────────────────────────────────────┐
│                    Server                        │
│                                                  │
│  ┌──────────────┐     ┌──────────────┐          │
│  │  sena_web    │     │  sena_api    │          │
│  │  (Frontend)  │────▶│  (Backend)   │          │
│  │  Port 3000   │     │  Port 4000   │          │
│  └──────────────┘     └──────┬───────┘          │
│       Docker                 │                   │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│─ ─ ─ ─ ─ ─ ─ ─  │
│       Host / External       │                   │
│                      ┌──────▼───────┐           │
│                      │   MySQL 8.0  │           │
│                      │  Port 3306   │           │
│                      │ sena_referral│           │
│                      └──────────────┘           │
│                   (DevOps จัดการเอง)             │
└─────────────────────────────────────────────────┘
```

**เปรียบเทียบกับ mode เดิม:**

| | `docker-compose.prod.yml` | `docker-compose.extdb.yml` |
|---|---|---|
| MySQL | อยู่ใน Docker container | ใช้ DB ภายนอก / managed DB |
| api | depends_on mysql container | เชื่อมต่อผ่าน `DB_HOST` ใน env |
| web | เหมือนกัน | เหมือนกัน |
| phpMyAdmin | รวมอยู่ | ไม่รวม (DevOps จัดการเอง) |

> สรุป: ถ้ามีฐานข้อมูลอยู่แล้ว ให้ใช้ `docker-compose.extdb.yml` แต่ถ้าต้องการรันครบทั้ง stack ในเครื่องเดียว ให้ใช้ `docker-compose.prod.yml`

---

## Prerequisites

- **Docker** 20.10+ และ **Docker Compose** v2
- **MySQL 8.0+** (DevOps ติดตั้งเอง)
- Docker images บน Docker Hub:
  - `chanetw/sena-api:latest`
  - `chanetw/sena-web:latest`

---

## Step 1: สร้าง MySQL Database

### วิธี A: รัน SQL setup script (แนะนำ)

```bash
# Login ด้วย root
mysql -uroot -p < database/setup-external-db.sql
```

Script นี้จะสร้าง:
- Database `sena_referral` (charset: utf8mb4)
- User `sena_user` พร้อม password และ permissions
- ตารางทั้งหมด (15 tables)
- Triggers สำหรับ audit trail
- Views สำหรับรายงาน
- Seed data (agent types 6 รายการ)

### วิธี B: สร้างเอง → import schema แยก

```bash
# สร้าง database
mysql -uroot -p -e "
  CREATE DATABASE sena_referral CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER 'sena_user'@'%' IDENTIFIED BY 'YOUR_PASSWORD';
  GRANT ALL PRIVILEGES ON sena_referral.* TO 'sena_user'@'%';
  FLUSH PRIVILEGES;
"

# Import schema
mysql -usena_user -p sena_referral < database-schema.sql
mysql -usena_user -p sena_referral < customer-audit-triggers.sql
```

### ตรวจสอบ

```bash
mysql -usena_user -p sena_referral -e "SHOW TABLES;"
```

ต้องเห็น 15 tables:
`activity_logs`, `agent_type_details`, `agent_types`, `agents`, `customer_product_types`, `customers`, `email_logs`, `leads`, `notification_rules`, `product_types`, `projects`, `requests`, `sales`, `users`, `visits`

---

## Step 2: Import ข้อมูล

ถ้ามี database dump จากระบบเดิม:

```bash
mysql -usena_user -p sena_referral < backups/sena_referral_current.sql
```

> **หมายเหตุ**: ถ้ารัน `setup-external-db.sql` แล้ว schema จะมีอยู่แล้ว   dump file จะ INSERT ข้อมูลเข้าไป

---

## Step 3: ตั้งค่า Environment

### 3.1 แก้ไข `backend/.env.extdb`

```bash
cp backend/.env.extdb backend/.env.extdb.local   # backup ต้นฉบับ
vi backend/.env.extdb
```

**ค่าที่ต้องแก้:**

```env
# CORS — ใส่ IP จริงของ server
CORS_ORIGIN=http://YOUR_SERVER_IP:3000

# Database — ใส่ค่าตาม MySQL ที่สร้าง
DB_HOST=host.docker.internal     # ← กรณี MySQL อยู่ server เดียวกัน
# DB_HOST=10.0.0.50              # ← กรณี MySQL อยู่คนละ server
DB_PORT=3306
DB_USER=sena_user
DB_PASSWORD=YOUR_DB_PASSWORD     # ← แก้ให้ตรงกับที่สร้าง
DB_NAME=sena_referral
```

**DB_HOST ใช้ค่าไหน?**

| กรณี | DB_HOST |
|------|---------|
| MySQL อยู่บน server เดียวกับ Docker | `host.docker.internal` |
| MySQL อยู่คนละ server | IP ของ MySQL server เช่น `10.0.0.50` |
| MySQL เป็น managed service (RDS, Cloud SQL) | endpoint ที่ได้มา |

### 3.2 แก้ไข `frontend/.env.prod` (ถ้าเปลี่ยน server IP)

```env
VITE_API_BASE=http://YOUR_SERVER_IP:4000/api
VITE_ENV=production
VITE_APP_TITLE=SENA Agent System
```

> **สำคัญ**: ถ้าเปลี่ยน `VITE_API_BASE` ต้อง rebuild web image ด้วย:
> ```bash
> bash scripts/deploy/build-and-push.sh latest http://YOUR_SERVER_IP:4000/api
> ```
> เพราะ VITE_API_BASE embed เข้า static bundle ตอน build time

---

## Step 4: Deploy Containers

### 4.1 Pull images

```bash
docker compose -f docker-compose.extdb.yml pull
```

### 4.2 Start ทั้งหมด

```bash
docker compose -f docker-compose.extdb.yml up -d
```

### 4.3 ดู logs

```bash
# ดู logs ทั้งหมด
docker compose -f docker-compose.extdb.yml logs -f

# ดู logs เฉพาะ api
docker compose -f docker-compose.extdb.yml logs -f api
```

---

## Step 5: ตรวจสอบระบบ

### Health Check

```bash
# Server health
curl http://localhost:4000/health
# Expected: {"success":true,"message":"Server is running",...}

# Database connection
curl http://localhost:4000/api/test-db
# Expected: {"success":true,"message":"Database connection successful"}
```

### ทดสอบ Login

เปิด browser → `http://SERVER_IP:3000`

- Email: `admin@test.com`
- Password: `password`

### ดูสถานะ containers

```bash
docker compose -f docker-compose.extdb.yml ps
```

ต้องเห็น:
```
NAME         IMAGE                       STATUS
sena_api     chanetw/sena-api:latest      Up
sena_web     chanetw/sena-web:latest      Up
```

---

## การแยก Start/Stop

### Start เฉพาะ Backend API

```bash
docker compose -f docker-compose.extdb.yml up api -d
```

### Start เฉพาะ Frontend Web

```bash
docker compose -f docker-compose.extdb.yml up web -d
```

### Stop ทั้งหมด

```bash
docker compose -f docker-compose.extdb.yml down
```

### Restart เฉพาะ API (เช่น หลังแก้ .env)

```bash
docker compose -f docker-compose.extdb.yml restart api
```

---

## Troubleshooting

### ปัญหา: API connect DB ไม่ได้

**อาการ**: `curl /api/test-db` → error หรือ API container restart loop

**ตรวจสอบ**:
```bash
# ดู logs
docker compose -f docker-compose.extdb.yml logs api

# ทดสอบ connection จาก host
mysql -usena_user -p -h DB_HOST sena_referral -e "SELECT 1"
```

**แก้ไข**:
1. ตรวจ `DB_HOST` ใน `.env.extdb` ว่าถูกต้อง
2. ตรวจว่า MySQL accept remote connections (bind-address = `0.0.0.0`)
3. ตรวจ firewall/security group ว่าเปิด port 3306
4. ตรวจว่า user `sena_user@%` ถูก grant สิทธิ์

### ปัญหา: Frontend โหลดได้แต่ API call ล้มเหลว

**อาการ**: หน้า login แสดงแต่ login ไม่ได้, console แสดง CORS error

**แก้ไข**:
1. ตรวจ `CORS_ORIGIN` ใน `.env.extdb` มี URL ของ frontend หรือไม่
2. ตรวจ `VITE_API_BASE` ว่าชี้ไป API ที่ถูกต้อง (ถ้าผิดต้อง rebuild web image)
3. Restart api: `docker compose -f docker-compose.extdb.yml restart api`

### ปัญหา: ภาษาไทยแสดงผิด (garbled text)

**แก้ไข**:
```bash
# ตรวจ charset ของ database
mysql -usena_user -p -e "SHOW CREATE DATABASE sena_referral;"
# ต้องเห็น: utf8mb4
```

ถ้าไม่ถูกต้อง:
```sql
ALTER DATABASE sena_referral CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### ปัญหา: Container เริ่มก่อน MySQL พร้อม

**อาการ**: API crash เพราะ connect DB ไม่ได้ตอน startup

**แก้ไข**: API มี retry logic (5 ครั้ง ห่าง 5 วินาที) อัตโนมัติ   
ปรับค่าได้ใน `.env.extdb`:
```env
DB_CONNECT_RETRIES=10       # จำนวนครั้งที่ retry (default: 5)
DB_CONNECT_RETRY_DELAY=5000 # ms ระหว่าง retry (default: 5000)
```

---

## ไฟล์ที่เกี่ยวข้อง

| ไฟล์ | คำอธิบาย |
|------|---------|
| `docker-compose.extdb.yml` | Docker Compose ไม่มี MySQL (api + web เท่านั้น) |
| `backend/.env.extdb` | Environment template สำหรับ external DB |
| `frontend/.env.prod` | Frontend config (VITE_API_BASE) |
| `database/setup-external-db.sql` | SQL รวมสำหรับสร้าง DB + schema + triggers |
| `backups/sena_referral_current.sql` | Database dump (ข้อมูลจริง) |
| `scripts/deploy/build-and-push.sh` | Script สำหรับ rebuild + push Docker images |
| `docs/guides/DEPLOY-EXTERNAL-DB.md` | คู่มือฉบับนี้สำหรับ deployment แบบ external DB |

---

## เปรียบเทียบ Compose Files

| ไฟล์ | ใช้เมื่อไหร่ |
|------|------------|
| `docker-compose.yml` | Development บน local (MySQL ใน Docker) |
| `docker-compose.prod.yml` | Production แบบ all-in-Docker (MySQL ใน Docker) |
| `docker-compose.extdb.yml` | Production แบบ external DB (MySQL ข้างนอก Docker) |
