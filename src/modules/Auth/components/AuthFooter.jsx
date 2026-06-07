import { LockFill, LightningChargeFill } from 'react-bootstrap-icons';
import shieldImg from '../../../assets/images/shield.png';
import styles from '../styles/AuthFooter.module.scss';

/**
 * Auth page footer — security badges + legal/trust text.
 * showTerms=true → "Terms & Privacy Policy" (used on register)
 * showTerms=false → "Your data is 100% secure with us" (used on login)
 */
export default function AuthFooter({ showTerms = false }) {
    return (
        <div className={styles.footer}>
            <div className={styles.badges}>
                <span className={styles.badge}><img src={shieldImg} alt="" aria-hidden="true" width={12} height={12} style={{ objectFit: 'contain' }} /> Secure</span>
                <span className={styles.badge}><LockFill size={12} /> Private</span>
                <span className={styles.badge}><LightningChargeFill size={12} /> Fast</span>
            </div>

            {showTerms ? (
                <p className={styles.terms}>
                    By continuing, you agree to our{' '}
                    <a href="#" className={styles.termsLink} onClick={(e) => e.preventDefault()}>
                        Terms &amp; Privacy Policy
                    </a>
                </p>
            ) : (
                <p className={styles.secureText}>🔒 Your data is 100% secure with us</p>
            )}
        </div>
    );
}
