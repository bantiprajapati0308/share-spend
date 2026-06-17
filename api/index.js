// Vercel serverless entry point.
// Lazily boot the Express app so startup errors return JSON instead of
// failing invocation with FUNCTION_INVOCATION_FAILED.
let app = null;
let bootError = null;

const loadApp = () => {
    if (app || bootError) return;
    try {
        app = require('../server/server.js');
    } catch (error) {
        bootError = error;
        console.error('[api/index] bootstrap failed:', error?.stack || error);
    }
};

module.exports = (req, res) => {
    loadApp();

    if (bootError) {
        return res.status(500).json({
            success: false,
            error: 'Server bootstrap failed',
            details: process.env.NODE_ENV === 'production'
                ? (bootError.message || 'Unknown startup error')
                : (bootError.stack || bootError.message || 'Unknown startup error'),
        });
    }

    return app(req, res);
};
