const { ok } = require('../utils/response');
const { isAiEmailAllowed } = require('../config/aiAccess');

const getAiAccess = (req, res) => ok(res, {
    enabled: isAiEmailAllowed(req.email, req.emailVerified),
});

module.exports = { getAiAccess };
