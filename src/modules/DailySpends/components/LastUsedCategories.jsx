import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import useCategoryContext from '../hooks/useCategoryContext';
import styles from '../styles/LastUsedCategories.module.scss';

function LastUsedCategories({ onCategorySelect, transactionType, lastUsedCategories }) {
    const { categories, isInitialized } = useCategoryContext();
    const [recentCategories, setRecentCategories] = useState([]);

    useEffect(() => {
        if (!isInitialized) {
            return;
        }

        const mappedRecentCategories = lastUsedCategories[transactionType]
            ?.map((categoryName) =>
                categories.find((category) =>
                    category.type === transactionType &&
                    category.isEnabled &&
                    category.name === categoryName
                )
            )
            .filter(Boolean)
            .map((category) => ({
                label: `${category.emoji} ${category.name}`,
                value: category.id,
                categoryName: category.name,
                emoji: category.emoji,
                categoryId: category.id,
            })) || [];

        setRecentCategories(mappedRecentCategories);
    }, [categories, isInitialized, lastUsedCategories, transactionType]);

    return (
        <div className={styles.lastUsedCategoriesContainer}>
            {recentCategories.map((category) => (
                <div
                    key={category.categoryId}
                    className={styles.categoryCard}
                    onClick={() => onCategorySelect(category)}
                >
                    <div className={styles.categoryEmoji}>{category.emoji}</div>
                    <div className={styles.categoryName}>{category.categoryName}</div>
                </div>
            ))}
        </div>
    );
}

LastUsedCategories.propTypes = {
    onCategorySelect: PropTypes.func.isRequired,
    transactionType: PropTypes.string.isRequired,
    lastUsedCategories: PropTypes.shape({
        spend: PropTypes.arrayOf(PropTypes.string),
        income: PropTypes.arrayOf(PropTypes.string),
    }).isRequired,
};

export default LastUsedCategories;