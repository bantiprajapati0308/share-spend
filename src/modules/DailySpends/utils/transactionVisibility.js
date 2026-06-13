export const buildDisabledCategoryLookup = (categories = []) => {
    const disabled = categories.filter((category) => category?.isEnable === false);
    return {
        disabledIds: new Set(disabled.map((category) => String(category.id))),
        // Fallback for legacy transactions that only store category name, not categoryId
        disabledNames: new Set(disabled.map((category) => String(category.name))),
    };
};

export const isTransactionInDisabledCategory = (transaction, lookup) => {
    if (!transaction || !lookup) return false;
    // Check by categoryId first (stable, preferred)
    if (transaction.categoryId && lookup.disabledIds.has(String(transaction.categoryId))) {
        return true;
    }
    // Always also check by category name — covers legacy transactions that have no categoryId,
    // AND transactions where categoryId was stored in a different format (pre-migration, name-as-id, etc.)
    if (transaction.category && lookup.disabledNames.has(String(transaction.category))) {
        return true;
    }
    return false;
};

export const filterTransactionsByDisabledCategories = (transactions = [], lookup) => {
    if (!Array.isArray(transactions) || transactions.length === 0) return [];
    return transactions.filter((transaction) => !isTransactionInDisabledCategory(transaction, lookup));
};
