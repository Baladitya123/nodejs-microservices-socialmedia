const jwt = require('jsonwebtoken')
const logger = require('../utils/logger')

const validToken = async (req, res, next) => {
    const authheader = req.headers['authorization'];
    const token = authheader && authheader.split(" ")[1];

    if (!token) {
        logger.warn('Authentication required');
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    jwt.verify(token, process.env.JWT_KEY, (err, user) => {
        if (err) {
            logger.warn('Invalid token');
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        console.log('User verified:', user); // Log the user object
        req.user = user; // Attach the user to the request object
        next();
    });
};

module.exports= validToken