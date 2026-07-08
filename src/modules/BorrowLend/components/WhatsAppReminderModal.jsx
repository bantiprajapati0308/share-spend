import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';
import { Check2Circle, ClipboardCheck, PersonCheck, Search, Whatsapp } from 'react-bootstrap-icons';
import { toast } from 'react-toastify';
import styles from '../styles/WhatsAppReminderModal.module.scss';

const copyToClipboard = async (text) => {
    if (!text) throw new Error('Reminder message is empty.');

    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);

    if (!copied) throw new Error('Clipboard copy failed.');
};

function WhatsAppReminderModal({
    show,
    mode,
    person,
    message,
    mobileNumber,
    isOpening,
    error,
    onCancel,
    onOpenWhatsApp,
}) {
    const [copyState, setCopyState] = useState('idle');
    const [localError, setLocalError] = useState('');

    const handleCopy = useCallback(async (showToast = true) => {
        try {
            setCopyState('copying');
            setLocalError('');
            await copyToClipboard(message);
            setCopyState('success');
            if (showToast) toast.success('Reminder message copied successfully.');
        } catch (copyError) {
            console.error('Reminder copy failed:', copyError);
            setCopyState('failed');
            setLocalError('Unable to copy reminder. Please tap Copy Again.');
            if (showToast) toast.error('Unable to copy reminder. Please tap Copy Again.');
        }
    }, [message]);

    useEffect(() => {
        if (!show || mode !== 'manual') return;
        handleCopy(true);
    }, [show, mode, handleCopy]);

    const copied = copyState === 'success';
    const displayError = localError || error;

    if (mode === 'confirm') {
        return (
            <Modal show={show} onHide={onCancel} centered contentClassName={styles.modalContent}>
                <Modal.Body className={styles.modalBody}>
                    <div className={styles.header}>
                        <div className={styles.successIcon}>
                            <PersonCheck size={27} />
                        </div>
                        <div>
                            <h3>Send WhatsApp Message?</h3>
                            <p>Transaction saved successfully.</p>
                        </div>
                    </div>

                    <section className={styles.confirmPanel}>
                        <strong>Would you like to send this WhatsApp message to {person?.personName || 'this contact'}?</strong>
                        <span>{mobileNumber || 'Saved mobile number'}</span>
                    </section>

                    {displayError && <div className={styles.errorBox}>{displayError}</div>}

                    <div className={styles.actions}>
                        <button
                            type="button"
                            className={styles.primaryButton}
                            onClick={onOpenWhatsApp}
                            disabled={isOpening}
                        >
                            <Whatsapp size={18} />
                            {isOpening ? 'Opening...' : 'Send on WhatsApp'}
                        </button>
                        <button type="button" className={styles.cancelButton} onClick={onCancel}>
                            Not now
                        </button>
                    </div>
                </Modal.Body>
            </Modal>
        );
    }

    return (
        <Modal show={show} onHide={onCancel} centered contentClassName={styles.modalContent}>
            <Modal.Body className={styles.modalBody}>
                <div className={styles.header}>
                    <div className={`${styles.successIcon} ${copied ? styles.successIconDone : ''}`}>
                        <Check2Circle size={28} />
                    </div>
                    <div>
                        <h3>Send WhatsApp Reminder</h3>
                        <p>{person?.personName || 'Contact'} does not have a saved mobile number.</p>
                    </div>
                </div>

                <section className={styles.successPanel}>
                    <span className={styles.copyBadge}>
                        <ClipboardCheck size={17} />
                    </span>
                    <div>
                        <strong>
                            {copied ? 'Reminder message copied successfully.' : 'Copying reminder message...'}
                        </strong>
                        <p>You can paste it into WhatsApp after opening the contact manually.</p>
                    </div>
                </section>

                <section className={styles.stepsCard}>
                    <h4>Follow these simple steps</h4>

                    <div className={styles.stepItem}>
                        <span className={styles.stepNumber}>1</span>
                        <div>
                            <strong>Your reminder message has already been copied.</strong>
                            <small className={copied ? styles.completed : ''}>
                                {copied ? 'Completed' : 'Waiting for clipboard permission'}
                            </small>
                        </div>
                    </div>

                    <div className={styles.stepItem}>
                        <span className={styles.stepNumber}>2</span>
                        <div>
                            <strong>Tap Open WhatsApp.</strong>
                            <small>WhatsApp will open without selecting a chat.</small>
                        </div>
                    </div>

                    <div className={styles.stepItem}>
                        <span className={styles.stepNumber}>3</span>
                        <div>
                            <strong>Search the contact manually.</strong>
                            <small>Example: Rahul, Aman, Neha</small>
                        </div>
                    </div>

                    <div className={styles.stepItem}>
                        <span className={styles.stepNumber}>4</span>
                        <div>
                            <strong>Open chat, long press, paste, then send.</strong>
                            <small>Your reminder text is ready.</small>
                        </div>
                    </div>
                </section>

                {displayError && <div className={styles.errorBox}>{displayError}</div>}

                <div className={styles.actions}>
                    <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={onOpenWhatsApp}
                        disabled={isOpening}
                    >
                        <Whatsapp size={18} />
                        {isOpening ? 'Opening...' : 'Open WhatsApp'}
                    </button>
                    <button type="button" className={styles.secondaryButton} onClick={() => handleCopy(true)}>
                        <Search size={16} />
                        Copy Again
                    </button>
                    <button type="button" className={styles.cancelButton} onClick={onCancel}>
                        Cancel
                    </button>
                </div>
            </Modal.Body>
        </Modal>
    );
}

WhatsAppReminderModal.propTypes = {
    show: PropTypes.bool.isRequired,
    mode: PropTypes.oneOf(['manual', 'confirm']),
    person: PropTypes.shape({
        personName: PropTypes.string,
    }),
    message: PropTypes.string,
    mobileNumber: PropTypes.string,
    isOpening: PropTypes.bool,
    error: PropTypes.string,
    onCancel: PropTypes.func.isRequired,
    onOpenWhatsApp: PropTypes.func.isRequired,
};

WhatsAppReminderModal.defaultProps = {
    mode: 'manual',
    person: null,
    message: '',
    mobileNumber: '',
    isOpening: false,
    error: '',
};

export default WhatsAppReminderModal;
