import React, { useState, useEffect } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { CheckCircleFill, ExclamationTriangleFill, InfoCircleFill } from 'react-bootstrap-icons';

function ToastNotification({
    show,
    onClose,
    variant = 'success',
    title,
    message,
    autoHide = true,
    delay = 3000
}) {
    const [showToast, setShowToast] = useState(show);

    useEffect(() => {
        setShowToast(show);
    }, [show]);

    const handleClose = () => {
        setShowToast(false);
        if (onClose) {
            onClose();
        }
    };

    const getIcon = () => {
        switch (variant) {
            case 'success':
                return <CheckCircleFill className="me-2" style={{ color: '#28a745' }} />;
            case 'warning':
                return <ExclamationTriangleFill className="me-2" style={{ color: '#ffc107' }} />;
            case 'info':
                return <InfoCircleFill className="me-2" style={{ color: '#17a2b8' }} />;
            default:
                return <CheckCircleFill className="me-2" style={{ color: '#28a745' }} />;
        }
    };

    return (
        <ToastContainer
            position="top-end"
            className="p-3"
            style={{ zIndex: 9999 }}
        >
            <Toast
                show={showToast}
                onClose={handleClose}
                autohide={autoHide}
                delay={delay}
                bg={variant === 'success' ? 'success' : variant}
                className="text-white"
            >
                <Toast.Header>
                    {getIcon()}
                    <strong className="me-auto">{title}</strong>
                </Toast.Header>
                {message && (
                    <Toast.Body>
                        {message}
                    </Toast.Body>
                )}
            </Toast>
        </ToastContainer>
    );
}

export default ToastNotification;