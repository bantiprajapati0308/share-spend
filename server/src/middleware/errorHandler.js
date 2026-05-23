// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    console.error('[ErrorHandler]', err);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error',
    });
};

module.exports = errorHandler;
