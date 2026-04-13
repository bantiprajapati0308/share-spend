import React from 'react';
import { BoxArrowDown, BoxArrowDownRight, BoxArrowUp, Trash3 } from 'react-bootstrap-icons';
import styles from '../styles/DailySpends.module.scss';
import { formatCurrencyINR, getCurrencySymbol } from '../../../Util';

function ExpenseItem({ expense, onDelete }) {
    const currency = localStorage.getItem('defaultCurrency') || 'INR';
    const currencySymbol = getCurrencySymbol(currency);
    const incomeTypeData = expense.type;
    return (
        <div className="d-flex align-items-center justify-content-between border-0 rounded-3 px-3 py-2 mb-2 bg-white shadow-sm">

            {/* Left Section */}
            <div className="flex-grow-1 overflow-hidden">

                {/* Line 1 */}
                <div className="d-flex justify-content-between align-items-center">
                    <div className="fw-semibold text-dark text-truncate d-flex align-items-center gap-2">
                        <span className="fs-5">
                            {expense.categoryIcon || '📝'}
                        </span>
                        {expense.name}
                    </div>

                    <div className={`fw-bold ${incomeTypeData === 'income' ? 'text-success' : 'text-danger'} fs-6`}>
                        {incomeTypeData === 'income' ? <BoxArrowDown size={18} className='me-1' /> : <BoxArrowUp size={18} className='me-1 mb-1' />}
                        {formatCurrencyINR(expense.amount)}
                    </div>
                </div>

                {/* Line 2 */}
                <div className="d-flex justify-content-between align-items-center small mt-1">
                    <div className="text-muted text-truncate">
                        <span className="badge bg-light text-dark border me-2">
                            {expense.category}
                        </span>

                        {expense.notes && (
                            <span className="text-secondary">
                                {expense.notes}
                            </span>
                        )}
                    </div>

                    <div className="text-muted text-nowrap">
                        {new Date(expense.date).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short'
                        })}
                    </div>
                </div>
            </div>

            {/* Delete Button */}
            <button
                className="btn btn-sm btn-light border-0 ms-2 d-flex align-items-center justify-content-center"
                style={{ width: '32px', height: '32px' }}
                onClick={() => onDelete(expense.id)}
                title="Delete expense"
            >
                <Trash3 size={18} className="text-danger" />
            </button>
        </div>
    );
}

export default ExpenseItem;
