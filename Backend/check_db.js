const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'rootpassword',
    database: process.env.DB_NAME || 'newgen_db'
};

async function checkData() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log("✅ Connected to database successfully!");

        const [rows] = await connection.execute('SELECT * FROM users');

        if (rows.length === 0) {
            console.log("📭 No users found in the database.");
        } else {
            console.log(`📊 Found ${rows.length} users:`);
            console.table(rows);
        }

        await connection.end();
    } catch (err) {
        console.error("❌ Error connecting to database:");
        console.error("   Code:", err.code);
        console.error("   Message:", err.message);
        console.error("   Error Object:", err);
    }
}

checkData();
