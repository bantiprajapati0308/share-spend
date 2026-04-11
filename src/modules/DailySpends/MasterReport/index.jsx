import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner, Alert } from 'react-bootstrap';
import PropTypes from 'prop-types';
import styles from './styles/MasterReport.module.scss';

// Components
import ReportHeader from './components/ReportHeader';
import TimeSummaryCardsSection from './components/TimeSummaryCardsSection';
import TabToggle from '../../../components/common/TabToggle';
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

    // Tab configuration
    const reportTabs = [
        { key: 'category', label: 'By Category', icon: '' },
        { key: 'monthly', label: 'By Month', icon: '' },
        { key: 'recent', label: 'Recent Transactions', icon: '' }
    ];

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

            {/* Time-based Summary Cards */}
            <TimeSummaryCardsSection
                todayData={calculations.today}
                thisWeekData={calculations.thisWeek}
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
                    {/* Custom Tab Toggle */}
                    <TabToggle
                        tabs={reportTabs}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                    />

                    {/* Tab Content */}
                    {activeTab === 'category' && (
                        <CategoryBreakdownTab
                            categoryBreakdown={categoryBreakdown}
                            totalSpent={calculations.totalSpent}
                            currencySymbol={currencySymbol}
                            onCategoryClick={handleCategoryClick}
                        />
                    )}

                    {activeTab === 'monthly' && (
                        <MonthlyBreakdownTab
                            monthlyBreakdown={monthlyBreakdown}
                            currencySymbol={currencySymbol}
                        />
                    )}

                    {activeTab === 'recent' && (
                        <RecentTransactionsTab
                            transactions={transactions}
                            currencySymbol={currencySymbol}
                        />
                    )}

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