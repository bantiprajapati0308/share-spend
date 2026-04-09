/**
 * Utility functions for Master Report
 * Handles CSV generation, export, and other helper functions
 */

/**
 * Generate CSV content for master report
 */
export const generateMasterReportCSV = (data) => {
    const { transactions, categoryBreakdown, monthlyBreakdown, calculations } = data;

    let csv = 'Master Report - All Transactions\n';
    csv += `Generated: ${new Date().toLocaleString()}\n\n`;

    // Summary section
    csv += 'Summary\n';
    csv += `Total Spent,${calculations.totalSpent.toFixed(2)}\n`;
    csv += `Total Income,${calculations.totalIncome.toFixed(2)}\n`;
    csv += `Average Transaction,${calculations.averageTransaction.toFixed(2)}\n`;
    csv += `Total Transactions,${transactions.length}\n\n`;

    // Category-wise breakdown
    csv += 'Category-wise Breakdown\n';
    csv += 'Category,Total,Count,Average\n';
    Object.entries(categoryBreakdown)
        .sort((a, b) => b[1].amount - a[1].amount)
        .forEach(([cat, data]) => {
            csv += `"${cat}",${data.amount.toFixed(2)},${data.count},${(data.amount / data.count).toFixed(2)}\n`;
        });

    // Monthly breakdown
    csv += '\nMonthly Breakdown\n';
    csv += 'Month,Total,Count\n';
    Object.entries(monthlyBreakdown)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .forEach(([month, data]) => {
            csv += `${month},${data.amount.toFixed(2)},${data.count}\n`;
        });

    // Recent transactions
    csv += '\nRecent Transactions\n';
    csv += 'Date,Category,Description,Amount,Type,Notes\n';
    transactions.slice(0, 100).forEach(tx => {
        const date = new Date(tx.date || tx.createdAt).toLocaleDateString();
        const description = (tx.description || tx.name || '').replace(/"/g, '""');
        const notes = (tx.notes || tx.remarks || '').replace(/"/g, '""');
        csv += `${date},"${tx.category || 'N/A'}","${description}",${tx.amount},${tx.type},"${notes}"\n`;
    });

    return csv;
};

/**
 * Download CSV file
 */
export const downloadCSV = (csvContent, filename = null) => {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `master-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
};

/**
 * Format currency amount
 */
export const formatCurrency = (amount, currencySymbol = '', decimals = 2) => {
    return `${currencySymbol}${Number(amount).toFixed(decimals)}`;
};

/**
 * Format date consistently across the application
 */
export const formatDate = (date, options = {}) => {
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };
    return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
};

/**
 * Calculate percentage with proper handling of division by zero
 */
export const calculatePercentage = (value, total, decimals = 0) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100 * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/**
 * Sort transactions by date (most recent first)
 */
export const sortTransactionsByDate = (transactions, ascending = false) => {
    return [...transactions].sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt);
        const dateB = new Date(b.date || b.createdAt);
        return ascending ? dateA - dateB : dateB - dateA;
    });
};

/**
 * Filter transactions by category
 */
export const filterTransactionsByCategory = (transactions, category) => {
    return transactions.filter(tx => (tx.category || 'Other') === category);
};

/**
 * Filter transactions by type
 */
export const filterTransactionsByType = (transactions, type) => {
    return transactions.filter(tx => tx.type === type);
};

/**
 * Get unique categories from transactions
 */
export const getUniqueCategories = (transactions) => {
    const categories = new Set();
    transactions.forEach(tx => {
        categories.add(tx.category || 'Other');
    });
    return Array.from(categories).sort();
};