import { useState } from 'react';
import { Form } from 'react-bootstrap';
import { EnvelopeFill, LockFill, EyeFill, EyeSlashFill } from 'react-bootstrap-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../firebase';
import { authApi } from '../../../services/api/authApi';
import logoImg from '../../../assets/images/logo.png';
import styles from '../styles/LoginForm.module.scss';

const ERROR_MESSAGES = {
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/too-many-requests': 'Too many failed attempts. Try again later.',
};

/**
 * Login form — email / password sign-in.
 * All Firebase calls are made here; App.jsx onAuthStateChanged handles the rest.
 */
export default function LoginForm({ onRegister, onForgotPassword, onError, onLoading }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        onLoading?.(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            await authApi.updateLastLogin().catch(() => {/* non-blocking */ });
            // onAuthStateChanged in App.jsx drives the rest of the login flow
        } catch (err) {
            onError?.(ERROR_MESSAGES[err.code] || 'Login failed. Please try again.');
            setSubmitting(false);
            onLoading?.(false);
        }
    };

    return (
        <div>
            {/* Logo */}
            <div className={styles.logoSection}>
                <div className={styles.logoIconWrapper}>
                    <img src={logoImg} alt="Share Spend" className={styles.logoIcon} />
                </div>
            </div>

            {/* Heading */}
            <div className={styles.headingSection}>
                <h2 className={styles.heading}>Welcome back! 👋</h2>
                <p className={styles.subtitle}>Glad to see you again</p>
            </div>

            <Form onSubmit={handleSubmit} noValidate>
                {/* Email */}
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

                {/* Password */}
                <div className={styles.fieldWrapper}>
                    <span className={styles.fieldIcon}><LockFill size={15} /></span>
                    <Form.Control
                        type={showPwd ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className={`${styles.input} ${styles.inputPassword}`}
                        required
                        autoComplete="current-password"
                    />
                    <button
                        type="button"
                        className={styles.eyeBtn}
                        onClick={() => setShowPwd((v) => !v)}
                        tabIndex={-1}
                        aria-label={showPwd ? 'Hide password' : 'Show password'}
                    >
                        {showPwd ? <EyeSlashFill size={15} /> : <EyeFill size={15} />}
                    </button>
                </div>

                {/* Forgot password */}
                <div className={styles.forgotRow}>
                    <button type="button" className={styles.forgotLink} onClick={onForgotPassword}>
                        Forgot password?
                    </button>
                </div>

                {/* Submit */}
                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                    <LockFill size={14} />
                    {submitting ? 'Logging in…' : 'LOGIN'}
                </button>
            </Form>

            <p className={styles.switchText}>
                Don&apos;t have an account?{' '}
                <button type="button" className={styles.switchLink} onClick={onRegister}>
                    Register
                </button>
            </p>
        </div>
    );
}
