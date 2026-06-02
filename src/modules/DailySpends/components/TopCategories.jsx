import React, { useState, useEffect, useRef } from 'react';
import { useDailyExpenses } from '../hooks/useDailyExpenses';
import styles from '../styles/TopCategories.module.scss';
import useCategoryContext from '../hooks/useCategoryContext';
import MoreCategoriesPopover from './MoreCategoriesPopover';

const VISIBLE_COUNT = 5;

const TopCategories = ({ selectedCategory, transactionType, onGoToCategories }) => {
    const { getTopCategories } = useDailyExpenses();
    const { categories, isInitialized } = useCategoryContext();
    const [allCategories, setAllCategories] = useState([]);
    const [showMore, setShowMore] = useState(false);
    const moreRef = useRef(null);

    useEffect(() => {
        if (!isInitialized) return;
        const top = getTopCategories[transactionType]
            ?.map(name =>
                categories.find(cat =>
                    cat.type === transactionType && cat.isEnabled && cat.name === name
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
            .filter(cat => cat.type === transactionType && cat.isEnabled && !topNames.has(cat.name))
            .map(cat => ({
                label: `${cat.emoji} ${cat.name}`,
                value: cat.id,
                categoryName: cat.name,
                emoji: cat.emoji,
                categoryId: cat.id,
            }));

        setAllCategories([...top, ...rest]);
    }, [getTopCategories, categories, isInitialized, transactionType]);

    const visible = allCategories.slice(0, VISIBLE_COUNT);
    const overflow = allCategories.slice(VISIBLE_COUNT);

    return (
        <div className={styles.topCategoriesContainer}>
            {visible.map((cat) => (
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

            {overflow.length > 0 && (
                <div ref={moreRef} className={styles.moreWrapper}>
                    <button
                        type="button"
                        className={styles.categoryCircleBtn}
                        onClick={() => setShowMore(v => !v)}
                    >
                        <div className={`${styles.categoryCircle} ${styles.moreCircle}`}>···</div>
                        <span className={styles.categoryName}>More</span>
                    </button>
                    {showMore && (
                        <MoreCategoriesPopover
                            categories={overflow}
                            onSelect={(cat) => { selectedCategory(cat); setShowMore(false); }}
                            onGoToCategories={onGoToCategories}
                            onClose={() => setShowMore(false)}
                            anchorRef={moreRef}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default TopCategories;
