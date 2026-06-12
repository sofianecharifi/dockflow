const jwt = require('jsonwebtoken');

const requireAuth = (req, res, next) => {

    const token = req.cookies.dockflow_token;

    if (!token) {
        return res.status(401).json({ message: 'Non Autorisé' });
    }

    try {
        // verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);


        req.user = decoded; // save user id
        next();
    } catch (error) {
        // handle invalid token
        return res.status(401).json({ message: 'Non Autorisé' });
    }
};

module.exports = requireAuth;
