import { 
    collection, 
    doc, 
    addDoc, 
    updateDoc, 
    getDocs, 
    query, 
    where, 
    orderBy,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore';
import { auth, db } from '../firebase';

/**
 * Firestore Settlement Schema:
 * settlements/{settlementId} {
 *   tripId: string,
 *   amount: number,
 *   payer: string,
 *   receiver: string,
 *   originalAmount: number,
 *   originalPayer: string,
 *   originalReceiver: string,
 *   processedBy: string (user email),
 *   status: 'completed' | 'pending' | 'failed',
 *   createdAt: timestamp,
 *   updatedAt: timestamp
 * }
 */

/**
 * Process a settlement and save to Firestore
 */
export const processSettlement = async (tripId, settlementData) => {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User not authenticated');
        }

        const { amount, payer, receiver, originalTransaction } = settlementData;

        // Prepare settlement document
        const settlementDoc = {
            tripId,
            amount: parseFloat(amount),
            payer,
            receiver,
            originalAmount: originalTransaction.amount,
            originalPayer: originalTransaction.from,
            originalReceiver: originalTransaction.to,
            processedBy: user.email,
            status: 'completed',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        // Save settlement to Firestore
        const settlementRef = await addDoc(collection(db, 'settlements'), settlementDoc);

        console.log('Settlement saved to Firestore:', {
            settlementId: settlementRef.id,
            ...settlementDoc
        });

        return {
            success: true,
            settlementId: settlementRef.id,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('Settlement processing failed:', error);
        throw new Error(error.message || 'Failed to process settlement. Please try again.');
    }
};

/**
 * Update trip balances in Firestore after settlement
 * This is optional - settlements work without this update
 */
export const updateTripBalances = async (tripId, newBalances) => {
    try {
        // Check if user is authenticated
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User not authenticated');
        }

        // Validate inputs
        if (!tripId) {
            throw new Error('Invalid trip ID');
        }

        if (!newBalances || typeof newBalances !== 'object') {
            throw new Error('Invalid balance data');
        }

        // Update the trip document with new calculated balances
        const tripRef = doc(db, 'trips', tripId);
        
        // Prepare update data - only include fields that exist
        const updateData = {
            lastSettlementUpdate: serverTimestamp(),
            lastUpdatedBy: user.email
        };

        // Convert balances to a serializable format
        const serializableBalances = {};
        Object.entries(newBalances).forEach(([member, balance]) => {
            if (typeof balance === 'number' && !isNaN(balance)) {
                serializableBalances[member] = Number(balance.toFixed(2));
            }
        });

        // Only add balances if they have valid data
        if (Object.keys(serializableBalances).length > 0) {
            updateData.calculatedBalances = serializableBalances; // Use different field name
        }
        
        await updateDoc(tripRef, updateData);

        console.log('Trip metadata updated in Firestore:', {
            tripId,
            balances: serializableBalances,
            updatedBy: user.email
        });

        return {
            success: true,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('Failed to update trip metadata:', error);
        
        // Provide more specific error messages
        if (error.code === 'not-found') {
            throw new Error('Trip not found. Settlement saved but trip metadata not updated.');
        } else if (error.code === 'permission-denied') {
            throw new Error('Insufficient permissions to update trip metadata.');
        } else if (error.code === 'invalid-argument') {
            throw new Error('Invalid data format for trip update.');
        } else {
            throw new Error(error.message || 'Failed to update trip metadata.');
        }
    }
};

/**
 * Get all settlements for a trip
 */
export const getTripSettlements = async (tripId) => {
    try {
        // Simplified query to avoid composite index requirement
        const q = query(
            collection(db, 'settlements'),
            where('tripId', '==', tripId)
        );

        const querySnapshot = await getDocs(q);
        const settlements = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Filter for completed settlements and add to array
            if (data.status === 'completed') {
                settlements.push({
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate?.() || null
                });
            }
        });

        // Sort by creation date in JavaScript instead of Firestore
        settlements.sort((a, b) => {
            if (!a.createdAt) return 1;
            if (!b.createdAt) return -1;
            return b.createdAt.getTime() - a.createdAt.getTime();
        });

        return settlements;

    } catch (error) {
        console.error('Failed to fetch settlements:', error);
        throw new Error('Failed to load settlement history.');
    }
};

/**
 * Apply multiple settlements as a batch operation
 */
export const processBatchSettlements = async (tripId, settlementsArray) => {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User not authenticated');
        }

        const batch = writeBatch(db);
        const settlementIds = [];

        // Add all settlements to batch
        settlementsArray.forEach((settlementData) => {
            const settlementRef = doc(collection(db, 'settlements'));
            
            batch.set(settlementRef, {
                tripId,
                amount: parseFloat(settlementData.amount),
                payer: settlementData.payer,
                receiver: settlementData.receiver,
                originalAmount: settlementData.originalTransaction.amount,
                originalPayer: settlementData.originalTransaction.from,
                originalReceiver: settlementData.originalTransaction.to,
                processedBy: user.email,
                status: 'completed',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            settlementIds.push(settlementRef.id);
        });

        // Commit the batch
        await batch.commit();

        return {
            success: true,
            settlementIds,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('Batch settlement processing failed:', error);
        throw new Error('Failed to process settlements. Please try again.');
    }
};