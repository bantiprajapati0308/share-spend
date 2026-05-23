/**
 * Centralised response helpers — match the shape expected by the frontend apiClient.js
 */
const ok = (res, data, status = 200) =>
    res.status(status).json({ success: true, data });

const fail = (res, message, status = 500) =>
    res.status(status).json({ success: false, error: message });

const notFound = (res, message = 'Not found') => fail(res, message, 404);

const badRequest = (res, message = 'Bad request') => fail(res, message, 400);

module.exports = { ok, fail, notFound, badRequest };
