import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Form, Modal, Button, Spinner, Alert, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Trash3, Lock } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import useCategoryContext from '../hooks/useCategoryContext';
import { useUserCategories } from '../hooks/useUserCategories';
import TransactionTypeSelector from './common/TransactionTypeSelector';
import { NON_DELETABLE_CATEGORIES } from '../../../utils/predefinedCategories';
import styles from '../styles/CategoryManager.module.scss';

const SYSTEM_CATEGORY_TOOLTIPS = {
    Lent: 'Records money lent to someone. Required for Borrow/Lend.',
    Borrowed: 'Records money borrowed from someone. Required for Borrow/Lend.',
    Repayment: 'Records when someone repays you. Required for Borrow/Lend.',
    'Borrowed Pay': 'Records when you repay borrowed money. Required for Borrow/Lend.',
};

const getSystemTooltip = (name) =>
    SYSTEM_CATEGORY_TOOLTIPS[name] ?? 'System category required for Borrow/Lend — cannot be deleted.';

function CategoryManager({ onCategoriesChanged }) {
    const {
        categories,
        loading,
        addNewCategory,
        updateCategoryInState,
        removeCategoryFromState,
    } = useCategoryContext();

    const { disableCategory, enableCategory, deleteCategory } = useUserCategories();

    const [activeType, setActiveType] = useState('spend');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryEmoji, setNewCategoryEmoji] = useState('📝');
    const [newCategoryType, setNewCategoryType] = useState('spend');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const spendCount = useMemo(
        () => categories.filter((c) => c.type === 'spend').length,
        [categories]
    );
    const incomeCount = useMemo(
        () => categories.filter((c) => c.type === 'income').length,
        [categories]
    );

    const filteredCategories = useMemo(() => {
        return [...categories.filter((c) => c.type === activeType)].sort((a, b) => {
            if (a.isEnabled === b.isEnabled) return 0;
            return a.isEnabled ? -1 : 1;
        });
    }, [categories, activeType]);

    const activeCategories = useMemo(
        () => filteredCategories.filter((c) => c.isEnabled),
        [filteredCategories]
    );
    const hiddenCategories = useMemo(
        () => filteredCategories.filter((c) => !c.isEnabled),
        [filteredCategories]
    );

    const openAddModal = () => {
        setNewCategoryType(activeType);
        setNewCategoryName('');
        setNewCategoryEmoji('📝');
        setShowAddModal(true);
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) {
            toast.error('Please enter a category name');
            return;
        }
        try {
            setIsSubmitting(true);
            await addNewCategory(newCategoryName.trim(), newCategoryEmoji, newCategoryType);
            if (onCategoriesChanged) await onCategoriesChanged();
            setShowAddModal(false);
            toast.success('Category added successfully');
        } catch (error) {
            toast.error(error.message || 'Failed to add category');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleCategory = async (category) => {
        try {
            if (category.isEnabled) {
                await disableCategory(category.id);
                updateCategoryInState(category.id, { isEnabled: false });
                toast.success('Category hidden');
            } else {
                await enableCategory(category.id);
                updateCategoryInState(category.id, { isEnabled: true });
                toast.success('Category shown');
            }
            if (onCategoriesChanged) await onCategoriesChanged();
        } catch {
            toast.error('Failed to update category');
        }
    };

    const handleDeleteCategory = async (category) => {
        if (NON_DELETABLE_CATEGORIES.includes(category.name)) {
            toast.error('This category cannot be deleted.');
            return;
        }
        if (!window.confirm(`Delete "${category.name}"?`)) return;
        try {
            await deleteCategory(category.id);
            removeCategoryFromState(category.id);
            if (onCategoriesChanged) await onCategoriesChanged();
            toast.success('Category deleted');
        } catch (error) {
            toast.error(error.message || 'Failed to delete category');
        }
    };

    const renderCategoryRow = (category) => {
        const isSystem = NON_DELETABLE_CATEGORIES.includes(category.name);
        return (
            <div
                key={category.id}
                className={`${styles.categoryRow} ${!category.isEnabled ? styles.categoryRowHidden : ''}`}
            >
                <span className={styles.categoryDragHandle} aria-hidden="true">⠿</span>
                <span className={styles.categoryRowEmoji}>{category.emoji}</span>
                <span className={styles.categoryRowName}>{category.name}</span>
                <Form.Check
                    type="switch"
                    id={`cat-switch-${category.id}`}
                    checked={category.isEnabled}
                    onChange={() => handleToggleCategory(category)}
                    className="ms-auto flex-shrink-0"
                />
                <button
                    type="button"
                    className={styles.categoryDeleteBtn}
                    disabled={isSystem}
                    title={isSystem ? getSystemTooltip(category.name) : 'Delete category'}
                    onClick={() => handleDeleteCategory(category)}
                >
                    {isSystem ? <Lock size={13} /> : <Trash3 size={13} />}
                </button>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="text-center py-4">
                <Spinner animation="border" size="sm" />
                <p className="mt-2 text-muted small">Loading categories…</p>
            </div>
        );
    }

    return (
        <div className={styles.categoryManager}>
            {/* Type Toggle */}
            <div className={styles.categoryTypeToggle}>
                <button
                    type="button"
                    className={`${styles.categoryTypeBtn} ${activeType === 'spend' ? styles.categoryTypeBtnActive : ''}`}
                    onClick={() => setActiveType('spend')}
                >
                    💰 Spending ({spendCount})
                </button>
                <button
                    type="button"
                    className={`${styles.categoryTypeBtn} ${activeType === 'income' ? styles.categoryTypeIncomeBtnActive : ''}`}
                    onClick={() => setActiveType('income')}
                >
                    🎯 Income ({incomeCount})
                </button>
            </div>


            {/* Active Categories */}
            {activeCategories.length > 0 && (
                <div className={styles.categorySection}>
                    <div className={styles.categoriesHeader}>
                        <p className={styles.categorySectionLabel}>
                            ACTIVE CATEGORIES ({activeCategories.length})
                            <OverlayTrigger
                                placement="top"
                                overlay={
                                    <Tooltip id="category-hint-tooltip">
                                        Use the toggle to show / hide categories in the Add Expense screen
                                    </Tooltip>
                                }
                            >
                                <i className={`bi bi-info-circle ${styles.categoryInfoIcon}`} />
                            </OverlayTrigger>
                        </p>
                        <button type="button" className={styles.addCategoryLink} onClick={openAddModal}>
                            <i className="bi bi-plus-circle" /> Add New
                        </button>
                    </div>
                    <div className={styles.categoriesList}>
                        {activeCategories.map(renderCategoryRow)}
                    </div>
                </div>
            )}

            {/* Hidden Categories */}
            {hiddenCategories.length > 0 && (
                <div className={styles.categorySection}>
                    <p className={styles.categorySectionLabel}>
                        HIDDEN CATEGORIES ({hiddenCategories.length})
                    </p>
                    {hiddenCategories.map(renderCategoryRow)}
                </div>
            )}

            {filteredCategories.length === 0 && (
                <Alert variant="info" className="text-center">
                    No {activeType === 'spend' ? 'spending' : 'income'} categories yet. Add your first one!
                </Alert>
            )}


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
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddCategory(); }}
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Emoji (optional)</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="🍔"
                            value={newCategoryEmoji}
                            onChange={(e) => setNewCategoryEmoji(e.target.value.substring(0, 2))}
                            maxLength="2"
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleAddCategory}
                        disabled={isSubmitting || !newCategoryName.trim()}
                    >
                        {isSubmitting ? 'Adding…' : 'Add Category'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

CategoryManager.propTypes = {
    onCategoriesChanged: PropTypes.func,
};

export default CategoryManager;
