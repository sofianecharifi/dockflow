const bcrypt = require('bcrypt');
const db = require('../../config/database');

class UserService {
    async getAllUsers() {
        return await db.allAsync('SELECT id, email, username, role, created_at, updated_at FROM users');
    }

    async createUser(data) {
        const { email, username, password, role } = data;
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.runAsync(
            'INSERT INTO users (email, username, password, role) VALUES (?, ?, ?, ?)', 
            [email, username, hashedPassword, role]
        );
    }

    async updateUser(id, data) {
        const { email, username, role, password } = data;
        let query = 'UPDATE users SET email = ?, username = ?, role = ?, updated_at = CURRENT_TIMESTAMP';
        let params = [email, username, role];

        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += ', password = ?';
            params.push(hashedPassword);
        }

        query += ' WHERE id = ?';
        params.push(id);

        const result = await db.runAsync(query, params);
        return result.changes > 0;
    }

    async deleteUser(id) {
        const result = await db.runAsync('DELETE FROM users WHERE id = ?', [id]);
        return result.changes > 0;
    }
}

module.exports = new UserService();
