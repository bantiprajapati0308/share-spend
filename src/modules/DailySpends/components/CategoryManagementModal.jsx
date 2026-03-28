import React from 'react';
import { Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import styles from '../styles/DailySpends.module.scss';
import CategoryForm from './CategoryForm';
import CategoryDisplay from './CategoryDisplay';

function CategoryManagementModal({ show, onClose, useCategories: hook, onCategoryAdded }) {
    const {
        addCategory,
        deleteCategory,
        customCategories,
        predefinedCategories,
        allCategories
    } = hook();

    const handleAddCategory = (categoryName, emoji) => {
        const result = addCategory(categoryName, emoji);

        if (result.success) {
            toast.success(result.message);
            onCategoryAdded?.();
        } else {
            toast.error(result.error);
        }
    };

    const handleDeleteCategory = (categoryValue) => {
        return deleteCategory(categoryValue);
    };

    return (
        <Modal show={show} onHide={onClose} size="lg" centered className={styles.categoryModal}>
            <Modal.Header closeButton className={styles.modalHeader}>
                <Modal.Title>Manage Categories</Modal.Title>
            </Modal.Header>

            <Modal.Body className={styles.modalBody}>
                {/* Category Form Component */}
                <CategoryForm onCategoryAdded={handleAddCategory} />

                {/* Category Display Component */}
                <CategoryDisplay
                    allCategories={allCategories}
                    customCategories={customCategories}
                    predefinedCategories={predefinedCategories}
                    onDeleteCategory={handleDeleteCategory}
                />
            </Modal.Body>
        </Modal>
    );
}

export default CategoryManagementModal;
