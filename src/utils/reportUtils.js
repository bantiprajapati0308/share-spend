import { auth } from '../firebase';
import { getCurrencySymbol } from '../Util';
import { getMembers, getExpenses } from '../hooks/useReport';
import { processSettlement, updateTripBalances } from './settlementAPI';
import { applySettlement, calculateTransactionsFromBalances } from './settlementCalculations';
import { getInitialFilters } from './expenseFilterUtils';

/**
 * Report Data Management Utilities
 * Centralized logic for handling report data fetching, settlements, and state management
 */

/**
 * Fetch all required data for report
 */
export const fetchReportData = async (tripId) => {
    try {
        const [memberList, expenseList] = await Promise.all([
            getMembers(tripId),
            getExpenses(tripId)
        ]);

        return {
            members: memberList,
            expenses: expenseList
        };
    } catch (error) {
        console.error('Failed to fetch report data:', error);
        throw new Error('Failed to load report data. Please try again.');
    }
};

/**
 * Initialize filter states
 */
export const initializeFilters = () => {
    return {
        filters: getInitialFilters(),
        showFilters: false
    };
};

/**
 * Initialize accordion states
 */
export const initializeAccordionStates = () => {
    return {
        expenses: "0",
        spentAmounts: "1",
        balances: "2",
        settlements: "3",
        personShares: "4",
        settlementHistory: "5"
    };
};

/**
 * Filter management handlers
 */
export const createFilterHandlers = (setExpenseFilters, setShowFilters) => {
    const handleFilterChange = (field, value) => {
        setExpenseFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleMultiSelectChange = (field, selectedOptions) => {
        const values = selectedOptions ? selectedOptions.map(option => option.value) : [];
        setExpenseFilters(prev => ({
            ...prev,
            [field]: values
        }));
    };

    const handleClearFilters = () => {
        setExpenseFilters(getInitialFilters());
    };

    const toggleFilters = () => {
        setShowFilters(prev => !prev);
    };

    return {
        handleFilterChange,
        handleMultiSelectChange,
        handleClearFilters,
        toggleFilters
    };
};

/**
 * Accordion management handlers
 */
export const createAccordionHandlers = (setAccordionStates) => {
    const handleAccordionSelect = (accordionKey, eventKey) => {
        setAccordionStates(prev => ({
            ...prev,
            [accordionKey]: eventKey
        }));
    };

    return { handleAccordionSelect };
};

/**
 * Modal management handlers
 */
export const createModalHandlers = (
    setShowParticipants,
    setCurrentParticipants,
    setShowSettlementModal,
    setSelectedTransaction
) => {
    const handleShowParticipants = (participants) => {
        setCurrentParticipants(participants);
        setShowParticipants(true);
    };

    const handleCloseParticipants = () => setShowParticipants(false);

    const handleTransactionClick = (transaction) => {
        setSelectedTransaction(transaction);
        setShowSettlementModal(true);
    };

    const handleCloseSettlementModal = () => {
        setShowSettlementModal(false);
        setSelectedTransaction(null);
    };

    return {
        handleShowParticipants,
        handleCloseParticipants,
        handleTransactionClick,
        handleCloseSettlementModal
    };
};

/**
 * Toast notification handlers
 */
export const createToastHandlers = (setToast) => {
    const showSuccessToast = (title, message) => {
        setToast({
            show: true,
            variant: 'success',
            title,
            message
        });
    };

    const showErrorToast = (title, message) => {
        setToast({
            show: true,
            variant: 'warning',
            title,
            message
        });
    };

    const handleToastClose = () => {
        setToast(prev => ({ ...prev, show: false }));
    };

    return {
        showSuccessToast,
        showErrorToast,
        handleToastClose
    };
};

/**
 * Settlement processing logic
 */
export const createSettlementHandler = ({
    tripId,
    currency,
    currentBalances,
    addSettlement,
    removeSettlement,
    refreshSettlements,
    setOverrideBalances,
    setOverrideTransactions,
    setSettlementLoading,
    setShowSettlementModal,
    setSelectedTransaction,
    showSuccessToast,
    showErrorToast
}) => {
    const handleSettlementSubmit = async (settlementData) => {
        setSettlementLoading(true);
        let tempSettlement = null;

        try {
            // 1. Apply settlement optimistically for immediate UI feedback
            const result = applySettlement(currentBalances, settlementData);
            setOverrideBalances(result.balances);
            setOverrideTransactions(result.transactions);

            // 2. Add settlement to local state for tracking
            tempSettlement = addSettlement({
                tripId,
                ...settlementData,
                processedBy: auth.currentUser?.email
            });

            // 3. Save settlement to Firestore
            const settlementResult = await processSettlement(tripId, settlementData);
            console.log('Settlement processed successfully:', settlementResult);

            // 4. Update trip balances in Firestore (optional)
            try {
                await updateTripBalances(tripId, result.balances);
                console.log('Trip balances updated successfully');
            } catch (balanceError) {
                console.warn('Failed to update trip balances, but settlement was saved:', balanceError);
                // Don't throw here - settlement was still successful
            }

            // 5. Clear override states since settlements are now included in base calculations
            setOverrideBalances(null);
            setOverrideTransactions(null);

            // 6. Update the local settlement with the actual ID from Firestore
            if (tempSettlement && settlementResult.settlementId) {
                // Remove temp settlement and refresh from database
                removeSettlement(tempSettlement.id);
                await refreshSettlements();
            }

            // 7. Success - close modal and show success toast
            setShowSettlementModal(false);
            setSelectedTransaction(null);
            showSuccessToast(
                'Settlement Saved!',
                `${settlementData.payer} paid ${getCurrencySymbol(currency)}${settlementData.amount.toFixed(2)} to ${settlementData.receiver}. Settlement saved to database.`
            );

        } catch (error) {
            console.error('Settlement submission failed:', error);

            // 8. Rollback optimistic updates on error
            setOverrideBalances(null);
            setOverrideTransactions(null);

            // 9. Remove the temporary settlement from local state
            if (tempSettlement) {
                removeSettlement(tempSettlement.id);
            }

            // 10. Show error toast
            showErrorToast(
                'Settlement Failed',
                error.message || 'Failed to save settlement to database. Please try again.'
            );

            // Re-throw to let modal handle the error
            throw error;
        } finally {
            setSettlementLoading(false);
        }
    };

    return { handleSettlementSubmit };
};

/**
 * Member options utility
 */
export const createMemberOptions = (members) => {
    return members.map(member => ({
        value: member,
        label: member
    }));
};

/**
 * Calculate applied settlements and get current state
 */
export const calculateSettledBalances = (baseCalculatedData, settlements) => {
    if (!settlements || settlements.length === 0) {
        return baseCalculatedData;
    }

    // Start with base balances
    let adjustedBalances = { ...baseCalculatedData.balances };

    // Apply all settlements to balances
    settlements.forEach(settlement => {
        if (settlement.status === 'completed') {
            adjustedBalances[settlement.payer] = (adjustedBalances[settlement.payer] || 0) + settlement.amount;
            adjustedBalances[settlement.receiver] = (adjustedBalances[settlement.receiver] || 0) - settlement.amount;
        }
    });

    // Recalculate transactions from adjusted balances
    const adjustedTransactions = calculateTransactionsFromBalances(adjustedBalances);

    return {
        ...baseCalculatedData,
        balances: adjustedBalances,
        transactions: adjustedTransactions
    };
};

/**
 * Create a complete report state manager
 */
export const createReportStateManager = () => {
    return {
        fetchReportData,
        initializeFilters,
        initializeAccordionStates,
        createFilterHandlers,
        createAccordionHandlers,
        createModalHandlers,
        createToastHandlers,
        createSettlementHandler,
        createMemberOptions,
        calculateSettledBalances
    };
};

export default createReportStateManager;