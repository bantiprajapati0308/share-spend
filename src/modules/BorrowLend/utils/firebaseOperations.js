/**
 * Firebase BorrowLend Operations Utility  
 * Optimized reusable functions for Firebase operations
 */

import { db, auth } from '../../../firebase';
import { collection, getDocs, deleteDoc, doc, query, updateDoc } from 'firebase/firestore';

/**
 * Core Firebase operation executor
 * @param {string} entryUuid - UUID to find
 * @param {Function} operation - Operation to perform on entry
 * @param {Function} refreshCallback - Callback to refresh data
 * @returns {Promise<any>} Operation result
 */
const executeFirebaseOperation = async (entryUuid, operation, refreshCallback) => {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error('User not authenticated');

        // Find document and entry
        const snapshot = await getDocs(query(collection(db, 'users', userId, 'borrowLend')));
        const found = snapshot.docs.reduce((acc, document) => {
            if (acc.found) return acc;
            const data = document.data();
            const index = data.data?.findIndex(entry => entry.uuid === entryUuid) ?? -1;
            return index !== -1 ? { found: true, document, index, data: [...data.data] } : acc;
        }, { found: false });

        if (!found.found) throw new Error(`Entry with UUID ${entryUuid} not found`);

        // Execute operation
        const result = operation(found.data[found.index], found.data, found.index);

        // Handle result: null = delete, object = update, other = return value
        if (result === null) {
            found.data.splice(found.index, 1);
        } else if (typeof result === 'object' && result.constructor === Object) {
            found.data[found.index] = result;
        } else {
            return result; // Custom return value, no DB update
        }

        // Save changes
        const docRef = doc(db, 'users', userId, 'borrowLend', found.document.id);
        found.data.length === 0
            ? await deleteDoc(docRef)
            : await updateDoc(docRef, { data: found.data });

        refreshCallback?.();
        return typeof result === 'object' ? true : result;
    } catch (err) {
        console.error(`Firebase operation failed for ${entryUuid}:`, err.message);
        throw err;
    }
};

// Operation factories
const createUpdateOperation = (updateFn) => (entry) => ({ ...entry, ...updateFn(entry) });
const createDeleteOperation = () => () => null;
const createToggleOperation = (field, timestampField) => (entry) => {
    const newValue = !entry[field];
    return { [field]: newValue, [timestampField]: newValue ? new Date().toISOString() : null };
};

// Public API
export const archiveEntryByUuid = (uuid, refresh) =>
    executeFirebaseOperation(uuid, createUpdateOperation(() => ({
        archived: true,
        archivedAt: new Date().toISOString()
    })), refresh);

export const unarchiveEntryByUuid = (uuid, refresh) =>
    executeFirebaseOperation(uuid, (entry) => {
        const { archived, archivedAt, ...clean } = entry;
        return clean;
    }, refresh);

export const toggleMarkAsDoneByUuid = async (uuid, refresh) => {
    let newStatus;
    await executeFirebaseOperation(uuid, (entry) => {
        newStatus = !entry.markAsDone;
        return createUpdateOperation(() => createToggleOperation('markAsDone', 'markedDoneAt')(entry))(entry);
    }, refresh);
    return newStatus;
};

export const deleteEntryByUuid = (uuid, refresh) =>
    executeFirebaseOperation(uuid, createDeleteOperation(), refresh);

// Generic updater for custom operations
export const updateEntryByUuid = (uuid, updateFn, refresh) =>
    executeFirebaseOperation(uuid, updateFn, refresh);