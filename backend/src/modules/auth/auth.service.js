const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../../config/database');
const userService = require('../users/users.service');

class AuthService {
    async isSetupRequired() {
        const row = await db.getAsync('SELECT COUNT(*) as count FROM users');
        return row.count === 0;
    }

    async generateTokens(user) {
        // Access Token expires in 15 minutes
        const accessToken = jsonwebtoken.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        // Generate a random string for the refresh token
        const refreshToken = crypto.randomBytes(40).toString('hex');
        
        // Hash it for DB storage
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        
        // Expires in 7 days
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await db.runAsync(
            'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
            [user.id, tokenHash, expiresAt.toISOString()]
        );

        return { accessToken, refreshToken };
    }

    async authenticate(email, password) {
        const user = await db.getAsync('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) return null;

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return null;

        return await this.generateTokens(user);
    }

    async refreshToken(tokenStr) {
        if (!tokenStr) throw new Error('NO_TOKEN');

        // Cleanup expired tokens randomly or on request (good practice)
        await db.runAsync('DELETE FROM refresh_tokens WHERE expires_at < CURRENT_TIMESTAMP');

        const tokenHash = crypto.createHash('sha256').update(tokenStr).digest('hex');
        const record = await db.getAsync(
            'SELECT * FROM refresh_tokens WHERE token_hash = ? AND expires_at >= CURRENT_TIMESTAMP',
            [tokenHash]
        );

        if (!record) {
            throw new Error('INVALID_TOKEN');
        }

        // Delete the used refresh token (rotation)
        await db.runAsync('DELETE FROM refresh_tokens WHERE id = ?', [record.id]);

        // Get user for new tokens
        const user = await db.getAsync('SELECT id, email, username, role FROM users WHERE id = ?', [record.user_id]);
        if (!user) {
            throw new Error('USER_NOT_FOUND');
        }

        return await this.generateTokens(user);
    }

    async revokeToken(tokenStr) {
        if (!tokenStr) return;
        const tokenHash = crypto.createHash('sha256').update(tokenStr).digest('hex');
        await db.runAsync('DELETE FROM refresh_tokens WHERE token_hash = ?', [tokenHash]);
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

    async verifyPassword(userId, password) {
        const user = await db.getAsync('SELECT password FROM users WHERE id = ?', [userId]);
        if (!user) throw new Error('USER_NOT_FOUND');

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new Error('INVALID_PASSWORD');
        return true;
    }

    async changePassword(userId, currentPassword, newPassword) {
        await this.verifyPassword(userId, currentPassword);

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.runAsync('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
    }

    async deleteAccount(userId, password) {
        await this.verifyPassword(userId, password);
        await userService.deleteUser(userId);
    }
}

module.exports = new AuthService();
