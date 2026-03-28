import React, { useState } from 'react';
import { Form, Button, Modal, ListGroup, Badge, Alert } from 'react-bootstrap';
import { Trash2, Plus } from 'react-bootstrap-icons';
import styles from '../styles/CategoryLimitsManagement.module.scss';
import GradientProgressBar from './GradientProgressBar';

function CategoryLimitsManagement({
    categories,
    limits,
    categoryTotals,
    startDate,
    endDate,
    onAddLimit,
    onUpdateLimit,
    onDeleteLimit,
    loading,
    error,
}) {
    const [showModal, setShowModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [limitAmount, setLimitAmount] = useState('');
    const [editingId, setEditingId] = useState(null);

    const handleAddLimit = () => {
        if (!selectedCategory || !limitAmount) {
            alert('Please select a category and enter a limit amount');
            return;
        }

        if (editingId) {
            onUpdateLimit(editingId, {
                category: selectedCategory,
                limit: parseFloat(limitAmount),
                startDate,
                endDate,
            });
        } else {
            onAddLimit({
                category: selectedCategory,
                limit: parseFloat(limitAmount),
                startDate,
                endDate,
            });
        }

        resetForm();
        setShowModal(false);
    };

    const handleEditLimit = (limit) => {
        setSelectedCategory(limit.category);
        setLimitAmount(limit.limit.toString());
        setEditingId(limit.id);
        setShowModal(true);
    };

    const resetForm = () => {
        setSelectedCategory('');
        setLimitAmount('');
        setEditingId(null);
    };

    const handleCloseModal = () => {
        resetForm();
        setShowModal(false);
    };

    const getCategorySpent = (category) => {
        return categoryTotals[category] || 0;
    };

    const getProgressPercentage = (limit) => {
        const spent = getCategorySpent(limit.category);
        return Math.min(Math.round((spent / limit.limit) * 100), 100);
    };

    return (
        <div className={styles.limitsContainer}>
            <div className={styles.header}>
                <h4>Category Spending Limits</h4>
                <Button
                    variant="success"
                    size="sm"
                    onClick={() => setShowModal(true)}
                    className={styles.addBtn}
                >
                    <Plus size={16} /> Add Limit
                </Button>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            {loading ? (
                <p className={styles.loadingText}>Loading limits...</p>
            ) : limits.length === 0 ? (
                <p className={styles.emptyText}>No spending limits set for this period</p>
            ) : (
                <ListGroup className={styles.limitsList}>
                    {limits.map((limit) => {
                        const spent = getCategorySpent(limit.category);
                        const percentage = getProgressPercentage(limit);

                        return (
                            <ListGroup.Item key={limit.id} className={styles.limitItem}>
                                <div className={styles.limitHeader}>
                                    <div>
                                        <span className={styles.category}>{limit.category}</span>
                                        <Badge
                                            bg={percentage > 100 ? 'danger' : percentage > 80 ? 'warning' : 'success'}
                                            className={styles.badge}
                                        >
                                            {percentage}%
                                        </Badge>
                                    </div>
                                    <div className={styles.actions}>
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => handleEditLimit(limit)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => {
                                                if (window.confirm('Delete this limit?')) {
                                                    onDeleteLimit(limit.id);
                                                }
                                            }}
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>

                                <div className={styles.amounts}>
                                    <span>Spent: <strong>${spent.toFixed(2)}</strong></span>
                                    <span>Limit: <strong>${limit.limit.toFixed(2)}</strong></span>
                                </div>

                                <GradientProgressBar percentage={percentage} />
                            </ListGroup.Item>
                        );
                    })}
                </ListGroup>
            )}

            {/* Modal for adding/editing limits */}
            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{editingId ? 'Edit Limit' : 'Add Spending Limit'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Category</Form.Label>
                            <Form.Select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                <option value="">Select a category</option>
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Limit Amount</Form.Label>
                            <Form.Control
                                type="number"
                                placeholder="e.g., 500"
                                value={limitAmount}
                                onChange={(e) => setLimitAmount(e.target.value)}
                                step="0.01"
                                min="0"
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleAddLimit}>
                        {editingId ? 'Update Limit' : 'Add Limit'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default CategoryLimitsManagement;
