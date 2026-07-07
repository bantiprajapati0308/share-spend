require('dotenv').config({ path: require('path').join(__dirname, '.env') });
require('./src/config/firebase'); // initialise Admin SDK early

const express = require('express');
const cors = require('cors');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, cb) => {
        // Allow requests with no origin (e.g. mobile apps, curl, Postman)
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            cb(null, true);
        } else {
            const err = new Error(`CORS: origin ${origin} not allowed`);
            err.status = 403;
            cb(err);
        }
    },
    credentials: true,
}));

app.use(express.json());

// ─── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/trips', require('./src/routes/trips'));
app.use('/api/invites', require('./src/routes/invites'));
app.use('/api/notifications', require('./src/routes/notifications'));
app.use('/api/settlements', require('./src/routes/settlements'));
app.use('/api/daily-spends', require('./src/routes/dailySpends'));
app.use('/api/categories', require('./src/routes/categories'));
app.use('/api/category-limits', require('./src/routes/categoryLimits'));
app.use('/api/settings', require('./src/routes/settings'));
app.use('/api/borrow-lend', require('./src/routes/borrowLend'));
app.use('/api/app-config', require('./src/routes/appConfig'));
app.use('/api/cron', require('./src/routes/cron'));
// ─── Error handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Export for Vercel serverless (module.exports = app) ─────────────────────
// When imported by api/index.js, Vercel handles the HTTP server — no listen() needed.
// When run directly (Railway / local), start the listener normally.
module.exports = app;

if (require.main === module) {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
        console.log(`[server] Running on http://localhost:${PORT}`);
    });
}
