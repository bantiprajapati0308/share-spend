const admin = require('firebase-admin');
const path = require('path');

let initError = null;

const unavailableProxy = (name) =>
    new Proxy(
        {},
        {
            get() {
                const details = initError?.message || 'unknown Firebase initialization error';
                const err = new Error(`Firebase ${name} unavailable: ${details}`);
                err.status = 500;
                throw err;
            },
        }
    );

try {
    if (!admin.apps.length) {
        // Option A: FIREBASE_SERVICE_ACCOUNT env var contains the JSON string
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            const raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
            admin.initializeApp({
                credential: admin.credential.cert(JSON.parse(raw)),
            });
        }
        // Option B: GOOGLE_APPLICATION_CREDENTIALS points to the JSON file (standard Firebase approach)
        else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
            });
        }
        // Option C: serviceAccount.json file exists next to server.js (dev convenience)
        else {
            const filePath = path.join(__dirname, '../../serviceAccount.json');
            const serviceAccount = require(filePath);
            admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        }
    }
} catch (error) {
    initError = new Error(
        'Firebase credentials not found or invalid. Set FIREBASE_SERVICE_ACCOUNT (JSON string) '
        + 'or GOOGLE_APPLICATION_CREDENTIALS (path), or provide server/serviceAccount.json.'
    );
    initError.cause = error;
    console.error('[firebase] initialization failed:', error?.message || error);
}

const db = initError ? unavailableProxy('db') : admin.firestore();
const auth = initError ? unavailableProxy('auth') : admin.auth();
const FieldValue = admin.firestore.FieldValue;

module.exports = { admin, db, auth, FieldValue };

