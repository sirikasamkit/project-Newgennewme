const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

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

// Database Helper Wrappers (Promises & Callback support)
const db = {
    pool,
    query: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            pool.query(sql, params, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    },
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
            if (err) return callback ? callback(err) : null;
            if (callback) callback(null, results && results.length > 0 ? results[0] : null);
        });
    },
    all: (sql, params, callback) => {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        pool.query(sql, params || [], (err, results) => {
            if (err) return callback ? callback(err) : null;
            if (callback) callback(null, results || []);
        });
    },
    serialize: (callback) => {
        if (callback) callback();
    }
};

// Initialize Table Schemas
const initDB = () => {
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
};

initDB();

module.exports = db;
