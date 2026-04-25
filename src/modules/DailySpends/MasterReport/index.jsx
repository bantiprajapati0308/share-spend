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
import { StackedBarChart } from '../../../components/charts';
import { Chart } from 'chart.js';

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
        getCategoryTransactions,
        getWeeklyBreakdownData,
        getUniqueCategories,
        getTotalCategoriesCount,
        getOtherCategoriesList
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

    // Custom chart options for better legend handling with compact styling
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                align: 'start',
                labels: {
                    boxWidth: 8,
                    boxHeight: 8,
                    padding: 4,
                    font: {
                        size: 9,
                        family: "'Inter', sans-serif",
                    },
                    usePointStyle: true,
                    textAlign: 'left',
                    generateLabels: function (chart) {
                        const original = Chart.defaults.plugins.legend.labels.generateLabels;
                        const labels = original.call(this, chart);

                        // Truncate long category names for compact display
                        labels.forEach(label => {
                            if (label.text && label.text.length > 12) {
                                label.text = label.text.substring(0, 12) + '...';
                            }
                        });

                        return labels;
                    }
                },
                maxHeight: 50,
                onClick: (evt, legendItem, legend) => {
                    // Toggle dataset visibility
                    const index = legendItem.datasetIndex;
                    const chart = legend.chart;
                    const meta = chart.getDatasetMeta(index);
                    meta.hidden = meta.hidden === null ? !chart.data.datasets[index].hidden : null;
                    chart.update();
                }
            }
        },
        layout: {
            padding: {
                bottom: 5
            }
        }
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
            />

            {/* Monthly Expense Breakdown Chart by Weeks */}
            {!loading && transactions.length > 0 && (
                <div className="mb-4" style={{ position: 'relative' }}>
                    <StackedBarChart
                        data={getWeeklyBreakdownData()}
                        categories={getUniqueCategories()}
                        title="Monthly Expense Breakdown by Weeks"
                        subtitle={
                            getTotalCategoriesCount() > 6
                                ? `Top 6 categories + Others for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
                                : `Expenses by category for each week of ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
                        }
                        size="medium"
                        loading={loading}
                        currency="₹"
                        showValues={true}
                        customOptions={chartOptions}
                        className={getUniqueCategories().length > 4 ? "multi-category-legend-chart" : "compact-legend-chart"}
                        colorPalette="default"
                        onBarClick={(data) => {
                            // Optional: Navigate to category details or show modal
                        }}
                    />
                    <div className="mt-2 text-muted text-center" style={{ fontSize: '0.75rem' }}>
                        <i className="bi bi-info-circle me-1"></i>
                        {getTotalCategoriesCount() > 6 ? (
                            <>
                                Showing top 6 categories by amount. "Other" includes: {getOtherCategoriesList().join(', ')}
                                • Total: {getTotalCategoriesCount()} categories
                            </>
                        ) : (
                            <>
                                Click legend items to show/hide categories • Total: {getTotalCategoriesCount()} categories
                            </>
                        )}
                    </div>
                </div>
            )}

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