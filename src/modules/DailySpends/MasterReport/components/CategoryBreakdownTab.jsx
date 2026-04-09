import React from 'react';
import PropTypes from 'prop-types';
import DataTable from './DataTable';
import GradientProgressBar from '../../components/GradientProgressBar';
import styles from '../styles/MasterReport.module.scss';

/**
 * Category Breakdown Tab Component
 * Displays category-wise analysis with clickable rows
 */
function CategoryBreakdownTab({
    categoryBreakdown,
    totalSpent,
    currencySymbol,
    onCategoryClick
}) {
    // Prepare data for the table
    const categoryData = Object.entries(categoryBreakdown)
        .sort((a, b) => b[1].amount - a[1].amount)
        .map(([category, data]) => ({
            key: category,
            category: category,
            amount: data.amount,
            count: data.count,
            percentage: Math.round((data.amount / totalSpent) * 100)
        }));

    // Define table columns
    const columns = [
        {
            key: 'category',
            header: 'Category',
            render: (row) => (
                <span className={styles.categoryName}>
                    {row.category}
                </span>
            )
        },
        {
            key: 'amount',
            header: 'Total Amount',
            align: 'right',
            render: (row) => (
                <strong>
                    {currencySymbol}{row.amount.toFixed(2)}
                </strong>
            )
        },
        {
            key: 'count',
            header: 'Transactions',
            align: 'right',
            render: (row) => row.count
        },
        {
            key: 'percentage',
            header: '% of Total',
            align: 'center',
            render: (row) => (
                <GradientProgressBar
                    percentage={row.percentage}
                    height="small"
                    showLabel={true}
                />
            )
        }
    ];

    const handleRowClick = (row) => {
        if (onCategoryClick) {
            onCategoryClick(row.category, row);
        }
    };

    return (
        <div className={styles.tabContent}>
            <div className={styles.tableWrapper}>
                <h4 className={styles.sectionTitle}>
                    Category-wise Analysis
                </h4>
                <p className={styles.sectionSubtitle}>
                    Click on any category to view detailed transactions
                </p>
                <DataTable
                    columns={columns}
                    data={categoryData}
                    onRowClick={handleRowClick}
                    className={styles.categoryTable}
                />
            </div>
        </div>
    );
}

CategoryBreakdownTab.propTypes = {
    categoryBreakdown: PropTypes.object.isRequired,
    totalSpent: PropTypes.number.isRequired,
    currencySymbol: PropTypes.string.isRequired,
    onCategoryClick: PropTypes.func.isRequired
};

export default CategoryBreakdownTab;