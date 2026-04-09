import React from 'react';
import PropTypes from 'prop-types';
import DataTable from './DataTable';
import styles from '../styles/MasterReport.module.scss';

/**
 * Monthly Breakdown Tab Component
 * Displays monthly spending summary
 */
function MonthlyBreakdownTab({
    monthlyBreakdown,
    currencySymbol
}) {
    // Prepare data for the table
    const monthlyData = Object.entries(monthlyBreakdown)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([month, data]) => {
            const [year, monthNum] = month.split('-');
            const monthName = new Date(`${year}-${monthNum}-01`)
                .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

            return {
                key: month,
                month: monthName,
                amount: data.amount,
                count: data.count,
                rawMonth: month
            };
        });

    // Define table columns
    const columns = [
        {
            key: 'month',
            header: 'Month',
            render: (row) => row.month
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
        }
    ];

    return (
        <div className={styles.tabContent}>
            <div className={styles.tableWrapper}>
                <h4 className={styles.sectionTitle}>
                    Monthly Spending Summary
                </h4>
                <DataTable
                    columns={columns}
                    data={monthlyData}
                    className={styles.monthlyTable}
                />
            </div>
        </div>
    );
}

MonthlyBreakdownTab.propTypes = {
    monthlyBreakdown: PropTypes.object.isRequired,
    currencySymbol: PropTypes.string.isRequired
};

export default MonthlyBreakdownTab;