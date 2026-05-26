const normalizeCategoryKey = (value) => String(value || '').trim().toLowerCase();

export const buildDisabledCategoryLookup = (categories = []) => {
    const disabled = categories.filter((category) => category?.isEnabled === false);

    return {
        disabledIds: new Set(disabled.map((category) => String(category.id))),
        disabledNames: new Set(disabled.map((category) => normalizeCategoryKey(category.name))),
    };
};

export const isTransactionInDisabledCategory = (transaction, lookup) => {
    if (!transaction || !lookup) return false;

    if (transaction.categoryId && lookup.disabledIds.has(String(transaction.categoryId))) {
        return true;
    }

    const categoryName = normalizeCategoryKey(transaction.categoryName || transaction.category);
    if (categoryName && lookup.disabledNames.has(categoryName)) {
        return true;
    }

    return false;
};

export const filterTransactionsByDisabledCategories = (transactions = [], lookup) => {
    if (!Array.isArray(transactions) || transactions.length === 0) return [];
    return transactions.filter((transaction) => !isTransactionInDisabledCategory(transaction, lookup));
};
