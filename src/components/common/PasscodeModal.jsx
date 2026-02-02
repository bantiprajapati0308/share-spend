import React, { useState } from 'react';
import { Modal, Button, Alert } from 'react-bootstrap';
import { ShieldCheck, ShieldX } from 'react-bootstrap-icons';
import PasscodeInput from './PasscodeInput';

function PasscodeModal({
    show,
    onHide,
    onSuccess,
    tripName = "this trip",
    title = "Enter Passcode",
    message = "This trip requires a passcode to make changes."
}) {
    const [enteredPasscode, setEnteredPasscode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const success = await onSuccess(enteredPasscode);
            if (success) {
                handleClose();
            } else {
                setError('Incorrect passcode. Please try again.');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setEnteredPasscode('');
        setError('');
        setIsLoading(false);
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} centered backdrop="static">
            <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <Modal.Title className="d-flex align-items-center">
                    <ShieldCheck size={24} className="me-2" />
                    {title}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="mb-3">
                    <p className="text-muted mb-2">
                        <strong>{tripName}</strong> is protected.
                    </p>
                    <p className="small text-muted mb-3">
                        {message}
                    </p>
                </div>

                {error && (
                    <Alert variant="danger" className="d-flex align-items-center">
                        <ShieldX size={20} className="me-2" />
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <PasscodeInput
                        value={enteredPasscode}
                        onChange={setEnteredPasscode}
                        placeholder="Enter the trip passcode"
                        label="Passcode"
                        helperText=""
                        required
                    />

                    <div className="d-flex gap-2 justify-content-end mt-3">
                        <Button
                            variant="outline-secondary"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={!enteredPasscode.trim() || isLoading}
                        >
                            {isLoading ? 'Verifying...' : 'Verify'}
                        </Button>
                    </div>
                </form>
            </Modal.Body>
        </Modal>
    );
}

export default PasscodeModal;