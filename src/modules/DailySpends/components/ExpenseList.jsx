import React, { useState, useMemo } from 'react';
import { Badge } from 'react-bootstrap';
import styles from '../styles/DailySpends.module.scss';
import ExpenseItem from './ExpenseItem';
import SortingComponent from '../../../components/common/SortingComponent';
import { sortExpenses, SORT_TYPES } from '../../../utils/sortingUtils';

function ExpenseList({ expenses, onDelete, onEdit, title = 'Your Expenses', dateHide = false }) {
    const [currentSort, setCurrentSort] = useState(SORT_TYPES.DATE_NEWEST);
    const [searchQuery, setSearchQuery] = useState('');

    const isIncome = title.includes('Income');
    const isToday = title.toLowerCase().includes('today');
    const isLast7Days = title.toLowerCase().includes('last 7 days');

    const emptyMessage = isToday
        ? (isIncome ? 'No income transactions found for today.' : 'No spend transactions found for today.')
        : isLast7Days
            ? (isIncome ? 'No income transactions found in the last 7 days.' : 'No spend transactions found in the last 7 days.')
            : isIncome
                ? 'No income added yet. Add your income above!'
                : 'No expenses yet. Start adding your daily expenses above!';

    const normalizedSearch = searchQuery.trim().toLowerCase();

    // Filter by name, amount, notes, and date text
    const filteredExpenses = useMemo(() => {
        if (!normalizedSearch) {
            return expenses;
        }

        return expenses.filter((expense) => {
            const nameText = String(expense.name || '').toLowerCase();
            const categoryText = String(expense.category || '').toLowerCase();
            const amountText = String(expense.amount ?? '').toLowerCase();
            const notesText = String(expense.notes || '').toLowerCase();

            const dateValue = expense.date || expense.createdAt;
            let dateText = '';
            let isoDateText = '';

            if (dateValue) {
                const parsedDate = new Date(dateValue);
                if (!Number.isNaN(parsedDate.getTime())) {
                    dateText = parsedDate
                        .toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                        })
                        .toLowerCase();
                    isoDateText = parsedDate.toISOString().split('T')[0].toLowerCase();
                }
            }

            return (
                nameText.includes(normalizedSearch) ||
                categoryText.includes(normalizedSearch) ||
                amountText.includes(normalizedSearch) ||
                notesText.includes(normalizedSearch) ||
                dateText.includes(normalizedSearch) ||
                isoDateText.includes(normalizedSearch)
            );
        });
    }, [expenses, normalizedSearch]);

    // Sort only the visible (filtered) expenses
    const sortedExpenses = useMemo(() => {
        return sortExpenses(filteredExpenses, currentSort);
    }, [filteredExpenses, currentSort]);

    const hasSearch = normalizedSearch.length > 0;

    const handleSortChange = (sortType) => {
        setCurrentSort(sortType);
    };

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="d-flex align-items-center gap-1 me-2 mb-0 fw-semibold text-dark">
                    <span className="text-secondary ms-3" style={{ fontSize: '1rem' }}>Transactions</span>
                    <Badge bg={isIncome ? 'success' : 'danger'} pill className="px-1 py-1" style={{ fontSize: '0.72rem' }}>
                        {hasSearch ? `${sortedExpenses.length}/${expenses.length}` : expenses.length}
                    </Badge>
                </h5>

                {expenses.length > 0 && (
                    <SortingComponent
                        currentSort={currentSort}
                        onSortChange={handleSortChange}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
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
                ) : sortedExpenses.length === 0 ? (
                    <div className={styles.noExpenses}>
                        <p>No transactions match your search.</p>
                    </div>
                ) : (
                    <>
                        {sortedExpenses.map((expense) => (
                            <ExpenseItem
                                key={expense.id}
                                expense={expense}
                                onDelete={onDelete}
                                onEdit={onEdit}
                                dateHide={dateHide}
                            />
                        ))}
                    </>
                )}
            </div>
        </>
    );
}

export default ExpenseList;
