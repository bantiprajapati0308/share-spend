import { useState } from 'react';
import { Form } from 'react-bootstrap';
import { EnvelopeFill, ArrowLeft, KeyFill } from 'react-bootstrap-icons';
import { authApi } from '../../../services/api/authApi';
import logoImg from '../../../assets/images/logo.png';
import styles from '../styles/ForgotPassword.module.scss';

/**
 * Forgot password form.
 * Calls POST /api/auth/forgot-password on the server, which proxies to Firebase REST API.
 * Always shows success (prevents email enumeration).
 */
export default function ForgotPasswordForm({ onBack }) {
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            await authApi.forgotPassword(email);
            setSent(true);
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (sent) {
        return (
            <div className={styles.sentView}>
                <div className={styles.sentIcon}>✉️</div>
                <h3 className={styles.sentHeading}>Check your inbox</h3>
                <p className={styles.sentText}>
                    If <strong>{email}</strong> has an account, a password reset link was sent.
                    Check your spam folder if you don&apos;t see it.
                </p>
                <button type="button" className={styles.backBtn} onClick={onBack}>
                    <ArrowLeft size={14} /> Back to Login
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* Logo */}
            <div className={styles.logoSection}>
                <div className={styles.logoIconWrapper}>
                    <img src={logoImg} alt="Share Spend" className={styles.logoIcon} />
                </div>
            </div>

            <div className={styles.headingSection}>
                <h2 className={styles.heading}>Forgot Password? 🔑</h2>
                <p className={styles.subtitle}>Enter your email to receive a reset link</p>
            </div>

            {error && <div className={styles.errorBox}>{error}</div>}

            <Form onSubmit={handleSubmit} noValidate>
                <div className={styles.fieldWrapper}>
                    <span className={styles.fieldIcon}><EnvelopeFill size={15} /></span>
                    <Form.Control
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className={styles.input}
                        required
                        autoComplete="email"
                    />
                </div>

                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                    <KeyFill size={14} />
                    {submitting ? 'Sending…' : 'SEND RESET LINK'}
                </button>
            </Form>

            <div className={styles.switchText}>
                <button type="button" className={styles.backLink} onClick={onBack}>
                    <ArrowLeft size={12} /> Back to Login
                </button>
            </div>
        </div>
    );
}
