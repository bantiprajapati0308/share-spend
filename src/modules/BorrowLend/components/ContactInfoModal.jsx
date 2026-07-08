import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Envelope, InfoCircle, Lock, Telephone, X } from 'react-bootstrap-icons';
import styles from '../styles/ContactInfoModal.module.scss';

const getLocalMobileNumber = (value = '') => {
    const digits = String(value || '').replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
    return digits.slice(0, 10);
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function ContactInfoModal({
    show,
    person,
    isSaving,
    onCancel,
    onSave,
}) {
    const [mobileNumber, setMobileNumber] = useState('');
    const [email, setEmail] = useState('');
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!show) return;
        setMobileNumber(getLocalMobileNumber(person?.mobileNumber));
        setEmail(person?.email || '');
        setErrors({});
    }, [show, person]);

    const formattedPreview = useMemo(
        () => mobileNumber ? `+91 ${mobileNumber.replace(/(\d{5})(\d{0,5})/, '$1 $2').trim()}` : 'Not added',
        [mobileNumber]
    );

    if (!show) return null;

    const validate = () => {
        const nextErrors = {};
        if (mobileNumber && !/^\d{10}$/.test(mobileNumber)) {
            nextErrors.mobileNumber = 'Enter a valid 10 digit mobile number.';
        }
        if (email.trim() && !isValidEmail(email.trim())) {
            nextErrors.email = 'Enter a valid email address.';
        }
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;
        onSave({
            mobileNumber: mobileNumber.trim(),
            email: email.trim(),
        });
    };

    return (
        <div className={styles.backdrop} role="presentation" onClick={onCancel}>
            <section
                className={styles.sheet}
                role="dialog"
                aria-modal="true"
                aria-labelledby="contact-info-title"
                onClick={(event) => event.stopPropagation()}
            >
                <span className={styles.dragHandle} />

                <header className={styles.header}>
                    <div>
                        <h3 id="contact-info-title">Update Contact Info</h3>
                        <p>{person?.personName || 'Person'}</p>
                    </div>
                    <button type="button" onClick={onCancel} aria-label="Close contact form">
                        <X size={22} />
                    </button>
                </header>

                <div className={styles.infoCard}>
                    <InfoCircle size={20} />
                    <p>Keeping contact information updated helps you send reminders easily.</p>
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="contact-mobile">Mobile Number</label>
                    <div className={`${styles.mobileInput} ${errors.mobileNumber ? styles.inputError : ''}`}>
                        <span>+91</span>
                        <input
                            id="contact-mobile"
                            type="tel"
                            inputMode="numeric"
                            maxLength={10}
                            placeholder="98765 43210"
                            value={mobileNumber}
                            onChange={(event) => {
                                setMobileNumber(event.target.value.replace(/\D/g, '').slice(0, 10));
                                setErrors((current) => ({ ...current, mobileNumber: '' }));
                            }}
                        />
                    </div>
                    {errors.mobileNumber ? (
                        <small className={styles.errorText}>{errors.mobileNumber}</small>
                    ) : (
                        <small>We will use this number to send WhatsApp reminders.</small>
                    )}
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="contact-email">Email Address <span>(Optional)</span></label>
                    <div className={`${styles.emailInput} ${errors.email ? styles.inputError : ''}`}>
                        <Envelope size={17} />
                        <input
                            id="contact-email"
                            type="email"
                            placeholder="pawan@example.com"
                            value={email}
                            onChange={(event) => {
                                setEmail(event.target.value);
                                setErrors((current) => ({ ...current, email: '' }));
                            }}
                        />
                    </div>
                    {errors.email ? (
                        <small className={styles.errorText}>{errors.email}</small>
                    ) : (
                        <small>We will use this email for notifications and important updates.</small>
                    )}
                </div>

                <div className={styles.safeCard}>
                    <Lock size={18} />
                    <span>Your information is safe with us and will never be shared.</span>
                </div>

                <div className={styles.previewCard}>
                    <Telephone size={16} />
                    <span>{formattedPreview}</span>
                </div>

                <div className={styles.actions}>
                    <button type="button" className={styles.saveButton} onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button type="button" className={styles.cancelButton} onClick={onCancel} disabled={isSaving}>
                        Cancel
                    </button>
                </div>
            </section>
        </div>
    );
}

ContactInfoModal.propTypes = {
    show: PropTypes.bool.isRequired,
    person: PropTypes.shape({
        personName: PropTypes.string,
        mobileNumber: PropTypes.string,
        email: PropTypes.string,
    }),
    isSaving: PropTypes.bool,
    onCancel: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
};

ContactInfoModal.defaultProps = {
    person: null,
    isSaving: false,
};

export default ContactInfoModal;
