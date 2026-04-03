import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Form, Button, Modal, ListGroup, Badge, Alert, Spinner, Accordion, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Trash2, Plus, Lock, Ban } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import useCategoryContext from '../hooks/useCategoryContext';
import { useUserCategories } from '../hooks/useUserCategories';
import TransactionTypeSelector from './common/TransactionTypeSelector';
import { NON_DELETABLE_CATEGORIES } from '../../../utils/predefinedCategories';

/**
 * Get tooltip message for non-deletable categories
 * @param {string} categoryName - Name of the category
 * @returns {string} Tooltip message explaining the category's purpose
 */
const getCategoryTooltip = (categoryName) => {
    const tooltips = {
        'Lent': 'Use this category when you lend money to someone. It records the amount going out as a loan that you expect to be repaid.',
        'Borrowed': 'Use this category when someone lends you money. It records the amount coming in as a loan that you need to repay.',
        'Repayment': 'Use this category when someone repays the money you lent them. It records the repayment as income.',
        'Borrowed Pay': 'Use this category when you repay money you borrowed. It records the repayment as an expense.'
    };
    return tooltips[categoryName] || 'This is a system category required for Borrow/Lend functionality and cannot be deleted.';
};

/**
 * Category Management Modal
 * Manages categories with support for spend/income types
 * Shows both types in expandable accordions
 * Disabled categories won't appear in any dropdown
 */
function CategoryManagementModal({ show, onHide }) {
    const {
        categories,
        loading: contextLoading,
        addNewCategory,
        updateCategoryInState,
        removeCategoryFromState
    } = useCategoryContext();

    const {
        disableCategory,
        enableCategory,
        deleteCategory,
        isCategoryUsed,
    } = useUserCategories();

    const [showAddModal, setShowAddModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryEmoji, setNewCategoryEmoji] = useState('📝');
    const [newCategoryType, setNewCategoryType] = useState('spend');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get categories by type
    const spendCategories = useMemo(() => {
        return categories.filter(cat => cat.type === 'spend');
    }, [categories]);

    const incomeCategories = useMemo(() => {
        return categories.filter(cat => cat.type === 'income');
    }, [categories]);

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) {
            toast.error('Please enter a category name');
            return;
        }

        try {
            setIsSubmitting(true);
            await addNewCategory(newCategoryName.trim(), newCategoryEmoji, newCategoryType);
            setNewCategoryName('');
            setNewCategoryEmoji('📝');
            setNewCategoryType('spend');
            setShowAddModal(false);
            toast.success('Category added successfully');
        } catch (error) {
            toast.error(error.message || 'Failed to add category');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleCategory = async (categoryId, isEnabled) => {
        try {
            if (isEnabled) {
                // Category is currently enabled, so disable it
                await disableCategory(categoryId);
                updateCategoryInState(categoryId, { isEnabled: false });
                toast.success('Category disabled');
            } else {
                // Category is currently disabled, so enable it
                await enableCategory(categoryId);
                updateCategoryInState(categoryId, { isEnabled: true });
                toast.success('Category enabled');
            }
        } catch (error) {
            toast.error('Failed to update category');
            console.error(error);
        }
    };

    const handleDeleteCategory = async (categoryId, categoryData) => {
        if (NON_DELETABLE_CATEGORIES.includes(categoryData.name)) {
            toast.error('This category cannot be deleted.');
            return;
        }

        try {
            const isUsed = await isCategoryUsed(categoryId);
            if (isUsed) {
                toast.error(
                    'This category is used in transactions. Disable it instead.'
                );
                return;
            }

            if (!window.confirm('Are you sure you want to delete this category?')) {
                return;
            }

            await deleteCategory(categoryId, categoryData);
            removeCategoryFromState(categoryId);
            toast.success('Category deleted successfully');
        } catch (error) {
            toast.error(error.message || 'Failed to delete category');
            console.error(error);
        }
    };

    const renderCategoryList = (categoryList, disabled = false) => {
        return (
            <ListGroup>
                {categoryList.map((category) => (
                    <ListGroup.Item
                        key={category.id}
                        className="d-flex justify-content-between align-items-center px-2"
                        style={!category.isEnabled ? { opacity: 0.6 } : {}}
                    >
                        <div>

                            <span style={{ fontSize: '0.825rem', marginRight: '0.05rem' }}>
                                {category.emoji}
                            </span>
                            <strong>{category.name}</strong> {!category.isEnabled && <Ban size={14} />}
                        </div>
                        <div>
                            <Form.Check
                                type="switch"
                                id={`switch-${category.id}`}
                                checked={category.isEnabled}
                                onChange={() => handleToggleCategory(category.id, category.isEnabled)}
                                className="d-inline-block"
                            />
                            {NON_DELETABLE_CATEGORIES.includes(category.name) ? (
                                <OverlayTrigger
                                    placement="top"
                                    overlay={
                                        <Tooltip>
                                            <div style={{ textAlign: 'center' }}>
                                                <Lock size={16} style={{ marginBottom: '4px' }} />
                                                {getCategoryTooltip(category.name)}
                                            </div>
                                        </Tooltip>
                                    }
                                >
                                    <span>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            disabled
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </span>
                                </OverlayTrigger>
                            ) : (
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleDeleteCategory(category.id, category)}
                                >
                                    <Trash2 size={14} />
                                </Button>
                            )}
                        </div>
                    </ListGroup.Item>
                ))}
            </ListGroup>
        );
    };

    return (
        <>
            <Modal show={show} onHide={onHide} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>📂 Manage Categories</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Button
                        variant="success"
                        size="sm"
                        onClick={() => setShowAddModal(true)}
                        className="mb-3"
                    >
                        <Plus size={16} /> Add New Category
                    </Button>

                    {contextLoading ? (
                        <div className="text-center">
                            <Spinner animation="border" size="sm" />
                            <p className="mt-2">Loading categories...</p>
                        </div>
                    ) : categories.length === 0 ? (
                        <Alert variant="info">No categories yet. Create your first one!</Alert>
                    ) : (
                        <Accordion defaultActiveKey={['spending', 'income']} alwaysOpen>
                            {/* Spending Categories Accordion */}
                            <Accordion.Item eventKey="spending">
                                <Accordion.Header>
                                    💰 Spending Categories ({spendCategories.length})
                                </Accordion.Header>
                                <Accordion.Body>
                                    {spendCategories.length === 0 ? (
                                        <Alert variant="info" className="mb-0">
                                            No spending categories yet
                                        </Alert>
                                    ) : (
                                        <div>
                                            <h6 className="mb-3">
                                                All Categories ({spendCategories.length})
                                            </h6>
                                            {renderCategoryList(spendCategories)}
                                        </div>
                                    )}
                                </Accordion.Body>
                            </Accordion.Item>

                            {/* Income Categories Accordion */}
                            <Accordion.Item eventKey="income">
                                <Accordion.Header>
                                    🎯 Income Categories ({incomeCategories.length})
                                </Accordion.Header>
                                <Accordion.Body>
                                    {incomeCategories.length === 0 ? (
                                        <Alert variant="info" className="mb-0">
                                            No income categories yet
                                        </Alert>
                                    ) : (
                                        <div>
                                            <h6 className="mb-3">
                                                All Categories ({incomeCategories.length})
                                            </h6>
                                            {renderCategoryList(incomeCategories)}
                                        </div>
                                    )}
                                </Accordion.Body>
                            </Accordion.Item>
                        </Accordion>
                    )}
                </Modal.Body>
            </Modal>

            {/* Add Category Modal */}
            <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered backdrop="static">
                <Modal.Header closeButton>
                    <Modal.Title>Add New Category</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <TransactionTypeSelector
                        value={newCategoryType}
                        onChange={setNewCategoryType}
                        label="Category Type"
                        variant="stacked"
                    />

                    <Form.Group className="mb-3 mt-3">
                        <Form.Label>Category Name</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="e.g., Groceries, Fuel, Rent"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') handleAddCategory();
                            }}
                        />
                    </Form.Group>

                    <Form.Group>
                        <Form.Label>Emoji (optional)</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="🍔"
                            value={newCategoryEmoji}
                            onChange={(e) =>
                                setNewCategoryEmoji(e.target.value.substring(0, 2))
                            }
                            maxLength="2"
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowAddModal(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleAddCategory}
                        disabled={isSubmitting || !newCategoryName.trim()}
                    >
                        {isSubmitting ? 'Adding...' : 'Add Category'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

CategoryManagementModal.propTypes = {
    show: PropTypes.bool.isRequired,
    onHide: PropTypes.func.isRequired,
};

export default CategoryManagementModal;
