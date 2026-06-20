const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../db/database.db');

// Ensure the db directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// init db
const db = new Database(dbPath);
console.log('Connecté à SQLite via better-sqlite3');

// Wrappers pour conserver la compatibilité avec le code existant qui utilisait `sqlite3`
db.runAsync = async (sql, params = []) => {
    return db.prepare(sql).run(params);
};

db.getAsync = async (sql, params = []) => {
    return db.prepare(sql).get(params);
};

db.allAsync = async (sql, params = []) => {
    return db.prepare(sql).all(params);
};

// init tables & seed
const initDb = async () => {
    try {
        await db.runAsync(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
            console.log('Nouveau secret JWT généré et sauvegardé.');
        } else {
            process.env.JWT_SECRET = secretRow.value;
        }

    } catch (error) {
        console.error('error initializing db', error);
    }
};

db.initDb = initDb;

module.exports = db;