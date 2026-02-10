const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const multer = require('multer');

const app = express();
app.use(cors());
app.use(express.json());

//ตั้งค่าการเก็บไฟล์รูปภาพชั่วคราว
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/generate-plan', async (req, res) => {
    try {
        const { bmi, weight, height, status } = req.body;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
        });

        const prompt = `ในฐานะผู้เชี่ยวชาญด้านสุขภาพจากโปรเจกต์ NeWGen NewME 
        ผู้ใช้มีค่า BMI: ${bmi} (${status}), น้ำหนัก: ${weight}kg, ส่วนสูง: ${height}cm.
        ช่วยแนะนำ:
        1. แผนการกิน (มื้อเช้า, กลางวัน, เย็น)
        2. แผนการออกกำลังกาย 3 ท่า
        ตอบเป็นภาษาไทย โดยใช้หัวข้อและ Bullet point ให้ชัดเจน และเน้นความปลอดภัย`;

        const result = await model.generateContent(prompt);
        const response = await result.response;

        res.json({ plan: response.text() });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/analyze-food', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "กรุณาอัปโหลดรูปภาพ" });
        }

        // ประมวลผลรูปภาพ
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const imagePart = {
            inlineData: {
                data: req.file.buffer.toString("base64"),
                mimeType: req.file.mimetype
            }
        };

        const prompt = `ในฐานะนักโภชนาการจาก NeWGen NewME ช่วยวิเคราะห์รูปอาหารนี้:
        1. ชื่ออาหารคืออะไร?
        2. ประมาณการแคลอรี่ (kcal)
        3. สารอาหารหลัก (โปรตีน, คาร์บ, ไขมัน)
        4. คำแนะนำสุขภาพสั้นๆ
        ตอบเป็นภาษาไทยและใช้ Bullet point`;

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        
        res.json({ analysis: response.text() });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "AI ไม่สามารถวิเคราะห์รูปนี้ได้" });
    }
});

app.listen(5000, () => {
  console.log("✅ Server running on http://localhost:5000");
});

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// ตั้งค่าการเชื่อมต่อ
const dbConfig = {
    host: 'db', // ชื่อ service ใน docker-compose
    user: 'root',
    password: 'rootpassword',
    database: 'newgen_db'
};

// API สำหรับสมัครสมาชิก (เพิ่มเข้าไปใน server.js เดิม)
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10); // เข้ารหัสลับ

        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );
        res.json({ status: "success", message: "ลงทะเบียนเรียบร้อย" });
    } catch (err) {
        res.status(500).json({ error: "อีเมลนี้มีในระบบแล้ว" });
    }
});

// API สำหรับ Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (rows.length > 0) {
            const match = await bcrypt.compare(password, rows[0].password);
            if (match) {
                res.json({ status: "success", user: rows[0].username });
            } else {
                res.status(401).json({ message: "รหัสผ่านไม่ถูกต้อง" });
            }
        } else {
            res.status(404).json({ message: "ไม่พบผู้ใช้นี้" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});