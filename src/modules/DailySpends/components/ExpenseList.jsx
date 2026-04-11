import React from 'react';
import { Calendar } from 'react-bootstrap-icons';
import styles from '../styles/DailySpends.module.scss';
import ExpenseItem from './ExpenseItem';

function ExpenseList({ expenses, onDelete, title = 'Your Expenses' }) {
    const isIncome = title.includes('Income');
    const emptyMessage = isIncome
        ? 'No income added yet. Add your income above!'
        : 'No expenses yet. Start adding your daily expenses above!';
    return (
        <div className={styles.expenseList}>
            <h3 className='d-flex justify-content-between align-items-center'>
                <span> <Calendar size={24} className="me-2" />
                    {title}</span>
                {/* <button className={'btn btn-sm btn-outline-primary'}>View Analytics</button> */}
            </h3>

            {expenses.length === 0 ? (
                <div className={styles.noExpenses}>
                    <p>{emptyMessage}</p>
                </div>
            ) : (
                <>
                    {expenses.map((expense) => (
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
