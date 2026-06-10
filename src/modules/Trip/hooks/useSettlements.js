import { useState, useEffect } from 'react';
import { getTripSettlements } from '../utils/settlementAPI';

/**
 * Custom hook for managing settlement state and loading settlement history
 */
function useSettlements(tripId) {
    const [settlements, setSettlements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load settlements when component mounts or tripId changes
    useEffect(() => {
        if (!tripId) return;

        const loadSettlements = async () => {
            setLoading(true);
            setError(null);

            try {
                const settlementHistory = await getTripSettlements(tripId);
                setSettlements(settlementHistory);
            } catch (err) {
                setError(err.message);
                console.error('Failed to load settlements:', err);
            } finally {
                setLoading(false);
            }
        };

        loadSettlements();
    }, [tripId]);

    // Add a new settlement to the local state (for optimistic updates)
    const addSettlement = (settlementData) => {
        const newSettlement = {
            id: `temp_${Date.now()}`,
            ...settlementData,
            createdAt: new Date(),
            status: 'completed'
        };
        setSettlements(prev => [newSettlement, ...prev]);
        return newSettlement;
    };

    // Remove a settlement from local state (for rollback)
    const removeSettlement = (settlementId) => {
        setSettlements(prev => prev.filter(s => s.id !== settlementId));
    };

    // Update settlement in local state
    const updateSettlement = (settlementId, updates) => {
        setSettlements(prev =>
            prev.map(s => s.id === settlementId ? { ...s, ...updates } : s)
        );
    };

    // Calculate total settlements for a specific payer-receiver pair
    const getTotalSettled = (payer, receiver) => {
        return settlements
            .filter(s => s.payer === payer && s.receiver === receiver)
            .reduce((total, settlement) => total + settlement.amount, 0);
    };

    // Get settlement history for display
    const getSettlementHistory = () => {
        return settlements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    };

    return {
        settlements,
        loading,
        error,
        addSettlement,
        removeSettlement,
        updateSettlement,
        getTotalSettled,
        getSettlementHistory,
        refreshSettlements: () => {
            if (tripId) {
                const loadSettlements = async () => {
                    try {
                        const settlementHistory = await getTripSettlements(tripId);
                        setSettlements(settlementHistory);
                    } catch (err) {
                        setError(err.message);
                    }
                };
                loadSettlements();
            }
        }
    };
}

export default useSettlements;