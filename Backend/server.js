const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/generate-plan', async (req, res) => {
    try {
        const { bmi, weight, height, status } = req.body;
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `ในฐานะผู้เชี่ยวชาญด้านสุขภาพจากโปรเจกต์ NeWGen NewME 
        ผู้ใช้มีค่า BMI: ${bmi} (${status}), น้ำหนัก: ${weight}kg, ส่วนสูง: ${height}cm.
        ช่วยออกแบบแผนดังนี้ในรูปแบบ JSON:
        1. แผนการกิน (Nutrition Plan): แบ่งเป็น มื้อเช้า, กลางวัน, เย็น
        2. แผนการออกกำลังกาย (Workout Plan): แนะนำ 3 ท่าที่เหมาะสม
        *ตอบเป็นภาษาไทยและเน้นความปลอดภัย*`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        res.json({ plan: response.text() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(5000, () => console.log('Server running on port 5000'));