# Claude Code Configuration

## Environment Variables

```bash
export ANTHROPIC_BASE_URL=https://api.z.ai/api/andthropic
export ANTHROPIC_AUTH_TOKEN=aeb4353df3f844d595ab96b07bb5bc6e.WaL6qUNjfWTrr0Yh
```

## คำสั่งเรียกใช้ Claude Code

### วิธีที่ 1: รันครั้งเดียว
```bash
ANTHROPIC_BASE_URL=https://api.z.ai/api/andthropic ANTHROPIC_AUTH_TOKEN=aeb4353df3f844d595ab96b07bb5bc6e.WaL6qUNjfWTrr0Yh claude
```

### วิธีที่ 2: Set ไว้ใช้งานตลอด (แนะนำ)
```bash
echo 'export ANTHROPIC_BASE_URL=https://api.z.ai/api/andthropic' >> ~/.zshrc
echo 'export ANTHROPIC_AUTH_TOKEN=aeb4353df3f844d595ab96b07bb5bc6e.WaL6qUNjfWTrr0Yh' >> ~/.zshrc
source ~/.zshrc
claude
```

### วิธีที่ 3: รันในโปรเจคปัจจุบันโดยตรง
```bash
ANTHROPIC_BASE_URL=https://api.z.ai/api/andthropic ANTHROPIC_AUTH_TOKEN=aeb4353df3f844d595ab96b07bb5bc6e.WaL6qUNjfWTrr0Yh claude --cd "/Users/nk-lamy/Desktop/Coding/referral-new/V2manit/Projectrefer"
```

## ตรวจสอบสถานะการตั้งค่า
```bash
echo $ANTHROPIC_BASE_URL
echo $ANTHROPIC_AUTH_TOKEN
```
"keyword"
ANTHROPIC_BASE_URL=https://api.z.ai/api/andthropic ANTHROPIC_AUTH_TOKEN=aeb4353df3f844d595ab96b07bb5bc6e.WaL6qUNjfWTrr0Yh claude
---
*สร้างเมื่อ: 2025-10-16*