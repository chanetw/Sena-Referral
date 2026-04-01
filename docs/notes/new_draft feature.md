# Manual Feature - Agent Referral System

## 📋 ภาพรวมระบบ

ระบบจัดการเอเจนต์และลูกค้า (Agent Referral System) เป็นเว็บแอปพลิเคชันที่พัฒนาด้วย React + Node.js + Ant Design สำหรับการจัดการข้อมูลเอเจนต์ขายและลูกค้าในธุรกิจอสังหาริมทรัพย์

### 🌟 **ความพิเศษของระบบ**
- **Multi-Role System**: รองรับ 2 ระดับผู้ใช้ (Admin และ Agent)
- **Self-Registration**: เอเจนต์สามารถสมัครด้วยตนเองได้
- **Role-based Dashboard**: แสดงเนื้อหาต่างกันตามสิทธิ์ผู้ใช้
- **Agent Approval Workflow**: ระบบอนุมัติเอเจนต์จาก Admin

## 🛠️ Tech Stack

### Frontend
- **React 18** - JavaScript Library สำหรับสร้าง UI
- **Vite** - Build Tool และ Development Server
- **Ant Design** - UI Component Library พร้อม Thai Localization
- **Redux Toolkit** - State Management
- **Axios** - HTTP Client สำหรับเรียก API

### Backend
- **Node.js** - Runtime Environment
- **Express.js** - Web Framework
- **JWT** - Authentication
- **CORS** - Cross-Origin Resource Sharing
- **Helmet** - Security Middleware
- **Morgan** - HTTP Request Logger

## 🚀 วิธีการรันระบบ

### 1. เริ่มต้น Backend Server

```bash
cd backend
npm start
```

**เซิร์ฟเวอร์จะรันที่:** `http://localhost:4000`

### 2. เริ่มต้น Frontend Development Server

```bash
cd frontend
npm run dev
```

**เว็บแอปจะรันที่:** `http://localhost:5173`

### 3. การเข้าสู่ระบบ

เปิดเบราว์เซอร์และไปที่ `http://localhost:5173`

**ข้อมูลเข้าสู่ระบบ:**

#### 👨‍💼 **Admin (ผู้ดูแลระบบ):**
- **Email:** `admin@test.com`
- **Password:** `123456`
- **เข้าถึง:** Admin Dashboard (`/admin/dashboard`)

#### 👤 **Agent (เอเจนต์ทดสอบ):**
- **Email:** `somchai@example.com`
- **Password:** `123456`  
- **เข้าถึง:** Agent Dashboard (`/agent/dashboard`)

#### 🆕 **Agent Registration (สมัครใหม่):**
- คลิกปุ่ม "สมัครเป็นเอเจนต์" ในหน้า Login
- หรือไปที่ `http://localhost:5173/register-agent`

## ✨ ฟีเจอร์หลักของระบบ

### 🔐 ระบบ Authentication & Role Management
- **Multi-Role Login**: รองรับ Admin และ Agent
- **JWT Token Authentication**: ความปลอดภัยระดับสูง
- **Auto-redirect**: เข้าหน้าที่ถูกต้องตาม Role
- **Protected Routes**: ป้องกันการเข้าถึงโดยไม่มีสิทธิ์
- **Session Management**: Auto-redirect เมื่อ session หมดอายุ

#### การทำงานของ Role System:
```
Admin Login → Admin Dashboard (จัดการทุกอย่าง)
Agent Login → Agent Dashboard (ดูเฉพาะข้อมูลตนเอง)
```

---

### 🆕 **Agent Self-Registration System**

#### ฟีเจอร์:
- **หน้าสมัครเอเจนต์** - Form สมัครที่ใช้งานง่าย
- **Auto Agent Code Generation** - สร้างรหัสเอเจนต์อัตโนมัติ (AG001, AG002, ...)
- **Validation ครบถ้วน** - ตรวจสอบข้อมูลก่อนบันทึก
- **Status Management** - สถานะ pending รอการอนุมัติ
- **Success Page** - แสดงผลการสมัครและขั้นตอนถัดไป

#### ขั้นตอนการสมัคร:
1. **กรอกข้อมูล** - ชื่อ, นามสกุล, อีเมล, เบอร์โทร, เลขบัตรประชาชน, รหัสผ่าน
2. **รอการอนุมัติ** - Admin ตรวจสอบและอนุมัติ
3. **เริ่มใช้งาน** - Login และเข้าถึง Agent Dashboard

#### ข้อมูลที่ต้องกรอก:
- ชื่อ-นามสกุล (จำเป็น)
- อีเมล (จำเป็น, ไม่ซ้ำ)
- เบอร์โทร (ไม่จำเป็น)
- เลขประจำตัวประชาชน (จำเป็น, 13 หลัก, ไม่ซ้ำ)
- รหัสผ่าน (จำเป็น, อย่างน้อย 6 ตัวอักษร)
- ยืนยันรหัสผ่าน (ต้องตรงกัน)

---

### 👥 **Admin Dashboard - จัดการเอเจนต์ (Agent Management)**

#### ฟีเจอร์ (สำหรับ Admin เท่านั้น):
- **แสดงรายการเอเจนต์** - ตารางแสดงข้อมูลเอเจนต์ทั้งหมดพร้อม pagination
- **ค้นหาเอเจนต์** - ค้นหาด้วยชื่อ, รหัสเอเจนต์, หรืออีเมล
- **กรองข้อมูล** - กรองตามสถานะ (ใช้งาน/ไม่ใช้งาน/รออนุมัติ)
- **เพิ่มเอเจนต์ใหม่** - ฟอร์มเพิ่มเอเจนต์พร้อม validation
- **แก้ไขข้อมูลเอเจนต์** - อัพเดทข้อมูลเอเจนต์ที่มีอยู่
- **ลบเอเจนต์** - ลบเอเจนต์พร้อม confirmation dialog
- **อนุมัติเอเจนต์** - เปลี่ยนสถานะจาก pending เป็น active

#### สถานะของเอเจนต์:
- **🟢 active** - ใช้งานได้ปกติ
- **🔴 inactive** - ระงับการใช้งาน
- **🟡 pending** - รอการอนุมัติจาก Admin

#### ข้อมูลเอเจนต์:
- รหัสเอเจนต์ (Agent Code)
- ชื่อ-นามสกุล
- อีเมล
- เบอร์โทร
- เลขประจำตัวประชาชน
- สถานะ (ใช้งาน/ไม่ใช้งาน)
- วันที่ลงทะเบียน

#### เอเจนต์ตัวอย่างในระบบ:
1. **AG001** - สมชาย ใจดี (somchai@example.com) - 🟢 active
2. **AG002** - สุมาลี สวยงาม (sumalee@example.com) - 🟢 active
3. **AG003** - วิชาญ เก่งจริง (wichan@example.com) - 🔴 inactive

---

### 🏠 **Agent Dashboard - หน้าแดชบอร์ดสำหรับเอเจนต์**

#### ฟีเจอร์ (สำหรับ Agent เท่านั้น):
- **แดshบอร์ดส่วนตัว** - สถิติและข้อมูลส่วนตัว
- **ลูกค้าของฉัน** - รายชื่อลูกค้าที่ตนเองดูแล
- **ข้อมูลส่วนตัว** - ดูและแก้ไขข้อมูลส่วนตัว
- **สถิติการขาย** - ยอดขายและประสิทธิภาพ

#### ข้อจำกัดสำหรับ Agent:
- ❌ ไม่สามารถดูข้อมูลเอเจนต์คนอื่นได้
- ❌ ไม่สามารถเพิ่ม/แก้ไข/ลบเอเจนต์ได้
- ❌ ไม่สามารถเข้าถึง Admin functions ได้
- ✅ ดูได้เฉพาะลูกค้าที่ตนเองรับผิดชอบ
- ✅ แก้ไขข้อมูลส่วนตัวได้

#### Menu สำหรับ Agent:
1. **แดชบอร์ด** - หน้าหลักแสดงสถิติ
2. **ลูกค้าของฉัน** - รายการลูกค้าที่ดูแล
3. **ข้อมูลส่วนตัว** - Profile และการตั้งค่า

---

### 👤 **จัดการลูกค้า (Customer Management)**

#### ฟีเจอร์ (แตกต่างกันตาม Role):

##### 👨‍💼 **สำหรับ Admin:**
- **แสดงรายการลูกค้าทั้งหมด** - ตารางแสดงข้อมูลลูกค้าทุกคนในระบบ
- **ค้นหาลูกค้า** - ค้นหาด้วยชื่อ, รหัสลูกค้า, อีเมล, หรือเบอร์โทร
- **กรองข้อมูล** - กรองตามสถานะและเอเจนต์ที่รับผิดชอบ
- **เพิ่มลูกค้าใหม่** - ฟอร์มเพิ่มลูกค้าพร้อม validation
- **แก้ไขข้อมูลลูกค้า** - อัพเดทข้อมูลลูกค้าที่มีอยู่
- **ลบลูกค้า** - ลบลูกค้าพร้อม confirmation dialog
- **มอบหมายเอเจนต์** - เลือกเอเจนต์ที่รับผิดชอบลูกค้า

##### 👤 **สำหรับ Agent:**
- **แสดงเฉพาะลูกค้าของตนเอง** - ดูได้เฉพาะลูกค้าที่ตนเองรับผิดชอบ
- **ดูข้อมูลลูกค้า** - ข้อมูลติดต่อและรายละเอียด
- **สถิติลูกค้า** - จำนวนลูกค้าทั้งหมดและลูกค้าใหม่

#### ข้อมูลลูกค้า:
- รหัสลูกค้า (Customer Code)
- ชื่อ-นามสกุล
- อีเมล
- เบอร์โทร
- เลขประจำตัวประชาชน
- ที่อยู่
- เอเจนต์ที่รับผิดชอบ
- สถานะ (ใช้งาน/ไม่ใช้งาน)
- วันที่ลงทะเบียน

#### ลูกค้าตัวอย่างในระบบ:
1. **CU001** - นพดล สุขใจ (เอเจนต์: AG001 - สมชาย ใจดี)
2. **CU002** - สมหญิง ใจดี (เอเจนต์: AG001 - สมชาย ใจดี)
3. **CU003** - วิชาญ มั่งมี (เอเจนต์: AG002 - สุมาลี สวยงาม)
4. **CU004** - นิภา รุ่งเรือง (เอเจนต์: AG002 - สุมาลี สวยงาม)
5. **CU005** - สมศักดิ์ พันธุ์ดี (เอเจนต์: AG003 - วิชาญ เก่งจริง)

---

## 🎨 UI/UX Features

### ภาษาไทย
- Interface ทั้งหมดเป็นภาษาไทย
- Thai date formatting
- Thai localization สำหรับ Ant Design components

### Responsive Design
- รองรับการใช้งานบนหน้าจอขนาดต่างๆ
- Mobile-friendly layout
- Adaptive table และ form layouts

### User Experience
- Loading states สำหรับการโหลดข้อมูล
- Error notifications พร้อมข้อความภาษาไทย
- Success notifications เมื่อดำเนินการสำเร็จ
- Confirmation dialogs สำหรับการลบข้อมูล
- Search และ filter แบบ real-time

---

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - เข้าสู่ระบบ (Admin/Agent)
- `POST /api/auth/register-agent` - สมัครเป็นเอเจนต์
- `GET /api/auth/me` - ดึงข้อมูลผู้ใช้ปัจจุบัน
- `POST /api/auth/logout` - ออกจากระบบ

### Agents Management
- `GET /api/agents` - ดึงรายการเอเจนต์ทั้งหมด
- `GET /api/agents/:id` - ดึงข้อมูลเอเจนต์ตาม ID
- `POST /api/agents` - เพิ่มเอเจนต์ใหม่
- `PUT /api/agents/:id` - แก้ไขข้อมูลเอเจนต์
- `DELETE /api/agents/:id` - ลบเอเจนต์
- `GET /api/agents/list` - ดึงรายชื่อเอเจนต์สำหรับ dropdown

### Customers Management
- `GET /api/customers` - ดึงรายการลูกค้าทั้งหมด
- `GET /api/customers/:id` - ดึงข้อมูลลูกค้าตาม ID
- `POST /api/customers` - เพิ่มลูกค้าใหม่
- `PUT /api/customers/:id` - แก้ไขข้อมูลลูกค้า
- `DELETE /api/customers/:id` - ลบลูกค้า

### System
- `GET /health` - ตรวจสอบสถานะเซิร์ฟเวอร์
- `GET /api/test-db` - ทดสอบการเชื่อมต่อฐานข้อมูล

---

## 🔒 Security Features

- **JWT Authentication** - ใช้ JSON Web Token สำหรับการยืนยันตัวตน
- **CORS Protection** - ป้องกันการเข้าถึงจากโดเมนที่ไม่ได้รับอนุญาต
- **Helmet Security** - เพิ่มความปลอดภัยด้วย HTTP headers
- **Input Validation** - ตรวจสอบข้อมูลที่ป้อนเข้ามา
- **Rate Limiting** - จำกัดจำนวนคำขอต่อหน่วยเวลา (ปิดในโหมด development)

---

## 📱 การใช้งานระบบ

### 🚀 **เริ่มต้นใช้งาน**

#### สำหรับผู้ดูแลระบบ (Admin):
1. เปิดเบราว์เซอร์ไปที่ `http://localhost:5173`
2. ใส่ email: `admin@test.com` และ password: `123456`
3. คลิก "เข้าสู่ระบบ" → จะเข้าสู่ Admin Dashboard

#### สำหรับเอเจนต์ (Agent):
1. เปิดเบราว์เซอร์ไปที่ `http://localhost:5173`
2. ใส่ email: `somchai@example.com` และ password: `123456`
3. คลิก "เข้าสู่ระบบ" → จะเข้าสู่ Agent Dashboard

#### สำหรับเอเจนต์ใหม่:
1. ในหน้า Login คลิกปุ่ม "สมัครเป็นเอเจนต์"
2. กรอกข้อมูลให้ครบถ้วน
3. รอการอนุมัติจาก Admin

---

### 👨‍💼 **คู่มือการใช้งาน Admin Dashboard**

#### 1. จัดการเอเจนต์:
1. คลิกเมนู "จัดการเอเจนต์" ในแถบด้านซ้าย
2. ดูรายการเอเจนต์ทั้งหมด (รวมสถานะ pending)
3. ใช้ช่องค้นหาเพื่อหาเอเจนต์ที่ต้องการ
4. กรองตามสถานะ: ทั้งหมด/ใช้งาน/ไม่ใช้งาน
5. คลิก "เพิ่มเอเจนต์ใหม่" เพื่อเพิ่มเอเจนต์
6. คลิกไอคอน "แก้ไข" เพื่อแก้ไขข้อมูลหรือเปลี่ยนสถานะ
7. คลิกไอคอน "ลบ" เพื่อลบเอเจนต์ (มี confirmation)

#### 2. อนุมัติเอเจนต์ใหม่:
1. เมื่อมีเอเจนต์สมัครใหม่ จะแสดงสถานะ "รออนุมัติ"
2. คลิก "แก้ไข" ที่เอเจนต์ที่รออนุมัติ
3. เปลี่ยนสถานะจาก "pending" เป็น "active"
4. บันทึกการเปลี่ยนแปลง

#### 3. จัดการลูกค้า:
1. คลิกเมนู "จัดการลูกค้า" ในแถบด้านซ้าย
2. ดูรายการลูกค้าทั้งหมดในระบบ
3. ใช้ตัวกรองเพื่อกรองตามสถานะหรือเอเจนต์
4. คลิก "เพิ่มลูกค้าใหม่" เพื่อเพิ่มลูกค้า
5. เลือกเอเจนต์ที่รับผิดชอบลูกค้าจาก dropdown
6. คลิกไอคอน "แก้ไข" หรือ "ลบ" ในแต่ละแถว

---

### 👤 **คู่มือการใช้งาน Agent Dashboard**

#### 1. ดูแดชบอร์ดส่วนตัว:
1. หลังจาก Login จะเข้าสู่หน้าแดชบอร์ดโดยอัตโนมัติ
2. ดูสถิติ: จำนวนลูกค้าทั้งหมด, ลูกค้าใหม่, ยอดขาย
3. ดูรายชื่อลูกค้าล่าสุด

#### 2. จัดการลูกค้าของตนเอง:
1. คลิกเมนู "ลูกค้าของฉัน"
2. ดูรายการลูกค้าที่ตนเองรับผิดชอบเท่านั้น
3. ดูข้อมูลติดต่อและสถานะของลูกค้า

#### 3. จัดการข้อมูลส่วนตัว:
1. คลิกเมนู "ข้อมูลส่วนตัว"
2. ดูข้อมูลส่วนตัว: รหัสเอเจนต์, ชื่อ-นามสกุล, อีเมล, สถานะ
3. (ในอนาคตจะสามารถแก้ไขข้อมูลได้)

#### 4. ออกจากระบบ:
- คลิกไอคอน profile ที่มุมขวาบน
- เลือก "ออกจากระบบ"

---

### 🔄 **Workflow การสมัครและอนุมัติเอเจนต์**

```
1. เอเจนต์สมัครใหม่ → สถานะ "pending"
2. Admin เข้าระบบ → เห็นเอเจนต์ที่รออนุมัติ
3. Admin แก้ไขเอเจนต์ → เปลี่ยนสถานะเป็น "active"
4. เอเจนต์สามารถ Login ได้
5. เอเจนต์เข้าใช้ Agent Dashboard
```

---

## 🐛 การแก้ไขปัญหา

### Backend ไม่สามารถเริ่มได้ (Port ถูกใช้)
```bash
# หา process ที่ใช้ port 5001
lsof -i :5001

# ฆ่า process (แทน PID ด้วยเลขที่ได้)
kill -9 PID
```

### Frontend ไม่สามารถเชื่อมต่อ Backend
1. ตรวจสอบว่า Backend รันอยู่ที่ port 5001
2. ตรวจสอบการตั้งค่า CORS ในไฟล์ `.env`
3. ล้าง browser cache และ localStorage

### ข้อมูลไม่แสดง
1. เปิด Developer Tools (F12)
2. ตรวจสอบ Console เพื่อดู error messages
3. ตรวจสอบ Network tab เพื่อดู API calls

---

## 📁 โครงสร้างโปรเจค

```
referralsena-main/
├── backend/                     # Node.js Backend
│   ├── .env                     # Environment variables
│   ├── server-mysql.js          # Main server file
│   ├── src/
│   │   ├── config/              # Configuration files
│   │   ├── models/              # Database models
│   │   └── services/            # Business logic services
│   └── package.json             # Backend dependencies
├── frontend/                    # React Frontend
│   ├── src/
│   │   ├── components/          # Reusable components
│   │   ├── pages/               # Feature-based page folders
│   │   ├── store/               # Redux store และ slices
│   │   ├── services/            # API services
│   │   └── App.jsx              # Main App component
│   ├── public/assets/           # Static assets
│   ├── package.json             # Frontend dependencies
│   └── vite.config.js           # Vite configuration
├── docs/                        # Guides และ notes
├── scripts/                     # Deploy/local/security/test scripts
├── database-schema.sql          # Database schema
└── CLAUDE.md                    # Project context memory
```

---

## 🔄 การพัฒนาต่อ

### ฟีเจอร์ที่สามารถเพิ่มได้:
1. **Projects Management** - จัดการโครงการอสังหาริมทรัพย์
2. **Sales Tracking** - ติดตามยอดขายและคอมมิชชั่น
3. **Reports Dashboard** - รายงานสถิติและกราฟ
4. **File Upload** - อัพโหลดไฟล์เอกสาร
5. **Real Database** - เชื่อมต่อกับ MySQL หรือ PostgreSQL
6. **Email Notifications** - ส่งอีเมลแจ้งเตือน
7. **Export to Excel** - ส่งออกข้อมูลเป็นไฟล์ Excel

### การเชื่อมต่อฐานข้อมูลจริง:
ใช้ไฟล์ `database-schema.sql` เพื่อสร้างตารางในฐานข้อมูล MySQL และแทนที่ mock data ด้วย Sequelize ORM

---

---

## 🎯 **สรุปฟีเจอร์ที่พัฒนาเสร็จแล้ว**

### ✅ **Phase 1: Admin Panel (adminversion branch)**
- ✅ Admin Dashboard สำหรับจัดการเอเจนต์และลูกค้า
- ✅ Agent Management (CRUD operations)
- ✅ Customer Management (CRUD operations)
- ✅ Thai localization และ responsive UI

### ✅ **Phase 2: Agent Self-Registration (main branch)**
- ✅ Agent Registration System
- ✅ Role-based Authentication (Admin/Agent)
- ✅ Separate Dashboards for Admin และ Agent
- ✅ Agent Approval Workflow
- ✅ Agent-specific Customer View

### 🔄 **Phase 3: ฟีเจอร์ที่กำลังพัฒนา/วางแผน**
- 🔄 Agent Profile Management
- 🔄 Real-time Notifications
- 🔄 Sales Tracking และ Commission
- 🔄 Reports และ Analytics
- 🔄 File Upload System
- 🔄 Email Notifications

---

## 📂 **Project Structure สรุป**

```
referralsena-main/
├── backend/                         # Node.js Backend
│   ├── server-mysql.js              # Main server with MySQL + Sequelize APIs
│   ├── src/config/                  # Configuration files
│   ├── src/models/                  # Database models
│   └── src/services/                # Business logic services
├── frontend/                        # React Frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── auth/                # LoginPage, AgentRegister
│   │   │   ├── dashboards/          # Dashboard, AgentDashboard
│   │   │   ├── admin/               # AgentManagement, CustomerManagement
│   │   │   ├── projects/            # ProjectManagement, ProjectForm
│   │   │   ├── reports/             # ReportsPage
│   │   │   └── settings/            # SettingsPage
│   │   ├── store/                   # authSlice, agentsSlice, customersSlice
│   │   └── services/api.js          # API service calls
│   └── public/assets/               # Shared images and static assets
├── docs/notes/                      # Notes and draft feature docs
├── docs/guides/                     # API and deployment guides
├── scripts/                         # Deploy/local/security/test scripts
├── database-schema.sql              # Database schema
└── CLAUDE.md                        # Project context memory
```

---

## 🚀 **การพัฒนาต่อ**

หากต้องการพัฒนาเพิ่มเติม สามารถใช้ branch structure:
- **`adminversion`** - Version สำหรับ Admin เท่านั้น
- **`main`** - Version ปัจจุบันที่รองรับ Multi-Role
- **`feature/*`** - สำหรับ feature ใหม่ๆ

---

*📝 เอกสารนี้อัพเดทเมื่อ: **4 สิงหาคม 2025** - Agent Self-Registration System*