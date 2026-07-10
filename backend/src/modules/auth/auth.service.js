const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');
const db = require('../../config/database');

class AuthService {
    async isSetupRequired() {
        const row = await db.getAsync('SELECT COUNT(*) as count FROM users');
        return row.count === 0;
    }

    async authenticate(email, password) {
        const user = await db.getAsync('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) return null;

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return null;

        const token = jsonwebtoken.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        return { user, token };
    }

    async setupAdmin(email, password) {
        const isRequired = await this.isSetupRequired();
        if (!isRequired) {
            throw new Error('ALREADY_SETUP');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.runAsync(
            "INSERT INTO users (email, username, password, role) VALUES (?, 'Admin', ?, 'admin')", 
            [email, hashedPassword]
        );
    }

    async getUserProfile(userId) {
        return await db.getAsync('SELECT id, email, username, role FROM users WHERE id = ?', [userId]);
    }

    async updateProfile(userId, username, email) {
        await db.runAsync('UPDATE users SET username = ?, email = ? WHERE id = ?', [username, email, userId]);
    }

    async changePassword(userId, currentPassword, newPassword) {
        const user = await db.getAsync('SELECT password FROM users WHERE id = ?', [userId]);
        if (!user) throw new Error('USER_NOT_FOUND');

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) throw new Error('INVALID_PASSWORD');

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.runAsync('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
    }
}

module.exports = new AuthService();
