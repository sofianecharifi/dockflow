const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');
const db = require('../../config/database');



async function checkSetupStatus(req, res) {
    try {
        const row = await db.getAsync('SELECT COUNT(*) as count FROM users');
        // If count is 0, setup is required
        return res.json({ setupRequired: row.count === 0 });
    } catch (error) {
        console.error('Erreur lors de la vérification du setup:', error);
        return res.status(500).json({ message: 'Erreur interne du serveur' });
    }
}

async function loginUser(req, res) {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({ message: 'Email et mot de passe requis' });
        }

        const user = await db.getAsync('SELECT * FROM users WHERE email = ?', [email]);

        // bad auth
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

        res.cookie('dockflow_token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 24 * 60 * 60 * 1000
        });

        return res.json({ message: 'Connecté' });
    } catch (error) {
        console.error('Erreur lors du login:', error);
        return res.status(500).json({ message: 'Erreur interne du serveur' });
    }
}

async function setupAdmin(req, res) {
    try {
        // check if user exists
        const row = await db.getAsync('SELECT COUNT(*) as count FROM users');

        if (row.count > 0) {
            return res.status(403).json({ message: 'Le système a déjà été initialisé. Un compte existe déjà.' });
        }

        // validate payloads
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ message: 'Email et mot de passe requis pour créer le compte admin.' });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: 'Le mot de passe doit faire au moins 8 caractères pour des raisons de sécurité.' });
        }

        // hash & create admin
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.runAsync('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword]);

        return res.status(201).json({ message: 'Compte administrateur créé avec succès.' });

    } catch (error) {
        console.error('Erreur lors de l\'initialisation du compte admin:', error);
        return res.status(500).json({ message: 'Erreur interne du serveur' });
    }
}

async function logoutUser(req, res) {
    res.clearCookie('dockflow_token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    });
    return res.json({ message: 'Déconnecté' });
}

module.exports = { loginUser, setupAdmin, checkSetupStatus, logoutUser };