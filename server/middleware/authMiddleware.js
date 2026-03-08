const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // Get token from header
    const authHeader = req.header('Authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;

    if (!token) {
        console.log('❌ No token provided');
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // JWT payload structure: { user: { id, role, email }, iat, exp }
        req.user = decoded.user;

        console.log('✅ Token verified:', { id: req.user.id, role: req.user.role });
        next();
    } catch (err) {
        console.log('❌ Invalid token:', err.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};