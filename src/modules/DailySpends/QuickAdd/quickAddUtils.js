export const confidenceTone = (confidence) => {
    if (confidence === 'low') return 'alert';
    if (confidence === 'medium') return 'warning';
    return 'normal';
};

const defaultFieldMeta = (field, confidence, status = 'pending') => ({
    field,
    confidence: ['high', 'medium', 'low'].includes(confidence) ? confidence : 'high',
    status,
    explanation: getFieldExplanation(field, confidence),
});

export const getFieldExplanation = (field, confidence) => {
    const base = {
        category: 'Category was inferred based on your input. Please verify this value.',
        amount: 'Amount was inferred or estimated. Please verify this value.',
        name: 'Expense name was inferred from your input. Please verify this value.',
        date: 'Date was inferred based on the context you gave. Please verify this value.',
        time: 'Time was inferred based on the context. Please verify this value.',
        paymentMethod: 'Payment method was not clearly mentioned. Please review and select the correct payment method.',
        note: 'Note was inferred or shortened from your input. Please verify this value.',
    };

    if (field === 'paymentMethod' && confidence === 'low') {
        return 'Payment method was not clearly mentioned. Please review and select the correct payment method.';
    }

    return base[field] || 'This value was inferred and should be reviewed before saving.';
};

export const getFieldConfidenceState = ({ field, confidence, status } = {}) => {
    const level = ['high', 'medium', 'low'].includes(confidence) ? confidence : 'high';
    const state = {
        field,
        level,
        status: status || (level === 'high' ? 'confirmed' : 'pending'),
        icon: level === 'low' ? 'alert' : level === 'medium' ? 'warning' : 'check',
        explanation: getFieldExplanation(field, level),
    };

    return state;
};

export const getTransactionFieldMeta = (transaction = {}) => {
    const container = transaction.fieldMeta || {};
    const fields = ['category', 'amount', 'name', 'date', 'time', 'paymentMethod', 'note'];

    return fields.reduce((acc, field) => {
        const fieldKey = `${field}Confidence`;
        const confidence = transaction[fieldKey] || (field === 'category' ? transaction.categoryConfidence : null);
        const fieldState = container[field] || {};
        const base = getFieldConfidenceState({
            field,
            confidence: confidence || 'high',
            status: fieldState.status || (confidence === 'high' ? 'confirmed' : 'pending'),
        });

        acc[field] = { ...base, ...fieldState };
        return acc;
    }, {});
};

export const normalizeQuickAddTransaction = (transaction = {}) => {
    if (!transaction || typeof transaction !== 'object') return transaction;

    const normalized = { ...transaction };
    normalized.fieldMeta = getTransactionFieldMeta(normalized);
    normalized.categoryConfidence = normalized.categoryConfidence || 'high';
    normalized.paymentMethodConfidence = normalized.paymentMethodConfidence || 'high';
    normalized.dateConfidence = normalized.dateConfidence || 'high';
    normalized.timeConfidence = normalized.timeConfidence || 'high';
    normalized.amountConfidence = normalized.amountConfidence || 'high';
    normalized.nameConfidence = normalized.nameConfidence || 'high';

    return normalized;
};

export const hasUnresolvedLowConfidence = (transaction = {}) => {
    const fieldMeta = getTransactionFieldMeta(transaction);
    return Object.values(fieldMeta).some((meta) => meta.level === 'low' && meta.status !== 'confirmed');
};

export const getReviewSaveState = (transactions = []) => {
    const unresolvedLow = transactions.filter((transaction) => hasUnresolvedLowConfidence(transaction)).length;
    const readyCount = transactions.filter((transaction) => !hasUnresolvedLowConfidence(transaction)).length;

    return {
        disabled: unresolvedLow > 0,
        message: unresolvedLow > 0 ? 'Please resolve the fields marked in red before saving.' : '',
        readyCount,
    };
};

export const formatQuickAddDateTime = (transaction = {}) => {
    if (!transaction.date && !transaction.time) return 'Date not specified';

    const dateValue = transaction.date
        ? new Date(`${transaction.date}T${transaction.time || '00:00:00'}`)
        : new Date();

    if (Number.isNaN(dateValue.getTime())) return 'Date not specified';

    return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(dateValue).replace(' at ', ' · ');
};

export const categoryForId = (categories, categoryId) =>
    categories.find((category) => category.id === categoryId) || null;

export const transactionPayload = (transaction, category) => ({
    type: transaction.type === 'income' ? 'income' : 'spend',
    name: transaction.name?.trim() || 'Untitled transaction',
    amount: Number(transaction.amount),
    categoryId: category?.id || transaction.categoryId || null,
    categoryName: category?.name || 'Uncategorized',
    category: category?.name || 'Uncategorized',
    categoryIcon: category?.emoji || '🏷️',
    date: `${transaction.date}T${transaction.time || '12:00:00'}`,
    notes: transaction.note || '',
    paymentMethodId: transaction.paymentMethod || null,
});

export const displayPaymentMethod = (paymentMethods, value) =>
    paymentMethods.find((method) => method.value === value)?.label || value?.replaceAll('_', ' ') || 'Not selected';
