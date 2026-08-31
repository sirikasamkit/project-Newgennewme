const mysql = require('mysql2');
const path = require('path');
const fs = require('fs');

require('dotenv').config();
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

let activeDriver = 'mysql';
let pool = null;
let sqliteDb = null;

// Safe try-load sqlite3 (catches GLIBC native binding issues on Cloud hosts)
try {
    const sqlite3 = require('sqlite3').verbose();
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    sqliteDb = new sqlite3.Database(path.join(dataDir, 'app.sqlite'));
    activeDriver = 'sqlite';
} catch (err) {
    console.log('ℹ️ Native sqlite3 binding unavailable, switching to Memory Store engine.');
    activeDriver = 'memory';
}

// In-Memory fallback store for environments without MySQL or native SQLite
const memoryStore = {
    users: [],
    bmi_history: [],
    saved_foods: [],
    user_plans: [],
    bug_reports: [],
    daily_tracking: [],
    idCounters: { users: 1, bmi_history: 1, saved_foods: 1, user_plans: 1, bug_reports: 1, daily_tracking: 1 }
};

// Initialize SQLite tables if sqlite3 loaded
if (sqliteDb) {
    sqliteDb.serialize(() => {
        sqliteDb.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            email TEXT UNIQUE,
            password TEXT,
            age INTEGER,
            gender TEXT,
            weight REAL,
            height REAL,
            goal_weight REAL,
            activity TEXT DEFAULT 'general',
            is_admin INTEGER DEFAULT 0,
            profile_image TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        sqliteDb.run(`CREATE TABLE IF NOT EXISTS bmi_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            bmi REAL,
            weight REAL,
            height REAL,
            status TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        sqliteDb.run(`CREATE TABLE IF NOT EXISTS saved_foods (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            food_name TEXT,
            calories INTEGER,
            analysis TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        sqliteDb.run(`CREATE TABLE IF NOT EXISTS user_plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            plan_details TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        sqliteDb.run(`CREATE TABLE IF NOT EXISTS bug_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT,
            message TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        sqliteDb.run(`CREATE TABLE IF NOT EXISTS daily_tracking (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            date TEXT,
            water_intake INTEGER DEFAULT 0,
            sleep_hours REAL DEFAULT 0,
            mood TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, date)
        )`);
    });
}

// Try MySQL Connection if DB_HOST is defined and reachable
if (process.env.DB_HOST && process.env.DB_HOST !== 'localhost') {
    try {
        pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'newgen_db',
            port: process.env.DB_PORT || 3306,
            ssl: { rejectUnauthorized: false },
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            connectTimeout: 5000
        });

        pool.getConnection((err, connection) => {
            if (err) {
                console.log('ℹ️ Remote MySQL connection failed, using local/memory engine.');
            } else {
                console.log('✅ Connected to MySQL database');
                activeDriver = 'mysql';
                connection.release();
            }
        });
    } catch (e) {
        // Ignore and use active fallback
    }
}

// Adapt SQL query for SQLite compatibility
const adaptQuery = (sql) => {
    return sql
        .replace(/INT AUTO_INCREMENT PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
        .replace(/LONGTEXT/gi, 'TEXT')
        .replace(/VARCHAR\(\d+\)/gi, 'TEXT')
        .replace(/FLOAT/gi, 'REAL')
        .replace(/TINYINT/gi, 'INTEGER')
        .replace(/DATE_SUB\s*\([^,]+,\s*INTERVAL\s+(\d+)\s+DAY\)/gi, "date('now', '-$1 days')")
        .replace(/CURDATE\(\)/gi, "date('now')")
        .replace(/ON DUPLICATE KEY UPDATE[\s\S]*$/, '');
};

const db = {
    getDriver: () => activeDriver,
    
    run: (sql, params, callback) => {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        params = params || [];

        // 1. SQLite Driver
        if (activeDriver === 'sqlite' && sqliteDb) {
            if (sql.includes('daily_tracking') && sql.includes('INSERT INTO')) {
                const upsertSql = `
                    INSERT INTO daily_tracking (user_id, date, water_intake, sleep_hours, mood)
                    VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(user_id, date) DO UPDATE SET
                        water_intake = excluded.water_intake,
                        sleep_hours = excluded.sleep_hours,
                        mood = excluded.mood
                `;
                sqliteDb.run(upsertSql, params.slice(0, 5), function (err) {
                    if (callback) callback.call({ lastID: this ? this.lastID : 0, changes: this ? this.changes : 0 }, err);
                });
                return;
            }

            sqliteDb.run(adaptQuery(sql), params, function (err) {
                if (err && err.message && err.message.includes('UNIQUE constraint failed')) {
                    err.message = 'UNIQUE constraint failed';
                }
                if (callback) callback.call({ lastID: this ? this.lastID : 0, changes: this ? this.changes : 0 }, err);
            });
            return;
        }

        // 2. MySQL Driver
        if (activeDriver === 'mysql' && pool) {
            pool.query(sql, params, function (err, results) {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') err.message = 'UNIQUE constraint failed';
                    if (callback) return callback(err);
                    return;
                }
                if (callback) callback.call({ lastID: results.insertId, changes: results.affectedRows }, null);
            });
            return;
        }

        // 3. In-Memory Driver Fallback (Pure JS)
        const lowerSql = sql.toLowerCase();
        let lastID = 1;

        if (lowerSql.includes('insert into users')) {
            const [username, email, password] = params;
            if (memoryStore.users.find(u => u.email === email)) {
                if (callback) return callback(new Error('UNIQUE constraint failed'));
                return;
            }
            lastID = memoryStore.idCounters.users++;
            memoryStore.users.push({
                id: lastID, username, email, password,
                age: null, gender: null, weight: null, height: null, goal_weight: null,
                activity: 'general', is_admin: 0, profile_image: null,
                created_at: new Date().toISOString()
            });
        } else if (lowerSql.includes('update users set')) {
            const [username, age, gender, weight, height, goal_weight, activity, profile_image, userId] = params;
            const u = memoryStore.users.find(user => user.id === parseInt(userId));
            if (u) {
                u.username = username; u.age = age; u.gender = gender; u.weight = weight;
                u.height = height; u.goal_weight = goal_weight; u.activity = activity;
                if (profile_image !== undefined) u.profile_image = profile_image;
            }
        } else if (lowerSql.includes('insert into bmi_history')) {
            lastID = memoryStore.idCounters.bmi_history++;
            const [user_id, bmi, weight, height, status] = params;
            memoryStore.bmi_history.unshift({ id: lastID, user_id: parseInt(user_id), bmi, weight, height, status, created_at: new Date().toISOString() });
        } else if (lowerSql.includes('insert into saved_foods')) {
            lastID = memoryStore.idCounters.saved_foods++;
            const [user_id, food_name, analysis] = params;
            memoryStore.saved_foods.unshift({ id: lastID, user_id: parseInt(user_id), food_name, analysis, created_at: new Date().toISOString() });
        } else if (lowerSql.includes('insert into user_plans')) {
            lastID = memoryStore.idCounters.user_plans++;
            const [user_id, plan_details] = params;
            memoryStore.user_plans.unshift({ id: lastID, user_id: parseInt(user_id), plan_details, created_at: new Date().toISOString() });
        } else if (lowerSql.includes('insert into daily_tracking')) {
            const [user_id, date, water_intake, sleep_hours, mood] = params;
            const existing = memoryStore.daily_tracking.find(t => t.user_id === parseInt(user_id) && t.date === date);
            if (existing) {
                if (water_intake !== undefined) existing.water_intake = water_intake;
                if (sleep_hours !== undefined) existing.sleep_hours = sleep_hours;
                if (mood !== undefined) existing.mood = mood;
            } else {
                lastID = memoryStore.idCounters.daily_tracking++;
                memoryStore.daily_tracking.push({ id: lastID, user_id: parseInt(user_id), date, water_intake: water_intake || 0, sleep_hours: sleep_hours || 0, mood });
            }
        } else if (lowerSql.includes('insert into bug_reports')) {
            lastID = memoryStore.idCounters.bug_reports++;
            const [email, message] = params;
            memoryStore.bug_reports.unshift({ id: lastID, email, message, created_at: new Date().toISOString() });
        }

        if (callback) callback.call({ lastID, changes: 1 }, null);
    },

    get: (sql, params, callback) => {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        params = params || [];

        if (activeDriver === 'sqlite' && sqliteDb) {
            sqliteDb.get(adaptQuery(sql), params, (err, row) => {
                if (callback) callback(err, row || null);
            });
            return;
        }

        if (activeDriver === 'mysql' && pool) {
            pool.query(sql, params, (err, results) => {
                if (err) return callback ? callback(err) : null;
                if (callback) callback(null, results && results.length > 0 ? results[0] : null);
            });
            return;
        }

        // Memory Driver Fallback
        const lowerSql = sql.toLowerCase();
        let result = null;

        if (lowerSql.includes('from users where email =')) {
            result = memoryStore.users.find(u => u.email === params[0]) || null;
        } else if (lowerSql.includes('from users where id =')) {
            result = memoryStore.users.find(u => u.id === parseInt(params[0])) || null;
        } else if (lowerSql.includes('count(*)')) {
            if (lowerSql.includes('users')) result = { c: memoryStore.users.length };
            else if (lowerSql.includes('saved_foods')) result = { c: memoryStore.saved_foods.length };
            else if (lowerSql.includes('user_plans')) result = { c: memoryStore.user_plans.length };
            else if (lowerSql.includes('bmi_history')) result = { c: memoryStore.bmi_history.length };
        }

        if (callback) callback(null, result);
    },

    all: (sql, params, callback) => {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        params = params || [];

        if (activeDriver === 'sqlite' && sqliteDb) {
            sqliteDb.all(adaptQuery(sql), params, (err, rows) => {
                if (callback) callback(err, rows || []);
            });
            return;
        }

        if (activeDriver === 'mysql' && pool) {
            pool.query(sql, params, (err, results) => {
                if (err) return callback ? callback(err) : null;
                if (callback) callback(null, results || []);
            });
            return;
        }

        // Memory Driver Fallback
        const lowerSql = sql.toLowerCase();
        let results = [];

        if (lowerSql.includes('from bmi_history where user_id =')) {
            results = memoryStore.bmi_history.filter(b => b.user_id === parseInt(params[0]));
        } else if (lowerSql.includes('from saved_foods where user_id =')) {
            results = memoryStore.saved_foods.filter(f => f.user_id === parseInt(params[0]));
        } else if (lowerSql.includes('from user_plans where user_id =')) {
            results = memoryStore.user_plans.filter(p => p.user_id === parseInt(params[0]));
        } else if (lowerSql.includes('from daily_tracking where user_id =')) {
            results = memoryStore.daily_tracking.filter(t => t.user_id === parseInt(params[0]));
        } else if (lowerSql.includes('from bug_reports')) {
            results = memoryStore.bug_reports;
        } else if (lowerSql.includes('from users')) {
            results = memoryStore.users;
        }

        if (callback) callback(null, results);
    },

    serialize: (callback) => {
        if (callback) callback();
    }
};

module.exports = db;
