const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../db/database.db');

// Ensure the db directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Init db
const db = new Database(dbPath);
console.log('Connected to SQLite via better-sqlite3');

db.runAsync = async (sql, params = []) => {
    return db.prepare(sql).run(params);
};

db.getAsync = async (sql, params = []) => {
    return db.prepare(sql).get(params);
};

db.allAsync = async (sql, params = []) => {
    return db.prepare(sql).all(params);
};

// Init tables and seed
const initDb = async () => {
    try {
        await db.runAsync(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                username TEXT NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.runAsync(`
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token_hash TEXT NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await db.runAsync(`
            CREATE TABLE IF NOT EXISTS server_config (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        `);

        // Check for JWT_SECRET, generate if missing
        let secretRow = await db.getAsync("SELECT value FROM server_config WHERE key = 'jwt_secret'");
        if (!secretRow) {
            const crypto = require('crypto');
            const newSecret = crypto.randomBytes(64).toString('hex');
            await db.runAsync("INSERT INTO server_config (key, value) VALUES ('jwt_secret', ?)", [newSecret]);
            process.env.JWT_SECRET = newSecret;
            console.log('New JWT secret generated and saved.');
        } else {
            process.env.JWT_SECRET = secretRow.value;
        }

    } catch (error) {
        console.error('Error initializing db', error);
    }
};

db.initDb = initDb;

module.exports = db;