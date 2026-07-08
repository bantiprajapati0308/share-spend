import { TRANSACTION_TYPES } from '../constants/transactionTypes';
import { formatLedgerDate, getTransactionLabel, isRepaymentPayment } from './ledgerViewModel';

const sanitizeFileName = (value) =>
    String(value || 'person-ledger')
        .trim()
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase() || 'person-ledger';

const escapeHtml = (value) =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const buildCell = (value, className = '') =>
    `<td class="${className}">${escapeHtml(value)}</td>`;

const buildTextCell = (value, className = '') =>
    `<td class="${className}" style="mso-number-format:'\\@';">${escapeHtml(value)}</td>`;

const downloadWorkbook = (html, fileName) => {
    const blob = new Blob([html], {
        type: 'application/vnd.ms-excel;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const exportPersonLedgerExcel = ({ person, transactions, formatAmount }) => {
    const isLending = person.type === TRANSACTION_TYPES.GAVE;
    const totalBase = isLending ? person.totalLent : person.totalBorrowed;
    const mobileNumber = person.mobileNumber ? String(person.mobileNumber) : 'Not available';
    const generatedAt = new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    const transactionRows = transactions.length
        ? transactions.map((transaction, index) => {
            const repayment = isRepaymentPayment(transaction.paymentType);
            const balanceAfter = Number(transaction.balanceAfter || 0);
            const description = transaction.description || (repayment ? 'Partial payment' : 'Cash given');
            const amount = `${repayment ? '-' : '+'} ${formatAmount(transaction.amount)}`;

            return `
                <tr class="${repayment ? 'row-returned' : 'row-added'}">
                    ${buildCell(index + 1, 'center')}
                    ${buildCell(formatLedgerDate(transaction.date))}
                    ${buildCell(getTransactionLabel(transaction), repayment ? 'type-returned' : 'type-added')}
                    ${buildCell(description)}
                    ${buildCell(transaction.dueDate ? formatLedgerDate(transaction.dueDate) : '-')}
                    ${buildCell(amount, repayment ? 'amount-negative' : 'amount-positive')}
                    ${buildCell(balanceAfter === 0 ? 'Cleared' : `${formatAmount(balanceAfter)} due`)}
                    ${buildCell(repayment ? 'Payment updated' : 'Amount added')}
                </tr>
            `;
        }).join('')
        : `
            <tr>
                <td colspan="8" class="empty">No transactions available for this person.</td>
            </tr>
        `;

    const html = `
        <html>
            <head>
                <meta charset="UTF-8" />
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        color: #071336;
                    }
                    table {
                        border-collapse: collapse;
                        width: 100%;
                    }
                    td, th {
                        border: 1px solid #dbe5f6;
                        padding: 9px 10px;
                        font-size: 12px;
                        vertical-align: middle;
                    }
                    .title {
                        background: #1d4ed8;
                        color: #ffffff;
                        font-size: 20px;
                        font-weight: 700;
                        text-align: center;
                    }
                    .subtitle {
                        background: #eff6ff;
                        color: #334155;
                        font-size: 12px;
                        text-align: center;
                    }
                    .section {
                        background: #071336;
                        color: #ffffff;
                        font-weight: 700;
                        font-size: 13px;
                    }
                    .label {
                        background: #f8fbff;
                        color: #52607c;
                        font-weight: 700;
                    }
                    .value {
                        background: #ffffff;
                        font-weight: 700;
                    }
                    .summary-head {
                        background: #eaf3ff;
                        color: #1d4ed8;
                        font-weight: 700;
                        text-align: center;
                    }
                    .summary-value {
                        background: #ffffff;
                        font-size: 15px;
                        font-weight: 700;
                        text-align: center;
                    }
                    .remaining {
                        color: #dc2626;
                    }
                    .settled {
                        color: #079455;
                    }
                    .table-head th {
                        background: #f1f5f9;
                        color: #071336;
                        font-weight: 700;
                    }
                    .row-added {
                        background: #f2fbf6;
                    }
                    .row-returned {
                        background: #fff7f7;
                    }
                    .type-added,
                    .amount-positive {
                        color: #079455;
                        font-weight: 700;
                    }
                    .type-returned,
                    .amount-negative {
                        color: #dc2626;
                        font-weight: 700;
                    }
                    .center {
                        text-align: center;
                    }
                    .empty {
                        color: #52607c;
                        text-align: center;
                        font-style: italic;
                    }
                </style>
            </head>
            <body>
                <table>
                    <tr><td colspan="8" class="title">Borrow/Lend Ledger - ${escapeHtml(person.personName)}</td></tr>
                    <tr><td colspan="8" class="subtitle">Generated on ${escapeHtml(generatedAt)} | Share Spend</td></tr>
                    <tr><td colspan="8"></td></tr>

                    <tr><td colspan="8" class="section">Summary</td></tr>
                    <tr>
                        <td colspan="2" class="summary-head">${escapeHtml(isLending ? 'Total Lent' : 'Total Borrowed')}</td>
                        <td colspan="2" class="summary-head">Returned</td>
                        <td colspan="4" class="summary-head">Remaining</td>
                    </tr>
                    <tr>
                        <td colspan="2" class="summary-value">${escapeHtml(formatAmount(totalBase))}</td>
                        <td colspan="2" class="summary-value">${escapeHtml(formatAmount(person.totalReturned))}</td>
                        <td colspan="4" class="summary-value ${Number(person.remaining || 0) === 0 ? 'settled' : 'remaining'}">${escapeHtml(formatAmount(person.remaining))}</td>
                    </tr>
                    <tr><td colspan="8"></td></tr>

                    <tr><td colspan="8" class="section">Person Details</td></tr>
                    <tr>
                        <td class="label">Name</td>
                        <td colspan="2" class="value">${escapeHtml(person.personName)}</td>
                        <td class="label">Type</td>
                        <td colspan="4" class="value">${escapeHtml(isLending ? 'You lent money' : 'You borrowed money')}</td>
                    </tr>
                    <tr>
                        <td class="label">Status</td>
                        <td colspan="2" class="value">${escapeHtml(person.status)}</td>
                        <td class="label">Due Date</td>
                        <td colspan="4" class="value">${escapeHtml(formatLedgerDate(person.dueDate))}</td>
                    </tr>
                    <tr>
                        <td class="label">Mobile Number</td>
                        ${buildTextCell(mobileNumber, 'value').replace('<td', '<td colspan="2"')}
                        <td class="label">Email ID</td>
                        <td colspan="4" class="value">${escapeHtml(person.email || 'Not available')}</td>
                    </tr>
                    <tr><td colspan="8"></td></tr>

                    <tr><td colspan="8" class="section">Transaction History</td></tr>
                    <tr class="table-head">
                        <th>No.</th>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Due Date</th>
                        <th>Amount</th>
                        <th>Balance After</th>
                        <th>Status</th>
                    </tr>
                    ${transactionRows}
                </table>
            </body>
        </html>
    `;

    downloadWorkbook(html, `${sanitizeFileName(person.personName)}-borrow-lend-ledger.xls`);
};
