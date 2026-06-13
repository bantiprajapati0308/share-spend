import React, { useState, useEffect } from 'react';
import { useDailyExpenses } from '../hooks/useDailyExpenses';
import styles from '../styles/TopCategories.module.scss';
import useCategoryContext from '../hooks/useCategoryContext';

const TopCategories = ({ selectedCategory, transactionType, onGoToCategories }) => {
    const { getTopCategories } = useDailyExpenses();
    const { categories, isInitialized } = useCategoryContext();
    const [allCategories, setAllCategories] = useState([]);

    useEffect(() => {
        if (!isInitialized) return;
        const top = getTopCategories[transactionType]
            ?.map(name =>
                categories.find(cat =>
                    cat.type === transactionType && cat.isEnable && cat.name === name
                )
            )
            .filter(Boolean)
            .map(cat => ({
                label: `${cat.emoji} ${cat.name}`,
                value: cat.id,
                categoryName: cat.name,
                emoji: cat.emoji,
                categoryId: cat.id,
            })) || [];

        // Append any enabled categories not already in top list
        const topNames = new Set(top.map(c => c.categoryName));
        const rest = categories
            .filter(cat => cat.type === transactionType && cat.isEnable && !topNames.has(cat.name))
            .map(cat => ({
                label: `${cat.emoji} ${cat.name}`,
                value: cat.id,
                categoryName: cat.name,
                emoji: cat.emoji,
                categoryId: cat.id,
            }));

        setAllCategories([...top, ...rest]);
    }, [getTopCategories, categories, isInitialized, transactionType]);

    return (
        <div className={styles.topCategoriesContainer}>
            {allCategories.map((cat) => (
                <button
                    key={cat.categoryId}
                    type="button"
                    className={styles.categoryCircleBtn}
                    onClick={() => selectedCategory(cat)}
                >
                    <div className={styles.categoryCircle}>{cat.emoji}</div>
                    <span className={styles.categoryName}>{cat.categoryName}</span>
                </button>
            ))}
        </div>
    );
};

export default TopCategories;
