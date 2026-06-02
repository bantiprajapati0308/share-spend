const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { db } = require('../config/firebase');
const { ok, fail } = require('../utils/response');

router.use(auth);

// GET /api/app-config/payment-methods
router.get('/payment-methods', async (req, res) => {
    try {
        const snap = await db.collection('appConfig').doc('masterConfig').get();
        const paymentMethods = snap.exists ? snap.data().paymentMethods : [];
        ok(res, { paymentMethods });
    } catch (e) {
        fail(res, e.message);
    }
});

module.exports = router;
