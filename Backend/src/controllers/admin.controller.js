const db = require('../config/db');

exports.getStats = (req, res) => {
    let stats = { totalUsers: 0, totalScans: 0, totalPlans: 0, totalBMICalcs: 0 };
    let completed = 0;
    const checkDone = () => {
        completed++;
        if (completed === 4) res.json(stats);
    };

    db.get('SELECT COUNT(*) as c FROM users', (err, row) => { if (!err && row) stats.totalUsers = row.c; checkDone(); });
    db.get('SELECT COUNT(*) as c FROM saved_foods', (err, row) => { if (!err && row) stats.totalScans = row.c; checkDone(); });
    db.get('SELECT COUNT(*) as c FROM user_plans', (err, row) => { if (!err && row) stats.totalPlans = row.c; checkDone(); });
    db.get('SELECT COUNT(*) as c FROM bmi_history', (err, row) => { if (!err && row) stats.totalBMICalcs = row.c; checkDone(); });
};

exports.getUsers = (req, res) => {
    db.all(`SELECT id, username, email, is_admin, created_at FROM users`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

exports.deleteUser = (req, res) => {
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
};

exports.getBugReports = (req, res) => {
    db.all(`SELECT id, email, message, created_at FROM bug_reports ORDER BY id DESC LIMIT 100`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

exports.deleteBugReport = (req, res) => {
    db.run(`DELETE FROM bug_reports WHERE id = ?`, [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
};
