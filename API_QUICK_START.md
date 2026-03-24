# API คู่มือการลงทะเบียนและเปิดใช้งาน Agent

> **อัพเดทล่าสุด**: มีนาคม 2026 | รองรับ server-to-server integration พร้อม API Key security

---

## 📋 ภาพรวม Endpoints

| Endpoint | วัตถุประสงค์ | ต้องการ | ผลลัพธ์ |
|----------|------------|--------|--------|
| `POST /api/auth/register` ⭐ | สร้าง + activate ทันที (server-to-server) | **X-Api-Key** header | `agentStatus: active` ทันที |
| `POST /api/auth/register-agent` | สมัครรอการอนุมัติ (หน้าเว็บ public) | ไม่ต้อง | `agentStatus: inactive` รอ admin |
| `POST /api/auth/activate-registration` | สร้าง + activate ผ่าน email link | JWT activation token | `agentStatus: active` |

**แนะนำสำหรับ integration กับระบบอื่น**: ใช้ `POST /api/auth/register`

---

## 🔐 ความปลอดภัย (API Key Authentication)

endpoint `POST /api/auth/register` ออกแบบสำหรับ **server-to-server** เท่านั้น

### วิธีการทำงาน

```
ระบบภายนอก  ──(HTTPS + X-Api-Key)──►  POST /api/auth/register  ──►  สร้าง user + agent (active)
```

### Header ที่ต้องส่ง

```
X-Api-Key: <your-api-key>
Content-Type: application/json
```

### มาตรการความปลอดภัยที่ใช้

| มาตรการ | รายละเอียด |
|--------|-----------|
| **API Key** | ต้องส่ง `X-Api-Key` header ทุก request |
| **Timing-safe comparison** | ใช้ `crypto.timingSafeEqual` ป้องกัน timing attack |
| **Rate limiting** | สูงสุด 30 requests / 15 นาที ต่อ IP |
| **Disabled by default** | ถ้าไม่ตั้ง `REGISTER_API_KEY` ใน env → endpoint คืน 503 ทันที |
| **ไม่ expose hint** | key ผิดหรือไม่มี key → ได้ 401 เหมือนกันทุกกรณี |

---

## ⚙️ การตั้งค่า Environment

### สร้าง API Key ใหม่

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# ตัวอย่าง output: 2e95610014cbacb8edd1856372f7313162744a2675b546423c718aa9d1bdabae
```

### เพิ่มใน `backend/.env`

```env
# Server-to-server Register API Key
REGISTER_API_KEY=<ใส่ key ที่สร้างได้จากคำสั่งข้างบน>
REGISTER_API_RATE_LIMIT_WINDOW_MS=900000     # 15 นาที (optional)
REGISTER_API_RATE_LIMIT_MAX_REQUESTS=30       # สูงสุด 30 req/window (optional)
```

> ⚠️ **สำคัญ**: เก็บ API Key ฝั่งระบบที่เรียกเข้ามาเป็น environment variable เสมอ ห้าม hardcode ในโค้ด

---

## 🚀 การใช้งาน POST /api/auth/register

### Request

**URL**: `POST http://<server>:4000/api/auth/register`

**Headers**:
```
Content-Type: application/json
X-Api-Key: <your-api-key>
```

**Body**:

| Field | Type | Required | Validation | หมายเหตุ |
|-------|------|:--------:|-----------|---------|
| `firstName` | string | ✅ | ไม่ว่าง | ชื่อจริง |
| `lastName` | string | ✅ | ไม่ว่าง | นามสกุล |
| `email` | string | ✅ | รูปแบบ email, ไม่ซ้ำ | ใช้สำหรับล็อกอิน |
| `idCard` | string | ✅ | ตัวเลข 13 หลักเท่านั้น | ใช้เป็นรหัสผ่านเริ่มต้น |
| `phone` | string | ❌ | ขึ้นต้น `0`, ยาว 9-10 หลัก, ไม่ซ้ำ | เบอร์โทรศัพท์ |
| `agentTypeCode` | string | ❌ | ดูตารางด้านล่าง | default: `general` |

**ประเภทเอเจนต์ที่ใช้ได้** (`agentTypeCode`):

| Code | ชื่อภาษาไทย |
|------|------------|
| `general` | บุคคลทั่วไป (default) |
| `resident` | ลูกบ้าน SENA |
| `livnex_customer` | ลูกค้า Livnex |
| `rentnex_customer` | ลูกค้า Rentnex |
| `sena_staff` | พนักงาน SENA |
| `partner` | พันธมิตร SENA |

**ตัวอย่าง Request Body**:
```json
{
  "firstName": "สมชาย",
  "lastName": "ใจดี",
  "email": "agent@example.com",
  "phone": "0812345678",
  "idCard": "1234567890123",
  "agentTypeCode": "general"
}
```

---

### Response

#### ✅ สำเร็จ (HTTP 201)

```json
{
  "success": true,
  "message": "ลงทะเบียนและเปิดใช้งานบัญชีสำเร็จ",
  "data": {
    "agentCode": "AG014",
    "firstName": "สมชาย",
    "lastName": "ใจดี",
    "email": "agent@example.com",
    "userStatus": "active",
    "agentStatus": "active",
    "requiresAdminReview": false,
    "agentType": {
      "id": 6,
      "code": "general",
      "nameTh": "บุคคลทั่วไป"
    },
    "loginInfo": {
      "email": "agent@example.com",
      "password": "รหัสประชาชน 13 หลัก"
    }
  }
}
```

| Field | คำอธิบาย |
|-------|---------|
| `agentCode` | รหัสเอเจนต์ที่สร้างอัตโนมัติ (AG001, AG002, ...) |
| `userStatus` | สถานะ user account — `active` เสมอสำหรับ endpoint นี้ |
| `agentStatus` | `active` (ปกติ) หรือ `inactive` (เลขบัตรซ้ำ รอตรวจสอบ) |
| `requiresAdminReview` | `false` (ปกติ) หรือ `true` (เลขบัตรซ้ำ) |
| `loginInfo.password` | เป็น hint เท่านั้น — รหัสผ่านคือค่าที่ส่งมาใน `idCard` |

---

#### ❌ Error Responses

| HTTP Status | `errorType` | สาเหตุ |
|-------------|-------------|-------|
| 400 | `validation` | ข้อมูล required ไม่ครบ |
| 400 | `email` | รูปแบบ email ไม่ถูกต้อง |
| 400 | `idCard` | เลขบัตรไม่ใช่ตัวเลข 13 หลัก |
| 400 | `phone` | รูปแบบเบอร์โทรไม่ถูกต้อง |
| 400 | `agentTypeCode` | ประเภทเอเจนต์ไม่ถูกต้อง |
| 401 | `missing_api_key` | ไม่มี X-Api-Key header |
| 401 | `invalid_api_key` | X-Api-Key ผิด |
| 409 | `email` | email ถูกใช้แล้ว |
| 409 | `phone` | เบอร์โทรถูกใช้แล้ว |
| 503 | `service_unavailable` | ไม่ได้ตั้งค่า REGISTER_API_KEY ใน environment |

**ตัวอย่าง Error Response**:
```json
{
  "success": false,
  "message": "อีเมลนี้ถูกใช้แล้ว",
  "errorType": "email"
}
```

---

### กรณี: เลขบัตรประชาชนซ้ำ

เมื่อ `idCard` ซ้ำกับ agent เดิม ระบบจะ **ยังสร้าง user ให้** แต่ agent จะอยู่ในสถานะ `inactive` รอ admin ตรวจสอบ:

```json
{
  "success": true,
  "message": "ลงทะเบียนและเปิดใช้งานบัญชีสำเร็จ แต่พบเลขบัตรประชาชนซ้ำ สถานะรอตรวจสอบจากผู้ดูแลระบบ",
  "data": {
    "agentCode": "AG015",
    "userStatus": "active",
    "agentStatus": "inactive",
    "requiresAdminReview": true
  }
}
```

Admin ต้องเข้า http://localhost:3000 แล้วอนุมัติใน Agent Management

---

## 💻 ตัวอย่างโค้ด Integration

### Node.js (axios)

```javascript
const axios = require('axios');

const SENA_API_URL = process.env.SENA_API_URL || 'http://localhost:4000';
const SENA_API_KEY = process.env.SENA_REGISTER_API_KEY; // เก็บใน env ห้าม hardcode

async function registerAgent(userData) {
  try {
    const response = await axios.post(
      `${SENA_API_URL}/api/auth/register`,
      {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        idCard: userData.idCard,
        agentTypeCode: userData.agentTypeCode || 'general'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': SENA_API_KEY
        }
      }
    );

    return response.data; // { success: true, data: { agentCode, ... } }

  } catch (error) {
    if (error.response) {
      // HTTP error (4xx, 5xx)
      throw new Error(`Registration failed: ${error.response.data.message}`);
    }
    throw error;
  }
}

// การใช้งาน
const result = await registerAgent({
  firstName: 'สมชาย',
  lastName: 'ใจดี',
  email: 'agent@example.com',
  phone: '0812345678',
  idCard: '1234567890123'
});

console.log('AgentCode:', result.data.agentCode);
console.log('Status:', result.data.agentStatus);
```

### Node.js (fetch — native)

```javascript
const response = await fetch('http://localhost:4000/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Api-Key': process.env.SENA_REGISTER_API_KEY
  },
  body: JSON.stringify({
    firstName: 'สมชาย',
    lastName: 'ใจดี',
    email: 'agent@example.com',
    phone: '0812345678',
    idCard: '1234567890123',
    agentTypeCode: 'general'
  })
});

const result = await response.json();

if (!result.success) {
  throw new Error(result.message);
}

console.log(result.data.agentCode); // AG014
```

### Python

```python
import requests
import os

SENA_API_URL = os.environ.get('SENA_API_URL', 'http://localhost:4000')
SENA_API_KEY = os.environ.get('SENA_REGISTER_API_KEY')  # เก็บใน env ห้าม hardcode

def register_agent(first_name, last_name, email, id_card, phone=None, agent_type_code='general'):
    url = f'{SENA_API_URL}/api/auth/register'
    headers = {
        'Content-Type': 'application/json',
        'X-Api-Key': SENA_API_KEY
    }
    payload = {
        'firstName': first_name,
        'lastName': last_name,
        'email': email,
        'idCard': id_card,
        'agentTypeCode': agent_type_code
    }
    if phone:
        payload['phone'] = phone

    response = requests.post(url, json=payload, headers=headers)
    result = response.json()

    if not result.get('success'):
        raise ValueError(f"Registration failed: {result.get('message')}")

    return result['data']

# การใช้งาน
agent = register_agent(
    first_name='สมชาย',
    last_name='ใจดี',
    email='agent@example.com',
    id_card='1234567890123',
    phone='0812345678'
)
print(f"Agent Code: {agent['agentCode']}, Status: {agent['agentStatus']}")
```

### PHP

```php
<?php
function registerAgent(array $data): array {
    $url = ($_ENV['SENA_API_URL'] ?? 'http://localhost:4000') . '/api/auth/register';
    $apiKey = $_ENV['SENA_REGISTER_API_KEY']; // เก็บใน env ห้าม hardcode

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($data),
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'X-Api-Key: ' . $apiKey,
        ],
    ]);

    $response = json_decode(curl_exec($ch), true);
    curl_close($ch);

    if (!$response['success']) {
        throw new RuntimeException('Registration failed: ' . $response['message']);
    }

    return $response['data'];
}

// การใช้งาน
$agent = registerAgent([
    'firstName'     => 'สมชาย',
    'lastName'      => 'ใจดี',
    'email'         => 'agent@example.com',
    'phone'         => '0812345678',
    'idCard'        => '1234567890123',
    'agentTypeCode' => 'general',
]);

echo "Agent Code: {$agent['agentCode']}, Status: {$agent['agentStatus']}";
?>
```

### cURL (ทดสอบจาก Terminal)

```bash
# กำหนด key ใน shell variable
export SENA_API_KEY="2e95610014cbacb8edd1856372f7313162744a2675b546423c718aa9d1bdabae"

# ยิง request
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: $SENA_API_KEY" \
  -d '{
    "firstName": "สมชาย",
    "lastName": "ใจดี",
    "email": "agent@example.com",
    "phone": "0812345678",
    "idCard": "1234567890123",
    "agentTypeCode": "general"
  }'
```

---

## 🔄 Flow หลังลงทะเบียนสำเร็จ

```
POST /api/auth/register
        │
        ▼
agentStatus == "active"?
   ├── ✅ YES → ล็อกอินได้ทันที
   │          POST /api/auth/login
   │          { email, password: <idCard> }
   │
   └── ⚠️ NO (requiresAdminReview: true)
              → Admin ต้องอนุมัติที่
              http://localhost:3000 → Agent Management
```

### ล็อกอินหลังลงทะเบียน

```json
POST /api/auth/login
{
  "email": "agent@example.com",
  "password": "1234567890123"
}
```

> **หมายเหตุ**: รหัสผ่านเริ่มต้นคือค่าเดียวกันกับ `idCard` ที่ส่งมาตอนลงทะเบียน แนะนำให้ผู้ใช้เปลี่ยนรหัสผ่านหลัง login ครั้งแรก

---

## 📊 ความหมายของ Status Fields

### `userStatus` (users.is_active)
- `active` — บัญชีเปิดใช้งาน สามารถล็อกอินได้
- `inactive` — บัญชีถูกระงับ

### `agentStatus` (agents.status)
- `active` — เอเจนต์ผ่านการอนุมัติ ใช้งานได้เต็มรูปแบบ
- `inactive` — รอ admin ตรวจสอบ (เกิดจากเลขบัตรซ้ำ)

> ผู้ใช้จะล็อกอินได้ก็ต่อเมื่อ **ทั้งสองค่าเป็น active** เท่านั้น

---

## 📚 Swagger UI

ดูและทดสอบ API ได้ที่: **http://localhost:4000/api/docs**

ใน Swagger ให้คลิก **Authorize** และใส่ API Key ในช่อง `ApiKeyAuth` ก่อนกด "Try it out"

| Endpoint | Tag | หมายเหตุ |
|----------|-----|---------|
| `POST /api/auth/register` | Auth ⭐ | ต้อง X-Api-Key |
| `POST /api/auth/register-agent` | Auth | Public (pending approval) |
| `POST /api/auth/activate-registration` | Auth | ต้อง JWT activation token |
| `POST /api/auth/login` | Auth | ล็อกอิน |
| `GET /api/auth/me` | Auth | ดู profile ตัวเอง |

---

## 🛡️ Checklist ความปลอดภัยสำหรับ Production

- [ ] เปลี่ยน `REGISTER_API_KEY` เป็น key ใหม่ที่มีความยาวอย่างน้อย 32 bytes
- [ ] เก็บ API Key ใน secrets manager หรือ environment variable ของระบบ ไม่ hardcode ในโค้ด
- [ ] ใช้ HTTPS เสมอ (ห้ามส่ง API Key ผ่าน HTTP ใน production)
- [ ] จำกัด IP whitelist ที่สามารถเรียก endpoint นี้ได้ (ผ่าน firewall/nginx)
- [ ] ตั้ง `REGISTER_API_RATE_LIMIT_MAX_REQUESTS` ให้เหมาะกับ volume จริง
- [ ] เปลี่ยน `JWT_SECRET` เป็นค่าที่ไม่ใช่ default


| Endpoint | วัตถุประสงค์ | ความง่าย | เมื่อใช้ |
|----------|-----------|---------|--------|
| `POST /api/auth/register` ⭐**ใหม่** | สร้าง & activate ทึนที | ⭐⭐⭐ ง่ายสุด | ง่ายที่สุด สำหรับ simple integration |
| `POST /api/auth/register-agent` | สร้างแล้ว pending approval | ⭐⭐ | ต้องให้ admin อนุมัติ |
| `POST /api/auth/activate-registration` | activate จาก email link | ⭐ | ต้อง JWT activation token จากไหนอื่น |

---

## 🚀 Quick Start: ใช้ `/api/auth/register` (แนะนำ)

ส่งข้อมูลแล้วได้ user + agent ที่เปิดใช้งานแล้วทันที ไม่ต้องการ token อื่น

### Request ตัวอย่าง

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "สมชาย",
    "lastName": "ใจดี",
    "email": "agent@example.com",
    "phone": "0812345678",
    "idCard": "1234567890123",
    "agentTypeCode": "general"
  }'
```

### Request Body Schema

| Field | Type | Required | ตัวอย่าง | หมายเหตุ |
|-------|------|----------|---------|---------|
| `firstName` | string | ✅ | "สมชาย" | ชื่อจริง |
| `lastName` | string | ✅ | "ใจดี" | นามสกุล |
| `email` | string | ✅ | "agent@example.com" | อีเมลสำหรับล็อกอิน ต้องไม่ซ้ำ |
| `phone` | string | ❌ | "0812345678" | เบอร์โทร ต้องขึ้นต้นด้วย 0 และ 9-10 หลัก |
| `idCard` | string | ✅ | "1234567890123" | เลขบัตรประชาชน 13 หลัก (ใช้เป็นรหัสผ่านเริ่มต้น) |
| `agentTypeCode` | string | ❌ | "general" | ประเภทเอเจนต์ (default: general) |

### ประเภทเอเจนต์ที่ใช้ได้

```
- "general"          (บุคคลทั่วไป)
- "resident"         (อาคารอพยพและที่อยู่อาศัย)
- "livnex_customer"  (ลูกค้า Livnex) 
- "rentnex_customer" (ลูกค้า Rentnex)
- "sena_staff"       (พนักงาน SENA)
- "partner"          (พันธมิตร SENA)
```

### Response Success (201 Created)

```json
{
  "success": true,
  "message": "ลงทะเบียนและเปิดใช้งานบัญชีสำเร็จ",
  "data": {
    "agentCode": "AG014",
    "firstName": "สมชาย",
    "lastName": "ใจดี",
    "email": "agent@example.com",
    "userStatus": "active",
    "agentStatus": "active",
    "requiresAdminReview": false,
    "agentType": {
      "id": 6,
      "code": "general",
      "nameTh": "บุคคลทั่วไป"
    },
    "loginInfo": {
      "email": "agent@example.com",
      "password": "รหัสประชาชน 13 หลัก"
    }
  }
}
```

### Response Errors

#### ❌ Email ถูกใช้แล้ว (409)
```json
{
  "success": false,
  "message": "อีเมลนี้ถูกใช้แล้ว",
  "errorType": "email"
}
```

#### ❌ เลขบัตรประชาชนซ้ำ (409) - สถานะ pending
```json
{
  "success": false,
  "message": "เบอร์โทรนี้ถูกใช้แล้ว",
  "errorType": "phone"
}
```

#### ❌ ข้อมูลไม่ครบ (400)
```json
{
  "success": false,
  "message": "กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อ, นามสกุล, อีเมล, เลขบัตรประชาชน)",
  "errorType": "validation"
}
```

#### ❌ เลขบัตรไม่ถูกต้อง (400)
```json
{
  "success": false,
  "message": "เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก",
  "errorType": "idCard"
}
```

---

## 📝 Output Details

### agentCode
- สร้างอัตโนมัติ (AG001, AG002, ...)
- ใช้สำหรับระบุตัวตน

### userStatus & agentStatus
- `active` - สามารถล็อกอินได้ทันที
- `inactive` - รอการอนุมัติจาก admin (ถ้าเลขบัตรซ้ำ)

### loginInfo
- **email**: ใช้สำหรับล็อกอิน
- **password**: เลขบัตรประชาชน 13 หลัก ที่ส่งมาใน `idCard` field

ตัวอย่าง:
```
Email: agent@example.com
Password: 1234567890123
```

---

## 🔐 มี 3 ชั้นของสถานะ

### 1️⃣ User Status (users.is_active)
- `true` / `false` - เปิดใช้งานบัญชี

### 2️⃣ Agent Status (agents.status)
- `active` - เอเจนต์พร้อมใช้งาน
- `inactive` - รอการอนุมัติ (เมื่อเลขบัตรซ้ำ)

### 3️⃣ Role (users.role)
- `agent` - เอเจนต์
- `admin` - ผู้ดูแล
- `manager` - ผู้จัดการ

---

## 🔄 Duplicate ID Card Logic

ถ้าเลขบัตรประชาชนซ้ำกับ agent เดิม:

```json
{
  "success": true,
  "message": "ลงทะเบียนและเปิดใช้งานบัญชีสำเร็จ แต่พบเลขบัตรประชาชนซ้ำ...",
  "data": {
    "agentCode": "AG015",
    "userStatus": "active",    // ✅ user เปิดใช้งาน
    "agentStatus": "inactive", // ⚠️ agent รอตรวจสอบ
    "requiresAdminReview": true
  }
}
```

ผู้ดูและบบต้องตรวจสอบ admin panel และอนุมัติ

---

## 🚀 Integration Examples

### JavaScript / Node.js

```javascript
const response = await fetch('http://localhost:4000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    firstName: 'สมชาย',
    lastName: 'ใจดี',
    email: 'agent@example.com',
    phone: '0812345678',
    idCard: '1234567890123',
    agentTypeCode: 'general'
  })
});

const result = await response.json();
console.log(result);
```

### Python

```python
import requests
import json

url = 'http://localhost:4000/api/auth/register'
payload = {
  'firstName': 'สมชาย',
  'lastName': 'ใจดี',
  'email': 'agent@example.com',
  'phone': '0812345678',
  'idCard': '1234567890123',
  'agentTypeCode': 'general'
}

response = requests.post(url, json=payload)
print(json.dumps(response.json(), indent=2, ensure_ascii=False))
```

### PHP

```php
<?php
$url = 'http://localhost:4000/api/auth/register';
$data = array(
  'firstName' => 'สมชาย',
  'lastName' => 'ใจดี',
  'email' => 'agent@example.com',
  'phone' => '0812345678',
  'idCard' => '1234567890123',
  'agentTypeCode' => 'general'
);

$options = array(
  'http' => array(
    'header' => 'Content-type: application/json\r\n',
    'method' => 'POST',
    'content' => json_encode($data)
  )
);

$context = stream_context_create($options);
$result = file_get_contents($url, false, $context);
echo $result;
?>
```

---

## 📚 ดูรายละเอียดเพิ่มเติมใน Swagger UI

เปิด: http://localhost:4000/api/docs

ที่นั่นจะเห็น:
- ✅ `/api/auth/register` ← แนะนำใช้
- `/api/auth/register-agent` ← ต้องการการอนุมัติ
- `/api/auth/activate-registration` ← ต้องการ JWT token

---

## 🎯 สรุปสั้น
- **ใช้เส้นนี้เสมอ**: `POST /api/auth/register`
- **ส่งแค่**: firstName, lastName, email, idCard, agentTypeCode (optional)
- **ได้กลับมา**: agent code, user status, agent status, login info
- **ไม่ต้อง**: activation token, admin approval (ยกเว้นดุกlicate ID card)
