const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { GoogleGenerativeAI } = require("@google/generative-ai");
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// NEW: Crash Recovery & Logging
process.on('uncaughtException', (err) => {
    console.error('💥 UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

const rateLimit = require('express-rate-limit');

// Rate Limiter for Auth Routes (Max 5 requests per 15 minutes)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: "ทำรายการบ่อยเกินไป กรุณารอ 15 นาทีแล้วลองใหม่" },
    standardHeaders: true,
    legacyHeaders: false,
});

// Serve static files from the Frontend directory
app.use(express.static(path.join(__dirname, '../Frontend')));

// ตั้งค่าการเก็บไฟล์รูปภาพชั่วคราว
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // จำกัดขนาดไฟล์ที่ 5 MB
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const JWT_SECRET = process.env.JWT_SECRET || 'newgen_super_secret_key';

if (JWT_SECRET === 'newgen_super_secret_key') {
    console.warn('⚠️ WARNING: Using default JWT_SECRET. Do not use this in production!');
}

// ==========================================
// Database Setup
// ==========================================

// ตั้งค่า Database (SQLite) - สร้างไฟล์database.sqlite ในโฟลเดอร์เดียวกัน
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Could not connect to database', err);
    } else {
        console.log('✅ Connected to SQLite database');
    }
});

// สร้างตาราง users ถ้ายังไม่มี
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        email TEXT UNIQUE,
        password TEXT
    )`);

    // ฟังก์ชันช่วยเพิ่ม Column (ถ้าไม่มี)
    const addColumn = (table, column, type) => {
        db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`, (err) => { });
    };

    addColumn('users', 'age', 'INTEGER');
    addColumn('users', 'gender', 'TEXT');
    addColumn('users', 'weight', 'REAL');
    addColumn('users', 'height', 'REAL');
    addColumn('users', 'goal_weight', 'REAL');
    addColumn('users', 'activity', 'TEXT DEFAULT "general"'); // New Column
    addColumn('users', 'is_admin', 'INTEGER DEFAULT 0'); // 0=User, 1=Admin
    addColumn('users', 'profile_image', 'TEXT'); // NEW: Base64 or URL
    addColumn('users', 'created_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');

    // ตารางประวัติ BMI
    db.run(`CREATE TABLE IF NOT EXISTS bmi_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        bmi REAL,
        weight REAL,
        height REAL,
        status TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // ตารางประวัติอาหาร
    db.run(`CREATE TABLE IF NOT EXISTS saved_foods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        food_name TEXT,
        calories INTEGER,
        analysis TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // ตารางแผนสุขภาพ
    db.run(`CREATE TABLE IF NOT EXISTS user_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        plan_details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
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

// Send index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/index.html'));
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
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `คุณคือ NeWGen AI ผู้ช่วยอัจฉริยะด้านสุขภาพและความงาม (Wellness Assistant)
        หน้าที่ของคุณคือตอบคำถามเกี่ยวกับสุขภาพ การออกกำลังกาย โภชนาการ และการดูแลตัวเอง 
        คำถามจากผู้ใช้: "${message}"
        
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
app.post('/api/register', authLimiter, async (req, res) => {
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
app.post('/api/login', authLimiter, (req, res) => {
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
app.post('/api/check-email', (req, res) => {
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
app.post('/api/reset-password', async (req, res) => {
    const { email, new_password } = req.body;

    if (!email || !new_password) {
        return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
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

// ดึงข้อมูลโปรไฟล์
app.get('/api/profile', authenticateToken, (req, res) => {
    const sql = `SELECT * FROM users WHERE id = ?`;
    db.get(sql, [req.user.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) {
            delete row.password; // ไม่ส่ง password กลับไป
            res.json(row);
        } else {
            res.status(404).json({ message: "User not found" });
        }
    });
});

// อัปเดตข้อมูลโปรไฟล์
app.put('/api/profile', authenticateToken, (req, res) => {
    const { username, age, gender, weight, height, goal_weight, activity, profile_image } = req.body;

    // Log payload size for debugging
    if (profile_image) {
        console.log(`📸 Profile update request received. Image size: ${(profile_image.length / 1024).toFixed(2)} KB`);
    }

    // อัปเดตข้อมูลผู้ใช้ (รวม Username และ Profile Image)
    const sql = `UPDATE users SET username = ?, age = ?, gender = ?, weight = ?, height = ?, goal_weight = ?, activity = ?, profile_image = ? WHERE id = ?`;
    db.run(sql, [username, age, gender, weight, height, goal_weight, activity, profile_image, req.user.id], function (err) {
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
            queryDB(`SELECT bmi, weight, height, status, datetime(created_at, 'localtime') as created_at FROM bmi_history WHERE user_id = ? ORDER BY id DESC LIMIT ? OFFSET ?`, [userId, limit + 1, offset]),
            queryDB(`SELECT food_name, analysis, datetime(created_at, 'localtime') as created_at FROM saved_foods WHERE user_id = ? ORDER BY id DESC LIMIT ? OFFSET ?`, [userId, limit + 1, offset]),
            queryDB(`SELECT plan_details, datetime(created_at, 'localtime') as created_at FROM user_plans WHERE user_id = ? ORDER BY id DESC LIMIT ? OFFSET ?`, [userId, limit + 1, offset])
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

    db.get('SELECT COUNT(*) as c FROM users', (err, row) => { if (!err) stats.totalUsers = row.c; checkDone(); });
    db.get('SELECT COUNT(*) as c FROM saved_foods', (err, row) => { if (!err) stats.totalScans = row.c; checkDone(); });
    db.get('SELECT COUNT(*) as c FROM user_plans', (err, row) => { if (!err) stats.totalPlans = row.c; checkDone(); });
    db.get('SELECT COUNT(*) as c FROM bmi_history', (err, row) => { if (!err) stats.totalBMICalcs = row.c; checkDone(); });
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
