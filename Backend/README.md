# 🟢 NeWGen NewME - Backend API (Modular Architecture)

Backend API Service สำหรับระบบ NeWGen NewME พัฒนาด้วย Node.js, Express และ Google Gemini 2.5 Flash

---

## 🚀 ฟีเจอร์หลัก (Features)
- 🍲 **AI Food Analysis:** สแกนภาพอาหารและวิเคราะห์คุณค่าทางโภชนาการ (kcal, protein, carbs, fat)
- 🏋️ **AI Fitness Plan Generator:** สร้างแผนสุขภาพและตารางออกกำลังกายเฉพาะบุคคล
- 💬 **AI Wellness Assistant:** แชทบอทตอบคำถามด้านสุขภาพ
- 🔐 **Authentication & Security:** JWT Token, Bcrypt password hashing, Rate Limiting
- 💧 **Daily Tracking & Analytics:** บันทึกการดื่มน้ำ, การนอนหลับ, และสถิติสุขภาพ
- ⚡ **Dual Database Engine:** รองรับทั้ง MySQL และ SQLite (Auto-fallback)

---

## 🛠️ วิธีการติดตั้งและรัน (Getting Started)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. ตั้งค่า Environment Variables
สร้างไฟล์ `.env`:
```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=newgen_db
DB_PORT=3306
```

### 3. รัน Server
```bash
npm run dev
# หรือ
npm start
```
*API จะเปิดใช้งานที่ `http://localhost:5000`*
