// Dummy data generator for testing charts

/**
 * Generate dummy expense data for stacked bar chart
 */
export const generateDummyExpenseData = () => {
    const categories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills'];
    const dates = [];
    const data = [];

    // Generate last 7 days
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
    }

    // Generate random data for each category and date
    dates.forEach(date => {
        categories.forEach(category => {
            const amount = Math.floor(Math.random() * 1000) + 100; // Random amount between 100-1100
            data.push({
                date,
                category,
                amount,
                type: 'spend'
            });
        });
    });

    return data;
};

/**
 * Generate dummy category breakdown data for pie/donut charts
 */
export const generateDummyCategoryData = () => {
    return [
        { category: 'Food', amount: 4500 },
        { category: 'Transport', amount: 2800 },
        { category: 'Entertainment', amount: 1200 },
        { category: 'Shopping', amount: 3200 },
        { category: 'Bills', amount: 5600 }
    ];
};

/**
 * Generate dummy trend data for line charts
 */
export const generateDummyTrendData = () => {
    const data = [];
    const dates = [];

    // Generate last 30 days
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
    }

    let baseAmount = 1000;
    dates.forEach(date => {
        // Add some randomness and trend
        const variation = (Math.random() - 0.5) * 400;
        baseAmount = Math.max(200, baseAmount + variation);

        data.push({
            date,
            amount: Math.round(baseAmount),
            type: 'spend'
        });
    });

    return data;
};

/**
 * Generate dummy comparison data for multiple series
 */
export const generateDummyComparisonData = () => {
    const data = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

    months.forEach(month => {
        // Income data
        data.push({
            month,
            amount: Math.floor(Math.random() * 20000) + 30000,
            type: 'income'
        });

        // Expense data
        data.push({
            month,
            amount: Math.floor(Math.random() * 15000) + 20000,
            type: 'expense'
        });
    });

    return data;
};