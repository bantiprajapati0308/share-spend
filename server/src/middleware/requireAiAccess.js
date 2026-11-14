const { isAiEmailAllowed } = require('../config/aiAccess');

const requireAiAccess = (req, res, next) => {
    if (!isAiEmailAllowed(req.email, req.emailVerified)) {
        return res.status(403).json({
            success: false,
            error: 'AI features are not enabled for this account',
            code: 'AI_FEATURE_DISABLED',
        });
    }

    return next();
};

module.exports = requireAiAccess;
