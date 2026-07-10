class UserController {
    constructor(userService) {
        this.service = userService;
        
        // Bind methods
        this.getUsers = this.getUsers.bind(this);
        this.createUser = this.createUser.bind(this);
        this.updateUser = this.updateUser.bind(this);
        this.deleteUser = this.deleteUser.bind(this);
    }

    async getUsers(req, res) {
        try {
            const users = await this.service.getAllUsers();
            return res.json(users);
        } catch (error) {
            console.error('Error fetching users:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    async createUser(req, res) {
        try {
            const { email, username, password, role } = req.body || {};
            if (!email || !username || !password || !role) {
                return res.status(400).json({ message: 'Tous les champs (email, username, password, role) sont requis.' });
            }

            if (password.length < 8) {
                return res.status(400).json({ message: 'Le mot de passe doit faire au moins 8 caractères.' });
            }

            await this.service.createUser({ email, username, password, role });
            return res.status(201).json({ message: 'Utilisateur créé avec succès.' });
        } catch (error) {
            console.error('Error creating user:', error);
            if (error.message && error.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
            }
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    async updateUser(req, res) {
        try {
            const { id } = req.params;
            const { email, username, role, password } = req.body || {};

            if (!email || !username || !role) {
                return res.status(400).json({ message: 'Email, username et role sont requis.' });
            }

            if (password && password.trim() !== '' && password.length < 8) {
                return res.status(400).json({ message: 'Le mot de passe doit faire au moins 8 caractères.' });
            }

            const updated = await this.service.updateUser(id, { email, username, role, password });
            if (!updated) {
                return res.status(404).json({ message: 'Utilisateur non trouvé.' });
            }

            return res.json({ message: 'Utilisateur mis à jour avec succès.' });
        } catch (error) {
            console.error('Error updating user:', error);
            if (error.message && error.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ message: 'Cet email est déjà utilisé par un autre compte.' });
            }
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    async deleteUser(req, res) {
        try {
            const { id } = req.params;
            
            // Prevent self-deletion
            if (parseInt(id, 10) === req.user.id) {
                return res.status(403).json({ message: 'Vous ne pouvez pas supprimer votre propre compte administrateur.' });
            }

            const deleted = await this.service.deleteUser(id);
            if (!deleted) {
                return res.status(404).json({ message: 'Utilisateur non trouvé.' });
            }

            return res.json({ message: 'Utilisateur supprimé avec succès.' });
        } catch (error) {
            console.error('Error deleting user:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }
}

const userService = require('./users.service');
module.exports = new UserController(userService);
