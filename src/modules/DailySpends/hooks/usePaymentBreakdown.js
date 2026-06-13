import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import useCategoryContext from './useCategoryContext';
import { buildDisabledCategoryLookup, filterTransactionsByDisabledCategories } from '../utils/transactionVisibility';

/**
 * Computes a payment-method breakdown for a given transaction type.
 *
 * Returns an array of:
 *   { paymentMethodId, label, amount, percentage, color }
 * sorted descending by amount, plus a `total` number.
 *
 * Transactions with no paymentMethodId are grouped under "Other".
 */

const PM_META = {
    cash: { label: 'Via Cash', color: '#28a745', icon: 'bi-cash-coin' },
    upi: { label: 'Via UPI', color: '#667eea', icon: 'bi-phone-fill' },
    credit_card: { label: 'Via Credit Card', color: '#2196f3', icon: 'bi-credit-card-2-front-fill' },
};

const SUPPORTED_PM_IDS = new Set(Object.keys(PM_META));

export function usePaymentBreakdown(type) {
    const transactions = useSelector(state => state.dailySpends.transactions);
    const paymentMethods = useSelector(state => state.appConfig.paymentMethods);
    const { categories } = useCategoryContext();

    return useMemo(() => {
        const disabledLookup = buildDisabledCategoryLookup(categories);
        const visibleTransactions = filterTransactionsByDisabledCategories(transactions, disabledLookup);
        const filtered = visibleTransactions.filter(t => t.type === type);
        const total = filtered.reduce((sum, t) => sum + (t.amount || 0), 0);

        // Build a label map from the store so renames are reflected
        const pmLabelMap = {};
        paymentMethods.forEach(pm => { pmLabelMap[pm.value] = pm.label; });

        // Accumulate amounts only for the three supported payment methods.
        // Credit card companion income entries have paymentMethodId: null,
        // so we resolve them to 'credit_card' via the isCreditCardCompanion flag.
        const amountMap = {};
        filtered.forEach(t => {
            const key = (!t.paymentMethodId && t.isCreditCardCompanion)
                ? 'credit_card'
                : t.paymentMethodId;
            if (!key || !SUPPORTED_PM_IDS.has(key)) return;
            amountMap[key] = (amountMap[key] || 0) + (t.amount || 0);
        });

        const rows = Object.entries(amountMap).map(([pmId, amount]) => {
            const meta = PM_META[pmId];
            const storeLabel = pmLabelMap[pmId];
            return {
                paymentMethodId: pmId,
                label: storeLabel ? `Via ${storeLabel}` : meta.label,
                amount,
                percentage: total > 0 ? (amount / total) * 100 : 0,
                color: meta.color,
                icon: meta.icon,
            };
        });

        rows.sort((a, b) => b.amount - a.amount);

        return { rows, total };
    }, [transactions, paymentMethods, categories, type]);
}
