import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { DeleteButton } from '../../utils/Button';

function ConfirmationModal({ show, handleClose, handleConfirm }) {
    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Confirm Action</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                If you clear data, you will lose all expenses that you have handled recently. Do you still want to continue?
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Cancel
                </Button>
                <DeleteButton onClick={handleConfirm} text="Delete" />
            </Modal.Footer>
        </Modal>
    );
}

export default ConfirmationModal;
