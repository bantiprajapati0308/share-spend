import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Alert, Button, Form, Modal } from 'react-bootstrap';
import { validateWhatsAppMobileNumber } from '../utils/validationHelper';
import styles from '../styles/WhatsAppReminderModal.module.scss';

function WhatsAppReminderModal({
    show,
    person,
    isSaving,
    error,
    onCancel,
    onContinue,
}) {
    const existingNumber = person?.mobileNumber || '';
    const [mobileNumber, setMobileNumber] = useState(existingNumber);
    const [isEditing, setIsEditing] = useState(!existingNumber);
    const [localError, setLocalError] = useState('');
    const isTransactionMessage = Boolean(person?.whatsAppContext && person.whatsAppContext !== 'reminder');

    useEffect(() => {
        setMobileNumber(existingNumber);
        setIsEditing(!existingNumber);
        setLocalError('');
    }, [existingNumber, show]);

    const validation = useMemo(() => validateWhatsAppMobileNumber(mobileNumber), [mobileNumber]);
    const numberChanged = validation.normalized !== validateWhatsAppMobileNumber(existingNumber).normalized;
    const canContinue = validation.isValid && !isSaving;

    const handleContinue = async () => {
        if (!validation.isValid) {
            setLocalError(validation.error);
            return;
        }

        setLocalError('');
        await onContinue({
            rawMobileNumber: mobileNumber,
            normalizedMobileNumber: validation.normalized,
            shouldUpdate: isEditing || numberChanged,
        });
    };

    return (
        <Modal show={show} onHide={onCancel} centered>
            <Modal.Header closeButton>
                <Modal.Title>{isTransactionMessage ? 'Send WhatsApp Message?' : 'WhatsApp Reminder'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className={styles.personBlock}>
                    <span>{person?.personName?.charAt(0)?.toUpperCase() || '?'}</span>
                    <div>
                        <strong>{person?.personName || 'Person'}</strong>
                        <small>
                            {isTransactionMessage
                                ? 'Transaction saved. You can notify this contact on WhatsApp.'
                                : 'Open chat from your own WhatsApp app.'}
                        </small>
                    </div>
                </div>

                <Form.Group className="mb-2">
                    <Form.Label>Mobile Number</Form.Label>
                    <Form.Control
                        value={mobileNumber}
                        onChange={(event) => {
                            setMobileNumber(event.target.value);
                            setLocalError('');
                        }}
                        disabled={!isEditing}
                        placeholder="+91 9876543210"
                        inputMode="tel"
                    />
                </Form.Group>

                {!isEditing && existingNumber && (
                    <p className={styles.confirmText}>Do you want to send a WhatsApp message to this contact number?</p>
                )}

                {(localError || error) && (
                    <Alert variant="danger" className="py-2 mb-0">
                        {localError || error}
                    </Alert>
                )}
            </Modal.Body>
            <Modal.Footer>
                {!isEditing && existingNumber ? (
                    <Button variant="outline-secondary" onClick={() => setIsEditing(true)} disabled={isSaving}>
                        Change Number
                    </Button>
                ) : (
                    <Button variant="outline-secondary" onClick={onCancel} disabled={isSaving}>
                        Cancel
                    </Button>
                )}
                <Button variant="primary" onClick={handleContinue} disabled={!canContinue}>
                    {isSaving ? 'Please wait...' : 'Open WhatsApp'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

WhatsAppReminderModal.propTypes = {
    show: PropTypes.bool.isRequired,
    person: PropTypes.shape({
        id: PropTypes.string,
        personName: PropTypes.string,
        mobileNumber: PropTypes.string,
        whatsAppContext: PropTypes.string,
    }),
    isSaving: PropTypes.bool,
    error: PropTypes.string,
    onCancel: PropTypes.func.isRequired,
    onContinue: PropTypes.func.isRequired,
};

WhatsAppReminderModal.defaultProps = {
    person: null,
    isSaving: false,
    error: '',
};

export default WhatsAppReminderModal;
