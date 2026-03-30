import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Form, Button, Modal, ListGroup, Badge, Alert, Spinner } from 'react-bootstrap';
import { Trash2, Plus, Lock } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import useCategoryContext from '../hooks/useCategoryContext';
import { useUserCategories } from '../hooks/useUserCategories';
import TransactionTypeSelector from './common/TransactionTypeSelector';

/**
 * Category Management Modal
 * Manages categories with support for spend/income types
 * No useEffect - uses context for state management and instant updates
 */
function CategoryManagementModal({ show, onHide, type = 'spend' }) {
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
    const [newCategoryType, setNewCategoryType] = useState(type);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter categories by type using useMemo for performance
    const filteredCategories = useMemo(() => {
        return categories.filter(cat => cat.type === type);
    }, [categories, type]);

    const enabledCategories = useMemo(() => {
        return filteredCategories.filter(cat => cat.isEnabled);
    }, [filteredCategories]);

    const disabledCategories = useMemo(() => {
        return filteredCategories.filter(cat => !cat.isEnabled);
    }, [filteredCategories]);

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) {
            toast.error('Please enter a category name');
            return;
        }

        try {
            setIsSubmitting(true);
            // addNewCategory updates context state immediately
            await addNewCategory(newCategoryName.trim(), newCategoryEmoji, newCategoryType);
            setNewCategoryName('');
            setNewCategoryEmoji('📝');
            setNewCategoryType(type);
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
            if (!isEnabled) {
                await disableCategory(categoryId);
                updateCategoryInState(categoryId, { isEnabled: false });
                toast.success('Category disabled');
            } else {
                await enableCategory(categoryId);
                updateCategoryInState(categoryId, { isEnabled: true });
                toast.success('Category enabled');
            }
        } catch (error) {
            toast.error('Failed to update category');
            console.error(error);
        }
    };

    const handleDeleteCategory = async (categoryId) => {
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

            await deleteCategory(categoryId);
            removeCategoryFromState(categoryId);
            toast.success('Category deleted successfully');
        } catch (error) {
            toast.error(error.message || 'Failed to delete category');
            console.error(error);
        }
    };

    const getTypeLabel = (categoryType) => {
        return categoryType === 'income' ? 'Income' : 'Expense';
    };

    return (
        <>
            <Modal show={show} onHide={onHide} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>📂 Manage {getTypeLabel(type)} Categories</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Button
                        variant="success"
                        size="sm"
                        onClick={() => setShowAddModal(true)}
                        className="mb-3"
                    >
                        <Plus size={16} /> Add New {getTypeLabel(type)} Category
                    </Button>

                    {contextLoading ? (
                        <div className="text-center">
                            <Spinner animation="border" size="sm" />
                            <p className="mt-2">Loading categories...</p>
                        </div>
                    ) : filteredCategories.length === 0 ? (
                        <Alert variant="info">No {getTypeLabel(type).toLowerCase()} categories yet. Create your first one!</Alert>
                    ) : (
                        <>
                            {/* Enabled Categories */}
                            {enabledCategories.length > 0 && (
                                <div className="mb-4">
                                    <h6 className="mb-3">Active Categories ({enabledCategories.length})</h6>
                                    <ListGroup>
                                        {enabledCategories.map((category) => (
                                            <ListGroup.Item
                                                key={category.id}
                                                className="d-flex justify-content-between align-items-center"
                                            >
                                                <div>
                                                    <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>
                                                        {category.emoji}
                                                    </span>
                                                    <strong>{category.name}</strong>
                                                </div>
                                                <div>
                                                    <Button
                                                        variant="outline-warning"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleToggleCategory(category.id, true)
                                                        }
                                                        className="me-2"
                                                    >
                                                        Disable
                                                    </Button>
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleDeleteCategory(category.id)
                                                        }
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                </div>
                            )}

                            {/* Disabled Categories */}
                            {disabledCategories.length > 0 && (
                                <div>
                                    <h6 className="mb-3">Disabled Categories ({disabledCategories.length})</h6>
                                    <ListGroup>
                                        {disabledCategories.map((category) => (
                                            <ListGroup.Item
                                                key={category.id}
                                                className="d-flex justify-content-between align-items-center"
                                                style={{ opacity: 0.6 }}
                                            >
                                                <div>
                                                    <Lock size={14} className="me-2" />
                                                    <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>
                                                        {category.emoji}
                                                    </span>
                                                    <strong>{category.name}</strong>
                                                    <Badge bg="secondary" className="ms-2">
                                                        Disabled
                                                    </Badge>
                                                </div>
                                                <Button
                                                    variant="outline-success"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleToggleCategory(category.id, false)
                                                    }
                                                >
                                                    Enable
                                                </Button>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                </div>
                            )}
                        </>
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
    type: PropTypes.oneOf(['spend', 'income']),
};

CategoryManagementModal.defaultProps = {
    type: 'spend',
};

export default CategoryManagementModal;
