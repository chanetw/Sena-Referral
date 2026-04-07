# คู่มือ Deploy Production (อัปเดต 2026)

> อัปเดตล่าสุด: 7 เมษายน 2026  
> ใช้กับโปรเจกต์ `referralsena-main`

---

## 1) ภาพรวมระบบปัจจุบัน

Production ของระบบนี้แยกเป็น 4 services หลักผ่าน Docker:

| Service | Container | Port ภายนอก | หน้าที่ |
|---|---|---:|---|
| Frontend | `sena_web` | `3000` | หน้าเว็บผู้ดูแล / SPA |
| Backend API | `sena_api` | `4000` | REST API + Email + Auth |
| MySQL | `sena_mysql` | `3306` | ฐานข้อมูลหลัก |
| phpMyAdmin | `sena_phpmyadmin` | `8080` | จัดการฐานข้อมูลผ่านเว็บ |

ไฟล์หลักที่ใช้ deploy:

- `docker-compose.prod.yml`
- `backend/.env.prod`
- `frontend/.env.prod`
- `scripts/deploy/build-and-push.sh`
- `docker-compose.extdb.yml` (กรณีใช้ external database)

---

## 2) โหมด deploy ที่รองรับตอนนี้

### แบบ A: ใช้ MySQL ใน Docker เดียวกัน
ใช้ไฟล์:

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

เหมาะสำหรับ:
- server เดียวจบ
- ต้องการให้ฐานข้อมูลรันใน compose ชุดเดียวกัน

### แบบ B: ใช้ External DB / Managed DB
ใช้ไฟล์:

```bash
docker compose -f docker-compose.extdb.yml pull
docker compose -f docker-compose.extdb.yml up -d
```

เหมาะสำหรับ:
- แยก DB ออกจาก app
- ใช้ MySQL จากเครื่องอื่น / cloud database

---

## 3) ค่าที่ต้องตั้งก่อนขึ้น production

### Backend: `backend/.env.prod`
ตรวจค่าเหล่านี้ให้ถูกต้อง:

```env
NODE_ENV=production
PORT=4000
CORS_ORIGIN=http://172.22.22.11:3000,http://172.22.22.11:5173
DB_HOST=mysql
DB_PORT=3306
DB_USER=sena_user
DB_PASSWORD=sena_password
DB_NAME=sena_referral
JWT_SECRET=change-this-in-real-production
```

> ถ้าใช้โดเมนจริง เช่น `https://fgf.sena.co.th` หรือ `https://admin.sena.co.th` ต้องเพิ่มโดเมนนั้นใน `CORS_ORIGIN` ด้วย

### Frontend: `frontend/.env.prod`

```env
VITE_API_BASE=http://172.22.22.11:4000/api
VITE_ENV=production
VITE_APP_TITLE=SENA Agent System
```

> สำคัญ: `VITE_API_BASE` ถูกฝังเข้า static bundle ตอน build image ดังนั้นถ้าเปลี่ยนค่า ต้อง **rebuild web image ใหม่**

---

## 4) Build และ Push image ล่าสุด

ถ้าต้องการ build multi-arch (`linux/amd64` + `linux/arm64`) ให้ใช้:

```bash
bash scripts/deploy/build-and-push.sh latest http://172.22.22.11:4000/api
```

สคริปต์นี้จะ build และ push:
- `chanetw/sena-api:latest`
- `chanetw/sena-web:latest`

รองรับทั้ง:
- Linux server ทั่วไป (`amd64`)
- Apple Silicon / ARM (`arm64`)

---

## 5) ขั้นตอน deploy บน production server

### 5.1 ดึงโค้ดล่าสุด

```bash
cd /opt/sena-agent
git pull origin ver2
```

### 5.2 ดึง image ล่าสุดและรัน

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### 5.3 เช็คสถานะ container

```bash
docker compose -f docker-compose.prod.yml ps
```

ควรเห็น container เหล่านี้ขึ้นสถานะ running / healthy:
- `sena_web`
- `sena_api`
- `sena_mysql`
- `sena_phpmyadmin`

---

## 6) คำสั่งตรวจสอบหลัง deploy

### ตรวจ Backend health

```bash
curl http://localhost:4000/health
```

### ตรวจหน้าเว็บ

```text
http://172.22.22.11:3000
```

### ตรวจ phpMyAdmin

```text
http://172.22.22.11:8080
```

### ดู log

```bash
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f web
```

---

## 7) ถ้าจะเปลี่ยน IP หรือเปลี่ยนเป็นโดเมนจริง

สมมติเปลี่ยนจาก `172.22.22.11` เป็น `https://fgf.sena.co.th`

ให้แก้ 3 จุดหลัก:

1. `frontend/.env.prod`
   ```env
   VITE_API_BASE=https://fgf.sena.co.th/api
   ```

2. `backend/.env.prod`
   ```env
   CORS_ORIGIN=https://fgf.sena.co.th,https://admin.sena.co.th
   ```

3. build web image ใหม่
   ```bash
   bash scripts/deploy/build-and-push.sh latest https://fgf.sena.co.th/api
   ```

จากนั้นบน server:

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

---

## 8) หมายเหตุสำคัญ

- `frontend/.env.prod` มีผลตอน **build time** เป็นหลัก
- `backend/.env.prod` มีผลตอน **container start**
- ถ้าเปลี่ยน `JWT_SECRET`, SMTP, DB หรือ CORS ให้ restart/recreate API container
- ถ้าเปลี่ยน `VITE_API_BASE` ต้อง rebuild frontend image ไม่ใช่แค่ restart

---

## 9) ไฟล์ที่ควรรู้ในรอบนี้

- `docs/guides/DEPLOY-PRODUCTION-2026.md` ← คู่มือฉบับนี้
- `docker-compose.prod.yml` ← compose สำหรับ production ปัจจุบัน
- `docker-compose.extdb.yml` ← กรณี external DB
- `backend/.env.prod` ← config ฝั่ง backend
- `frontend/.env.prod` ← config ฝั่ง frontend
- `scripts/deploy/build-and-push.sh` ← build และ push multi-platform image

---

## 10) สรุปสั้นที่สุด

ถ้า deploy แบบ production ปกติ:

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

ถ้าเปลี่ยน API URL หรือโดเมน:
1. แก้ `frontend/.env.prod`
2. แก้ `backend/.env.prod`
3. rebuild image ใหม่
4. pull + up อีกครั้ง
