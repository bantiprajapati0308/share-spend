import React, { useState, useEffect } from 'react';
import { Form, Button, Modal, ListGroup, Badge, Alert, Spinner } from 'react-bootstrap';
import { Trash2, Plus, Lock } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import styles from '../styles/DailySpends.module.scss';
import { useUserCategories } from '../hooks/useUserCategories';

function CategoryManagementModal({ show, onHide }) {
    const {
        fetchCategories,
        addCategory,
        updateCategory,
        disableCategory,
        enableCategory,
        deleteCategory,
        isCategoryUsed,
    } = useUserCategories();

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryEmoji, setNewCategoryEmoji] = useState('📝');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load categories when modal opens
    useEffect(() => {
        if (show) {
            loadCategories();
        }
    }, [show]);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const data = await fetchCategories();
            setCategories(data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
        } catch (error) {
            toast.error('Failed to load categories');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) {
            toast.error('Please enter a category name');
            return;
        }

        try {
            setIsSubmitting(true);
            const newCat = await addCategory(newCategoryName.trim(), newCategoryEmoji);
            setCategories([newCat, ...categories]);
            setNewCategoryName('');
            setNewCategoryEmoji('📝');
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
                // Disabling category
                await disableCategory(categoryId);
                setCategories(
                    categories.map((cat) =>
                        cat.id === categoryId ? { ...cat, isEnabled: false } : cat
                    )
                );
                toast.success('Category disabled');
            } else {
                // Enabling category
                await enableCategory(categoryId);
                setCategories(
                    categories.map((cat) =>
                        cat.id === categoryId ? { ...cat, isEnabled: true } : cat
                    )
                );
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
            setCategories(categories.filter((cat) => cat.id !== categoryId));
            toast.success('Category deleted successfully');
        } catch (error) {
            toast.error(error.message || 'Failed to delete category');
            console.error(error);
        }
    };

    const enabledCategories = categories.filter((cat) => cat.isEnabled);
    const disabledCategories = categories.filter((cat) => !cat.isEnabled);

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

                    {loading ? (
                        <div className="text-center">
                            <Spinner animation="border" size="sm" />
                            <p className="mt-2">Loading categories...</p>
                        </div>
                    ) : categories.length === 0 ? (
                        <Alert variant="info">No categories yet. Create your first one!</Alert>
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
            <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Add New Category</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
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

export default CategoryManagementModal;
