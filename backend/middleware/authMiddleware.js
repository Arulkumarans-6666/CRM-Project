// backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // 1. Get token from header
    const authHeader = req.header('Authorization');

    // 2. Check if token doesn't exist
    if (!authHeader) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // 3. Check if token is in the correct 'Bearer <token>' format
    if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ msg: 'Token format is incorrect' });
    }

    try {
        // 4. Extract the token from 'Bearer <token>'
        const token = authHeader.split(' ')[1];
        
        // 5. Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 6. Attach user info to the request object
        req.user = decoded.user;
        
        // 7. Move to the next function
        next();
    } catch (err) {
        // 8. If token is not valid (expired, wrong secret), send an error
        console.error("❌ Token verification failed:", err.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

module.exports = authMiddleware;