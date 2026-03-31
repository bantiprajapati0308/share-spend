import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import { Plus } from 'react-bootstrap-icons';
import CategorySelectDropdown from '../../components/CategorySelectDropdown';
import CategoryManagementModal from '../../components/CategoryManagementModal';
import styles from '../styles/LimitsManager.module.scss';
import { validateLimitInput } from '../utils/limitsCalculations';

/**
 * LimitForm Component
 * Modal form for adding/editing limits
 */
function LimitForm({
    show,
    onHide,
    onSubmit,
    initialLimit = null,
    limitType = 'spend',
    loading = false,
}) {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [limitAmount, setLimitAmount] = useState('');
    const [validationError, setValidationError] = useState(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);

    // Initialize form when editing
    useEffect(() => {
        if (initialLimit) {
            setSelectedCategory({
                categoryId: initialLimit.categoryId || initialLimit.id,
                categoryName: initialLimit.category,
            });
            setLimitAmount(initialLimit.limit.toString());
        } else {
            resetForm();
        }
    }, [initialLimit, show]);

    const resetForm = () => {
        setSelectedCategory(null);
        setLimitAmount('');
        setValidationError(null);
    };

    const handleClose = () => {
        resetForm();
        onHide();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setValidationError(null);

        // Validate input
        const validation = validateLimitInput(
            selectedCategory?.categoryName,
            limitAmount
        );

        if (!validation.isValid) {
            setValidationError(validation.error);
            return;
        }

        // Prepare limit data
        const limitData = {
            category: selectedCategory.categoryName,
            categoryId: selectedCategory.categoryId,
            limit: parseFloat(limitAmount),
            type: limitType,
        };

        onSubmit(limitData, initialLimit?.id);
        handleClose();
    };

    const modalTitle = initialLimit
        ? `Edit ${limitType === 'income' ? 'Income' : 'Spending'} Limit`
        : `Add ${limitType === 'income' ? 'Income' : 'Spending'} Limit`;

    return (
        <>
            <Modal show={show} onHide={handleClose} centered backdrop="static">
                <Modal.Header closeButton>
                    <Modal.Title>{modalTitle}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {validationError && (
                        <Alert variant="danger" onClose={() => setValidationError(null)} dismissible>
                            {validationError}
                        </Alert>
                    )}

                    <Form onSubmit={handleSubmit}>
                        {/* Category Selection */}
                        <Form.Group className="mb-3">
                            <CategorySelectDropdown
                                value={selectedCategory}
                                onChange={setSelectedCategory}
                                type={limitType}
                                placeholder="Select a category..."
                            >
                                <button
                                    type="button"
                                    className={styles.addCategoryBtn}
                                    onClick={() => setShowCategoryModal(true)}
                                    title="Manage categories"
                                >
                                    <Plus size={16} />
                                </button>
                            </CategorySelectDropdown>
                        </Form.Group>

                        {/* Limit Amount */}
                        <Form.Group className="mb-3">
                            <Form.Label>Limit Amount</Form.Label>
                            <Form.Control
                                type="number"
                                placeholder="e.g., 500.00"
                                value={limitAmount}
                                onChange={(e) => setLimitAmount(e.target.value)}
                                step="0.01"
                                min="0"
                                required
                            />
                            <Form.Text className="text-muted">
                                Enter the {limitType === 'income' ? 'income' : 'spending'} limit for this category
                            </Form.Text>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : initialLimit ? 'Update Limit' : 'Add Limit'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Category Management Modal */}
            <CategoryManagementModal
                show={showCategoryModal}
                onHide={() => setShowCategoryModal(false)}
            />
        </>
    );
}

LimitForm.propTypes = {
    show: PropTypes.bool.isRequired,
    onHide: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    initialLimit: PropTypes.shape({
        id: PropTypes.string,
        category: PropTypes.string,
        categoryId: PropTypes.string,
        limit: PropTypes.number,
    }),
    limitType: PropTypes.oneOf(['spend', 'income']).isRequired,
    loading: PropTypes.bool,
};

export default LimitForm;
