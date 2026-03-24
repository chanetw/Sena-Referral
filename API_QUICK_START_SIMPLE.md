คู่มือย่อสุดง่าย — สร้างผู้ใช้พร้อมเปิดใช้งาน (สำหรับผู้ที่ไม่ชำนาญ)

1) เริ่มระบบ (ในโฟลเดอร์โปรเจกต์):

```bash
docker-compose up -d --build
```

2) ดูเอกสาร API (Swagger):

- เปิด: http://localhost:4000/api/docs

3) ทดสอบแบบเร็ว (สองวิธี):

- วิธีที่ 1 — ใช้ Postman:
  - เปิดไฟล์: `postman/Register-RegisterAPI.postman_collection.json`
  - Import ใน Postman → แก้ `baseUrl` เป็น `http://localhost:4000` → แก้ `registerApiKey` ให้เป็นค่า `REGISTER_API_KEY` จากไฟล์ `backend/.env`
  - รันคำขอ `Register and Activate`

- วิธีที่ 2 — ใช้แบบฟอร์ม HTML (ง่ายมาก):
  - เปิดไฟล์: `docs/register_form.html` ในเบราว์เซอร์
  - วาง `REGISTER_API_KEY` ลงในช่อง "API Key"
  - กรอกข้อมูลชื่อ-สกุล-อีเมล-บัตรประชาชน-โทรศัพท์ → กด "ส่งคำขอ"

4) คำตอบที่คาดหวัง:
- 201: สร้างสำเร็จ (ผู้ใช้เป็น active และ agent เป็น active)
- 401: ขาดหรือไม่ถูกต้อง `X-Api-Key`
- 400/409: ค่า input ซ้ำหรือมี validation fail

5) หมายเหตุความปลอดภัย:
- อย่าเก็บ `REGISTER_API_KEY` ในหน้าเว็บสาธารณะ
- สำหรับ production ให้จัดเก็บคีย์ในระบบจัดการความลับและจำกัดการเข้าถึง (IP whitelist)

ไฟล์ที่สร้างให้:
- `postman/Register-RegisterAPI.postman_collection.json`
- `docs/register_form.html`

ต้องการให้ผมสร้างไฟล์ Postman Collection แบบที่มีตัวแปร environment พร้อมตัวอย่างอีกหรือให้ผมทำไฟล์ HTML ที่เก็บคีย์แบบปลอดภัย (needs server-side)? บอกได้เลยครับ.