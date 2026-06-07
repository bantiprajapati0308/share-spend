import React from 'react';
import { getCurrencySymbol, getGradientColor } from '../../Util';

export const createSpentAmountsRenderer = (currency, spentAmounts, totalExpense) => {
    return (member, index, sortedArray) => {
        const percentage = totalExpense > 0 ? (spentAmounts[member] / totalExpense * 100).toFixed(1) : 0;
        const percentageValue = parseFloat(percentage);

        // Calculate gradient color based on percentage values
        const percentages = sortedArray && sortedArray.length > 0
            ? sortedArray.map(m => totalExpense > 0 ? (spentAmounts[m] / totalExpense * 100) : 0)
            : [0];
        const maxPercentage = Math.max(...percentages);
        const minPercentage = Math.min(...percentages);
        const textColor = getGradientColor(percentageValue, minPercentage, maxPercentage);

        return (
            <tr key={index}>
                <td style={{ color: '#1565c0', fontWeight: 500, background: '#e3f2fd' }}>
                    {member}
                </td>
                <td style={{ color: '#2e7d32', fontWeight: 500, background: '#e8f5e9' }}>
                    {getCurrencySymbol(currency)}{spentAmounts[member].toFixed(2)}
                </td>
                <td style={{ color: textColor, fontWeight: 'bold', background: '#fff3e0' }}>
                    {percentage}%
                </td>
            </tr>
        );
    };
};

export const createBalancesRenderer = (currency, balances, styles) => {
    return (member, index) => (
        <tr key={index}>
            <td className={balances[member] > 0 ? styles.positive : styles.negative}>
                {member}
            </td>
            <td className={balances[member] > 0 ? styles.positive : styles.negative}>
                {getCurrencySymbol(currency)}{balances[member].toFixed(2)}
            </td>
        </tr>
    );
};

export const createTransactionsRenderer = (currency, onTransactionClick = null) => {
    return (transaction, index) => (
        <tr
            key={index}
            onClick={onTransactionClick ? () => onTransactionClick(transaction) : undefined}
            style={{
                cursor: onTransactionClick ? 'pointer' : 'default',
                transition: 'background-color 0.2s ease'
            }}
            className={onTransactionClick ? 'settlement-row' : ''}
            onMouseEnter={(e) => {
                if (onTransactionClick) {
                    e.currentTarget.style.backgroundColor = '#f0f8ff';
                }
            }}
            onMouseLeave={(e) => {
                if (onTransactionClick) {
                    e.currentTarget.style.backgroundColor = '';
                }
            }}
            title={onTransactionClick ? 'Click to settle payment' : undefined}
            role={onTransactionClick ? 'button' : undefined}
            tabIndex={onTransactionClick ? 0 : -1}
            onKeyDown={onTransactionClick ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onTransactionClick(transaction);
                }
            } : undefined}
        >
            <td style={{ color: '#1769aa', background: '#e3f0ff' }}>
                {transaction.from}
            </td>
            <td style={{ color: '#2e7d32', background: '#e8f5e9' }}>
                {transaction.to}
            </td>
            <td style={{ background: '#fffde7', color: '#222' }}>
                {getCurrencySymbol(currency)}{transaction.amount.toFixed(2)}
                {onTransactionClick && (
                    <small className="ms-2 text-muted">
                        (click to settle)
                    </small>
                )}
            </td>
        </tr>
    );
};

export const createPersonSharesRenderer = (currency, personShares, totalExpense) => {
    return (member, index, sortedArray) => {
        const percentage = totalExpense > 0 ? (personShares[member] / totalExpense * 100).toFixed(1) : 0;
        const percentageValue = parseFloat(percentage);

        // Calculate gradient color based on percentage values
        const percentages = sortedArray && sortedArray.length > 0
            ? sortedArray.map(m => totalExpense > 0 ? (personShares[m] / totalExpense * 100) : 0)
            : [0];
        const maxPercentage = Math.max(...percentages);
        const minPercentage = Math.min(...percentages);
        const textColor = getGradientColor(percentageValue, minPercentage, maxPercentage);

        return (
            <tr key={index}>
                <td style={{ color: '#1565c0', fontWeight: 500, background: '#e3f2fd' }}>
                    {member}
                </td>
                <td style={{ color: '#2e7d32', fontWeight: 500, background: '#e8f5e9' }}>
                    {getCurrencySymbol(currency)}{personShares[member].toFixed(2)}
                </td>
                <td style={{ color: textColor, fontWeight: 'bold', background: '#fff3e0' }}>
                    {percentage}%
                </td>
            </tr>
        );
    };
};