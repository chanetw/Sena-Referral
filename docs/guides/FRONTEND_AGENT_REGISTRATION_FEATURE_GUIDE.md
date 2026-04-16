# คู่มือ Frontend: ฟีเจอร์สมัคร Agent และสร้าง User อัตโนมัติ

> อัปเดตล่าสุด: 7 เมษายน 2026  
> เหมาะสำหรับทีม Frontend / FGF Form

---

## 0) สรุปวิธีสมัครจาก API

ตอนนี้มี **2 วิธีหลัก** ที่ใช้สมัคร Agent ผ่าน API:

| วิธี | Endpoint | เหมาะกับ | Security | สรุปสั้น ๆ |
|---|---|---|---|---|
| Public / Legacy form | `POST /api/auth/register-agent` | หน้าเว็บสมัครทั่วไป, ฟอร์ม FGF ที่ยิงตรงเข้า backend | ไม่ต้องใช้ `X-Api-Key` | ส่งข้อมูลสมัครตรง ๆ แล้ว backend สร้าง `users` + `agents` + `agent_type_details` ให้เลย |
| Secure server-to-server | `POST /api/auth/register` | ระบบภายนอก, integration ระหว่างระบบ | ต้องส่ง `X-Api-Key` | เหมาะกับ production integration เพราะควบคุมสิทธิ์ได้ชัดกว่า |

> ถ้าสรุปแบบใช้งานจริง: **หน้าเว็บฟอร์มทั่วไป** ใช้ `POST /api/auth/register-agent` และถ้าเป็น **ระบบภายนอก/เชื่อมต่อระบบต่อระบบ** ให้ใช้ `POST /api/auth/register`

---

## 1) เวอร์ชันสั้นมาก — อ่านแค่นี้ก็เข้าใจ flow

### ยิงแบบไหน
เลือกได้ 2 แบบ:

```http
POST /api/auth/register-agent   // หน้าเว็บ form ทั่วไป / legacy
POST /api/auth/register         // server-to-server พร้อม X-Api-Key
```

### ส่งไปที่ไหน
- ถ้าเป็น **ฟอร์มสมัคร Agent จากหน้า FGF หรือหน้า public** → ส่งไป `POST /api/auth/register-agent`
- ถ้าเป็น **ระบบภายนอกที่เชื่อมแบบ backend-to-backend** → ส่งไป `POST /api/auth/register` พร้อม `X-Api-Key`
- ในเอกสารนี้จะอธิบาย payload หลักที่ใช้ร่วมกัน และยกตัวอย่างจาก flow `register-agent` เป็นหลัก

### ส่งอะไรไปบ้าง
อย่างน้อยต้องมี:

```json
{
  "firstName": "สมชาย",
  "lastName": "ใจดี",
  "email": "somchai@example.com",
  "phone": "0812345678",
  "idCard": "1234567890123",
  "agentTypeCode": "general"
}
```

### Backend ทำอะไรต่อ
1. เช็คข้อมูลครบไหม
2. เช็ค format ของ `email`, `phone`, `idCard`
3. เช็คซ้ำในระบบจาก
  - `idCard` เท่านั้น
  - `email` ยังมี unique constraint ในฐานข้อมูล ถ้าซ้ำจะถูก reject ตอน insert
4. ถ้า **ไม่ซ้ำ** → สร้าง
   - `user`
   - `agent`
   - `agent_type_details`
5. ส่งผลกลับให้ frontend

### ถ้าสำเร็จได้อะไรกลับมา
- `agentCode`
- `status`
- `agentType`
- ข้อความว่า “ลงทะเบียนสำเร็จ”
- ถ้าใช้ `POST /api/auth/register` จะมี `loginInfo` กลับมาด้วยในบาง flow

### ถ้าซ้ำจะเกิดอะไรขึ้น
ระบบจะไม่สร้างข้อมูลใหม่ และตอบ `409` กลับ เช่น
- อีเมลนี้ถูกใช้แล้ว
- เลขบัตรประชาชนนี้ถูกใช้แล้ว

---

## 2) แบบตรง ๆ: ทีมไหนทำอะไร

| ทีม | หน้าที่ |
|---|---|
| **Frontend / FGF Form** | เก็บค่าจากฟอร์ม แล้วส่ง body ไปที่ API ให้ถูก field |
| **Backend API** | ตรวจข้อมูล, เช็คซ้ำ, สร้าง `users` + `agents` + `agent_type_details` |
| **Email/Notification** | ใช้ template `MailAgentCreateuser.html` ถ้าต้องการส่งเมลแจ้งสร้างบัญชีสำเร็จ |

> พูดง่าย ๆ คือ **Frontend รับข้อมูล → Backend เช็คและสร้าง → Frontend แสดงผล**

---

## 3) สิ่งที่ Frontend ต้องทำจริง ๆ

Frontend มีหน้าที่แค่ 4 อย่าง:

1. เก็บค่าจากฟอร์มสมัคร Agent
2. แปลงค่าจาก dropdown ให้เป็น `agentTypeCode`
3. ยิง API ให้ถูก endpoint
4. แสดงผลลัพธ์ว่า
   - สมัครสำเร็จ
   - อีเมลซ้ำ
   - บัตรประชาชนซ้ำ
   - หรือเบอร์โทรไม่ถูก format

> **Frontend ไม่ต้องสร้าง `agentCode`, `refCode`, `user`, หรือรหัสผ่านเอง** เพราะ backend ทำให้ทั้งหมด

---

## 4) Mapping field จากฟอร์ม → API → Database

### 4.1 ข้อมูลหลักของ Agent

| Label ในฟอร์ม | API field | Required | เก็บลง table/column | หมายเหตุ |
|---|---|---:|---|---|
| ชื่อ | `firstName` | ✅ | `agents.first_name` | ชื่อจริง |
| นามสกุล | `lastName` | ✅ | `agents.last_name` | นามสกุล |
| อีเมล | `email` | ✅ | `users.email`, `agents.email` | ใช้ login |
| เบอร์โทร | `phone` | ❌ | `agents.phone` | ต้องเป็นเบอร์ไทย |
| เลขบัตรประชาชน | `idCard` | ✅ | `agents.id_card`, `agents.agent_id_card` | unique + ใช้เป็นรหัสผ่านเริ่มต้น |
| ประเภทผู้สมัคร | `agentTypeCode` | ✅ แนะนำให้ส่ง | `agents.agent_type_id` | backend จะ map จาก code → FK |

### 4.2 ข้อมูลรายละเอียดเพิ่มเติมของ Agent

ข้อมูลชุดนี้จะถูกเก็บในตาราง `agent_type_details`

| API field | Required | เก็บลง table/column | ใช้เมื่อ |
|---|---:|---|---|
| `referralCode` | ❌ | `agent_type_details.referral_code` | มีรหัสอ้างอิงจากแหล่งที่มา |
| `houseNumber` | ❌ | `agent_type_details.house_number` | ลูกบ้าน / ที่อยู่อาศัย |
| `projectId` | ❌ | `agent_type_details.project_id` | ฟอร์มในระบบยังส่งค่า `projects.id` ได้เหมือนเดิม |
| `projectText` | ❌ | `agent_type_details.project_text` | backend จะ stamp ชื่อโครงการจาก `projectId` ให้ หรือ API ภายนอกส่ง text ตรงเข้ามาได้ |
| `department` | ❌ | `agent_type_details.department` | พนักงาน/องค์กร |
| `division` | ❌ | `agent_type_details.division` | แผนก |
| `companyName` | ❌ | `agent_type_details.company_name` | ชื่อบริษัท |
| `occupation` | ❌ | `agent_type_details.occupation` | อาชีพ |
| `knowSenaFrom` | ❌ | `agent_type_details.know_sena_from` | เช่น `fgf.sena.co.th` |

---

## 5) ค่า `agentTypeCode` ที่ frontend ควรส่ง

| ตัวเลือกบนหน้าเว็บ | `agentTypeCode` ที่ต้องส่ง |
|---|---|
| ลูกบ้าน | `resident` |
| ลูกค้า LIvnex | `livnex_customer` |
| ลูกค้า Rentnex | `rentnex_customer` |
| พนักงานบริษัทเสนา | `sena_staff` |
| พันธมิตร / คู่ค้า | `partner` |
| บุคคลทั่วไป | `general` |

> ถ้า frontend ไม่มี dropdown นี้ในบาง flow ให้ส่งค่า default เป็น `general`

---

## 6) List / dropdown values จากฐานข้อมูล

ฟอร์มสมัคร Agent มีแค่บาง field ที่เป็น list จริง ๆ จากฐานข้อมูล ส่วนที่เหลือเป็น text input หรือส่งค่าอิสระได้

### 6.1 `agentTypeCode` มาจากตาราง `agent_types`

ให้ใช้ `code` เป็นค่าที่ส่งไป backend และใช้ `name_th` เป็น label บนหน้าเว็บ

| `agent_types.id` | `agent_types.code` | `agent_types.name_th` |
|---:|---|---|
| 1 | `resident` | ลูกบ้าน |
| 2 | `livnex_customer` | ลูกค้า LIvnex |
| 3 | `rentnex_customer` | ลูกค้า Rentnex |
| 4 | `sena_staff` | พนักงานบริษัทเสนาฯ และบริษัทในเครือ |
| 5 | `partner` | พันธมิตร คู่ค้า |
| 6 | `general` | บุคคลทั่วไป |

### 6.2 `projectId` + `projectText` สำหรับโครงการ

ตอนนี้รองรับ 2 แบบควบคู่กัน:

#### แบบที่ 1: ฟอร์มในระบบ (แนะนำสำหรับหน้า admin / internal form)
- ฟอร์มยังส่ง `projectId` เหมือนเดิม
- backend จะ lookup จาก `projects.id`
- แล้ว **stamp ชื่อโครงการลง `projectText` ให้อัตโนมัติ**

#### แบบที่ 2: API ภายนอก / หน้าเว็บที่ไม่อยากผูกกับ master project มาก
- ส่ง `projectText` มาเป็น text ได้เลย
- ไม่จำเป็นต้องมี `projectId`
- เหมาะกับกรณี “อื่นๆ” หรือระบบต้นทางไม่ได้ถือ `projects.id`

ถ้าฟอร์มมี dropdown โครงการ ให้ดึง list จาก `GET /api/projects` แล้วใช้ `projects.id` เป็นค่า submit
frontend **ไม่ควรกำหนดค่า `projectId` เองแบบ hardcode** เพราะค่าจริงต้องมาจากข้อมูลโครงการในฐานข้อมูล

ถ้าไม่เลือกโครงการ ให้ส่ง `projectId = null` และส่ง `projectText` เป็นข้อความเองได้ หรือไม่ส่งทั้งคู่ก็ได้

ถ้า frontend ไม่ใช่ของเรา หรือเป็นระบบภายนอก ให้ใช้หนึ่งใน 3 วิธีนี้:
- ให้ระบบต้นทางส่ง `projectId` มาพร้อมกับข้อมูลฟอร์ม
- ให้ระบบต้นทางส่ง `projectText` มาเป็นข้อความตรง ๆ
- หรือให้ frontend นั้นเรียก `GET /api/public/projects` เพื่อโหลดรายการโครงการก่อน submit

> ตอนนี้ `GET /api/projects` ยังเป็น API ที่ต้อง auth อยู่ ดังนั้นถ้าเป็นหน้า public ให้ใช้ `GET /api/public/projects` แทน

> `GET /api/public/projects` จะส่งกลับแค่ `id`, `projectCode`, `projectName`, `isActive` เพื่อให้ frontend ภายนอกเอาไปทำ dropdown ได้ทันที

ตัวอย่าง flow ของฟอร์มในระบบ:
- หน้า A ให้ผู้ใช้เลือกโครงการจาก dropdown
- หน้า A ส่ง `projectId`
- backend หา `project.projectName`
- backend บันทึกทั้ง `projectId` และ `projectText`

> แนะนำ label ตอนแสดงผล: `project_code - project_name`

| `projects.id` | `project_code` | `project_name` | `project_type` |
|---:|---|---|---|
| 1 | `PROJ001` | The Reserve Phahol-Pradipat | `condo` |
| 2 | `PROJ002` | Baan Sena Ville | `house` |
| 3 | `PROJ003` | Town Plus Ramkhamhaeng | `townhome` |

### 6.3 field ที่ไม่ใช่ list จากฐานข้อมูล

| Field | ประเภท | หมายเหตุ |
|---|---|---|
| `referralCode` | text | กรอกเองได้ |
| `houseNumber` | text | กรอกเองได้ |
| `department` | text | กรอกเองได้ |
| `division` | text | กรอกเองได้ |
| `companyName` | text | กรอกเองได้ |
| `occupation` | text | กรอกเองได้ |
| `knowSenaFrom` | text | ใช้เป็นช่องทางที่รู้จักเสนา เช่น `fgf.sena.co.th` |

> สรุปสั้น ๆ: **list ที่ต้องผูกกับฐานข้อมูลจริงมี 2 จุดหลักสำหรับฟอร์มในระบบ** คือ `agentTypeCode` จาก `agent_types` และ `projectId` จาก `projects` ส่วน `projectText` ใช้เก็บชื่อโครงการที่ stamp ไว้หรือรับตรงจาก API ได้

---

## 7) Request Body ที่ frontend ควรส่ง

### 7.1 แบบขั้นต่ำ (สำหรับฟอร์มสมัครทั่วไป)

```jsonc
{
  "firstName": "สมชาย",
  "lastName": "ใจดี",
  "email": "somchai@example.com",
  "phone": "0812345678",
  "idCard": "1234567890123",
  "agentTypeCode": "general" // general, resident, livnex_customer, rentnex_customer, sena_staff, partner
}
```

### 7.2 แบบเต็ม (แนะนำ ถ้ามีข้อมูลเพิ่มจากฟอร์ม)

```jsonc
{
  "firstName": "สมชาย",
  "lastName": "ใจดี",
  "email": "somchai@example.com",
  "phone": "0812345678",
  "idCard": "1234567890123",
  "agentTypeCode": "resident", // ค่าใน database: resident / livnex_customer / rentnex_customer / sena_staff / partner / general
  "referralCode": "REF123", // optional
  "houseNumber": "99/1", // optional
  "projectId": 3, // ฟอร์มในระบบยังส่ง projects.id ได้เหมือนเดิม
  "projectText": "นิช โมโน รัชวิภา", // backend จะ stamp ให้อัตโนมัติเมื่อมี projectId หรือ API ภายนอกจะส่งตรงมาก็ได้
  "department": "Marketing", // optional
  "division": "Digital", // optional
  "companyName": "SENA Development", // optional
  "occupation": "Employee", // optional
  "knowSenaFrom": "fgf.sena.co.th" // optional
}
```

> หมายเหตุ: ตัวอย่างด้านบนใช้รูปแบบ `jsonc` เพื่อใส่ comment อธิบายค่าได้
> แต่ payload จริงที่ส่งไป API ต้องเป็น JSON ปกติ ไม่มี `// comment`

---

## 8) Backend จะทำอะไรเมื่อ receive request

เมื่อ frontend จากหน้า FGF ส่งข้อมูลมาที่ `POST /api/auth/register-agent` ระบบจะทำตามลำดับนี้:

1. ตรวจว่า field จำเป็นครบหรือไม่
   - `firstName`
   - `lastName`
   - `email`
   - `idCard`

2. Validate format
   - `email` ต้องเป็นอีเมลที่ถูกต้อง
   - `idCard` ต้องเป็นเลข 13 หลัก
   - `phone` ถ้ามี ต้องเป็นเบอร์ไทย

3. จัดการข้อมูลโครงการ
   - ถ้ามี `projectId` → backend จะ lookup ชื่อโครงการแล้ว stamp ลง `projectText`
   - ถ้ามีแต่ `projectText` → backend จะเก็บ text ตรง ๆ

4. เช็คข้อมูลซ้ำ
   - `idCard` ซ้ำไหม
  - `email` จะถูกตรวจตอน insert จาก unique constraint ของฐานข้อมูล

5. ถ้าไม่ซ้ำ
   - สร้าง row ใน `users`
   - สร้าง row ใน `agents`
   - สร้าง row ใน `agent_type_details`

6. ระบบจะ generate ค่าให้อัตโนมัติ
   - `agentCode`
   - `refCode`
   - `registrationDate`
   - `status`

7. backend ส่ง response กลับให้ frontend

---

## 9) เงื่อนไข Duplicate ที่ frontend ต้องรู้

ระบบเช็คซ้ำจาก 2 อย่างหลัก:

### 8.1 `idCard`
- ถ้าซ้ำ จะไม่สร้าง user/agent ใหม่
- response จะเป็น `409`
- `errorType = "idCard"`

### 8.2 `email`
- ถ้าซ้ำ จะถูกปฏิเสธโดย unique constraint ของ `users.email`
- response จะเป็น `409`
- `errorType = "email"`

### หมายเหตุเรื่อง `phone`
- ระบบยังตรวจ **format** ของเบอร์โทรอยู่
- แต่จะ **ไม่เช็คว่าเบอร์ซ้ำหรือไม่** ระหว่างผู้สมัคร

---

## 10) ตัวอย่าง Response ที่ frontend จะได้รับ

### 9.1 กรณีสมัครสำเร็จ

```json
{
  "success": true,
  "message": "ลงทะเบียนสำเร็จ เปิดใช้งานบัญชีแล้ว",
  "data": {
    "agentCode": "AG010",
    "firstName": "สมชาย",
    "lastName": "ใจดี",
    "email": "somchai@example.com",
    "status": "active",
    "requiresAdminReview": false,
    "agentType": {
      "id": 6,
      "code": "general",
      "nameTh": "บุคคลทั่วไป"
    }
  }
}
```

### 9.2 กรณีเลขบัตรประชาชนซ้ำ

```json
{
  "success": false,
  "message": "เลขประจำตัวประชาชนนี้ถูกใช้แล้ว",
  "errorType": "idCard",
  "existingData": {
    "agentCode": "AG012",
    "firstName": "สมชาย",
    "lastName": "ใจดี",
    "email": "old@example.com"
  },
  "nextAction": "contact_admin"
}
```

### 9.3 กรณีอีเมลซ้ำ

```json
{
  "success": false,
  "message": "อีเมลนี้ถูกใช้แล้ว",
  "errorType": "email"
}
```

---

## 11) ตัวอย่างการเรียก API จาก frontend

### 11.1 เรียกแบบ public form — `POST /api/auth/register-agent`

ใช้เมื่อ frontend เป็นหน้า form ที่ยิงตรงเข้า backend ได้เลย

### ใช้ `fetch`

```javascript
const selectedProject = projects.find((project) => project.id === values.projectId);

const payload = {
  firstName: values.firstName,
  lastName: values.lastName,
  email: values.email,
  phone: values.phone,
  idCard: values.idCard,
  agentTypeCode: values.agentTypeCode,
  referralCode: values.referralCode,
  houseNumber: values.houseNumber,
  projectId: values.projectId,
  projectText: selectedProject?.projectName || values.projectText || null,
  department: values.department,
  division: values.division,
  companyName: values.companyName,
  occupation: values.occupation,
  knowSenaFrom: 'fgf.sena.co.th'
};

const response = await fetch('http://localhost:4000/api/auth/register-agent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
});

const result = await response.json();

if (response.ok && result.success) {
  console.log('สมัครสำเร็จ', result.data);
} else {
  console.error('สมัครไม่สำเร็จ', result);
}
```

### ใช้ `axios`

```javascript
import axios from 'axios';

const result = await axios.post('http://localhost:4000/api/auth/register-agent', payload);
console.log(result.data);
```

### 11.2 เรียกแบบ server-to-server — `POST /api/auth/register`

ใช้เมื่อระบบภายนอกจะยิงจาก backend ของตัวเองเข้ามา และต้องการความปลอดภัยมากขึ้น

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: <YOUR_REGISTER_API_KEY>" \
  -d '{
    "firstName": "สมชาย",
    "lastName": "ใจดี",
    "email": "somchai@example.com",
    "phone": "0812345678",
    "idCard": "1234567890123",
    "agentTypeCode": "general",
    "projectText": "นิช โมโน รัชวิภา"
  }'
```

**หมายเหตุของ route นี้**
- ต้องมี `X-Api-Key`
- เหมาะกับ integration ระหว่างระบบ
- ใช้ payload ใกล้เคียงกับ `register-agent`
- ส่ง `projectText` มาได้ตรง ๆ หรือส่ง `projectId` ให้ backend stamp ชื่อโครงการก็ได้

---

## 12) Frontend UX ที่แนะนำ

### เมื่อกดปุ่มสมัคร
- disable ปุ่ม submit ชั่วคราว
- แสดง loading state
- ป้องกันการกดซ้ำ

### ถ้าสมัครสำเร็จ
- แสดงข้อความว่า
  - "ลงทะเบียนสำเร็จ"
  - "ระบบได้สร้างบัญชีให้แล้ว"
- ถ้ามีการส่งอีเมลใน backend ให้แจ้งว่า
  - "กรุณาตรวจสอบอีเมลของท่าน"

### ถ้าข้อมูลซ้ำ
ให้แสดงข้อความตาม `errorType`

| `errorType` | ข้อความที่แนะนำ |
|---|---|
| `idCard` | เลขบัตรประชาชนนี้ถูกใช้งานแล้ว |
| `email` | อีเมลนี้ถูกใช้งานแล้ว |
| `phone` | เบอร์โทรศัพท์ไม่ถูกต้อง |

---

## 13) Email Template ที่เกี่ยวข้อง

ไฟล์ template ที่เตรียมไว้:

```text
Mail Template/MailAgentCreateuser.html
```

### ใช้สำหรับ
- แจ้ง agent ว่าระบบสร้างบัญชีเรียบร้อยแล้ว
- แจ้งข้อมูลสำหรับ login

### Placeholder ที่ต้องแทนค่าก่อนส่ง
| Placeholder | ค่าที่ควรแทน |
|---|---|
| `[FULL_NAME]` | ชื่อ + นามสกุลผู้สมัคร |
| `[AGENT_CODE]` | รหัส agent ที่สร้างแล้ว |
| `[AGENT_TYPE_NAME]` | ชื่อประเภท agent |
| `[ACCOUNT_STATUS]` | เช่น `active` |
| `[SYSTEM_LOGIN_URL]` | URL หน้าล็อกอินระบบ |
| `[EMAIL]` | อีเมลผู้สมัคร |
| `[SUPPORT_EMAIL]` | อีเมล support |

> หมายเหตุ: ตอนนี้ template HTML ถูกสร้างไว้แล้ว แต่ถ้าจะให้ส่งอีเมลจริงอัตโนมัติ ต้องผูกเข้ากับ backend email service เพิ่ม

---

## 14) สิ่งที่ frontend "ไม่ต้องทำ"

Frontend **ไม่ต้อง**:
- generate `agentCode`
- generate `refCode`
- คิดรหัสผ่านเอง
- เช็คซ้ำกับ database เอง
- map `agentTypeCode` เป็น `agent_type_id` เอง

สิ่งเหล่านี้ backend ทำให้ทั้งหมด

---

## 15) Checklist สำหรับทดสอบฝั่ง Frontend

### Happy path
- [ ] กรอกข้อมูลครบ
- [ ] ส่ง API ได้สำเร็จ
- [ ] ได้ response `201`
- [ ] แสดงข้อความสมัครสำเร็จ

### Validation path
- [ ] email ไม่ถูกต้อง → ได้ `400`
- [ ] idCard ไม่ครบ 13 หลัก → ได้ `400`
- [ ] phone ไม่ถูกต้อง → ได้ `400`

### Duplicate path
- [ ] email ซ้ำ → ได้ `409`
- [ ] idCard ซ้ำ → ได้ `409`

### Phone validation path
- [ ] phone ไม่ถูกต้อง → ได้ `400`

---

## 16) เอกสาร/ไฟล์ที่เกี่ยวข้อง

- Swagger API Docs: `http://localhost:4000/api/docs`
- FGF agent register endpoint: `POST /api/auth/register-agent`
- OpenAPI definition: `backend/src/docs/openapi.js`
- Email template: `Mail Template/MailAgentCreateuser.html`

---

## 17) สรุปสุดท้ายสำหรับทีม FGF

ถ้าจะสรุปให้ทีมใช้งานแบบเร็วที่สุด:

1. ถ้าเป็น **หน้าเว็บสมัครทั่วไป / public form**
   - ใช้ `POST /api/auth/register-agent`
2. ถ้าเป็น **integration จากระบบอื่น**
   - ใช้ `POST /api/auth/register` พร้อม `X-Api-Key`
3. ส่งข้อมูลหลักให้ครบ ได้แก่
   - `firstName`
   - `lastName`
   - `email`
   - `idCard`
   - และ `agentTypeCode`
4. ถ้ามีข้อมูลโครงการ
   - ส่ง `projectId` ได้สำหรับฟอร์มในระบบ
   - หรือส่ง `projectText` เป็นข้อความตรง ๆ ได้สำหรับ API ภายนอก
5. backend จะเป็นคนเช็คซ้ำและสร้างข้อมูลให้ทั้งหมด

ดังนั้นหน้าฝั่ง FGF หรือระบบภายนอกมีหน้าที่แค่ **เก็บข้อมูล → ยิง API ให้ถูก endpoint → รับผลลัพธ์กลับไปแสดงผล**



