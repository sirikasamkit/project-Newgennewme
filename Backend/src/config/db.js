const mysql = require('mysql2');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Load environment variables cleanly
require('dotenv').config();
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Safe data directory inside backend folder
let dataDir = path.join(process.cwd(), 'data');
try {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
} catch (e) {
    dataDir = '/tmp'; // Fallback to /tmp on restricted cloud environments
}

let activeDriver = 'mysql';
let pool = null;
let sqliteDb = null;

// Initialize SQLite with safe path
try {
    const sqliteFile = path.join(dataDir, 'app.sqlite');
    sqliteDb = new sqlite3.Database(sqliteFile);
} catch (e) {
    sqliteDb = new sqlite3.Database(':memory:');
}

// Helper to initialize tables on SQLite
const initSqliteTables = () => {
    if (!sqliteDb) return;
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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )`);

        sqliteDb.run(`CREATE TABLE IF NOT EXISTS saved_foods (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            food_name TEXT,
            calories INTEGER,
            analysis TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )`);

        sqliteDb.run(`CREATE TABLE IF NOT EXISTS user_plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            plan_details TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
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
            UNIQUE(user_id, date),
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )`);
    });
};

initSqliteTables();

// Try MySQL Connection
try {
    pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'newgen_db',
        port: process.env.DB_PORT || 3306,
        ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : undefined,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 5000
    });

    pool.getConnection((err, connection) => {
        if (err) {
            console.log('ℹ️ MySQL is not running on localhost:3306 -> Switched to SQLite mode seamlessly.');
            activeDriver = 'sqlite';
        } else {
            console.log('✅ Connected to MySQL database');
            activeDriver = 'mysql';
            connection.release();
            initMySQLTables();
        }
    });
} catch (e) {
    activeDriver = 'sqlite';
}

const initMySQLTables = () => {
    if (activeDriver !== 'mysql' || !pool) return;
    pool.query(`CREATE TABLE IF NOT EXISTS users (
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
};

// Adapt SQL query for SQLite compatibility if needed
const adaptQuery = (sql) => {
    if (activeDriver === 'sqlite') {
        return sql
            .replace(/INT AUTO_INCREMENT PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
            .replace(/LONGTEXT/gi, 'TEXT')
            .replace(/VARCHAR\(\d+\)/gi, 'TEXT')
            .replace(/FLOAT/gi, 'REAL')
            .replace(/TINYINT/gi, 'INTEGER')
            .replace(/DATE_SUB\s*\([^,]+,\s*INTERVAL\s+(\d+)\s+DAY\)/gi, "date('now', '-$1 days')")
            .replace(/CURDATE\(\)/gi, "date('now')")
            .replace(/ON DUPLICATE KEY UPDATE[\s\S]*$/, '');
    }
    return sql;
};

const db = {
    getDriver: () => activeDriver,
    
    run: (sql, params, callback) => {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        params = params || [];

        if (activeDriver === 'sqlite') {
            // Check for tracking UPSERT in SQLite
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
        } else {
            pool.query(sql, params, function (err, results) {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') err.message = 'UNIQUE constraint failed';
                    if (callback) return callback(err);
                    return;
                }
                if (callback) callback.call({ lastID: results.insertId, changes: results.affectedRows }, null);
            });
        }
    },

    get: (sql, params, callback) => {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        params = params || [];

        if (activeDriver === 'sqlite') {
            sqliteDb.get(adaptQuery(sql), params, (err, row) => {
                if (callback) callback(err, row || null);
            });
        } else {
            pool.query(sql, params, (err, results) => {
                if (err) return callback ? callback(err) : null;
                if (callback) callback(null, results && results.length > 0 ? results[0] : null);
            });
        }
    },

    all: (sql, params, callback) => {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        params = params || [];

        if (activeDriver === 'sqlite') {
            sqliteDb.all(adaptQuery(sql), params, (err, rows) => {
                if (callback) callback(err, rows || []);
            });
        } else {
            pool.query(sql, params, (err, results) => {
                if (err) return callback ? callback(err) : null;
                if (callback) callback(null, results || []);
            });
        }
    },

    serialize: (callback) => {
        if (callback) callback();
    }
};

module.exports = db;
