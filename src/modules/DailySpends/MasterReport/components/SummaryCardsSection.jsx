import React from 'react';
import { Row, Col } from 'react-bootstrap';
import PropTypes from 'prop-types';
import SummaryCard from './SummaryCard';

/**
 * Summary Cards Section Component
 * Groups all summary cards in a reusable section
 */
function SummaryCardsSection({
    totalSpent,
    totalIncome,
    averageTransaction,
    topCategory,
    spendTransactionCount,
    incomeTransactionCount,
    currencySymbol
}) {
    return (
        <Row className="g-3 mb-4">
            <Col lg={3} md={6}>
                <SummaryCard
                    label="Total Spent"
                    value={totalSpent.toFixed(2)}
                    subtext={`${spendTransactionCount} transactions`}
                    currencySymbol={currencySymbol}
                />
            </Col>

            <Col lg={3} md={6}>
                <SummaryCard
                    label="Total Income"
                    value={totalIncome.toFixed(2)}
                    subtext={`${incomeTransactionCount} transactions`}
                    variant="income"
                    currencySymbol={currencySymbol}
                />
            </Col>

            <Col lg={3} md={6}>
                <SummaryCard
                    label="Avg Transaction"
                    value={averageTransaction.toFixed(2)}
                    subtext={`${spendTransactionCount} spends`}
                    currencySymbol={currencySymbol}
                />
            </Col>

            <Col lg={3} md={6}>
                <SummaryCard
                    label="Top Category"
                    value={topCategory.category}
                    subtext={`${currencySymbol}${topCategory.amount.toFixed(2)}`}
                    variant="highlight"
                />
            </Col>
        </Row>
    );
}

SummaryCardsSection.propTypes = {
    totalSpent: PropTypes.number.isRequired,
    totalIncome: PropTypes.number.isRequired,
    averageTransaction: PropTypes.number.isRequired,
    topCategory: PropTypes.shape({
        category: PropTypes.string.isRequired,
        amount: PropTypes.number.isRequired
    }).isRequired,
    spendTransactionCount: PropTypes.number.isRequired,
    incomeTransactionCount: PropTypes.number.isRequired,
    currencySymbol: PropTypes.string.isRequired
};

export default SummaryCardsSection;