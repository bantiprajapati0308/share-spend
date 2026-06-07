const { auth } = require('../config/firebase');

/**
 * Verifies Firebase ID token from Authorization header.
 * Attaches req.uid and req.email to the request on success.
 */
const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Unauthorized: missing token' });
    }

    const token = authHeader.split('Bearer ')[1];
    try {
        const decoded = await auth.verifyIdToken(token);
        req.uid = decoded.uid;
        req.email = decoded.email || null;
        req.idToken = token; // raw token — used by send-verification endpoint
        next();
    } catch (err) {
        return res.status(401).json({ success: false, error: 'Unauthorized: invalid or expired token' });
    }
};

module.exports = authMiddleware;
