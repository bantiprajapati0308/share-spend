import React from 'react';
import { Button } from 'react-bootstrap';
import { PeopleFill } from 'react-bootstrap-icons';
import { getCurrencySymbol } from '../../Util';
import ReportTable from './ReportTable';

function ExpenseTable({ expenses, filteredExpenses, currency, onShowParticipants }) {
    const headers = [
        { label: 'No' },
        { label: 'Name' },
        { label: 'Amount' },
        { label: 'Paid By' },
        { label: 'Participants' }
    ];

    const renderRow = (expense, index) => (
        <tr key={expense.id || index}>
            <td>{index + 1}</td>
            <td>{expense.name}</td>
            <td>{getCurrencySymbol(currency)}{expense.amount.toFixed(2)}</td>
            <td>{expense.paidBy}</td>
            <td style={{
                maxWidth: 170,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                position: 'relative',
                paddingRight: 30
            }}>
                <span>
                    {expense.participants.slice(0, 2).map((p) => p.name).join(', ')}
                    {expense.participants.length > 2 ? '' : ''}
                </span>
                {expense.participants.length > 0 && (
                    <Button
                        size="sm"
                        variant="outline-info"
                        className="ms-2 p-1 d-inline-flex align-items-center justify-content-center"
                        style={{
                            borderRadius: '50%',
                            width: 28,
                            height: 28,
                            position: 'absolute',
                            right: 0
                        }}
                        onClick={() => onShowParticipants(expense.participants)}
                        title="View All Participants"
                    >
                        <PeopleFill size={16} />
                    </Button>
                )}
            </td>
        </tr>
    );

    const tableData = [...filteredExpenses];

    // Add summary row if filtered
    if (filteredExpenses.length > 0 && filteredExpenses.length !== expenses.length) {
        tableData.push({
            id: 'summary',
            isSummary: true,
            filteredCount: filteredExpenses.length,
            totalCount: expenses.length
        });
    }

    const renderRowWithSummary = (item, index) => {
        if (item.isSummary) {
            return (
                <tr key="summary" className="table-info">
                    <td colSpan="5" className="text-center py-2">
                        <small className="fw-semibold">
                            Showing {item.filteredCount} of {item.totalCount} expenses
                        </small>
                    </td>
                </tr>
            );
        }
        return renderRow(item, index);
    };

    const emptyMessage = expenses.length === 0
        ? 'No expenses found'
        : 'No expenses match your filters';

    return (
        <ReportTable
            headers={headers}
            data={tableData}
            renderRow={renderRowWithSummary}
            maxHeight="400px"
            emptyMessage={emptyMessage}
        />
    );
}

export default ExpenseTable;