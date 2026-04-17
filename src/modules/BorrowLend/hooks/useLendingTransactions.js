import { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../../../firebase';
import { collection, getDocs, deleteDoc, doc, orderBy, query, updateDoc } from 'firebase/firestore';
import { TRANSACTION_TYPES } from '../constants/transactionTypes';
import { addBorrowLendRecord } from '../utils/borrowLendFirestore';
import {
    getDueTrackingTransactions,
    getDueStatus,
    getUpcomingTransactions,
    getOverdueTransactions
} from '../utils/dueDateUtils';


const expandTransactionsFromRecords = (records) => {
    const expanded = [];

    records.forEach(record => {
        const entries = Array.isArray(record.data) ? record.data : [];

        entries.forEach((entry, idx) => {
            expanded.push({
                id: entry.uuid || `${record.id}-${idx}`, // Use UUID as primary identifier, fallback to composite ID
                uuid: entry.uuid,
                docId: record.id,
                personName: record.personName,
                type: record.type,
                amount: Number(entry.amount || 0),
                date: entry.insert_date || '',
                dueDate: entry.due_date || null,
                description: entry.description || '',
                paymentType: entry.payment_type || (record.type === TRANSACTION_TYPES.GAVE ? 'Lent' : 'Borrowed'),
                archived: entry.archived || false,
                archivedAt: entry.archivedAt || null,
                markAsDone: entry.markAsDone || false,
                markedDoneAt: entry.markedDoneAt || null,
            });
        });
    });

    return expanded.sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const useLendingTransactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            setError(null);

            const userId = auth.currentUser?.uid;
            if (!userId) {
                console.error('User not authenticated');
                setTransactions([]);
                return;
            }

            const transactionsQuery = query(
                collection(db, 'users', userId, 'borrowLend'),
                orderBy('createdAt', 'desc')
            );

            const snapshot = await getDocs(transactionsQuery);
            const data = snapshot.docs.map((document) => document.data());
            setTransactions(data);
        } catch (err) {
            console.error('Error fetching lending transactions:', err);
            setError(err.message || 'Failed to load records');
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    const addTransaction = async (transactionData) => {
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) {
                throw new Error('User not authenticated');
            }

            await addBorrowLendRecord({
                personName: transactionData.personName,
                amount: transactionData.amount,
                type: transactionData.type,
                date: transactionData.date,
                dueDate: transactionData.dueDate,
                description: transactionData.description,
            });

            await fetchTransactions();
        } catch (err) {
            console.error('Error adding lending transaction:', err);
            throw err;
        }
    };

    const deleteTransaction = async (entryUuid) => {
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) {
                throw new Error('User not authenticated');
            }

            // Find the document containing the entry with the given UUID
            const transactionsQuery = query(
                collection(db, 'users', userId, 'borrowLend')
            );

            const snapshot = await getDocs(transactionsQuery);
            let documentFound = null;
            let entryIndex = -1;

            // Search through all documents to find the one containing the UUID
            snapshot.docs.forEach(document => {
                const data = document.data();
                if (Array.isArray(data.data)) {
                    const index = data.data.findIndex(entry => entry.uuid === entryUuid);
                    if (index !== -1) {
                        documentFound = document;
                        entryIndex = index;
                    }
                }
            });

            if (!documentFound) {
                throw new Error(`Entry with UUID ${entryUuid} not found`);
            }

            const docData = documentFound.data();
            const updatedDataArray = [...docData.data];

            // Remove the entry with the matching UUID
            updatedDataArray.splice(entryIndex, 1);

            // If this was the last entry, delete the entire document
            if (updatedDataArray.length === 0) {
                await deleteDoc(doc(db, 'users', userId, 'borrowLend', documentFound.id));
            } else {
                // Update the document with the modified data array
                await updateDoc(doc(db, 'users', userId, 'borrowLend', documentFound.id), {
                    data: updatedDataArray
                });
            }

            await fetchTransactions();
            return true;
        } catch (err) {
            console.error('Error deleting lending transaction entry:', {
                error: err.message,
                code: err.code,
                fullError: err
            });
            throw err;
        }
    };

    const computeRecordTotals = (record) => {
        const entries = Array.isArray(record.data) ? record.data : [];

        let totalLent = 0;
        let totalBorrowed = 0;
        let totalRepayment = 0;

        entries.forEach(entry => {
            const paymentType = (entry.payment_type || '').toLowerCase();
            const value = Number(entry.amount || 0);
            if (paymentType === 'lent') totalLent += value;
            else if (paymentType === 'borrowed') totalBorrowed += value;
            else if (paymentType === 'repayment' || paymentType === 'borrowed repayment') totalRepayment += value;
        });

        const outstanding = record.type === TRANSACTION_TYPES.GAVE
            ? Math.max(totalLent - totalRepayment, 0)
            : Math.max(totalBorrowed - totalRepayment, 0);

        return { totalLent, totalBorrowed, totalRepayment, outstanding, entries };
    };

    const getTotalGiven = () => {
        const total = transactions
            .filter(t => t.type === TRANSACTION_TYPES.GAVE)
            .reduce((sum, t) => sum + (computeRecordTotals(t).outstanding || 0), 0);
        return Math.round(total * 100) / 100;
    };

    const getTotalTaken = () => {
        const total = transactions
            .filter(t => t.type === TRANSACTION_TYPES.TOOK)
            .reduce((sum, t) => sum + (computeRecordTotals(t).outstanding || 0), 0);
        return Math.round(total * 100) / 100;
    };

    const getNetBalance = () => {
        const given = getTotalGiven();
        const taken = getTotalTaken();
        return Math.round((given - taken) * 100) / 100;
    };

    const expandedTransactions = useMemo(() => expandTransactionsFromRecords(transactions), [transactions]);

    // Compute record totals by type for due tracking
    const recordTotals = useMemo(() => {
        const totals = {
            [TRANSACTION_TYPES.GAVE]: [],
            [TRANSACTION_TYPES.TOOK]: []
        };

        // Group transactions by type and person
        Object.keys(totals).forEach(type => {
            const recordsOfType = transactions.filter(t => t.type === type);

            recordsOfType.forEach(record => {
                const computed = computeRecordTotals(record);
                totals[type].push({
                    person: record.personName,
                    ...computed
                });
            });
        });

        return totals;
    }, [transactions]);

    const getFilteredTransactions = (filterType) => {
        if (filterType === 'all') return expandedTransactions;
        return expandedTransactions.filter(t => t.type === filterType);
    };

    const getUniquePersonNames = () => {
        const names = new Set();
        transactions.forEach(record => {
            if (record.personName && record.personName.trim()) {
                names.add(record.personName.trim());
            }
        });
        return Array.from(names).sort();
    };

    // Archive functionality
    const archiveTransaction = async (entryUuid) => {
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) {
                throw new Error('User not authenticated');
            }

            // Find the document containing the entry with the given UUID
            const transactionsQuery = query(
                collection(db, 'users', userId, 'borrowLend')
            );

            const snapshot = await getDocs(transactionsQuery);
            let documentFound = null;
            let entryIndex = -1;

            // Search through all documents to find the one containing the UUID
            snapshot.docs.forEach(document => {
                const data = document.data();
                if (Array.isArray(data.data)) {
                    const index = data.data.findIndex(entry => entry.uuid === entryUuid);
                    if (index !== -1) {
                        documentFound = document;
                        entryIndex = index;
                    }
                }
            });

            if (!documentFound) {
                throw new Error(`Entry with UUID ${entryUuid} not found`);
            }

            const docData = documentFound.data();
            const updatedDataArray = [...docData.data];

            // Update the entry with archived flag
            updatedDataArray[entryIndex] = {
                ...updatedDataArray[entryIndex],
                archived: true,
                archivedAt: new Date().toISOString()
            };

            // Update the document with the modified data array
            await updateDoc(doc(db, 'users', userId, 'borrowLend', documentFound.id), {
                data: updatedDataArray
            });

            await fetchTransactions();
            return true;
        } catch (err) {
            console.error('Error archiving transaction entry:', {
                error: err.message,
                code: err.code,
                fullError: err
            });
            throw err;
        }
    };

    // Mark as done functionality
    const markTransactionAsDone = async (entryUuid) => {
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) {
                throw new Error('User not authenticated');
            }

            // Find the document containing the entry with the given UUID
            const transactionsQuery = query(
                collection(db, 'users', userId, 'borrowLend')
            );

            const snapshot = await getDocs(transactionsQuery);
            let documentFound = null;
            let entryIndex = -1;

            // Search through all documents to find the one containing the UUID
            snapshot.docs.forEach(document => {
                const data = document.data();
                if (Array.isArray(data.data)) {
                    const index = data.data.findIndex(entry => entry.uuid === entryUuid);
                    if (index !== -1) {
                        documentFound = document;
                        entryIndex = index;
                    }
                }
            });

            if (!documentFound) {
                throw new Error(`Entry with UUID ${entryUuid} not found`);
            }

            const docData = documentFound.data();
            const updatedDataArray = [...docData.data];
            const currentEntry = updatedDataArray[entryIndex];

            // Toggle markAsDone status
            const newMarkAsDoneStatus = !(currentEntry.markAsDone || false);

            // Update the entry with markAsDone flag
            updatedDataArray[entryIndex] = {
                ...currentEntry,
                markAsDone: newMarkAsDoneStatus,
                markedDoneAt: newMarkAsDoneStatus ? new Date().toISOString() : null
            };

            // Update the document with the modified data array
            await updateDoc(doc(db, 'users', userId, 'borrowLend', documentFound.id), {
                data: updatedDataArray
            });

            await fetchTransactions();
            return newMarkAsDoneStatus;
        } catch (err) {
            console.error('Error marking transaction as done:', {
                error: err.message,
                code: err.code,
                fullError: err
            });
            throw err;
        }
    };

    const unarchiveTransaction = async (entryUuid) => {
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) {
                throw new Error('User not authenticated');
            }

            // Find the document containing the entry with the given UUID
            const transactionsQuery = query(
                collection(db, 'users', userId, 'borrowLend')
            );

            const snapshot = await getDocs(transactionsQuery);
            let documentFound = null;
            let entryIndex = -1;

            // Search through all documents to find the one containing the UUID
            snapshot.docs.forEach(document => {
                const data = document.data();
                if (Array.isArray(data.data)) {
                    const index = data.data.findIndex(entry => entry.uuid === entryUuid);
                    if (index !== -1) {
                        documentFound = document;
                        entryIndex = index;
                    }
                }
            });

            if (!documentFound) {
                throw new Error(`Entry with UUID ${entryUuid} not found`);
            }

            const docData = documentFound.data();
            const updatedDataArray = [...docData.data];

            // Remove archived flag from the entry
            const { archived, archivedAt, ...entryWithoutArchive } = updatedDataArray[entryIndex];
            updatedDataArray[entryIndex] = entryWithoutArchive;

            // Update the document with the modified data array
            await updateDoc(doc(db, 'users', userId, 'borrowLend', documentFound.id), {
                data: updatedDataArray
            });

            await fetchTransactions();
            return true;
        } catch (err) {
            console.error('Error unarchiving transaction entry:', {
                error: err.message,
                code: err.code,
                fullError: err
            });
            throw err;
        }
    };

    // Due tracking functionality
    const getActiveTransactions = () => {
        return expandedTransactions.filter(t => !t.archived && !t.markAsDone);
    };

    const getArchivedTransactions = () => {
        return expandedTransactions.filter(t => t.archived);
    };

    const getDueTrackingData = () => {
        const activeTransactions = getActiveTransactions();
        return getDueTrackingTransactions(activeTransactions);
    };

    const getDueTrackingByType = (transactionType) => {
        const activeTransactions = getActiveTransactions().filter(t => t.type === transactionType);

        // Create a function to get outstanding amount for a specific person/type
        const getOutstandingForPerson = (personName, type) => {
            const records = recordTotals[type] || [];
            const personRecord = records.find(record => record.person === personName);
            return personRecord ? Math.abs(personRecord.outstanding) : 0;
        };

        return getDueTrackingTransactions(activeTransactions, getOutstandingForPerson);
    };

    const getUpcomingDues = (transactionType = null) => {
        const transactions = transactionType
            ? getActiveTransactions().filter(t => t.type === transactionType)
            : getActiveTransactions();

        // Create a function to get outstanding amount for a specific person/type
        const getOutstandingForPerson = (personName, type) => {
            const records = recordTotals[type] || [];
            const personRecord = records.find(record => record.person === personName);
            return personRecord ? Math.abs(personRecord.outstanding) : 0;
        };

        return getUpcomingTransactions(transactions, getOutstandingForPerson);
    };

    const getOverdueDues = (transactionType = null) => {
        const transactions = transactionType
            ? getActiveTransactions().filter(t => t.type === transactionType)
            : getActiveTransactions();

        // Create a function to get outstanding amount for a specific person/type
        const getOutstandingForPerson = (personName, type) => {
            const records = recordTotals[type] || [];
            const personRecord = records.find(record => record.person === personName);
            return personRecord ? Math.abs(personRecord.outstanding) : 0;
        };

        return getOverdueTransactions(transactions, getOutstandingForPerson);
    };

    return {
        transactions,
        expandedTransactions,
        addTransaction,
        deleteTransaction,
        getTotalGiven,
        getTotalTaken,
        getNetBalance,
        getFilteredTransactions,
        getUniquePersonNames,
        // Archive functionality
        archiveTransaction,
        unarchiveTransaction,
        getActiveTransactions,
        getArchivedTransactions,
        markTransactionAsDone,
        // Due tracking functionality
        getDueTrackingData,
        getDueTrackingByType,
        getUpcomingDues,
        getOverdueDues,
        loading,
        error,
        refreshTransactions: fetchTransactions,
    };
};
