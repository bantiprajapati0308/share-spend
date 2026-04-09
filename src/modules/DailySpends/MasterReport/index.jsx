import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner, Alert, Tabs, Tab } from 'react-bootstrap';
import PropTypes from 'prop-types';
import styles from './styles/MasterReport.module.scss';

// Components
import ReportHeader from './components/ReportHeader';
import SummaryCardsSection from './components/SummaryCardsSection';
import CategoryBreakdownTab from './components/CategoryBreakdownTab';
import MonthlyBreakdownTab from './components/MonthlyBreakdownTab';
import RecentTransactionsTab from './components/RecentTransactionsTab';
import CategoryDetailsModal from './components/CategoryDetailsModal';

// Hooks and Utils
import { useMasterReportData } from './hooks/useMasterReportData';
import { getCurrencySymbol } from '../../../Util';
import { generateMasterReportCSV, downloadCSV } from './utils/masterReportUtils';

/**
 * Master Report Component
 * Refactored into modular components following DRY principles
 * Implements category details modal on row click
 */
function MasterReport({ currency = 'INR' }) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('category');
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedCategoryTransactions, setSelectedCategoryTransactions] = useState([]);

    const {
        transactions,
        categoryBreakdown,
        monthlyBreakdown,
        loading,
        error,
        calculations,
        getCategoryTransactions
    } = useMasterReportData();

    const currencySymbol = getCurrencySymbol(currency);

    // Handle category row click
    const handleCategoryClick = (categoryName) => {
        const categoryTransactions = getCategoryTransactions(categoryName);
        setSelectedCategory(categoryName);
        setSelectedCategoryTransactions(categoryTransactions);
        setShowCategoryModal(true);
    };

    // Handle modal close
    const handleModalClose = () => {
        setShowCategoryModal(false);
        setSelectedCategory(null);
        setSelectedCategoryTransactions([]);
    };

    // Handle export
    const handleExport = () => {
        const csvData = {
            transactions,
            categoryBreakdown,
            monthlyBreakdown,
            calculations
        };
        const csvContent = generateMasterReportCSV(csvData);
        downloadCSV(csvContent);
    };

    return (
        <div className={styles.reportContainer}>
            {/* Header */}
            <ReportHeader
                title="Master Report"
                subtitle="Complete transaction history and analytics"
                onBack={() => navigate(-1)}
                onExport={handleExport}
            />

            {/* Summary Cards */}
            <SummaryCardsSection
                totalSpent={calculations.totalSpent}
                totalIncome={calculations.totalIncome}
                averageTransaction={calculations.averageTransaction}
                topCategory={calculations.topCategory}
                spendTransactionCount={calculations.spendTransactionCount}
                incomeTransactionCount={calculations.incomeTransactionCount}
                currencySymbol={currencySymbol}
            />

            {/* Content based on state */}
            {loading ? (
                <div className={styles.loadingContainer}>
                    <Spinner animation="border" />
                    <p>Loading report data...</p>
                </div>
            ) : error ? (
                <Alert variant="danger">
                    Error loading report: {error}
                </Alert>
            ) : transactions.length === 0 ? (
                <Alert variant="info">
                    No transactions found yet.
                </Alert>
            ) : (
                <>
                    {/* Tabs */}
                    <Tabs
                        activeKey={activeTab}
                        onSelect={(k) => setActiveTab(k)}
                        className={styles.tabs}
                    >
                        {/* Category Breakdown Tab */}
                        <Tab eventKey="category" title="By Category">
                            <CategoryBreakdownTab
                                categoryBreakdown={categoryBreakdown}
                                totalSpent={calculations.totalSpent}
                                currencySymbol={currencySymbol}
                                onCategoryClick={handleCategoryClick}
                            />
                        </Tab>

                        {/* Monthly Breakdown Tab */}
                        <Tab eventKey="monthly" title="By Month">
                            <MonthlyBreakdownTab
                                monthlyBreakdown={monthlyBreakdown}
                                currencySymbol={currencySymbol}
                            />
                        </Tab>

                        {/* Recent Transactions Tab */}
                        <Tab eventKey="recent" title="Recent Transactions">
                            <RecentTransactionsTab
                                transactions={transactions}
                                currencySymbol={currencySymbol}
                            />
                        </Tab>
                    </Tabs>

                    {/* Category Details Modal */}
                    <CategoryDetailsModal
                        show={showCategoryModal}
                        onHide={handleModalClose}
                        categoryName={selectedCategory || ''}
                        transactions={selectedCategoryTransactions}
                        currencySymbol={currencySymbol}
                    />
                </>
            )}
        </div>
    );
}

MasterReport.propTypes = {
    currency: PropTypes.string
};

export default MasterReport;