import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from '../styles/TopCategories.module.scss';

/**
 * Popover that renders via a portal (above the anchor) to escape overflow clipping.
 */
function MoreCategoriesPopover({ categories, onSelect, onGoToCategories, onClose, anchorRef }) {
    const ref = useRef(null);
    const [pos, setPos] = useState(null);

    // Calculate position from anchor's bounding rect
    useEffect(() => {
        if (!anchorRef?.current) return;
        const rect = anchorRef.current.getBoundingClientRect();
        setPos({
            top: rect.bottom + 8, // 8px gap below anchor
            right: window.innerWidth - rect.right,
        });
    }, [anchorRef]);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (
                ref.current && !ref.current.contains(e.target) &&
                anchorRef?.current && !anchorRef.current.contains(e.target)
            ) onClose();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose, anchorRef]);

    if (!pos) return null;

    return createPortal(
        <div
            ref={ref}
            className={styles.morePopover}
            style={{ top: pos.top, right: pos.right }}
        >
            <ul className={styles.moreList}>
                {categories.map((cat) => (
                    <li key={cat.categoryId}>
                        <button
                            type="button"
                            className={styles.moreItem}
                            onClick={() => onSelect(cat)}
                        >
                            <span className={styles.moreItemEmoji}>{cat.emoji}</span>
                            <span className={styles.moreItemName}>{cat.categoryName}</span>
                        </button>
                    </li>
                ))}
            </ul>
            {onGoToCategories && (
                <button
                    type="button"
                    className={styles.addCustomBtn}
                    onClick={() => { onGoToCategories(); onClose(); }}
                >
                    <span className={styles.addCustomIcon}>＋</span>
                    Add Custom
                </button>
            )}
        </div>,
        document.body
    );
}

export default MoreCategoriesPopover;
