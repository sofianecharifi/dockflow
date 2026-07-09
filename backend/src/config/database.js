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
                username TEXT DEFAULT 'Admin',
                password TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Migration for existing databases
        try {
            await db.runAsync("ALTER TABLE users ADD COLUMN username TEXT DEFAULT 'Admin'");
            console.log("Migration: Added username column to users table.");
        } catch (e) {
            // Column likely already exists
        }

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