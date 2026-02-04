import React from 'react';
import { getCurrencySymbol } from '../Util';
import { PeopleFill, PiggyBank, CashStack, CheckCircle } from 'react-bootstrap-icons';

// Import components
import ReportAccordion from '../components/report/ReportAccordion';
import ReportTable from '../components/report/ReportTable';
import ExpenseFilters from '../components/report/ExpenseFilters';
import ExpenseTable from '../components/report/ExpenseTable';
import SettlementHistory from '../components/report/settlement/SettlementHistory';

import {
    createSpentAmountsRenderer,
    createBalancesRenderer,
    createTransactionsRenderer,
    createPersonSharesRenderer
} from '../components/report/tableRenderers.jsx';

/**
 * Report Rendering Utilities
 * Centralized render functions for report accordions
 */

/**
 * Render Expenses Accordion
 */
export const renderExpensesAccordion = ({
    accordionStates,
    handleAccordionSelect,
    filteredExpenses,
    showFilters,
    toggleFilters,
    expenseFilters,
    handleFilterChange,
    handleMultiSelectChange,
    handleClearFilters,
    memberOptions,
    currency,
    expenses,
    handleShowParticipants
}) => (
    <ReportAccordion
        activeKey={accordionStates.expenses}
        onSelect={(eventKey) => handleAccordionSelect('expenses', eventKey)}
        eventKey="0"
        icon={PiggyBank}
        title={`Expenses (${filteredExpenses.length})`}
    >
        <ExpenseFilters
            showFilters={showFilters}
            toggleFilters={toggleFilters}
            filters={expenseFilters}
            onFilterChange={handleFilterChange}
            onMultiSelectChange={handleMultiSelectChange}
            onClearFilters={handleClearFilters}
            memberOptions={memberOptions}
            currency={currency}
        />

        <ExpenseTable
            expenses={expenses}
            filteredExpenses={filteredExpenses}
            currency={currency}
            onShowParticipants={handleShowParticipants}
        />
    </ReportAccordion>
);

/**
 * Render Spent Amounts Accordion
 */
export const renderSpentAmountsAccordion = ({
    accordionStates,
    handleAccordionSelect,
    currency,
    spentAmounts,
    totalExpense
}) => (
    <ReportAccordion
        activeKey={accordionStates.spentAmounts}
        onSelect={(eventKey) => handleAccordionSelect('spentAmounts', eventKey)}
        eventKey="1"
        icon={CashStack}
        title="Spent Amounts"
    >
        <ReportTable
            headers={[
                { label: 'Member' },
                { label: 'Spent Amount' },
                { label: 'Percentage' }
            ]}
            data={Object.keys(spentAmounts)
                .sort((a, b) => spentAmounts[b] - spentAmounts[a])
                .concat(['TOTAL'])}
            renderRow={(member, index, sortedArray) => {
                if (member === 'TOTAL') {
                    return (
                        <tr key="total" className='table-dark'>
                            <td>Total Expense</td>
                            <td>{getCurrencySymbol(currency)}{totalExpense.toFixed(2)}</td>
                            <td>100.0%</td>
                        </tr>
                    );
                }
                const membersOnly = Object.keys(spentAmounts).sort((a, b) => spentAmounts[b] - spentAmounts[a]);
                const renderSpentAmounts = createSpentAmountsRenderer(currency, spentAmounts, totalExpense);
                return renderSpentAmounts(member, index, membersOnly);
            }}
        />
    </ReportAccordion>
);

/**
 * Render Balances Accordion
 */
export const renderBalancesAccordion = ({
    accordionStates,
    handleAccordionSelect,
    currency,
    balances,
    styles
}) => (
    <ReportAccordion
        activeKey={accordionStates.balances}
        onSelect={(eventKey) => handleAccordionSelect('balances', eventKey)}
        eventKey="2"
        icon={PiggyBank}
        title="Balances including Total Expense"
    >
        <ReportTable
            headers={[
                { label: 'Member', className: 'p-2' },
                { label: 'Balance', className: 'p-2' }
            ]}
            data={Object.keys(balances).sort((a, b) => balances[b] - balances[a])}
            renderRow={createBalancesRenderer(currency, balances, styles)}
        />
    </ReportAccordion>
);

/**
 * Render Settlements Accordion
 */
export const renderSettlementsAccordion = ({
    accordionStates,
    handleAccordionSelect,
    currency,
    transactions,
    handleTransactionClick
}) => (
    <ReportAccordion
        activeKey={accordionStates.settlements}
        onSelect={(eventKey) => handleAccordionSelect('settlements', eventKey)}
        eventKey="3"
        title="Final Settlements"
    >
        <ReportTable
            headers={[
                { label: 'Payer' },
                { label: 'Receiver' },
                { label: 'Amount' }
            ]}
            data={transactions}
            renderRow={createTransactionsRenderer(currency, handleTransactionClick)}
            emptyMessage="All settled! 🎉"
        />
    </ReportAccordion>
);

/**
 * Render Person Shares Accordion
 */
export const renderPersonSharesAccordion = ({
    accordionStates,
    handleAccordionSelect,
    currency,
    personShares,
    totalExpense
}) => (
    <ReportAccordion
        activeKey={accordionStates.personShares}
        onSelect={(eventKey) => handleAccordionSelect('personShares', eventKey)}
        eventKey="4"
        icon={PeopleFill}
        title="Per Person Expense Summary"
    >
        <ReportTable
            headers={[
                { label: 'Member', className: 'p-2' },
                { label: 'Total Share', className: 'p-2' },
                { label: 'Percentage', className: 'p-2' }
            ]}
            data={Object.keys(personShares)
                .sort((a, b) => personShares[b] - personShares[a])
                .concat(['TOTAL'])}
            renderRow={(member, index, sortedArray) => {
                if (member === 'TOTAL') {
                    return (
                        <tr key="total" className='table-dark'>
                            <td>Total</td>
                            <td>{getCurrencySymbol(currency)}{totalExpense.toFixed(2)}</td>
                            <td>100.0%</td>
                        </tr>
                    );
                }
                const membersOnly = Object.keys(personShares).sort((a, b) => personShares[b] - personShares[a]);
                const renderPersonShares = createPersonSharesRenderer(currency, personShares, totalExpense);
                return renderPersonShares(member, index, membersOnly);
            }}
        />
    </ReportAccordion>
);

/**
 * Render Settlement History Accordion
 */
export const renderSettlementHistoryAccordion = ({
    accordionStates,
    handleAccordionSelect,
    settlements,
    getSettlementHistory,
    currency
}) => (
    <ReportAccordion
        activeKey={accordionStates.settlementHistory}
        onSelect={(eventKey) => handleAccordionSelect('settlementHistory', eventKey)}
        eventKey="5"
        icon={CheckCircle}
        title={`Settlement History (${settlements.length})`}
    >
        <SettlementHistory
            settlements={getSettlementHistory()}
            currency={currency}
        />
    </ReportAccordion>
);

/**
 * Create all accordion renderers as a bundle
 */
export const createAccordionRenderers = () => ({
    renderExpensesAccordion,
    renderSpentAmountsAccordion,
    renderBalancesAccordion,
    renderSettlementsAccordion,
    renderPersonSharesAccordion,
    renderSettlementHistoryAccordion
});

export default createAccordionRenderers;