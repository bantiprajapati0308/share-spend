const https = require('https');
const { db, FieldValue } = require('../../config/firebase');
const { ok, fail, notFound, badRequest } = require('../../utils/response');
const { seedPredefinedCategoriesForUser } = require('../dailySpends/categoriesController');
const { seedPredefinedLimitsForUser } = require('../dailySpends/categoryLimitsController');
const { seedDefaultDateRangeForUser } = require('./settingsController');

// Firebase Web API key — used for client-facing REST calls (password reset, email verification).
// This key is intentionally public (same as what's in the frontend config).
const FIREBASE_WEB_API_KEY = process.env.FIREBASE_WEB_API_KEY || 'AIzaSyB0da2mYw-OstqycXFrlOKnxr7sIAhN3Sg';

/**
 * Calls Firebase Identity Toolkit REST API (OOB codes — password reset & email verify).
 * Uses Node's built-in https module to avoid extra dependencies.
 */
function firebaseOob(payload) {
    const body = JSON.stringify(payload);
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'identitytoolkit.googleapis.com',
            path: `/v1/accounts:sendOobCode?key=${FIREBASE_WEB_API_KEY}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
            },
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
                catch { resolve({ status: res.statusCode, body: data }); }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

// Seeds categories + limits + date range for a new user.
// Runs all three in parallel, then marks categoriesSeeded=true and dateRangeSeeded=true.
// Throws on failure so the caller can surface the error properly.
const seedNewUser = async (uid) => {
    console.log(`[auth] Seeding categories + limits + date range for uid=${uid}`);
    const [catAdded, limAdded] = await Promise.all([
        seedPredefinedCategoriesForUser(uid),
        seedPredefinedLimitsForUser(uid),
        seedDefaultDateRangeForUser(uid),
    ]);
    console.log(`[auth] Seeded ${catAdded} categories, ${limAdded} limits for uid=${uid}`);
    await db.collection('users').doc(uid).update({ categoriesSeeded: true, dateRangeSeeded: true });
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
            const { email, firstName, lastName, displayName, photoURL, authProvider, dateOfBirth, mobile } = req.body;
            const profile = {
                uid: req.uid,
                email: email || req.email || '',
                firstName: firstName || '',
                lastName: lastName || '',
                displayName: displayName || '',
                photoURL: photoURL || '',
                authProvider: authProvider || 'google',
                dateOfBirth: dateOfBirth || null,
                mobile: mobile || '',
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
        // Date range seeded separately so users who existed before this feature get it too.
        const needsDateRange = !snap.data().dateRangeSeeded;
        const { firstName: fName, lastName: lName, photoURL: pURL, dateOfBirth: dob, mobile: mob } = req.body;
        const data = snap.data();
        const updates = { lastLoginAt: now, updatedAt: now };
        // Always refresh photo URL (Google accounts may rotate it)
        if (pURL) updates.photoURL = pURL;
        // Patch fields that may be blank (e.g. Google user who later sets a phone number)
        if (!data.dateOfBirth && dob) updates.dateOfBirth = dob;
        if (!data.mobile && mob) updates.mobile = mob;
        if (!data.firstName && fName) updates.firstName = fName;
        if (!data.lastName && lName) updates.lastName = lName;
        await ref.update(updates);
        if (needsSeed) await seedNewUser(req.uid);
        else if (needsDateRange) {
            await seedDefaultDateRangeForUser(req.uid);
            await ref.update({ dateRangeSeeded: true });
        }

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
        const { firstName, lastName, dateOfBirth, mobile, email } = req.body;
        const now = FieldValue.serverTimestamp();

        // Existing user — check if seeding ever completed.
        if (snap.exists) {
            if (!snap.data().categoriesSeeded) await seedNewUser(req.uid);
            // Patch any fields missing due to createOrUpdateProfile race condition
            const data = snap.data();
            const patch = { lastLoginAt: now, updatedAt: now };
            if (!data.firstName && firstName) patch.firstName = firstName;
            if (!data.lastName && lastName) patch.lastName = lastName;
            if (!data.dateOfBirth && dateOfBirth) patch.dateOfBirth = dateOfBirth;
            if (!data.mobile && mobile) patch.mobile = mobile;
            await ref.update(patch);
            const updated = await ref.get();
            return ok(res, { id: updated.id, ...updated.data() });
        }
        const profile = {
            firstName: firstName || '',
            lastName: lastName || '',
            displayName: `${firstName || ''} ${lastName || ''}`.trim(),
            dateOfBirth: dateOfBirth || null,
            mobile: mobile || '',
            email: email || req.email || '',
            authProvider: 'email',
            createdAt: now,
            updatedAt: now,
            lastLoginAt: now,
        };
        await ref.set(profile);
        // Await seeding so categories + limits exist before the frontend loads.
        await seedNewUser(req.uid);
        ok(res, { id: req.uid, ...profile }, 201);
    } catch (e) {
        fail(res, e.message);
    }
};

// POST /api/auth/forgot-password  (public — no auth required)
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return badRequest(res, 'email is required');
        // Always return success to prevent email enumeration attacks.
        await firebaseOob({ requestType: 'PASSWORD_RESET', email }).catch((e) =>
            console.warn('[forgotPassword] Firebase REST error:', e.message)
        );
        ok(res, { sent: true });
    } catch (e) {
        fail(res, e.message);
    }
};

// POST /api/auth/send-verification  (authenticated)
const sendVerification = async (req, res) => {
    try {
        const idToken = req.idToken;
        if (!idToken) return badRequest(res, 'Missing ID token');
        await firebaseOob({ requestType: 'VERIFY_EMAIL', idToken }).catch((e) =>
            console.warn('[sendVerification] Firebase REST error:', e.message)
        );
        ok(res, { sent: true });
    } catch (e) {
        fail(res, e.message);
    }
};

module.exports = { getProfile, createOrUpdateProfile, updateProfile, updateLastLogin, register, forgotPassword, sendVerification };
