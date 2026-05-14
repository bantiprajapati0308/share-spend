import React, { useState, useMemo } from 'react';
import { Badge } from 'react-bootstrap';
import styles from '../styles/DailySpends.module.scss';
import ExpenseItem from './ExpenseItem';
import SortingComponent from '../../../components/common/SortingComponent';
import { sortExpenses, SORT_TYPES } from '../../../utils/sortingUtils';

function ExpenseList({ expenses, onDelete, onEdit, title = 'Your Expenses' }) {
    const [currentSort, setCurrentSort] = useState(SORT_TYPES.DATE_NEWEST);

    const isIncome = title.includes('Income');
    const emptyMessage = isIncome
        ? 'No income added yet. Add your income above!'
        : 'No expenses yet. Start adding your daily expenses above!';

    // Sort expenses based on current sort selection
    const sortedExpenses = useMemo(() => {
        return sortExpenses(expenses, currentSort);
    }, [expenses, currentSort]);

    const handleSortChange = (sortType) => {
        setCurrentSort(sortType);
    };

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="d-flex align-items-center gap-2 mb-0 fw-semibold text-dark">
                    <span className="text-secondary ms-3 ps-1" style={{ fontSize: '1.25rem' }}>{title}</span>
                    <Badge bg={isIncome ? 'success' : 'danger'} pill className="px-2 py-1" style={{ fontSize: '0.72rem' }}>
                        {expenses.length}
                    </Badge>
                </h5>

                {expenses.length > 0 && (
                    <SortingComponent
                        currentSort={currentSort}
                        onSortChange={handleSortChange}
                        buttonSize="sm"
                        buttonVariant="outline-primary"
                    />
                )}
            </div>
            <div className={styles.expenseList}>
                {expenses.length === 0 ? (
                    <div className={styles.noExpenses}>
                        <p>{emptyMessage}</p>
                    </div>
                ) : (
                    <>
                        {sortedExpenses.map((expense) => (
                            <ExpenseItem
                                key={expense.id}
                                expense={expense}
                                onDelete={onDelete}
                                onEdit={onEdit}
                            />
                        ))}
                    </>
                )}
            </div>
        </>
    );
}

export default ExpenseList;
