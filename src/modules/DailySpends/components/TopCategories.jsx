
import React, { useState, useEffect } from 'react';
import { useDailyExpenses } from '../hooks/useDailyExpenses';
import styles from '../styles/TopCategories.module.scss';
import useCategoryContext from '../hooks/useCategoryContext';

const TopCategories = ({ selectedCategory, transactionType }) => {
    const { getTopCategories } = useDailyExpenses();
    const { categories, loading, isInitialized } = useCategoryContext();
    const [topCategories, setTopCategories] = useState([]);
    useEffect(() => {
        if (isInitialized) {
            const topFiveCategories = getTopCategories[transactionType]
                ?.map(categoryName =>
                    categories.find(cat =>
                        cat.type === transactionType &&
                        cat.isEnabled &&
                        cat.name === categoryName
                    )
                )
                .filter(Boolean) // Remove undefined values
                .map(cat => ({
                    label: `${cat.emoji} ${cat.name}`,
                    value: cat.id,
                    categoryName: cat.name,
                    emoji: cat.emoji,
                    categoryId: cat.id
                })) || [];
            setTopCategories(topFiveCategories);
        }
    }, [getTopCategories, categories, isInitialized, transactionType]);
    return (
        <div className={styles.topCategoriesContainer}>
            {topCategories.map((cat, index) => {
                if (index < 3)
                    return (
                        <div
                            key={cat.id}
                            className={styles.categoryCard}
                            onClick={() => selectedCategory(cat)}
                        >
                            <div className={styles.categoryEmoji}>{cat.emoji}</div>
                            <div className={styles.categoryName}>{cat.categoryName}</div>
                        </div>
                    );
            })}
        </div>
    );
}

export default TopCategories;