const db = require('../config/db');

exports.getProfile = (req, res) => {
    const sql = `SELECT id, username, email, age, gender, weight, height, goal_weight, activity, is_admin, created_at FROM users WHERE id = ?`;
    db.get(sql, [req.user.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) res.json(row);
        else res.status(404).json({ message: "User not found" });
    });
};

exports.getProfileImage = (req, res) => {
    db.get(`SELECT profile_image FROM users WHERE id = ?`, [req.user.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ profile_image: row ? row.profile_image : null });
    });
};

exports.updateProfile = (req, res) => {
    const { username, age, gender, weight, height, goal_weight, activity, profile_image } = req.body;

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

    const sql = `UPDATE users SET username = ?, age = ?, gender = ?, weight = ?, height = ?, goal_weight = ?, activity = ?, profile_image = ? WHERE id = ?`;
    db.run(sql, [safeUsername, safeAge, gender || null, safeWeight, safeHeight, safeGoalWeight, activity || 'general', profile_image || null, req.user.id], function (err) {
        if (err) {
            console.error('❌ Database error updating profile:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ status: "success", message: "Profile updated" });
    });
};

exports.getHistory = async (req, res) => {
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
};

exports.deleteBmiHistory = (req, res) => {
    db.run(`DELETE FROM bmi_history WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'ไม่พบข้อมูล' });
        res.json({ success: true });
    });
};

exports.deleteFoodHistory = (req, res) => {
    db.run(`DELETE FROM saved_foods WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'ไม่พบข้อมูล' });
        res.json({ success: true });
    });
};

exports.deletePlanHistory = (req, res) => {
    db.run(`DELETE FROM user_plans WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'ไม่พบข้อมูล' });
        res.json({ success: true });
    });
};

exports.getDailyTracking = (req, res) => {
    const sql = `SELECT date, water_intake, sleep_hours, mood FROM daily_tracking 
                 WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) 
                 ORDER BY date ASC`;
    db.all(sql, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
};

exports.saveDailyTracking = (req, res) => {
    const { date, water_intake, sleep_hours, mood } = req.body;
    if (!date) return res.status(400).json({ error: "Date is required" });

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
};

exports.submitBugReport = (req, res) => {
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
        res.json({ status: 'success', message: 'ทีมงานได้รับรายงานแล้วครับ ขอบคุณมาก!' });
    });
};
