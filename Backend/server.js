const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { GoogleGenerativeAI } = require("@google/generative-ai");
const multer = require('multer');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit'); // Moved to top-level

const app = express();
app.set('trust proxy', 1); // Enable trusting proxy for rate limiting (needed for Ngrok)
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Crash Recovery & Logging
process.on('uncaughtException', (err) => {
    console.error('💥 UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

// Rate Limiter for Login (Max 10 attempts per 15 minutes)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: "เข้าสู่ระบบผิดพลาดบ่อยเกินไป กรุณารอ 15 นาทีแล้วลองใหม่" },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate Limiter for Register (Max 5 requests per hour)
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { error: "สมัครสมาชิกบ่อยเกินไป กรุณารอ 1 ชั่วโมงแล้วลองใหม่" },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate Limiter for Forgot Password (Max 5 requests per 15 minutes)
const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: "คำขอรีเซ็ตรหัสผ่านบ่อยเกินไป กรุณารอ 15 นาทีแล้วลองใหม่" },
    standardHeaders: true,
    legacyHeaders: false,
});

// (ไม่ได้เสิร์ฟไฟล์ Frontend จาก Backend แล้ว เนื่องจากแยก Frontend ไปไว้ที่ Netlify)
// app.use(express.static(path.join(__dirname, '../Frontend')));

// ตั้งค่าการเก็บไฟล์รูปภาพชั่วคราว
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // จำกัดขนาดไฟล์ที่ 5 MB
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const JWT_SECRET = process.env.JWT_SECRET || 'newgen_super_secret_key';

if (JWT_SECRET === 'newgen_super_secret_key') {
    console.log('⚠️  WARNING: Using default JWT_SECRET. Do not use this in production!');
}

// ==========================================
// Database Setup (MySQL)
// ==========================================

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'newgen_db',
    port: process.env.DB_PORT || 3306,
    ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Could not connect to MySQL database:', err.message);
    } else {
        console.log('✅ Connected to MySQL database');
        connection.release();
    }
});

// Wrapper function เพื่อให้คำสั่ง db เดิมใช้งานกับ MySQL ได้โดยไม่ต้องแก้โค้ดใหม่ทั้งหมด
const db = {
    run: (sql, params, callback) => {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        pool.query(sql, params || [], function (err, results) {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    err.message = 'UNIQUE constraint failed';
                }
                if (callback) return callback(err);
                return;
            }
            if (callback) {
                callback.call({ lastID: results.insertId, changes: results.affectedRows }, null);
            }
        });
    },
    get: (sql, params, callback) => {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        pool.query(sql, params || [], (err, results) => {
            if (err) return callback(err);
            callback(null, results && results.length > 0 ? results[0] : null);
        });
    },
    all: (sql, params, callback) => {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        pool.query(sql, params || [], (err, results) => {
            if (err) return callback(err);
            callback(null, results || []);
        });
    },
    serialize: (callback) => {
        callback();
    }
};

// สร้างตารางแบบ MySQL
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        age INT,
        gender VARCHAR(50),
        weight FLOAT,
        height FLOAT,
        goal_weight FLOAT,
        activity VARCHAR(50) DEFAULT 'general',
        is_admin TINYINT DEFAULT 0,
        profile_image LONGTEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS bmi_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        bmi FLOAT,
        weight FLOAT,
        height FLOAT,
        status VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS saved_foods (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        food_name VARCHAR(255),
        calories INT,
        analysis TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS user_plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        plan_details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS bug_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255),
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS daily_tracking (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        date DATE,
        water_intake INT DEFAULT 0,
        sleep_hours FLOAT DEFAULT 0,
        mood VARCHAR(50),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY user_date (user_id, date),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);
});

// ==========================================
// Middlewares
// ==========================================

// Middleware สำหรับตรวจสอบ Token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // เบราว์เซอร์ส่งมารูปแบบ: Bearer TOKEN_STR

    if (token == null) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Forbidden (Invalid Token)" });
        req.user = user;
        next();
    });
};

// Middleware ตรวจสอบความเป็น Admin
const authenticateAdmin = (req, res, next) => {
    authenticateToken(req, res, () => {
        if (req.user.is_admin !== 1) {
            return res.status(403).json({ error: "Access Denied: Admins Only" });
        }
        next();
    });
};

// ==========================================
// AI & Feature Routes
// ==========================================

// Route เริ่มต้นสำหรับเช็คสถานะเซิร์ฟเวอร์
app.get('/', (req, res) => {
    res.json({ status: "online", message: "NeWGen NewME API is running!" });
});

app.post('/api/generate-plan', async (req, res) => {
    try {
        const { bmi, weight, height, status, activity, mood, sleep } = req.body;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
        });

        let activityContext = "";
        if (activity === 'bodybuilder') {
            activityContext = " ผู้ใช้ต้องการเน้นสร้างกล้ามเนื้อสไตล์นักเพาะกาย (Bodybuilder) อาหารต้องเน้นโปรตีนแบบจัดเต็ม และตารางฝึกต้องเน้น Hypertrophy/Weight Training";
        }

        let behaviorContext = "";
        if (mood === 'tired' || mood === 'stressed') {
            behaviorContext += ` ขณะนี้ผู้ใช้รู้สึก ${mood === 'tired' ? 'เหนื่อย' : 'เครียด'} ควรแนะนำแผนที่ช่วยผ่อนคลายหรือลดความตึงเครียดลงบ้าง`;
        }
        if (sleep && sleep !== 'not-specified' && parseInt(sleep) < 7) {
            behaviorContext += ` ผู้ใช้นอนน้อยเพียง ${sleep} ชม. ควรเน้นการพักผ่อน (Recovery) และเลี่ยงกิจกรรมที่หักโหมเกินไปในวันนี้`;
        }

        const prompt = `ในฐานะผู้เชี่ยวชาญด้านสุขภาพจากโปรเจกต์ NeWGen NewME 
        ผู้ใช้มีค่า BMI: ${bmi} (${status}), น้ำหนัก: ${weight}kg, ส่วนสูง: ${height}cm.${activityContext}${behaviorContext}
        ช่วยแนะนำ:
        1. แผนการกิน (มื้อเช้า, กลางวัน, เย็น)
        2. แผนการออกกำลังกาย 3 ท่า โดยสำหรับแต่ละท่า ให้ระบุ:
           - วิธีสาธิตขั้นตอนการทำ (Step-by-step)
           - คำแนะนำด้านความปลอดภัย
           - และแนบลิงก์สำหรับค้นหาวีดีโอตัวอย่างใน YouTube ในรูปแบบ [🎬 คลิกเพื่อดูคลิปสาธิตท่านี้](https://www.youtube.com/results?search_query=วิธีทำท่า+ชื่อท่าภาษาไทย+และภาษาอังกฤษ)
        ตอบเป็นภาษาไทย โดยมุ่งเน้นความสวยงามของเนื้อหา ใช้ Bullet point และตัวหนา (**ข้อความ**) ให้ดูพรีเมียม`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const planText = response.text();

        // ตรวจสอบ Authorization ถ้ามี token ให้บันทึกประวัติ
        const authHeader = req.headers['authorization'];
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            try {
                const user = jwt.verify(token, JWT_SECRET);
                db.run(`INSERT INTO bmi_history (user_id, bmi, weight, height, status) VALUES (?, ?, ?, ?, ?)`,
                    [user.id, bmi, weight, height, status]);
                db.run(`INSERT INTO user_plans (user_id, plan_details) VALUES (?, ?)`,
                    [user.id, planText]);
            } catch (e) {
                console.error("Token verification or DB insert failed for generate-plan:", e);
            }
        }

        res.json({ plan: planText });

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
        const response = result.response;
        const analysisText = response.text();

        // ตรวจสอบ Authorization ถ้ามี token ให้บันทึกประวัติ
        const authHeader = req.headers['authorization'];
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            try {
                const user = jwt.verify(token, JWT_SECRET);
                db.run(`INSERT INTO saved_foods (user_id, food_name, analysis) VALUES (?, ?, ?)`,
                    [user.id, "ภาพอาหาร", analysisText]);
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
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        // Bug fix #1: Validate message is not empty before calling AI
        if (!message || typeof message !== 'string' || message.trim() === '') {
            return res.status(400).json({ error: "กรุณาพิมพ์ข้อความก่อนส่งครับ" });
        }

        // Security: Sanitize input — limit length and strip injection-prone characters
        const sanitizedMessage = message.trim().substring(0, 500).replace(/[`'"\\]/g, '');

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `คุณคือ NeWGen AI ผู้ช่วยอัจฉริยะด้านสุขภาพและความงาม (Wellness Assistant)
        หน้าที่ของคุณคือตอบคำถามเกี่ยวกับสุขภาพ การออกกำลังกาย โภชนาการ และการดูแลตัวเอง 
        คำถามจากผู้ใช้: "${sanitizedMessage}"
        
        คำแนะนำ:
        - ตอบอย่างเป็นกันเองและเป็นบวก
        - ถ้าผู้ใช้ถามเรื่องโภชนาการ ให้เน้นความสมดุล
        - ถ้าเป็นคำถามทางการแพทย์ที่ร้ายแรง ให้แนะนำให้ปรึกษาแพทย์
        - พยายามใช้ Bullet point เพื่อให้อ่านง่าย
        - ใช้ภาษาไทยที่ดูพรีเมียมและสุภาพ`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        res.json({ reply: response.text() });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "AI Assistant is resting right now." });
    }
});

// ==========================================
// Auth & User Routes
// ==========================================

// API สำหรับสมัครสมาชิก
app.post('/api/register', registerLimiter, async (req, res) => {
    const { username, email, password } = req.body;

    // ตรวจสอบความถูกต้องของ Input เบื้องต้น
    if (!username || !email || !password) {
        return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "รูปแบบอีเมลไม่ถูกต้อง" });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
        db.run(sql, [username, email, hashedPassword], function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: "อีเมลนี้มีผู้ใช้งานแล้ว" });
                }
                return res.status(500).json({ error: err.message });
            }
            res.json({ status: "success", message: "ลงทะเบียนเรียบร้อย", userId: this.lastID });
        });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// API สำหรับ Login
app.post('/api/login', loginLimiter, (req, res) => {
    const { email, password } = req.body;

    // ตรวจสอบความถูกต้องของ Input เบื้องต้น
    if (!email || !password) {
        return res.status(400).json({ message: "กรุณากรอกอีเมลและรหัสผ่าน" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "รูปแบบอีเมลไม่ถูกต้อง" });
    }

    const sql = `SELECT * FROM users WHERE email = ?`;
    db.get(sql, [email], async (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (row) {
            try {
                const match = await bcrypt.compare(password, row.password);
                if (match) {
                    // สร้าง JWT Token
                    const token = jwt.sign(
                        { id: row.id, username: row.username, email: row.email, is_admin: row.is_admin },
                        JWT_SECRET,
                        { expiresIn: '7d' }
                    );

                    // ส่ง token แทนการส่งแค่ username
                    res.json({ status: "success", user: row.username, token: token, is_admin: row.is_admin });
                } else {
                    res.status(401).json({ message: "รหัสผ่านไม่ถูกต้อง" });
                }
            } catch (compareError) {
                console.error("Bcrypt Compare Error:", compareError);
                return res.status(500).json({ message: "เกิดข้อผิดพลาดในการตรวจสอบรหัสผ่าน" });
            }
        } else {
            res.status(404).json({ message: "ไม่พบผู้ใช้นี้" });
        }
    });
});

// API สำหรับตรวจสอบว่ามีอีเมลนี้ในระบบหรือไม่ (ลืมรหัสผ่าน ขั้นตอนที่ 1)
app.post('/api/check-email', forgotPasswordLimiter, (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: "กรุณากรอกอีเมล" });
    }

    const sql = `SELECT * FROM users WHERE email = ?`;
    db.get(sql, [email], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) {
            res.json({ status: "success", message: "มีอีเมลนี้ในระบบ" });
        } else {
            res.status(404).json({ message: "ไม่พบอีเมลนี้ในระบบ" });
        }
    });
});

// API สำหรับรีเซ็ตรหัสผ่าน (ลืมรหัสผ่าน ขั้นตอนที่ 2)
app.post('/api/reset-password', forgotPasswordLimiter, async (req, res) => {
    const { email, new_password } = req.body;

    if (!email || !new_password) {
        return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    // Bug fix #2: Validate new password length (same as register)
    if (new_password.length < 6) {
        return res.status(400).json({ error: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร" });
    }

    try {
        const hashedPassword = await bcrypt.hash(new_password, 10);
        const sql = `UPDATE users SET password = ? WHERE email = ?`;
        db.run(sql, [hashedPassword, email], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes > 0) {
                res.json({ status: "success", message: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว" });
            } else {
                res.status(404).json({ message: "ไม่พบอีเมลนี้ในระบบ" });
            }
        });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// ==========================================
// Protected User Routes
// ==========================================

// ดึงข้อมูลโปรไฟล์ (ไม่ส่ง profile_image ที่อาจ Base64 ใหญ่)
app.get('/api/profile', authenticateToken, (req, res) => {
    const sql = `SELECT id, username, email, age, gender, weight, height, goal_weight, activity, is_admin, created_at FROM users WHERE id = ?`;
    db.get(sql, [req.user.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) res.json(row);
        else res.status(404).json({ message: "User not found" });
    });
});

// ดึงเฉพาะรูปโปรไฟล์ (endpoint แยก เพื่อไม่ให้ Base64 ขนาดใหญ่ติดค้างเอ้ API call ทั่วไป)
app.get('/api/profile/image', authenticateToken, (req, res) => {
    db.get(`SELECT profile_image FROM users WHERE id = ?`, [req.user.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ profile_image: row ? row.profile_image : null });
    });
});

// อัปเดตข้อมูลโปรไฟล์
app.put('/api/profile', authenticateToken, (req, res) => {
    const { username, age, gender, weight, height, goal_weight, activity, profile_image } = req.body;

    // Input Validation — username ใช้ fallback จาก token ถ้าว่าง
    const safeUsername = (username || req.user.username || '').trim();
    if (!safeUsername || safeUsername.length < 1 || safeUsername.length > 50) {
        return res.status(400).json({ error: "ชื่อผู้ใช้ไม่ถูกต้อง (1-50 ตัวอักษร)" });
    }
    const safeAge = age !== undefined && age !== '' ? parseInt(age) : null;
    if (safeAge !== null && (isNaN(safeAge) || safeAge < 1 || safeAge > 120)) {
        return res.status(400).json({ error: "อายุต้องเป็นตัวเลข 1-120" });
    }
    const safeWeight = weight !== undefined && weight !== '' ? parseFloat(weight) : null;
    if (safeWeight !== null && (isNaN(safeWeight) || safeWeight < 1 || safeWeight > 500)) {
        return res.status(400).json({ error: "น้ำหนักต้องเป็นตัวเลข 1-500" });
    }
    const safeHeight = height !== undefined && height !== '' ? parseFloat(height) : null;
    if (safeHeight !== null && (isNaN(safeHeight) || safeHeight < 50 || safeHeight > 300)) {
        return res.status(400).json({ error: "ส่วนสูงต้องเป็นตัวเลข 50-300" });
    }
    const safeGoalWeight = goal_weight !== undefined && goal_weight !== '' ? parseFloat(goal_weight) : null;
    if (safeGoalWeight !== null && (isNaN(safeGoalWeight) || safeGoalWeight < 1 || safeGoalWeight > 500)) {
        return res.status(400).json({ error: "น้ำหนักเป้าหมายต้องเป็นตัวเลข 1-500" });
    }
    const allowedGenders = ['male', 'female', 'other', ''];
    if (gender !== undefined && !allowedGenders.includes(gender)) {
        return res.status(400).json({ error: "ข้อมูลเพศไม่ถูกต้อง" });
    }
    const allowedActivities = ['general', 'bodybuilder'];
    if (activity !== undefined && !allowedActivities.includes(activity)) {
        return res.status(400).json({ error: "ข้อมูลประเภทกิจกรรมไม่ถูกต้อง" });
    }

    // Log payload size for debugging
    if (profile_image) {
        console.log(`📸 Profile update request received. Image size: ${(profile_image.length / 1024).toFixed(2)} KB`);
    }

    // อัปเดตข้อมูลผู้ใช้ (รวม Username และ Profile Image)
    const sql = `UPDATE users SET username = ?, age = ?, gender = ?, weight = ?, height = ?, goal_weight = ?, activity = ?, profile_image = ? WHERE id = ?`;
    db.run(sql, [safeUsername, safeAge, gender || null, safeWeight, safeHeight, safeGoalWeight, activity || 'general', profile_image || null, req.user.id], function (err) {
        if (err) {
            console.error('❌ Database error updating profile:', err);
            return res.status(500).json({ error: err.message });
        }
        console.log('✅ Profile updated successfully for user:', req.user.id);
        res.json({ status: "success", message: "Profile updated" });
    });
});

// ดึงประวัติการใช้งาน
app.get('/api/history', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const offset = (page - 1) * limit;

    try {
        const queryDB = (sql, params) => {
            return new Promise((resolve, reject) => {
                db.all(sql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        };

        const [bmiRows, foodRows, planRows] = await Promise.all([
            queryDB(`SELECT id, bmi, weight, height, status, created_at FROM bmi_history WHERE user_id = ? ORDER BY id DESC LIMIT ? OFFSET ?`, [userId, limit + 1, offset]),
            queryDB(`SELECT id, food_name, analysis, created_at FROM saved_foods WHERE user_id = ? ORDER BY id DESC LIMIT ? OFFSET ?`, [userId, limit + 1, offset]),
            queryDB(`SELECT id, plan_details, created_at FROM user_plans WHERE user_id = ? ORDER BY id DESC LIMIT ? OFFSET ?`, [userId, limit + 1, offset])
        ]);

        const hasMore = (bmiRows.length > limit || foodRows.length > limit || planRows.length > limit);

        res.json({
            bmi: bmiRows.slice(0, limit),
            foods: foodRows.slice(0, limit),
            plans: planRows.slice(0, limit),
            hasMore,
            page
        });
    } catch (err) {
        console.error("Error fetching history:", err);
        res.status(500).json({ error: "Failed to fetch user history" });
    }
});

// ==========================================
// Bug Report Endpoint
// ==========================================

// (ตาราง bug_reports ย้ายไปสร้างรวมกันที่ Database Setup แล้ว)

const reportLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { error: "ส่งรายงานบ่อยเกินไป กรุณารอ 1 ชั่วโมง" },
    standardHeaders: true,
    legacyHeaders: false,
});

app.post('/api/report', reportLimiter, (req, res) => {
    const { email, message } = req.body;
    if (!message || message.trim().length < 5) {
        return res.status(400).json({ error: "กรุณาอธิบายปัญหาที่พบ (อย่างน้อย 5 ตัวอักษร)" });
    }
    const safeEmail = typeof email === 'string' ? email.trim().substring(0, 200) : null;
    const safeMsg = message.trim().substring(0, 2000);
    db.run(`INSERT INTO bug_reports (email, message) VALUES (?, ?)`, [safeEmail, safeMsg], function (err) {
        if (err) {
            console.error('❌ Bug report DB error:', err);
            return res.status(500).json({ error: 'บันทึกรายงานไม่สำเร็จ' });
        }
        console.log(`🐛 Bug report #${this.lastID} received: ${safeMsg.substring(0, 80)}...`);
        res.json({ status: 'success', message: 'ทีมงานได้รับรายงานแล้วครับ ขอบคุณมาก!' });
    });
});

// ==========================================
// Admin Backend Systems
// ==========================================

// API ดึงข้อมูลสถิติรวมสำหรับ Dashboard แอดมิน
app.get('/api/admin/stats', authenticateAdmin, (req, res) => {
    let stats = { totalUsers: 0, totalScans: 0, totalPlans: 0, totalBMICalcs: 0 };
    let completed = 0;
    const checkDone = () => {
        completed++;
        if (completed === 4) res.json(stats);
    }

    // Bug fix #3: Added null-safety check for row before accessing row.c
    db.get('SELECT COUNT(*) as c FROM users', (err, row) => { if (!err && row) stats.totalUsers = row.c; checkDone(); });
    db.get('SELECT COUNT(*) as c FROM saved_foods', (err, row) => { if (!err && row) stats.totalScans = row.c; checkDone(); });
    db.get('SELECT COUNT(*) as c FROM user_plans', (err, row) => { if (!err && row) stats.totalPlans = row.c; checkDone(); });
    db.get('SELECT COUNT(*) as c FROM bmi_history', (err, row) => { if (!err && row) stats.totalBMICalcs = row.c; checkDone(); });
});

// API ดึงรายชื่อผู้ใช้ทั้งหมด
app.get('/api/admin/users', authenticateAdmin, (req, res) => {
    db.all(`SELECT id, username, email, is_admin, created_at FROM users`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// API ลบผู้ใช้ (ลบข้อมูลที่เกี่ยวข้องในตารางอื่นด้วย)
app.delete('/api/admin/users/:id', authenticateAdmin, (req, res) => {
    const targetUserId = req.params.id;

    if (targetUserId == req.user.id) {
        return res.status(400).json({ error: "Cannot delete your own admin account." });
    }

    db.serialize(() => {
        db.run(`DELETE FROM bmi_history WHERE user_id = ?`, [targetUserId]);
        db.run(`DELETE FROM saved_foods WHERE user_id = ?`, [targetUserId]);
        db.run(`DELETE FROM user_plans WHERE user_id = ?`, [targetUserId]);
        db.run(`DELETE FROM users WHERE id = ?`, [targetUserId], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: "User completely deleted" });
        });
    });
});

// ==========================================
// Admin: ดู Bug Reports
// ==========================================
app.get('/api/admin/bug-reports', authenticateAdmin, (req, res) => {
    db.all(`SELECT id, email, message, created_at FROM bug_reports ORDER BY id DESC LIMIT 100`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.delete('/api/admin/bug-reports/:id', authenticateAdmin, (req, res) => {
    db.run(`DELETE FROM bug_reports WHERE id = ?`, [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// ==========================================
// User History Delete Endpoints
// ==========================================
app.delete('/api/history/bmi/:id', authenticateToken, (req, res) => {
    db.run(`DELETE FROM bmi_history WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'ไม่พบข้อมูล' });
        res.json({ success: true });
    });
});

app.delete('/api/history/food/:id', authenticateToken, (req, res) => {
    db.run(`DELETE FROM saved_foods WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'ไม่พบข้อมูล' });
        res.json({ success: true });
    });
});

app.delete('/api/history/plan/:id', authenticateToken, (req, res) => {
    db.run(`DELETE FROM user_plans WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'ไม่พบข้อมูล' });
        res.json({ success: true });
    });
});

// ==========================================
// Daily Tracking Routes (Water, Sleep, Mood)
// ==========================================

// ดึงข้อมูล Daily Tracking (ย้อนหลัง 7 วัน)
app.get('/api/tracking', authenticateToken, (req, res) => {
    const sql = `SELECT date, water_intake, sleep_hours, mood FROM daily_tracking 
                 WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) 
                 ORDER BY date ASC`;
    db.all(sql, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

// บันทึก/อัปเดตข้อมูล Daily Tracking ของวันนั้น
app.post('/api/tracking', authenticateToken, (req, res) => {
    const { date, water_intake, sleep_hours, mood } = req.body;
    if (!date) return res.status(400).json({ error: "Date is required" });

    // UPSERT (Insert or Update) based on UNIQUE KEY user_date (user_id, date)
    const sql = `
        INSERT INTO daily_tracking (user_id, date, water_intake, sleep_hours, mood)
        VALUES (?, ?, COALESCE(?, 0), COALESCE(?, 0), ?)
        ON DUPLICATE KEY UPDATE 
            water_intake = COALESCE(VALUES(water_intake), water_intake),
            sleep_hours = COALESCE(VALUES(sleep_hours), sleep_hours),
            mood = COALESCE(VALUES(mood), mood)
    `;
    
    db.run(sql, [req.user.id, date, water_intake, sleep_hours, mood], function(err) {
        if (err) {
            console.error('❌ Tracking Sync Error:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ status: "success" });
    });
});

// ==========================================
// Start Server
// ==========================================

app.listen(5000, '0.0.0.0', () => {
    console.log("✅ Server running on http://localhost:5000");

    // Display LAN IP for remote access
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                console.log(`📲 Remote Device use: http://${net.address}:5000`);
            }
        }
    }
});
