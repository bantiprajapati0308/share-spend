import { useState } from 'react';
import { Form, Row, Col } from 'react-bootstrap';
import {
    EnvelopeFill, LockFill, EyeFill, EyeSlashFill,
    PersonFill, TelephoneFill,
} from 'react-bootstrap-icons';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../firebase';
import { authApi } from '../../../services/api/authApi';
import DatePickerInput from '../../../utils/DatePickerInput';
import logoImg from '../../../assets/images/logo.png';
import shieldImg from '../../../assets/images/shield.png';
import styles from '../styles/RegisterForm.module.scss';

const maxDob = new Date();
maxDob.setFullYear(maxDob.getFullYear() - 10);
const MAX_DOB = maxDob.toISOString().split('T')[0];

const ERROR_MESSAGES = {
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password must be at least 6 characters.',
};

/** Inline shield SVG — matches the 3D shield icon from the design */
function ShieldIcon() {
    return <img src={shieldImg} alt="" aria-hidden="true" style={{ width: 34, height: 34, objectFit: 'contain' }} />;
}

/**
 * Registration form — email / password sign-up.
 * After Firebase creates the account:
 *   1. authApi.register saves profile details to Firestore.
 *   2. authApi.sendVerification triggers the Firebase verification email.
 * App.jsx onAuthStateChanged handles profile seeding + navigation.
 */
export default function RegisterForm({ onLogin, onError, onLoading }) {
    const [form, setForm] = useState({
        firstName: '', lastName: '', dateOfBirth: '', mobile: '', email: '', password: '',
    });
    const [showPwd, setShowPwd] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const setField = (key) => (val) =>
        setForm((f) => ({ ...f, [key]: typeof val === 'string' ? val : val.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.dateOfBirth) { onError?.('Date of Birth is required.'); return; }
        setSubmitting(true);
        onLoading?.(true);
        try {
            await createUserWithEmailAndPassword(auth, form.email, form.password);
            // Both calls are non-blocking from the user's perspective —
            // App.jsx will show the FullScreenLoader while ensureUserProfile seeds categories.
            await Promise.allSettled([
                authApi.register({
                    email: form.email,
                    firstName: form.firstName,
                    lastName: form.lastName,
                    dateOfBirth: form.dateOfBirth || null,
                    mobile: form.mobile,
                    authProvider: 'email',
                }),
                authApi.sendVerification(),
            ]);
        } catch (err) {
            onError?.(ERROR_MESSAGES[err.code] || 'Registration failed. Please try again.');
            setSubmitting(false);
            onLoading?.(false);
        }
    };

    return (
        <div>
            {/* Brand icons */}
            <div className={styles.brandIconsRow}>
                <div className={styles.brandIcon}>
                    <img src={logoImg} alt="Share Spend logo" className={styles.brandLogoImg} />
                </div>
                <div className={`${styles.brandIcon} ${styles.brandIconShield}`}>
                    <ShieldIcon />
                </div>
            </div>

            <div className={styles.brandRow}>
                <h3 className={styles.brandName}>Share Spend</h3>
                <p className={styles.brandTagline}>Track · Split · Save</p>
            </div>

            <div className={styles.headingSection}>
                <h2 className={styles.heading}>Create Account</h2>
                <p className={styles.subtitle}>Let&apos;s get started! 👋</p>
            </div>

            <Form onSubmit={handleSubmit} noValidate>
                {/* Name row */}
                <Row className="g-2 mb-2">
                    <Col xs={6}>
                        <div className={styles.fieldWrapper}>
                            <span className={styles.fieldIcon}><PersonFill size={13} /></span>
                            <Form.Control
                                type="text"
                                value={form.firstName}
                                onChange={setField('firstName')}
                                placeholder="First name"
                                className={styles.input}
                                required
                            />
                        </div>
                    </Col>
                    <Col xs={6}>
                        <div className={styles.fieldWrapper}>
                            <span className={styles.fieldIcon}><PersonFill size={13} /></span>
                            <Form.Control
                                type="text"
                                value={form.lastName}
                                onChange={setField('lastName')}
                                placeholder="Last name"
                                className={styles.input}
                                required
                            />
                        </div>
                    </Col>
                </Row>

                {/* DOB + Mobile row */}
                <Row className="g-2 mb-2">
                    <Col xs={6}>
                        <div className={styles.dateWrapper}>
                            <DatePickerInput
                                label=""
                                value={form.dateOfBirth}
                                onChange={setField('dateOfBirth')}
                                maxDate={MAX_DOB}
                                placeholder="DD/MM/YYYY"
                            />
                        </div>
                    </Col>
                    <Col xs={6}>
                        <div className={styles.fieldWrapper}>
                            <span className={styles.fieldIcon}><TelephoneFill size={13} /></span>
                            <Form.Control
                                type="tel"
                                value={form.mobile}
                                onChange={setField('mobile')}
                                placeholder="Enter mobile"
                                className={styles.input}
                                required
                            />
                        </div>
                    </Col>
                </Row>

                {/* Email */}
                <div className={`${styles.fieldWrapper} mb-2`}>
                    <span className={styles.fieldIcon}><EnvelopeFill size={13} /></span>
                    <Form.Control
                        type="email"
                        value={form.email}
                        onChange={setField('email')}
                        placeholder="Enter your email"
                        className={styles.input}
                        required
                        autoComplete="email"
                    />
                </div>

                {/* Password */}
                <div className={styles.fieldWrapper}>
                    <span className={styles.fieldIcon}><LockFill size={13} /></span>
                    <Form.Control
                        type={showPwd ? 'text' : 'password'}
                        value={form.password}
                        onChange={setField('password')}
                        placeholder="Create password"
                        className={`${styles.input} ${styles.inputPassword}`}
                        required
                        minLength={8}
                        autoComplete="new-password"
                    />
                    <button
                        type="button"
                        className={styles.eyeBtn}
                        onClick={() => setShowPwd((v) => !v)}
                        tabIndex={-1}
                        aria-label={showPwd ? 'Hide password' : 'Show password'}
                    >
                        {showPwd ? <EyeSlashFill size={13} /> : <EyeFill size={13} />}
                    </button>
                </div>
                <p className={styles.passwordHint}>Use 8+ characters with letters &amp; numbers</p>

                {/* Email verification notice */}
                <div className={styles.verificationNotice}>
                    <img src={shieldImg} alt="" aria-hidden="true" className={styles.verificationIcon} width={20} height={20} style={{ objectFit: 'contain', flexShrink: 0 }} />
                    <div>
                        <p className={styles.verificationTitle}>Email verification</p>
                        <p className={styles.verificationText}>
                            You&apos;ll receive a verification link to your email after signup
                        </p>
                    </div>
                </div>

                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                    <PersonFill size={14} />
                    {submitting ? 'Creating account…' : 'REGISTER'}
                </button>
            </Form>

            <p className={styles.switchText}>
                Already have an account?{' '}
                <button type="button" className={styles.switchLink} onClick={onLogin}>
                    Login →
                </button>
            </p>
        </div>
    );
}
