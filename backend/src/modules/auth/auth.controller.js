class AuthController {
    constructor(authService) {
        this.service = authService;
        
        // Bind methods
        this.checkSetupStatus = this.checkSetupStatus.bind(this);
        this.loginUser = this.loginUser.bind(this);
        this.setupAdmin = this.setupAdmin.bind(this);
        this.logoutUser = this.logoutUser.bind(this);
        this.getMe = this.getMe.bind(this);
        this.updateProfile = this.updateProfile.bind(this);
        this.changePassword = this.changePassword.bind(this);
    }

    async checkSetupStatus(req, res) {
        try {
            const setupRequired = await this.service.isSetupRequired();
            return res.json({ setupRequired });
        } catch (error) {
            console.error('Error verifying setup status:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    async loginUser(req, res) {
        try {
            const { email, password } = req.body || {};

            if (!email || !password) {
                return res.status(400).json({ message: 'Email et mot de passe requis' });
            }

            const authResult = await this.service.authenticate(email, password);

            if (!authResult) {
                return res.status(401).json({ message: 'Identifiants incorrects' });
            }

            res.cookie('dockflow_token', authResult.token, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000,
                path: '/'
            });

            return res.json({ message: 'Connecté', token: authResult.token });
        } catch (error) {
            console.error('Error during login:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    async setupAdmin(req, res) {
        try {
            const { email, password } = req.body || {};
            
            if (!email || !password) {
                return res.status(400).json({ message: 'Email et mot de passe requis pour créer le compte admin.' });
            }

            if (password.length < 8) {
                return res.status(400).json({ message: 'Le mot de passe doit faire au moins 8 caractères pour des raisons de sécurité.' });
            }

            await this.service.setupAdmin(email, password);
            return res.status(201).json({ message: 'Compte administrateur créé avec succès.' });

        } catch (error) {
            if (error.message === 'ALREADY_SETUP') {
                return res.status(403).json({ message: 'Le système a déjà été initialisé. Un compte existe déjà.' });
            }
            console.error('Error initializing admin account:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    async logoutUser(req, res) {
        res.clearCookie('dockflow_token', {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/'
        });
        return res.json({ message: 'Déconnecté' });
    }

    async getMe(req, res) {
        try {
            const userId = req.user.id;
            const user = await this.service.getUserProfile(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            return res.json(user);
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const { username, email } = req.body || {};

            if (!username || !email) {
                return res.status(400).json({ message: 'Username and email are required.' });
            }

            if (!email.includes('@')) {
                return res.status(400).json({ message: 'Invalid email format.' });
            }

            await this.service.updateProfile(userId, username, email);
            return res.json({ message: 'Profile updated successfully', username, email });
        } catch (error) {
            console.error('Error updating user profile:', error);
            if (error.message && error.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ message: 'This email is already in use.' });
            }
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    async changePassword(req, res) {
        try {
            const userId = req.user.id;
            const { currentPassword, newPassword } = req.body || {};

            if (!currentPassword || !newPassword) {
                return res.status(400).json({ message: "L'ancien et le nouveau mot de passe sont requis." });
            }

            if (newPassword.length < 8) {
                return res.status(400).json({ message: 'Le nouveau mot de passe doit faire au moins 8 caractères.' });
            }

            await this.service.changePassword(userId, currentPassword, newPassword);
            return res.json({ message: 'Mot de passe mis à jour avec succès.' });
        } catch (error) {
            if (error.message === 'USER_NOT_FOUND') {
                return res.status(404).json({ message: 'Utilisateur non trouvé.' });
            }
            if (error.message === 'INVALID_PASSWORD') {
                return res.status(401).json({ message: 'Le mot de passe actuel est incorrect.' });
            }
            console.error('Error changing password:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }
}

const authService = require('./auth.service');
module.exports = new AuthController(authService);