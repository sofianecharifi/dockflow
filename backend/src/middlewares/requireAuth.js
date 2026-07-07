const jwt = require('jsonwebtoken');

const requireAuth = (req, res, next) => {

    let token = req.cookies.dockflow_token;

    // Fallback: Authorization header (useful for cross-origin Tauri/Electron/Capacitor apps)
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
};

module.exports = requireAuth;
