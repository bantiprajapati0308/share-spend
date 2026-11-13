import styles from '../styles/DualSummaryCards.module.scss';

function DualSummaryCardsSkeleton() {
    return (
        <div className={styles.wrapper} aria-label="Loading spending summary" aria-busy="true">
            <div className={`${styles.card} ${styles.cardSaving} ${styles.skeletonCard}`}>
                <div className={styles.topRow} aria-hidden="true">
                    <span className={`${styles.skeletonBlock} ${styles.skeletonBadge}`} />
                    <span className={`${styles.skeletonBlock} ${styles.skeletonIllustration}`} />
                </div>
                <div className={styles.mainRow} aria-hidden="true">
                    <div className={styles.mainLeft}>
                        <span className={`${styles.skeletonBlock} ${styles.skeletonAmount}`} />
                        <span className={`${styles.skeletonBlock} ${styles.skeletonLabel}`} />
                        <span className={`${styles.skeletonBlock} ${styles.skeletonSubBadge}`} />
                    </div>
                    <span className={`${styles.skeletonBlock} ${styles.skeletonRing}`} />
                </div>
                <div className={styles.miniCards} aria-hidden="true">
                    {[0, 1].map((item) => (
                        <div className={`${styles.miniCard} ${styles.skeletonMiniCard}`} key={item}>
                            <span className={`${styles.skeletonBlock} ${styles.skeletonMiniIcon}`} />
                            <span className={styles.skeletonMiniText}>
                                <span className={`${styles.skeletonBlock} ${styles.skeletonMiniLabel}`} />
                                <span className={`${styles.skeletonBlock} ${styles.skeletonMiniAmount}`} />
                            </span>
                        </div>
                    ))}
                </div>
                <div className={styles.progressSection} aria-hidden="true">
                    <div className={styles.progressLabels}>
                        <span className={`${styles.skeletonBlock} ${styles.skeletonProgressLabel}`} />
                        <span className={`${styles.skeletonBlock} ${styles.skeletonProgressLabel}`} />
                    </div>
                    <span className={`${styles.skeletonBlock} ${styles.skeletonProgressTrack}`} />
                    <span className={`${styles.skeletonBlock} ${styles.skeletonProgressStatus}`} />
                </div>
            </div>
            <span className="visually-hidden" role="status">Loading spending summary...</span>
        </div>
    );
}

export default DualSummaryCardsSkeleton;
