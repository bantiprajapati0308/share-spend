import React from 'react';
import { Trash3 } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import styles from '../styles/DailySpends.module.scss';

function CategoryDisplay({ allCategories, customCategories, predefinedCategories, onDeleteCategory }) {
    const handleDeleteCategory = (categoryValue) => {
        if (window.confirm(`Are you sure you want to delete "${categoryValue}"?`)) {
            const result = onDeleteCategory(categoryValue);
            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error(result.error);
            }
        }
    };

    return (
        <div className={styles.categoriesDisplay}>
            <h5 className={styles.sectionTitle}>All Categories ({allCategories.length})</h5>

            {/* Predefined Categories */}
            <div className={styles.categoriesSection}>
                <h6 className={styles.categoryGroupTitle}>Default Categories</h6>
                <div className={styles.categoryTagsContainer}>
                    {predefinedCategories.map((cat) => (
                        <div key={cat.value} className={styles.categoryTagModal}>
                            <span className={styles.categoryEmoji}>{cat.emoji}</span>
                            <span className={styles.categoryLabelTag}>{cat.label}</span>
                            <span className={styles.builtinBadge}>Built-in</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Custom Categories */}
            {customCategories.length > 0 && (
                <div className={styles.categoriesSection}>
                    <h6 className={styles.categoryGroupTitle}>Custom Categories ({customCategories.length})</h6>
                    <div className={styles.categoryTagsContainer}>
                        {customCategories.map((cat) => (
                            <div key={cat.value} className={styles.categoryTagModal + ' ' + styles.customCategoryTag}>
                                <span className={styles.categoryEmoji}>{cat.emoji}</span>
                                <span className={styles.categoryLabelTag}>{cat.label}</span>
                                <button
                                    type="button"
                                    className={styles.deleteTagBtn}
                                    onClick={() => handleDeleteCategory(cat.value)}
                                    title="Delete category"
                                >
                                    <Trash3 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {customCategories.length === 0 && (
                <div className={styles.noCustomCategories}>
                    <p>No custom categories yet. Create one to get started!</p>
                </div>
            )}
        </div>
    );
}

export default CategoryDisplay;
