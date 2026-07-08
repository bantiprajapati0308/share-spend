import { TRANSACTION_TYPES } from '../constants/transactionTypes';
import { formatLedgerDate, getTransactionLabel, isRepaymentPayment } from './ledgerViewModel';

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 14;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const sanitizeFileName = (value) =>
    String(value || 'person-ledger')
        .trim()
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase() || 'person-ledger';

const normalizeText = (value) =>
    String(value ?? '-')
        .replace(/₹/g, 'Rs. ')
        .replace(/\s+/g, ' ')
        .trim();

const addPageIfNeeded = (doc, y, height = 12) => {
    if (y + height <= PAGE_HEIGHT - MARGIN) return y;
    doc.addPage();
    return MARGIN;
};

const drawSectionTitle = (doc, title, y) => {
    const nextY = addPageIfNeeded(doc, y, 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(7, 19, 54);
    doc.text(title, MARGIN, nextY);
    doc.setDrawColor(219, 229, 246);
    doc.line(MARGIN, nextY + 4, PAGE_WIDTH - MARGIN, nextY + 4);
    return nextY + 11;
};

const drawSummaryCard = (doc, label, value, x, y, width, valueColor = [7, 19, 54]) => {
    doc.setFillColor(248, 251, 255);
    doc.setDrawColor(219, 229, 246);
    doc.roundedRect(x, y, width, 24, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(82, 96, 124);
    doc.text(label, x + 4, y + 8);

    doc.setFontSize(12);
    doc.setTextColor(...valueColor);
    doc.text(normalizeText(value), x + 4, y + 17, { maxWidth: width - 8 });
};

const drawDetailRow = (doc, label, value, x, y, width) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(82, 96, 124);
    doc.text(label, x, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(7, 19, 54);
    doc.text(normalizeText(value), x, y + 5, { maxWidth: width });
};

const drawTableHeader = (doc, y) => {
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(219, 229, 246);
    doc.rect(MARGIN, y, CONTENT_WIDTH, 10, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(7, 19, 54);
    doc.text('Date', MARGIN + 3, y + 6.5);
    doc.text('Type / Description', MARGIN + 28, y + 6.5);
    doc.text('Due Date', MARGIN + 92, y + 6.5);
    doc.text('Amount', MARGIN + 123, y + 6.5);
    doc.text('Balance', MARGIN + 153, y + 6.5);

    return y + 10;
};

const drawTransactionRow = (doc, transaction, y, formatAmount) => {
    const repayment = isRepaymentPayment(transaction.paymentType);
    const balanceAfter = Number(transaction.balanceAfter || 0);
    const description = transaction.description || (repayment ? 'Partial payment' : 'Cash given');
    const amount = `${repayment ? '-' : '+'} ${formatAmount(transaction.amount)}`;
    const descriptionLines = doc.splitTextToSize(normalizeText(description), 56);
    const rowHeight = Math.max(18, 12 + descriptionLines.length * 4);
    const nextY = addPageIfNeeded(doc, y, rowHeight + 12);

    if (nextY !== y) {
        y = drawTableHeader(doc, nextY);
    }

    doc.setFillColor(repayment ? 255 : 246, repayment ? 247 : 253, repayment ? 247 : 248);
    doc.setDrawColor(233, 238, 249);
    doc.rect(MARGIN, y, CONTENT_WIDTH, rowHeight, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(7, 19, 54);
    doc.text(formatLedgerDate(transaction.date), MARGIN + 3, y + 7);

    doc.setTextColor(repayment ? 220 : 7, repayment ? 38 : 148, repayment ? 38 : 85);
    doc.text(getTransactionLabel(transaction), MARGIN + 28, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(82, 96, 124);
    doc.text(descriptionLines, MARGIN + 28, y + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(7, 19, 54);
    doc.text(transaction.dueDate ? formatLedgerDate(transaction.dueDate) : '-', MARGIN + 92, y + 7, { maxWidth: 28 });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(repayment ? 220 : 7, repayment ? 38 : 148, repayment ? 38 : 85);
    doc.text(normalizeText(amount), MARGIN + 123, y + 7, { maxWidth: 28 });

    doc.setTextColor(7, 19, 54);
    doc.text(
        balanceAfter === 0 ? 'Cleared' : normalizeText(`${formatAmount(balanceAfter)} due`),
        MARGIN + 153,
        y + 7,
        { maxWidth: 38 }
    );

    return y + rowHeight;
};

export const exportPersonLedgerPdf = async ({ person, transactions, formatAmount }) => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const isLending = person.type === TRANSACTION_TYPES.GAVE;
    const totalBase = isLending ? person.totalLent : person.totalBorrowed;
    const generatedAt = new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    doc.setFillColor(29, 78, 216);
    doc.rect(0, 0, PAGE_WIDTH, 34, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(255, 255, 255);
    doc.text('Borrow/Lend Ledger', MARGIN, 15);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Generated on ${generatedAt}`, MARGIN, 23);
    doc.text('Share Spend', PAGE_WIDTH - MARGIN, 15, { align: 'right' });

    let y = 46;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(7, 19, 54);
    doc.text(person.personName, MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(82, 96, 124);
    doc.text(isLending ? 'You lent money' : 'You borrowed money', MARGIN, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(Number(person.remaining || 0) === 0 ? 7 : 220, Number(person.remaining || 0) === 0 ? 148 : 38, Number(person.remaining || 0) === 0 ? 85 : 38);
    doc.text(normalizeText(formatAmount(person.remaining)), PAGE_WIDTH - MARGIN, y, { align: 'right' });
    doc.setFontSize(8.5);
    doc.setTextColor(82, 96, 124);
    doc.text(person.remaining === 0 ? 'Settled' : `Due on ${formatLedgerDate(person.dueDate)}`, PAGE_WIDTH - MARGIN, y + 6, {
        align: 'right',
    });

    y += 20;
    const cardGap = 4;
    const cardWidth = (CONTENT_WIDTH - cardGap * 2) / 3;
    drawSummaryCard(doc, isLending ? 'Total Lent' : 'Total Borrowed', formatAmount(totalBase), MARGIN, y, cardWidth);
    drawSummaryCard(doc, 'Returned', formatAmount(person.totalReturned), MARGIN + cardWidth + cardGap, y, cardWidth);
    drawSummaryCard(
        doc,
        'Remaining',
        formatAmount(person.remaining),
        MARGIN + (cardWidth + cardGap) * 2,
        y,
        cardWidth,
        Number(person.remaining || 0) === 0 ? [7, 148, 85] : [220, 38, 38]
    );

    y += 38;
    y = drawSectionTitle(doc, 'Person Details', y);
    drawDetailRow(doc, 'Status', person.status, MARGIN, y, 40);
    drawDetailRow(doc, 'Latest Due Date', formatLedgerDate(person.dueDate), MARGIN + 48, y, 42);
    drawDetailRow(doc, 'Mobile Number', person.mobileNumber || 'Not available', MARGIN + 96, y, 42);
    drawDetailRow(doc, 'Email ID', person.email || 'Not available', MARGIN + 140, y, 52);

    y += 22;
    y = drawSectionTitle(doc, 'Transaction History', y);

    if (!transactions.length) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(82, 96, 124);
        doc.text('No transactions available for this person.', MARGIN, y);
    } else {
        y = drawTableHeader(doc, y);
        transactions.forEach((transaction) => {
            y = drawTransactionRow(doc, transaction, y, formatAmount);
        });
    }

    doc.save(`${sanitizeFileName(person.personName)}-borrow-lend-ledger.pdf`);
};
