import React, { useState, useMemo } from 'react';
import { Calendar } from 'react-bootstrap-icons';
import styles from '../styles/DailySpends.module.scss';
import ExpenseItem from './ExpenseItem';
import SortingComponent from '../../../components/common/SortingComponent';
import { sortExpenses, SORT_TYPES } from '../../../utils/sortingUtils';

function ExpenseList({ expenses, onDelete, title = 'Your Expenses' }) {
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
        <div className={styles.expenseList}>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className='d-flex align-items-center mb-0'>
                    <Calendar size={24} className="me-2" />
                    {title}
                </h3>

                {expenses.length > 0 && (
                    <SortingComponent
                        currentSort={currentSort}
                        onSortChange={handleSortChange}
                        buttonSize="sm"
                        buttonVariant="outline-primary"
                    />
                )}
            </div>

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
                        />
                    ))}
                </>
            )}
        </div>
    );
}

export default ExpenseList;
