const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('❌ Error connecting to database:', err.message);
        return;
    }
    console.log('✅ Connected to SQLite database');
});

db.serialize(() => {
    db.all("SELECT * FROM users", [], (err, rows) => {
        if (err) {
            console.error('❌ Error querying data:', err.message);
            return;
        }
        if (rows.length === 0) {
            console.log("📭 No users found in the database.");
        } else {
            console.log(`📊 Found ${rows.length} users:`);
            console.table(rows);
        }
    });
});

db.close();
