import React from 'react';
import PropTypes from 'prop-types';
import { InfoCircle } from 'react-bootstrap-icons';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
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
            header: 'Total Amt.',
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
                <div className="d-flex align-items-center gap-2 mb-3">
                    <h4 className={`${styles.sectionTitle} mb-0`}>
                        Category-wise Analysis
                    </h4>
                    <OverlayTrigger
                        placement="top"
                        overlay={
                            <Tooltip id="category-info-tooltip">
                                Click on any category to view detailed transactions
                            </Tooltip>
                        }
                    >
                        <InfoCircle
                            size={16}
                            className="text-muted"
                            style={{ cursor: 'help' }}
                        />
                    </OverlayTrigger>
                </div>
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