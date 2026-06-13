import styles from './MaintenancePage.module.scss';

function MaintenancePage() {
    return (
        <div className={styles.wrapper}>
            <div className={styles.card}>
                <div className={styles.iconWrap}>
                    <span className={styles.icon}>🔧</span>
                </div>
                <h1 className={styles.title}>We'll be right back</h1>
                <p className={styles.subtitle}>
                    Share &amp; Spend is currently undergoing scheduled maintenance.
                </p>
                <p className={styles.message}>
                    We're working hard to improve your experience. We'll notify you as soon as we're back online.
                </p>
                <div className={styles.divider} />
                <p className={styles.footer}>
                    Thank you for your patience 🙏
                </p>
            </div>
        </div>
    );
}

export default MaintenancePage;
