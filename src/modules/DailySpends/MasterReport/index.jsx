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
import TimeSummaryDetailModal from './components/TimeSummaryDetailModal';
import ChartsCarousel from './components/ChartsCarousel';
import { Chart } from 'chart.js';

// Hooks and Utils
import { useMasterReportData } from './hooks/useMasterReportData';
import { getCurrencySymbol } from '../../../Util';
import { generateMasterReportCSV, downloadCSV } from './utils/masterReportUtils';

/**
 * Master Report Component
 * Refactored into modular components following DRY principles
 * Implements category details modal on row click
 * @param {string} currency - Currency type (default: 'INR')
 * @param {Date} startDate - Start date for filtering (optional)
 * @param {Date} endDate - End date for filtering (optional)
 */
function MasterReport({ currency = 'INR', startDate = null, endDate = null }) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('category');
    const [chartTransactionType, setChartTransactionType] = useState('spend');
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedCategoryTransactions, setSelectedCategoryTransactions] = useState([]);

    // Time summary modal state
    const [showTimeSummaryModal, setShowTimeSummaryModal] = useState(false);
    const [timeSummaryModalTitle, setTimeSummaryModalTitle] = useState('');
    const [timeSummaryModalTransactions, setTimeSummaryModalTransactions] = useState([]);
    const [timeSummaryModalIsIncome, setTimeSummaryModalIsIncome] = useState(false);

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
    } = useMasterReportData(startDate, endDate);

    const currencySymbol = getCurrencySymbol(currency);

    // Prepare pie chart data by selected transaction type from filtered transactions
    const getCategoryChartData = (transactionType = 'spend') => {
        const categoryTotals = {};

        transactions
            .filter(tx => tx.type === transactionType)
            .forEach(tx => {
                const amount = parseFloat(tx.amount) || 0;
                if (amount <= 0) return;
                const category = tx.category || 'Other';
                categoryTotals[category] = (categoryTotals[category] || 0) + amount;
            });

        return Object.entries(categoryTotals)
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount);
    };

    const weeklyDataObj = getWeeklyBreakdownData(chartTransactionType);
    const pieChartDataByType = getCategoryChartData(chartTransactionType);
    const legendRows = Math.max(1, Math.ceil((weeklyDataObj.categories?.length || 1) / 4));
    const legendMaxHeight = Math.min(170, 45 + (legendRows * 14));

    // Handle category row click
    const handleCategoryClick = (categoryName) => {
        const categoryTransactions = getCategoryTransactions(categoryName);
        setSelectedCategory(categoryName);
        setSelectedCategoryTransactions(categoryTransactions);
        setShowCategoryModal(true);
    };

    // Handle pie chart slice click
    const handlePieSliceClick = (sliceData) => {
        handleCategoryClick(sliceData.label);
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
                    textAlign: 'left'
                },
                maxHeight: legendMaxHeight,
                onClick: (evt, legendItem, legend) => {
                    // Toggle dataset visibility
                    const index = legendItem.datasetIndex !== undefined ? legendItem.datasetIndex : legendItem.index;
                    const chart = legend.chart;

                    if (legendItem.datasetIndex !== undefined) {
                        // For stacked bar chart (multiple datasets)
                        const meta = chart.getDatasetMeta(index);
                        meta.hidden = meta.hidden === null ? !chart.data.datasets[index].hidden : null;
                    } else {
                        // For pie chart (single dataset, multiple data points)
                        const meta = chart.getDatasetMeta(0);
                        if (meta.data[index]) {
                            meta.data[index].hidden = !meta.data[index].hidden;
                        }
                    }
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

    // Same options for pie chart (reuse the working stacked bar chart legend config)
    const pieChartOptions = {
        ...chartOptions,
        plugins: {
            ...chartOptions.plugins,
            legend: {
                ...chartOptions.plugins.legend,
                onClick: (evt, legendItem, legend) => {
                    // Specific pie chart legend click handler
                    const index = legendItem.index;
                    const chart = legend.chart;
                    const meta = chart.getDatasetMeta(0);
                    if (meta.data[index]) {
                        meta.data[index].hidden = !meta.data[index].hidden;
                        chart.update();
                    }
                }
            }
        }
    };

    // Handle time summary card click
    const handleTimeSummaryCardClick = (period, type) => {
        let txs = [];
        let title = '';
        let isIncome = type === 'income';
        if (period === 'today') {
            // Normalize both dates to UTC YYYY-MM-DD string
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            txs = transactions.filter(tx => {
                const txDate = new Date(tx.date || tx.createdAt);
                const txDateStr = txDate.toISOString().split('T')[0];
                return tx.type === type && txDateStr === todayStr;
            });
            title = type === 'income' ? 'Today Income' : 'Today Spend';
        } else if (period === 'week') {
            const today = new Date();
            const weekAgo = new Date();
            weekAgo.setDate(today.getDate() - 6);
            weekAgo.setHours(0, 0, 0, 0);
            txs = transactions.filter(tx => {
                const txDate = new Date(tx.date || tx.createdAt);
                return tx.type === type && txDate >= weekAgo && txDate <= today;
            });
            title = type === 'income' ? 'Last 7 Days Income' : 'Last 7 Days Spend';
        }
        setTimeSummaryModalTitle(title);
        setTimeSummaryModalTransactions(txs);
        setTimeSummaryModalIsIncome(isIncome);
        setShowTimeSummaryModal(true);
    };

    return (
        <div className={styles.reportContainer}>
            {/* Header */}
            <ReportHeader
                onBack={() => navigate(-1)}
                onExport={handleExport}
            />

            {/* Time-based Summary Cards */}
            <TimeSummaryCardsSection
                todayData={calculations.today}
                thisWeekData={calculations.thisWeek}
                loading={loading}
                onCardClick={handleTimeSummaryCardClick}
            />

            {/* Charts Carousel */}
            {!loading && transactions.length > 0 && (
                <ChartsCarousel
                    pieChartData={pieChartDataByType}
                    stackedBarData={{ data: weeklyDataObj.data, labels: weeklyDataObj.labels }}
                    categories={weeklyDataObj.categories}
                    chartOptions={chartOptions}
                    pieChartOptions={pieChartOptions}
                    onPieSliceClick={handlePieSliceClick}
                    onBarClick={(data) => {
                        // Optional: Navigate to category details or show modal
                    }}
                    loading={loading}
                    startDate={startDate}
                    endDate={endDate}
                    transactionType={chartTransactionType}
                    onTransactionTypeChange={setChartTransactionType}
                    currency="₹"
                    transactions={transactions}
                />
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
                    {/* Time Summary Detail Modal */}
                    <TimeSummaryDetailModal
                        show={showTimeSummaryModal}
                        onHide={() => setShowTimeSummaryModal(false)}
                        title={timeSummaryModalTitle}
                        transactions={timeSummaryModalTransactions}
                        isIncome={timeSummaryModalIsIncome}
                    />
                </>
            )}
        </div>
    );
}

MasterReport.propTypes = {
    currency: PropTypes.string,
    startDate: PropTypes.instanceOf(Date),
    endDate: PropTypes.instanceOf(Date)
};

export default MasterReport;