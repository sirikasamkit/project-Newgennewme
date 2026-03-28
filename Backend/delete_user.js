const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error connecting to database:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to SQLite database');
});

const args = process.argv.slice(2);
const command = args[0];
const value = args[1];

function showHelp() {
    console.log(`
Usage:
  node delete_user.js list              - List all users
  node delete_user.js delete <id>       - Delete user by ID
  node delete_user.js clear             - Delete ALL users (Warning!)
`);
}

if (command === 'list') {
    db.all("SELECT * FROM users", [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return;
        }
        console.table(rows);
        db.close();
    });
} else if (command === 'delete') {
    if (!value) {
        console.error('❌ Please provide a user ID to delete.');
        showHelp();
        db.close();
        return;
    }
    const sql = "DELETE FROM users WHERE id = ?";
    db.run(sql, [value], function (err) {
        if (err) {
            console.error(err.message);
        } else if (this.changes === 0) {
            console.log(`⚠️ User with ID ${value} not found.`);
        } else {
            console.log(`✅ Deleted user with ID ${value}.`);
        }
        db.close();
    });
} else if (command === 'clear') {
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    readline.question('⚠️ Are you sure you want to delete ALL users? (yes/no): ', (answer) => {
        if (answer.toLowerCase() === 'yes') {
            db.run("DELETE FROM users", [], function (err) {
                if (err) {
                    console.error(err.message);
                } else {
                    console.log(`✅ Deleted ${this.changes} users.`);
                    // Reset ID counter
                    db.run("DELETE FROM sqlite_sequence WHERE name='users'", [], (err) => {
                        if (!err) console.log("✅ Reset ID counter.");
                    });
                }
                db.close();
                readline.close();
            });
        } else {
            console.log('❌ Operation cancelled.');
            db.close();
            readline.close();
        }
    });

} else {
    showHelp();
    db.close();
}
