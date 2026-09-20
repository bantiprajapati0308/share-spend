const admin = require('firebase-admin');
const fs = require('fs');
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

const parseServiceAccount = (raw) => {
    if (!raw || !String(raw).trim()) return null;

    try {
        return JSON.parse(String(raw).trim());
    } catch (error) {
        const details = new Error('FIREBASE_SERVICE_ACCOUNT is not valid JSON.');
        details.cause = error;
        throw details;
    }
};

const resolveServiceAccount = () => {
    const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (rawJson) {
        return parseServiceAccount(rawJson);
    }

    const candidatePaths = [
        process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
        process.env.GOOGLE_APPLICATION_CREDENTIALS,
        path.join(__dirname, '../../serviceAccount.json'),
        path.join(__dirname, '../serviceAccount.json'),
        path.join(__dirname, 'serviceAccount.json'),
    ];

    for (const candidate of candidatePaths) {
        if (!candidate || !fs.existsSync(candidate)) continue;

        try {
            const text = fs.readFileSync(candidate, 'utf8');
            return JSON.parse(text);
        } catch (error) {
            const details = new Error(`Firebase credential file is invalid: ${candidate}`);
            details.cause = error;
            throw details;
        }
    }

    return null;
};

try {
    if (!admin.apps.length) {
        // Prefer explicit env-based credentials for deployments.
        if (process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            const serviceAccount = resolveServiceAccount();

            if (serviceAccount) {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                });
            } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
                admin.initializeApp({
                    credential: admin.credential.applicationDefault(),
                });
            }
        }
        // Local fallback only when the file exists.
        else {
            const serviceAccount = resolveServiceAccount();
            if (serviceAccount) {
                admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
            }
        }

        if (!admin.apps.length) {
            throw new Error(
                'Firebase credentials not found or invalid. Set FIREBASE_SERVICE_ACCOUNT (JSON string) or GOOGLE_APPLICATION_CREDENTIALS, or provide a valid serviceAccount.json file.'
            );
        }
    }
} catch (error) {
    initError = new Error(
        'Firebase credentials not found or invalid. Set FIREBASE_SERVICE_ACCOUNT (JSON string) '
        + 'or GOOGLE_APPLICATION_CREDENTIALS (path), or provide a valid serviceAccount.json file.'
    );
    initError.cause = error;
    console.error('[firebase] initialization failed:', error?.message || error);
}

const db = initError ? unavailableProxy('db') : admin.firestore();
const auth = initError ? unavailableProxy('auth') : admin.auth();
const FieldValue = admin.firestore.FieldValue;

module.exports = { admin, db, auth, FieldValue };

