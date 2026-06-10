import { Headset } from 'react-bootstrap-icons';
import styles from '../styles/HelpCenter.module.scss';

function HelpBanner() {
    return (
        <div className={styles.banner}>
            <div className={styles.bannerText}>
                <h2 className={styles.bannerTitle}>How can we help you?</h2>
                <p className={styles.bannerSubtitle}>We're here to support you anytime you need.</p>
            </div>
            <div className={styles.bannerIllustration}>
                <div className={styles.illustrationCircle}>
                    <Headset color='white' size={32} />
                </div>
                <div className={styles.illustrationDot1} />
                <div className={styles.illustrationDot2} />
                <div className={styles.illustrationDot3} />
            </div>
        </div>
    );
}

export default HelpBanner;
