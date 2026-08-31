const GeminiService = require('../services/gemini.service');
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middlewares/auth.middleware');
const multer = require('multer');

exports.generatePlan = async (req, res) => {
    try {
        const { bmi, weight, height, status, activity, mood, sleep } = req.body;

        const planText = await GeminiService.generateHealthPlan({
            bmi, weight, height, status, activity, mood, sleep
        });

        // If authenticated, record in database
        const authHeader = req.headers['authorization'];
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            try {
                const user = jwt.verify(token, JWT_SECRET);
                db.run(
                    `INSERT INTO bmi_history (user_id, bmi, weight, height, status) VALUES (?, ?, ?, ?, ?)`,
                    [user.id, bmi, weight, height, status]
                );
                db.run(
                    `INSERT INTO user_plans (user_id, plan_details) VALUES (?, ?)`,
                    [user.id, planText]
                );
            } catch (e) {
                console.error("Token verification or DB insert failed for generate-plan:", e);
            }
        }

        res.json({ plan: planText });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

exports.analyzeFood = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "กรุณาอัปโหลดรูปภาพ" });
        }

        const analysisText = await GeminiService.analyzeFoodImage(req.file.buffer, req.file.mimetype);

        // If authenticated, record in database
        const authHeader = req.headers['authorization'];
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            try {
                const user = jwt.verify(token, JWT_SECRET);
                db.run(
                    `INSERT INTO saved_foods (user_id, food_name, analysis) VALUES (?, ?, ?)`,
                    [user.id, "ภาพอาหาร", analysisText]
                );
            } catch (e) {
                console.error("Token verification or DB insert failed for analyze-food:", e);
            }
        }

        res.json({ analysis: analysisText });
    } catch (err) {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: "ไฟล์ใหญ่เกินไป (รองรับสูงสุด 5MB)" });
            }
        }
        console.error(err);
        res.status(500).json({ error: "AI ไม่สามารถวิเคราะห์รูปนี้ได้" });
    }
};

exports.chat = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || typeof message !== 'string' || message.trim() === '') {
            return res.status(400).json({ error: "กรุณาพิมพ์ข้อความก่อนส่งครับ" });
        }

        const reply = await GeminiService.chatWellness(message);
        res.json({ reply });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "AI Assistant is resting right now." });
    }
};
