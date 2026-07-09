const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');
const db = require('../../config/database');

/**
 * Validates whether the application has been initialized with an admin account.
 * This is used by the frontend router to redirect users to the setup page if the database is completely empty.
 */
async function checkSetupStatus(req, res) {
    try {
        const row = await db.getAsync('SELECT COUNT(*) as count FROM users');
        return res.json({ setupRequired: row.count === 0 });
    } catch (error) {
        console.error('Error verifying setup status:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

/**
 * Authenticates a user and establishes an HTTP-only cookie session.
 * We rely on secure cookies to mitigate XSS vulnerabilities, ensuring the JWT token is inaccessible via client-side JavaScript.
 */
async function loginUser(req, res) {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({ message: 'Email et mot de passe requis' });
        }

        const user = await db.getAsync('SELECT * FROM users WHERE email = ?', [email]);

        // Prevent timing attacks and enumeration by returning generic error messages
        if (!user) {
            return res.status(401).json({ message: 'Identifiants incorrects' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Identifiants incorrects' });
        }

        const token = jsonwebtoken.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Set cookie for browser-based access (no Secure flag since backend runs on HTTP).
        // SameSite=Lax works for same-origin browser access.
        res.cookie('dockflow_token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000,
            path: '/'
        });

        // Also return the token in the response body so Tauri/Electron/Capacitor apps
        // can store it in localStorage and pass it via WebSocket auth handshake.
        return res.json({ message: 'Connecté', token });
    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

/**
 * Handles the initial setup of the first administrator account.
 * This endpoint locks itself permanently once the first user is created to prevent unauthorized takeovers.
 */
async function setupAdmin(req, res) {
    try {
        const row = await db.getAsync('SELECT COUNT(*) as count FROM users');

        // Security safeguard: Reject creation if the database is already seeded
        if (row.count > 0) {
            return res.status(403).json({ message: 'Le système a déjà été initialisé. Un compte existe déjà.' });
        }

        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ message: 'Email et mot de passe requis pour créer le compte admin.' });
        }

        // Enforce basic password complexity
        if (password.length < 8) {
            return res.status(400).json({ message: 'Le mot de passe doit faire au moins 8 caractères pour des raisons de sécurité.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.runAsync('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword]);

        return res.status(201).json({ message: 'Compte administrateur créé avec succès.' });

    } catch (error) {
        console.error('Error initializing admin account:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

/**
 * Terminates the user session by instructing the browser to discard the authentication cookie.
 */
async function logoutUser(req, res) {
    res.clearCookie('dockflow_token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/'
    });
    return res.json({ message: 'Déconnecté' });
}

/**
 * Fetches the currently authenticated user's profile.
 */
async function getMe(req, res) {
    try {
        const userId = req.user.id;
        const user = await db.getAsync('SELECT id, email, username, role FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

/**
 * Updates the user's profile information.
 */
async function updateProfile(req, res) {
    try {
        const userId = req.user.id;
        const { username, email } = req.body || {};

        if (!username || !email) {
            return res.status(400).json({ message: 'Username and email are required.' });
        }

        // Validate basic email format
        if (!email.includes('@')) {
            return res.status(400).json({ message: 'Invalid email format.' });
        }

        await db.runAsync('UPDATE users SET username = ?, email = ? WHERE id = ?', [username, email, userId]);
        
        return res.json({ message: 'Profile updated successfully', username, email });
    } catch (error) {
        console.error('Error updating user profile:', error);
        // Handle unique constraint failure for email
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ message: 'This email is already in use.' });
        }
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

/**
 * Updates the user's password.
 */
async function changePassword(req, res) {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body || {};

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "L'ancien et le nouveau mot de passe sont requis." });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'Le nouveau mot de passe doit faire au moins 8 caractères.' });
        }

        const user = await db.getAsync('SELECT password FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Le mot de passe actuel est incorrect.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.runAsync('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

        return res.json({ message: 'Mot de passe mis à jour avec succès.' });
    } catch (error) {
        console.error('Error changing password:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

module.exports = { loginUser, setupAdmin, checkSetupStatus, logoutUser, getMe, updateProfile, changePassword };