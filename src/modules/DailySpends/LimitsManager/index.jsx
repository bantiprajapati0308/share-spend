import { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Nav, Tab, Alert } from 'react-bootstrap';
import { ArrowLeft } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import useLimitsManager from './hooks/useLimitsManager';
import { useSelectedDateRange } from '../hooks/useSelectedDateRange';
import LimitsPanel from './components/LimitsPanel';
import LimitForm from './components/LimitForm';
import styles from './styles/LimitsManager.module.scss';
import { toast } from 'react-toastify';

/**
 * LimitsManager Main Component
 * Route-based interface for managing spending and income limits
 * Separate calculations and database operations for each type
 */
function LimitsManager() {
    const navigate = useNavigate();
    const { loadDateRange } = useSelectedDateRange();

    // State management
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [activeTab, setActiveTab] = useState('spending');
    const [showLimitForm, setShowLimitForm] = useState(false);
    const [editingLimit, setEditingLimit] = useState(null);
    const [formSubmitting, setFormSubmitting] = useState(false);

    const loadSavedDateRange = useCallback(async () => {
        try {
            const savedRange = await loadDateRange();
            if (savedRange?.startDate && savedRange?.endDate) {
                setStartDate(new Date(savedRange.startDate));
                setEndDate(new Date(savedRange.endDate));
            } else {
                // Set default to current month
                const now = new Date();
                setStartDate(new Date(now.getFullYear(), now.getMonth(), 1));
                setEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
            }
        } catch (err) {
            console.error('Error loading date range:', err);
            toast.error('Failed to load date range');
        }
    }, [loadDateRange]);

    // Use custom hook for limit management
    const {
        limits,
        categoryTotals,
        loading,
        error,
        addLimit,
        updateLimit,
        deleteLimit,
        initialize, // Get the initialize function
    } = useLimitsManager(startDate, endDate);

    // Load date range and data on mount (only once)
    useEffect(() => {
        loadSavedDateRange();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Initialize limits data once dates are available
    useEffect(() => {
        if (startDate && endDate) {
            initialize(); // Call the lazy-load function once
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startDate, endDate]); // Only depends on dates, not functions

    /**
     * Handle add limit form submission
     */
    const handleAddLimitSubmit = async (limitData, limitId) => {
        try {
            setFormSubmitting(true);

            if (limitId) {
                // Update existing limit
                await updateLimit(limitId, limitData);
                setEditingLimit(null);
            } else {
                // Add new limit
                await addLimit(limitData);
            }

            setShowLimitForm(false);
        } catch (err) {
            console.error('Error saving limit:', err);
        } finally {
            setFormSubmitting(false);
        }
    };

    /**
     * Handle edit limit
     */
    const handleEditLimit = (limit) => {
        setEditingLimit(limit);
        setShowLimitForm(true);
    };

    /**
     * Handle delete limit
     */
    const handleDeleteLimit = async (limitId) => {
        try {
            await deleteLimit(limitId);
        } catch (err) {
            console.error('Error deleting limit:', err);
        }
    };

    /**
     * Handle add new limit button
     */
    const handleOpenAddForm = () => {
        setEditingLimit(null);
        setShowLimitForm(true);
    };

    /**
     * Close form modal
     */
    const handleCloseForm = () => {
        setShowLimitForm(false);
        setEditingLimit(null);
    };

    const currentLimitType = activeTab === 'spending' ? 'spend' : 'income';

    return (
        <div className={styles.limitsManagerContainer}>
            {/* Header */}
            <div className={styles.header}>
                <Container>
                    <div className={styles.headerContent}>
                        <button
                            className={styles.backButton}
                            onClick={() => navigate('/share-spend/daily-expenses')}
                            title="Back to Daily Expenses"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className={styles.headerText}>
                            <h1>Limits Manager</h1>
                            <p>Manage your spending and income limits</p>
                        </div>
                    </div>
                </Container>
            </div>

            {/* Main Content */}
            <Container className={styles.mainContent}>
                {error && (
                    <Alert variant="warning" className="my-3">
                        {error}
                    </Alert>
                )}

                {!startDate || !endDate ? (
                    <Alert variant="info">
                        Loading date range...
                    </Alert>
                ) : (
                    <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                        {/* Tab Navigation */}
                        <Nav variant="tabs" className={styles.tabNavigation}>
                            <Nav.Item>
                                <Nav.Link eventKey="spending" className={styles.tabLink}>
                                    💰 Spending Limits
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="income" className={styles.tabLink}>
                                    🎯 Income Limits
                                </Nav.Link>
                            </Nav.Item>
                        </Nav>

                        {/* Tab Content */}
                        <Tab.Content className={styles.tabContent}>
                            {/* Spending Limits Tab */}
                            <Tab.Pane eventKey="spending">
                                <Row className="mt-4">
                                    <Col lg={12}>
                                        <LimitsPanel
                                            limits={limits}
                                            categoryTotals={categoryTotals}
                                            limitType="spend"
                                            onAddLimit={handleOpenAddForm}
                                            onEditLimit={handleEditLimit}
                                            onDeleteLimit={handleDeleteLimit}
                                            loading={loading}
                                            error={error}
                                        />
                                    </Col>
                                </Row>
                            </Tab.Pane>

                            {/* Income Limits Tab */}
                            <Tab.Pane eventKey="income">
                                <Row className="mt-4">
                                    <Col lg={12}>
                                        <LimitsPanel
                                            limits={limits}
                                            categoryTotals={categoryTotals}
                                            limitType="income"
                                            onAddLimit={handleOpenAddForm}
                                            onEditLimit={handleEditLimit}
                                            onDeleteLimit={handleDeleteLimit}
                                            loading={loading}
                                            error={error}
                                        />
                                    </Col>
                                </Row>
                            </Tab.Pane>
                        </Tab.Content>
                    </Tab.Container>
                )}
            </Container>

            {/* Limit Form Modal */}
            <LimitForm
                show={showLimitForm}
                onHide={handleCloseForm}
                onSubmit={handleAddLimitSubmit}
                initialLimit={editingLimit}
                limitType={currentLimitType}
                loading={formSubmitting}
            />
        </div>
    );
}

export default LimitsManager;
