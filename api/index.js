// Vercel serverless entry point.
// Imports the Express app from server/ and exports it for Vercel to handle.
// No app.listen() — Vercel manages the HTTP lifecycle.
module.exports = require('../server/server.js');
