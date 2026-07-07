const admin = require('firebase-admin');

try {
    if (!admin.apps.length) {
        admin.initializeApp();
    }
} catch (error) {
    console.error('[functions/firebase] failed to initialize Firebase Admin:', error);
    throw error;
}

const db = admin.firestore();

module.exports = { admin, db };
