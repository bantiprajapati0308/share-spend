const admin = require('firebase-admin');
const path = require('path');

if (!admin.apps.length) {
    // Option A: FIREBASE_SERVICE_ACCOUNT env var contains the JSON string
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
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
        try {
            const serviceAccount = require(filePath);
            admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        } catch {
            throw new Error(
                'Firebase credentials not found. Provide one of:\n' +
                '  • FIREBASE_SERVICE_ACCOUNT env var (JSON string)\n' +
                '  • GOOGLE_APPLICATION_CREDENTIALS env var (path to JSON file)\n' +
                '  • server/serviceAccount.json file'
            );
        }
    }
}

const db = admin.firestore();
const auth = admin.auth();
const FieldValue = admin.firestore.FieldValue;

module.exports = { admin, db, auth, FieldValue };

