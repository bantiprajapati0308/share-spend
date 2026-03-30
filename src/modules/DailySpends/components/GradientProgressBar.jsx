import React from 'react';
import styles from '../styles/GradientProgressBar.module.scss';

/**
 * Gradient Progress Bar component
 * Shows progress from green (0%) to red (100%+)
 * For income, colors are reversed (red at low %, green at high %)
 */
function GradientProgressBar({ percentage = 0, height = 'medium', showLabel = true, reverse = false }) {
    // Ensure percentage doesn't exceed 100 for visual display
    const displayPercentage = Math.min(percentage, 100);

    // Determine color based on percentage
    const getColorClass = () => {
        if (reverse) {
            // For income: reversed logic - higher is better
            if (percentage >= 80) return styles.green;
            if (percentage >= 50) return styles.yellow;
            if (percentage < 50) return styles.red;
        } else {
            // For spending: normal logic - lower is better
            if (percentage <= 33) return styles.green;
            if (percentage <= 66) return styles.yellow;
            if (percentage <= 100) return styles.orange;
        }
        return styles.red;
    };

    return (
        <div className={`${styles.progressContainer} ${styles[height]}`}>
            <div className={styles.progressWrapper}>
                <div className={styles.progressBackground}>
                    <div
                        className={`${styles.progressFill} ${getColorClass()}`}
                        style={{
                            width: `${displayPercentage}%`,
                            background: getGradient(percentage, reverse),
                        }}
                    ></div>
                </div>
                {showLabel && (
                    <span className={styles.progressLabel}>
                        {percentage}%
                        {percentage > 100 && <span className={styles.exceeded}> (Over)</span>}
                    </span>
                )}
            </div>

            {percentage > 100 && (
                <div className={styles.warningText}>
                    ⚠️ Limit exceeded by {(percentage - 100).toFixed(0)}%
                </div>
            )}
        </div>
    );
}

/**
 * Generate gradient based on percentage
 */
function getGradient(percentage, reverse = false) {
    if (reverse) {
        // For income: reversed colors - green at high %, red at low %
        if (percentage >= 80) {
            // Green
            return 'linear-gradient(90deg, #10b981 0%, #6ee7b7 100%)';
        } else if (percentage >= 50) {
            // Yellow to Orange
            return 'linear-gradient(90deg, #fbbf24 0%, #fb923c 100%)';
        } else {
            // Orange to Red
            return 'linear-gradient(90deg, #fb923c 0%, #f87171 100%)';
        }
    } else {
        // For spending: normal colors - green at low %, red at high %
        if (percentage <= 33) {
            // Green
            return 'linear-gradient(90deg, #10b981 0%, #6ee7b7 100%)';
        } else if (percentage <= 66) {
            // Yellow to Orange
            return 'linear-gradient(90deg, #fbbf24 0%, #fb923c 100%)';
        } else if (percentage <= 100) {
            // Orange to Red
            return 'linear-gradient(90deg, #fb923c 0%, #f87171 100%)';
        } else {
            // Dark Red
            return 'linear-gradient(90deg, #dc2626 0%, #991b1b 100%)';
        }
    }
}

export default GradientProgressBar;
