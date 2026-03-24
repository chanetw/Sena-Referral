# Customer Unmatched Agent Report

รายงานนี้สรุปลูกค้าในไฟล์ `docs/ag_customer_final.xlsx` ที่อ้างอิง `agent_id_card` แล้วไม่พบในไฟล์ `docs/tbl_agent_clean_final.xlsx`

## สรุปภาพรวม

- ก่อนคัด test/placeholder: `61` แถว จาก `16` ค่า `agent_id_card`
- หลังคัด test/placeholder และใส่ mapping ที่ยืนยันได้: เหลือ `24` แถว จาก `2` ค่า `agent_id_card`
- ไฟล์รายละเอียดทุกแถว: [customer-unmatched-agent-details.csv](customer-unmatched-agent-details.csv)
- ไฟล์สรุปตาม `agent_id_card`: [customer-unmatched-agent-summary.csv](customer-unmatched-agent-summary.csv)
- ไฟล์สรุปตาม `project_id` และ `status`: [customer-unmatched-agent-project-status-summary.csv](customer-unmatched-agent-project-status-summary.csv)
- ไฟล์ override ที่ใช้กับสคริปต์: [../customer-agent-id-card-overrides.csv](../customer-agent-id-card-overrides.csv)
- ไฟล์ placeholder/test ที่ให้ข้าม: [../customer-placeholder-agent-id-cards.csv](../customer-placeholder-agent-id-cards.csv)
- ไฟล์เคสที่ยังต้อง review ด้วยมือ: [customer-agent-manual-review.csv](customer-agent-manual-review.csv)

## ผลหลังใช้กฎใหม่

- สคริปต์ `009-upsert-customers.py` จะข้าม placeholder/test rows อัตโนมัติ `34` แถว
- สคริปต์จะ map `agent_id_card` อัตโนมัติ `3` แถว
- dry-run ล่าสุดเหลือ unresolved จริงแค่:
  - `3300200585772` จำนวน `22` แถว
  - `3100502564893` จำนวน `2` แถว

## ข้อสังเกตหลัก

- กลุ่มใหญ่สุดมี 2 ค่า คือ `3300200585772` และ `test` อย่างละ `22` แถว
- ค่า `test`, `999`, `4444`, `45874887`, `0000000000000` มีลักษณะเป็นข้อมูลทดสอบหรือ placeholder ชัดเจน
- บางค่าเป็นไปได้สูงว่าเป็นการพิมพ์ผิดเพียง 1 หลัก เช่น:
  - `1409900046068` -> น่าจะเป็น `1409900046069`
  - `3609700947350` -> น่าจะเป็น `3609700047350`
  - `1103701567104` -> น่าจะเป็น `1103701567140`
- ค่าที่ควรตรวจ manual เพิ่มคือ `3300200585772` เพราะมีจำนวนมากและ candidate ที่ใกล้ที่สุดคือ `3302000958771`

## กลุ่มที่ต้องตัดสินใจ

| agent_id_card | rows | candidate ที่ใกล้เคียง | แนวทางแนะนำ |
| --- | ---: | --- | --- |
| `3300200585772` | 22 | `3302000958771` | ตรวจว่าเป็นการพิมพ์ผิดแล้ว map ได้หรือไม่ |
| `test` | 22 | - | น่าจะเป็นข้อมูลทดสอบ ควรข้ามหรือคัดออก |
| `3100502564893` | 2 | `3100502642681` | ตรวจบัตร agent จริงก่อน map |
| `3652400125412` | 2 | `3620401125113` | ดูจากชื่อลูกค้าแล้วมีลักษณะเป็น test/system data |
| `999` | 2 | - | ข้อมูลทดสอบ ควรข้าม |
| `0000000000000` | 1 | - | ข้อมูล placeholder ควรข้าม |
| `1103701567104` | 1 | `1103701567140` | น่าจะพิมพ์ผิด 1 หลัก ตรวจแล้ว map ได้ |
| `1409900046068` | 1 | `1409900046069` | น่าจะพิมพ์ผิด 1 หลัก ตรวจแล้ว map ได้ |
| `2548145258965` | 1 | - | ดูเหมือน test data |
| `3111100000333` | 1 | - | ดูเหมือน test data |
| `3609700947350` | 1 | `3609700047350` | น่าจะพิมพ์ผิด 1 หลัก ตรวจแล้ว map ได้ |
| `3920400` | 1 | - | ดูเหมือน test/placeholder |
| `3920400000000` | 1 | - | ดูเหมือน test/placeholder |
| `3965555555555` | 1 | - | ดูเหมือน test/placeholder |
| `4444` | 1 | - | ข้อมูลทดสอบ ควรข้าม |
| `45874887` | 1 | - | ข้อมูลทดสอบ ควรข้าม |

## จุดกระจุกของปัญหา

กลุ่ม `project_id` และ `status` ที่เจอมากสุด:

| project_id | status | rows |
| --- | --- | ---: |
| `19` | `inactive` | 8 |
| `21` | `inactive` | 6 |
| `22` | `inactive` | 4 |
| `29` | `active` | 3 |
| `21` | `active` | 3 |

## แนวทางตัดสินใจก่อน apply จริง

1. ตัดสินใจค่า `3300200585772` ว่าจะผูกไปที่ `3302000958771` หรือไม่
2. ตัดสินใจค่า `3100502564893` ว่าจะผูกไปที่ `3100502642681` หรือไม่
3. ถ้ายังไม่ยืนยัน 2 ค่านี้ ให้ apply ได้โดยข้าม `24` แถวนี้ไปก่อน

## หมายเหตุ

- ถ้าจะ import ตอนนี้ด้วยกฎล่าสุด สคริปต์ customer จะข้าม placeholder/test `34` แถว และยังค้าง unresolved `24` แถว
- ถ้าต้องการรอบถัดไป ผมสามารถทำไฟล์ mapping ให้โดยตรงในรูปแบบ `old_agent_id_card -> new_agent_id` เพื่อใช้ apply แบบควบคุมได้