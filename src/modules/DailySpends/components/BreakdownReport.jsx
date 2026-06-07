import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Table, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { ArrowLeft, Download } from 'react-bootstrap-icons';
import styles from '../styles/BreakdownReport.module.scss';
import GradientProgressBar from './GradientProgressBar';
import { getBreakdownData } from '../../../hooks/useCategoryBreakdown';
import { getCategoryLimits } from '../../../hooks/useCategoryLimits';
import { getCurrencySymbol } from '../../../Util';

function BreakdownReport({ currency = 'INR' }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [breakdown, setBreakdown] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Get date range and limits from navigation state
    const startDate = location.state?.startDate || new Date(new Date().setHours(0, 0, 0, 0));
    const endDate = location.state?.endDate || new Date(new Date().setHours(23, 59, 59, 999));
    const passedLimits = location.state?.categoryLimits || [];

    const currencySymbol = getCurrencySymbol(currency);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Use passed limits or fetch them
                let limits = passedLimits;
                if (limits.length === 0) {
                    limits = await getCategoryLimits();
                }

                const data = await getBreakdownData(startDate, endDate, limits);
                setBreakdown(data);
                setError(null);
            } catch (err) {
                console.error('Error loading breakdown data:', err);
                setError(err.message || 'Failed to load report data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [startDate, endDate, passedLimits]);

    const getTotalSpent = () => {
        return Object.values(breakdown).reduce((sum, cat) => sum + cat.totalSpent, 0);
    };

    const getTotalLimit = () => {
        return Object.values(breakdown).reduce((sum, cat) => sum + (cat.limit || 0), 0);
    };

    const getExceededCategories = () => {
        return Object.values(breakdown).filter(cat => cat.percentage > 100);
    };

    const handleExport = () => {
        const csvContent = generateCSV();
        downloadCSV(csvContent);
    };

    const generateCSV = () => {
        let csv = 'Category-wise Spending Breakdown\n';
        csv += `From: ${startDate.toLocaleDateString()} To: ${endDate.toLocaleDateString()}\n\n`;
        csv += 'Category,Total Spent,Limit,Spent %,Status\n';

        Object.values(breakdown).forEach(cat => {
            const status = cat.percentage > 100 ? 'Over Limit' : 'Within Limit';
            csv += `"${cat.category}",${cat.totalSpent.toFixed(2)},${cat.limit ? cat.limit.toFixed(2) : 'N/A'},${cat.percentage}%,${status}\n`;
        });

        csv += `\nTotal Spent,${getTotalSpent().toFixed(2)}\n`;
        csv += `Total Limit,${getTotalLimit().toFixed(2)}\n`;

        return csv;
    };

    const downloadCSV = (csv) => {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `breakdown-report-${new Date().toISOString().split('T')[0]}.csv`;
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
                    <h2>Breakdown Report</h2>
                    <p className={styles.dateRange}>
                        {startDate.toLocaleDateString()} to {endDate.toLocaleDateString()}
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
                <Col md={4}>
                    <Card className={styles.summaryCard}>
                        <Card.Body>
                            <p className={styles.cardLabel}>Total Spent</p>
                            <h3 className={styles.cardAmount}>
                                {currencySymbol}{getTotalSpent().toFixed(2)}
                            </h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className={styles.summaryCard}>
                        <Card.Body>
                            <p className={styles.cardLabel}>Total Limit</p>
                            <h3 className={styles.cardAmount}>
                                {currencySymbol}{getTotalLimit().toFixed(2)}
                            </h3>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className={`${styles.summaryCard} ${getExceededCategories().length > 0 ? styles.warning : ''}`}>
                        <Card.Body>
                            <p className={styles.cardLabel}>Categories Over Limit</p>
                            <h3 className={styles.cardAmount}>
                                {getExceededCategories().length}
                            </h3>
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
            ) : Object.keys(breakdown).length === 0 ? (
                <Alert variant="info">
                    No expenses found for the selected date range.
                </Alert>
            ) : (
                <>
                    {/* Category Breakdown Table */}
                    <div className={styles.tableWrapper}>
                        <h4 className={styles.sectionTitle}>Category-wise Breakdown</h4>
                        <Table hover responsive className={styles.breakdownTable}>
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th className={styles.rightAlign}>Total Spent</th>
                                    <th className={styles.rightAlign}>Limit</th>
                                    <th className={styles.centerAlign}>Progress</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.values(breakdown)
                                    .sort((a, b) => b.totalSpent - a.totalSpent)
                                    .map((category) => (
                                        <tr key={category.category} className={category.percentage > 100 ? styles.overLimit : ''}>
                                            <td className={styles.categoryName}>{category.category}</td>
                                            <td className={styles.rightAlign}>
                                                <strong>{currencySymbol}{category.totalSpent.toFixed(2)}</strong>
                                            </td>
                                            <td className={styles.rightAlign}>
                                                {category.limit ? (
                                                    <strong>{currencySymbol}{category.limit.toFixed(2)}</strong>
                                                ) : (
                                                    <span className={styles.noLimit}>No Limit</span>
                                                )}
                                            </td>
                                            <td className={styles.centerAlign}>
                                                {category.limit && (
                                                    <div className={styles.progressCell}>
                                                        <GradientProgressBar
                                                            percentage={category.percentage}
                                                            height="small"
                                                            showLabel={true}
                                                        />
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </Table>
                    </div>

                    {/* Over-limit categories warning */}
                    {getExceededCategories().length > 0 && (
                        <Alert variant="warning" className={styles.warningAlert}>
                            <h5>⚠️ Categories Over Limit</h5>
                            <ul>
                                {getExceededCategories().map(cat => (
                                    <li key={cat.category}>
                                        <strong>{cat.category}</strong>: {currencySymbol}{cat.totalSpent.toFixed(2)} / {currencySymbol}{cat.limit.toFixed(2)} (+{(cat.percentage - 100).toFixed(0)}%)
                                    </li>
                                ))}
                            </ul>
                        </Alert>
                    )}
                </>
            )}
        </div>
    );
}

export default BreakdownReport;
