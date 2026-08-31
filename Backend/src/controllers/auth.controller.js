const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET } = require('../middlewares/auth.middleware');

exports.register = async (req, res) => {
    const { username, email, password } = req.body;

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
};

exports.login = (req, res) => {
    const { email, password } = req.body;

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
                    const token = jwt.sign(
                        { id: row.id, username: row.username, email: row.email, is_admin: row.is_admin },
                        JWT_SECRET,
                        { expiresIn: '7d' }
                    );

                    res.json({
                        status: "success",
                        user: row.username,
                        token: token,
                        is_admin: row.is_admin
                    });
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
};

exports.checkEmail = (req, res) => {
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
};

exports.resetPassword = async (req, res) => {
    const { email, new_password } = req.body;

    if (!email || !new_password) {
        return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

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
};
