import { LockFill, ShieldCheck } from 'react-bootstrap-icons';
import styles from './AIUnlockCard.module.scss';

const UPI_ID = '8269248099@ybl';
const PAYMENT_LINK = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&am=19&cu=INR&tn=${encodeURIComponent('Unlock AI features')}`;

function AIUnlockCard() {
    return (
        <section className={styles.card} aria-label="Unlock AI features">
            <div className={styles.icon}><LockFill size={17} /></div>
            <div className={styles.content}>
                <div className={styles.titleRow}>
                    <h3>Unlock AI features</h3>
                    <span className={styles.price}>₹19</span>
                </div>
                <p>Pay ₹19 using PhonePe or another UPI app. Access is enabled after payment verification.</p>
                <div className={styles.payee}>
                    <span>UPI ID</span>
                    <strong>{UPI_ID}</strong>
                </div>
                <a className={styles.buyButton} href={PAYMENT_LINK}>
                    <ShieldCheck size={16} />
                    Pay ₹19 with UPI
                </a>
                <small className={styles.note}>After paying, contact the app owner with your account email to activate AI.</small>
            </div>
        </section>
    );
}

export default AIUnlockCard;
