export const buildDisabledCategoryLookup = (categories = []) => {
    const disabled = categories.filter((category) => category?.isEnabled === false);
    return {
        disabledIds: new Set(disabled.map((category) => String(category.id))),
    };
};

export const isTransactionInDisabledCategory = (transaction, lookup) => {
    if (!transaction || !lookup) return false;
    // Filter by stable categoryId only — immune to name/emoji renames
    if (transaction.categoryId && lookup.disabledIds.has(String(transaction.categoryId))) {
        return true;
    }
    return false;
};

export const filterTransactionsByDisabledCategories = (transactions = [], lookup) => {
    if (!Array.isArray(transactions) || transactions.length === 0) return [];
    return transactions.filter((transaction) => !isTransactionInDisabledCategory(transaction, lookup));
};
