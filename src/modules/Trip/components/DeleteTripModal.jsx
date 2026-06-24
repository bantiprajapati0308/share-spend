import React from 'react';
import { Modal, Button } from 'react-bootstrap';

function DeleteTripModal({ trip, onClose, onConfirm }) {
    return (
        <Modal show={!!trip} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Delete Trip</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                Are you sure you want to delete <strong>{trip?.name}</strong>?
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button variant="danger" onClick={onConfirm}>Delete</Button>
            </Modal.Footer>
        </Modal>
    );
}

export default DeleteTripModal;
