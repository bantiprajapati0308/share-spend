import React, { useState, useMemo } from 'react';
import { Badge } from 'react-bootstrap';
import styles from '../styles/DailySpends.module.scss';
import ExpenseItem from './ExpenseItem';
import SortingComponent from '../../../components/common/SortingComponent';
import { sortExpenses, SORT_TYPES } from '../../../utils/sortingUtils';
import { formatCurrencyINR } from '../../../Util';
import { formatLocalDate } from '../utils/dateUtils';

// Extract 'YYYY-MM-DD' from an expense's date field (handles both date-only and datetime strings)
function getDateStr(expense) {
    return formatLocalDate(expense.date || expense.createdAt) || 'unknown';
}

// Format "Jun 4, 2024 • Tuesday" — same logic as CalendarHeatmap's getDayData date range
function formatDateHeader(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const formatted = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    return `${formatted} • ${dayName}`;
}

function ExpenseList({ expenses, onDelete, onEdit, title = 'Your Expenses', dateHide = false, disableActions = false }) {
    const [currentSort, setCurrentSort] = useState(SORT_TYPES.DATE_NEWEST);
    const [searchQuery, setSearchQuery] = useState('');

    const isIncome = title.includes('Income');

    const emptyMessage = isIncome
        ? 'No income added yet. Add your income above!'
        : 'No expenses yet. Start adding your daily expenses above!';

    const normalizedSearch = searchQuery.trim().toLowerCase();

    const filteredExpenses = useMemo(() => {
        if (!normalizedSearch) return expenses;
        return expenses.filter((expense) => {
            const nameText = String(expense.name || '').toLowerCase();
            const categoryText = String(expense.category || '').toLowerCase();
            const amountText = String(expense.amount ?? '').toLowerCase();
            const notesText = String(expense.notes || '').toLowerCase();
            const dateValue = expense.date || expense.createdAt;
            let dateText = '';
            let isoDateText = '';
            if (dateValue) {
                const dateString = formatLocalDate(dateValue);
                if (dateString) {
                    const parsedDate = new Date(`${dateString}T00:00:00`);
                    dateText = parsedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).toLowerCase();
                    isoDateText = dateString.toLowerCase();
                }
            }
            return nameText.includes(normalizedSearch) || categoryText.includes(normalizedSearch) || amountText.includes(normalizedSearch) || notesText.includes(normalizedSearch) || dateText.includes(normalizedSearch) || isoDateText.includes(normalizedSearch);
        });
    }, [expenses, normalizedSearch]);

    const sortedExpenses = useMemo(() => sortExpenses(filteredExpenses, currentSort), [filteredExpenses, currentSort]);

    // Group sorted expenses by date, preserving the sort order
    const dateGroups = useMemo(() => {
        const groups = new Map();
        sortedExpenses.forEach((expense) => {
            const ds = getDateStr(expense);
            if (!groups.has(ds)) groups.set(ds, []);
            groups.get(ds).push(expense);
        });
        return [...groups.entries()];
    }, [sortedExpenses]);

    const hasSearch = normalizedSearch.length > 0;

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
                        onSortChange={setCurrentSort}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        buttonSize="sm"
                        buttonVariant="outline-primary"
                    />
                )}
            </div>
            <div className={styles.expenseList}>
                {expenses.length === 0 ? (
                    <div className={styles.noExpenses}><p>{emptyMessage}</p></div>
                ) : sortedExpenses.length === 0 ? (
                    <div className={styles.noExpenses}><p>No transactions match your search.</p></div>
                ) : (
                    dateGroups.map(([dateStr, groupExpenses]) => {
                        // Reuse the same daily-total logic as getDayData in useCalendarData
                        const dayTotal = groupExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
                        return (
                            <div key={dateStr} className={styles.dateGroup}>
                                <div className={styles.dateGroupHeader}>
                                    <span className={styles.dateGroupLabel}>
                                        📅 {formatDateHeader(dateStr)}
                                    </span>
                                    <span className={styles.dateGroupTotal}>
                                        Total {formatCurrencyINR(dayTotal)}
                                    </span>
                                </div>
                                {groupExpenses.map((expense) => (
                                    <ExpenseItem
                                        key={expense.id}
                                        expense={expense}
                                        onDelete={onDelete}
                                        onEdit={onEdit}
                                        dateHide={true}
                                        disableActions={disableActions}
                                    />
                                ))}
                            </div>
                        );
                    })
                )}
            </div>
        </>
    );
}

export default ExpenseList;

