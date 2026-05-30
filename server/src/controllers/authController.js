const { db, FieldValue } = require('../config/firebase');
const { ok, fail, notFound } = require('../utils/response');
const { seedPredefinedCategoriesForUser } = require('./categoriesController');
const { seedPredefinedLimitsForUser } = require('./categoryLimitsController');

// Seeds both categories and limits for a user.
// Runs both in parallel, then marks categoriesSeeded=true on the user doc.
// Throws on failure so the caller can surface the error properly.
const seedNewUser = async (uid) => {
    console.log(`[auth] Seeding categories + limits for uid=${uid}`);
    const [catAdded, limAdded] = await Promise.all([
        seedPredefinedCategoriesForUser(uid),
        seedPredefinedLimitsForUser(uid),
    ]);
    console.log(`[auth] Seeded ${catAdded} categories, ${limAdded} limits for uid=${uid}`);
    // Mark as seeded so subsequent logins skip this work.
    await db.collection('users').doc(uid).update({ categoriesSeeded: true });
};

const usersCol = (uid) => db.collection('users').doc(uid);

// GET /api/auth/profile
const getProfile = async (req, res) => {
    try {
        const snap = await usersCol(req.uid).get();
        if (!snap.exists) return notFound(res, 'Profile not found');
        ok(res, { id: snap.id, ...snap.data() });
    } catch (e) {
        fail(res, e.message);
    }
};

// POST /api/auth/profile  (create or update — called after Google login)
const createOrUpdateProfile = async (req, res) => {
    try {
        const ref = usersCol(req.uid);
        const snap = await ref.get();
        const now = FieldValue.serverTimestamp();

        if (!snap.exists) {
            const { email, firstName, lastName, displayName, photoURL, authProvider } = req.body;
            const profile = {
                uid: req.uid,
                email: email || req.email || '',
                firstName: firstName || '',
                lastName: lastName || '',
                displayName: displayName || '',
                photoURL: photoURL || '',
                authProvider: authProvider || 'google',
                createdAt: now,
                updatedAt: now,
                lastLoginAt: now,
            };
            await ref.set(profile);
            // Await seeding so categories + limits exist before the frontend loads.
            await seedNewUser(req.uid);
            return ok(res, { id: req.uid, ...profile }, 201);
        }

        // Existing user — check if seeding ever completed (catches race-condition victims).
        const needsSeed = !snap.data().categoriesSeeded;
        const updates = { lastLoginAt: now, updatedAt: now };
        await ref.update(updates);
        if (needsSeed) await seedNewUser(req.uid);

        const updated = await ref.get();
        ok(res, { id: updated.id, ...updated.data() });
    } catch (e) {
        fail(res, e.message);
    }
};

// PUT /api/auth/profile  (update optional fields)
const updateProfile = async (req, res) => {
    try {
        const allowed = ['firstName', 'lastName', 'displayName', 'photoURL', 'age', 'dateOfBirth', 'phoneNumber'];
        const updates = {};
        allowed.forEach((key) => {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        });
        updates.updatedAt = FieldValue.serverTimestamp();

        await usersCol(req.uid).update(updates);
        const snap = await usersCol(req.uid).get();
        ok(res, { id: snap.id, ...snap.data() });
    } catch (e) {
        fail(res, e.message);
    }
};

// PATCH /api/auth/last-login
const updateLastLogin = async (req, res) => {
    try {
        await usersCol(req.uid).update({ lastLoginAt: FieldValue.serverTimestamp() });
        ok(res, { updated: true });
    } catch (e) {
        fail(res, e.message);
    }
};

// POST /api/auth/register  (email/password registration)
const register = async (req, res) => {
    try {
        const ref = usersCol(req.uid);
        const snap = await ref.get();

        // Existing user — check if seeding ever completed.
        if (snap.exists) {
            if (!snap.data().categoriesSeeded) await seedNewUser(req.uid);
            return ok(res, { id: snap.id, ...snap.data() });
        }

        const { username, email } = req.body;
        const now = FieldValue.serverTimestamp();
        const profile = { username: username || '', email: email || req.email || '', createdAt: now };
        await ref.set(profile);
        // Await seeding so categories + limits exist before the frontend loads.
        await seedNewUser(req.uid);
        ok(res, { id: req.uid, ...profile }, 201);
    } catch (e) {
        fail(res, e.message);
    }
};

module.exports = { getProfile, createOrUpdateProfile, updateProfile, updateLastLogin, register };
