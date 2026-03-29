import { db, auth } from '../../../firebase';
import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
} from 'firebase/firestore';

/**
 * Save and retrieve selected date range from Firestore
 * Stores in users/{userId}/settings document
 */

export const useSelectedDateRange = () => {
    const userId = auth.currentUser?.uid;

    if (!userId) {
        console.error('User not authenticated');
        return {};
    }

    const settingsDoc = doc(db, 'users', userId, 'settings', 'dateRange');

    /**
     * Save selected date range to Firestore
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Promise<void>}
     */
    const saveDateRange = async (startDate, endDate) => {
        try {
            const startDateStr = startDate instanceof Date
                ? startDate.toISOString().split('T')[0]
                : startDate;
            const endDateStr = endDate instanceof Date
                ? endDate.toISOString().split('T')[0]
                : endDate;

            await setDoc(
                settingsDoc,
                {
                    startDate: startDateStr,
                    endDate: endDateStr,
                    updatedAt: serverTimestamp(),
                },
                { merge: true }
            );
        } catch (error) {
            console.error('Error saving date range:', error);
            throw error;
        }
    };

    /**
     * Load selected date range from Firestore
     * Returns null if not set (user hasn't selected yet)
     * @returns {Promise<Object|null>} - { startDate, endDate } or null
     */
    const loadDateRange = async () => {
        try {
            const settingsSnapshot = await getDoc(settingsDoc);

            if (settingsSnapshot.exists()) {
                const data = settingsSnapshot.data();
                return {
                    startDate: data.startDate || null,
                    endDate: data.endDate || null,
                };
            }

            return null;
        } catch (error) {
            console.error('Error loading date range:', error);
            throw error;
        }
    };

    return {
        saveDateRange,
        loadDateRange,
    };
};

export default useSelectedDateRange;
