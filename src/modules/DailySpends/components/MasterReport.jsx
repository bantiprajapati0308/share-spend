import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Table, Row, Col, Card, Spinner, Alert, Tabs, Tab } from 'react-bootstrap';
import { ArrowLeft, Download } from 'react-bootstrap-icons';
import styles from '../styles/MasterReport.module.scss';
import GradientProgressBar from './GradientProgressBar';
import { getTransactions } from '../../../hooks/useDailySpends';
import { getCurrencySymbol } from '../../../Util';

function MasterReport({ currency = 'INR' }) {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [categoryBreakdown, setCategoryBreakdown] = useState({});
    const [monthlyBreakdown, setMonthlyBreakdown] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('category');

    const currencySymbol = getCurrencySymbol(currency);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await getTransactions();
                setTransactions(data);

                // Process category breakdown
                const categoryBreak = {};
                const monthlyBreak = {};

                data.forEach(tx => {
                    if (tx.type === 'spend') {
                        const category = tx.category || 'Other';
                        if (!categoryBreak[category]) {
                            categoryBreak[category] = { amount: 0, count: 0 };
                        }
                        categoryBreak[category].amount += parseFloat(tx.amount) || 0;
                        categoryBreak[category].count += 1;

                        // Monthly breakdown
                        const date = new Date(tx.date || tx.createdAt);
                        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                        if (!monthlyBreak[monthKey]) {
                            monthlyBreak[monthKey] = { amount: 0, count: 0 };
                        }
                        monthlyBreak[monthKey].amount += parseFloat(tx.amount) || 0;
                        monthlyBreak[monthKey].count += 1;
                    }
                });

                setCategoryBreakdown(categoryBreak);
                setMonthlyBreakdown(monthlyBreak);
                setError(null);
            } catch (err) {
                console.error('Error loading master report data:', err);
                setError(err.message || 'Failed to load report data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const getTotalSpent = () => {
        return transactions
            .filter(tx => tx.type === 'spend')
            .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
    };

    const getTotalIncome = () => {
        return transactions
            .filter(tx => tx.type === 'income')
            .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
    };

    const getAverageTransaction = () => {
        const spends = transactions.filter(tx => tx.type === 'spend');
        return spends.length > 0 ? getTotalSpent() / spends.length : 0;
    };

    const getTopCategory = () => {
        let top = { category: 'N/A', amount: 0 };
        Object.entries(categoryBreakdown).forEach(([cat, data]) => {
            if (data.amount > top.amount) {
                top = { category: cat, amount: data.amount };
            }
        });
        return top;
    };

    const handleExport = () => {
        const csvContent = generateCSV();
        downloadCSV(csvContent);
    };

    const generateCSV = () => {
        let csv = 'Master Report - All Transactions\n';
        csv += `Generated: ${new Date().toLocaleString()}\n\n`;

        csv += 'Summary\n';
        csv += `Total Spent,${getTotalSpent().toFixed(2)}\n`;
        csv += `Total Income,${getTotalIncome().toFixed(2)}\n`;
        csv += `Average Transaction,${getAverageTransaction().toFixed(2)}\n`;
        csv += `Total Transactions,${transactions.length}\n\n`;

        csv += 'Category-wise Breakdown\n';
        csv += 'Category,Total,Count,Average\n';
        Object.entries(categoryBreakdown)
            .sort((a, b) => b[1].amount - a[1].amount)
            .forEach(([cat, data]) => {
                csv += `"${cat}",${data.amount.toFixed(2)},${data.count},${(data.amount / data.count).toFixed(2)}\n`;
            });

        csv += '\nMonthly Breakdown\n';
        csv += 'Month,Total,Count\n';
        Object.entries(monthlyBreakdown)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .forEach(([month, data]) => {
                csv += `${month},${data.amount.toFixed(2)},${data.count}\n`;
            });

        return csv;
    };

    const downloadCSV = (csv) => {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `master-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className={styles.reportContainer}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.backButtonWrapper}>
                    <Button
                        variant="outline-secondary"
                        onClick={() => navigate(-1)}
                        className={styles.backBtn}
                    >
                        <ArrowLeft size={18} /> Back
                    </Button>
                </div>

                <div className={styles.title}>
                    <h2>Master Report</h2>
                    <p className={styles.subtitle}>
                        Complete transaction history and analytics
                    </p>
                </div>

                <Button
                    variant="success"
                    onClick={handleExport}
                    className={styles.exportBtn}
                >
                    <Download size={18} /> Export CSV
                </Button>
            </div>

            {/* Summary Cards */}
            <Row className="g-3 mb-4">
                <Col lg={3} md={6}>
                    <Card className={styles.summaryCard}>
                        <Card.Body>
                            <p className={styles.cardLabel}>Total Spent</p>
                            <h3 className={styles.cardAmount}>
                                {currencySymbol}{getTotalSpent().toFixed(2)}
                            </h3>
                            <p className={styles.cardSubtext}>
                                {transactions.filter(tx => tx.type === 'spend').length} transactions
                            </p>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={3} md={6}>
                    <Card className={`${styles.summaryCard} ${styles.income}`}>
                        <Card.Body>
                            <p className={styles.cardLabel}>Total Income</p>
                            <h3 className={styles.cardAmount}>
                                {currencySymbol}{getTotalIncome().toFixed(2)}
                            </h3>
                            <p className={styles.cardSubtext}>
                                {transactions.filter(tx => tx.type === 'income').length} transactions
                            </p>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={3} md={6}>
                    <Card className={styles.summaryCard}>
                        <Card.Body>
                            <p className={styles.cardLabel}>Avg Transaction</p>
                            <h3 className={styles.cardAmount}>
                                {currencySymbol}{getAverageTransaction().toFixed(2)}
                            </h3>
                            <p className={styles.cardSubtext}>
                                {transactions.filter(tx => tx.type === 'spend').length} spends
                            </p>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={3} md={6}>
                    <Card className={`${styles.summaryCard} ${styles.highlight}`}>
                        <Card.Body>
                            <p className={styles.cardLabel}>Top Category</p>
                            <h3 className={styles.cardAmount}>
                                {getTopCategory().category}
                            </h3>
                            <p className={styles.cardSubtext}>
                                {currencySymbol}{getTopCategory().amount.toFixed(2)}
                            </p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Loading and Error States */}
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
                <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className={styles.tabs}>
                    {/* Category Breakdown Tab */}
                    <Tab eventKey="category" title="By Category" className={styles.tabContent}>
                        <div className={styles.tableWrapper}>
                            <h4 className={styles.sectionTitle}>
                                Category-wise Analysis
                            </h4>
                            <Table hover responsive className={styles.analysisTable}>
                                <thead>
                                    <tr>
                                        <th>Category</th>
                                        <th className={styles.rightAlign}>Total Amount</th>
                                        <th className={styles.rightAlign}>Transactions</th>
                                        <th className={styles.rightAlign}>Average</th>
                                        <th className={styles.centerAlign}>% of Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(categoryBreakdown)
                                        .sort((a, b) => b[1].amount - a[1].amount)
                                        .map(([category, data]) => {
                                            const percentage = Math.round(
                                                (data.amount / getTotalSpent()) * 100
                                            );
                                            return (
                                                <tr key={category}>
                                                    <td className={styles.categoryName}>
                                                        {category}
                                                    </td>
                                                    <td className={styles.rightAlign}>
                                                        <strong>
                                                            {currencySymbol}
                                                            {data.amount.toFixed(2)}
                                                        </strong>
                                                    </td>
                                                    <td className={styles.rightAlign}>
                                                        {data.count}
                                                    </td>
                                                    <td className={styles.rightAlign}>
                                                        {currencySymbol}
                                                        {(data.amount / data.count).toFixed(2)}
                                                    </td>
                                                    <td className={styles.centerAlign}>
                                                        <GradientProgressBar
                                                            percentage={percentage}
                                                            height="small"
                                                            showLabel={true}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </Table>
                        </div>
                    </Tab>

                    {/* Monthly Breakdown Tab */}
                    <Tab eventKey="monthly" title="By Month" className={styles.tabContent}>
                        <div className={styles.tableWrapper}>
                            <h4 className={styles.sectionTitle}>
                                Monthly Spending Summary
                            </h4>
                            <Table hover responsive className={styles.analysisTable}>
                                <thead>
                                    <tr>
                                        <th>Month</th>
                                        <th className={styles.rightAlign}>Total Amount</th>
                                        <th className={styles.rightAlign}>Transactions</th>
                                        <th className={styles.rightAlign}>Average</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(monthlyBreakdown)
                                        .sort((a, b) => b[0].localeCompare(a[0]))
                                        .map(([month, data]) => {
                                            const [year, monthNum] = month.split('-');
                                            const monthName = new Date(`${year}-${monthNum}-01`)
                                                .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

                                            return (
                                                <tr key={month}>
                                                    <td>{monthName}</td>
                                                    <td className={styles.rightAlign}>
                                                        <strong>
                                                            {currencySymbol}
                                                            {data.amount.toFixed(2)}
                                                        </strong>
                                                    </td>
                                                    <td className={styles.rightAlign}>
                                                        {data.count}
                                                    </td>
                                                    <td className={styles.rightAlign}>
                                                        {currencySymbol}
                                                        {(data.amount / data.count).toFixed(2)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </Table>
                        </div>
                    </Tab>

                    {/* Recent Transactions Tab */}
                    <Tab eventKey="recent" title="Recent Transactions" className={styles.tabContent}>
                        <div className={styles.tableWrapper}>
                            <h4 className={styles.sectionTitle}>Latest Transactions</h4>
                            <Table hover responsive className={styles.analysisTable}>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Category</th>
                                        <th>Description</th>
                                        <th className={styles.rightAlign}>Amount</th>
                                        <th>Type</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.slice(0, 50).map((tx) => (
                                        <tr key={tx.id}>
                                            <td className={styles.dateCell}>
                                                {new Date(tx.date || tx.createdAt).toLocaleDateString()}
                                            </td>
                                            <td>{tx.category || 'N/A'}</td>
                                            <td className={styles.description}>
                                                {tx.description || '-'}
                                            </td>
                                            <td className={`${styles.rightAlign} ${tx.type === 'income' ? styles.income : ''}`}>
                                                <strong>
                                                    {tx.type === 'income' ? '+' : ''}
                                                    {currencySymbol}
                                                    {tx.amount}
                                                </strong>
                                            </td>
                                            <td>
                                                <span className={`${styles.badge} ${styles[tx.type]}`}>
                                                    {tx.type}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    </Tab>
                </Tabs>
            )}
        </div>
    );
}

export default MasterReport;
