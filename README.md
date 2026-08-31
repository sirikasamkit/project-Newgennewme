# 🌟 NeWGen NewME — AI-Powered Smart Wellness Platform (v2.0)

แพลตฟอร์มดูแลสุขภาพอัจฉริยะแบบครบวงจร พัฒนาด้วยสถาปัตยกรรม **Modular Backend (Node.js & Express)** และ **Modern Frontend SPA (React + Vite)** ขับเคลื่อนด้วยขุมพลัง **Google Gemini 2.5 Flash**

---

## 🚀 จุดเด่นของเวอร์ชัน 2.0 (New Features & Architecture)

- ⚡ **Single Page Application (SPA):** ลดความซ้ำซ้อน เหลือเพียง `index.html` ไฟล์เดียว สลับหน้าจอรวดเร็ว ไร้การ Refresh กระพริบ
- 🎨 **Modern Design System:** รองรับ Dark / Light Mode, Glassmorphism, Responsive บนมือถือและเดสก์ท็อป
- 🍲 **AI Food Vision:** อัปโหลดหรือถ่ายรูปอาหารเพื่อวิเคราะห์พลังงาน (kcal) และสารอาหารหลัก
- 🏋️ **Personalized Fitness & Diet Planner:** สร้างแผนออกกำลังกายและมื้ออาหารเฉพาะบุคคล พร้อมลิงก์คลิปสาธิต YouTube
- 💧 **Daily Health & Habit Tracker:** บันทึกการดื่มน้ำ (8 แก้ว), การนอนหลับ และสถิติอารมณ์
- 💬 **Interactive Wellness Chat Assistant:** ถาม-ตอบปัญหาสุขภาพกับ AI แบบเรียลไทม์
- 🛡️ **Modular Backend Architecture:** แบ่งแยก Routes, Controllers, Middlewares, Services และ Database ออกจากกันอย่างเป็นระบบ

---

## 📁 โครงสร้างโปรเจกต์ (Project Directory)

```
project-Newgennewme/
├── .env.example                  # ตัวอย่างการตั้งค่า Environment Variables
├── docker-compose.yml            # รันระบบ Full-Stack ผ่าน Docker
├── Backend/                      # 🟢 Express Modular API
│   ├── package.json
│   ├── server.js                 # Entry point
│   └── src/
│       ├── server.js             # Server App setup & Error handler
│       ├── config/               # db.js, gemini.js
│       ├── middlewares/          # auth, rateLimiter, upload
│       ├── controllers/          # auth, ai, user, admin
│       ├── routes/               # auth, ai, user, admin, index.js
│       └── services/             # gemini.service.js
│
└── Frontend/                     # 🔵 React + Vite SPA
    ├── index.html                # 📄 Single HTML Entry Point
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx               # Main SPA Layout & State Router
        ├── main.jsx
        ├── context/              # AuthContext (JWT & Profile state)
        ├── services/             # Centralized API client (api.js)
        ├── components/           # Navbar, Footer, AuthModal, BugReportModal
        ├── pages/                # Home, FoodScan, PlanGen, Chat, History, Profile, Admin, About
        └── styles/               # index.css (Theme tokens & Glassmorphism)
```

---

## 🛠️ วิธีการรันโปรเจกต์ (How to Run)

### 1. การตั้งค่า Environment Variables
สร้างไฟล์ `.env` ในโฟลเดอร์ `Backend/` โดยคัดลอกจาก `.env.example`:
```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=newgen_super_secret_key
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=newgen_db
DB_PORT=3306
```

### 2. รัน Backend API
```bash
cd Backend
npm install
npm run dev
```
*API จะทำงานที่: `http://localhost:5000`*

### 3. รัน Frontend Web App
```bash
cd Frontend
npm install
npm run dev
```
*หน้าเว็บจะเปิดที่: `http://localhost:3000`*

---

## 🐳 หรือรันผ่าน Docker Compose
```bash
docker-compose up --build
```
