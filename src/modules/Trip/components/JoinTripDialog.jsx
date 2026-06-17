import React, { useState } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import { EnvelopeFill, CheckCircleFill, XCircleFill } from 'react-bootstrap-icons';
import { invitesApi } from '../../../services/api/invitesApi';

/**
 * Modal shown when a user has pending trip invites.
 * Renders one invite at a time; calls onResponded after each accept/reject.
 *
 * Props:
 *   invite  - { id, tripName, invitedByEmail, tripId }
 *   onAccepted(tripId) - called after successful accept
 *   onRejected()       - called after reject
 *   onClose()          - called to dismiss without action
 */
function JoinTripDialog({ invite, onAccepted, onRejected, onClose }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!invite) return null;

    const handleAccept = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await invitesApi.acceptInvite(invite.tripId, invite.id);
            if (!result.success) throw new Error(result.error);
            onAccepted?.(invite.tripId);
        } catch (err) {
            setError(err.message || 'Failed to accept invite. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await invitesApi.rejectInvite(invite.tripId, invite.id);
            if (!result.success) throw new Error(result.error);
            onRejected?.();
        } catch (err) {
            setError(err.message || 'Failed to reject invite. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show centered onHide={onClose} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e62d0' }}>
                    <EnvelopeFill className="me-2" size={20} />
                    Trip Invitation
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p style={{ marginBottom: '0.5rem' }}>
                    You have been invited to join{' '}
                    <strong style={{ color: '#6c63ff' }}>{invite.tripName || 'a trip'}</strong>.
                </p>
                {invite.invitedByEmail && (
                    <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: 0 }}>
                        Invited by: {invite.invitedByEmail}
                    </p>
                )}
                {error && (
                    <div
                        style={{
                            marginTop: '0.75rem',
                            padding: '0.5rem 0.75rem',
                            background: '#fff3f3',
                            border: '1px solid #f5c2c7',
                            borderRadius: '6px',
                            color: '#842029',
                            fontSize: '0.875rem',
                        }}
                    >
                        {error}
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer style={{ justifyContent: 'space-between' }}>
                <Button
                    variant="outline-danger"
                    onClick={handleReject}
                    disabled={loading}
                    style={{ minWidth: '110px' }}
                >
                    {loading ? (
                        <Spinner animation="border" size="sm" />
                    ) : (
                        <><XCircleFill className="me-1" size={16} /> Reject</>
                    )}
                </Button>
                <Button
                    variant="primary"
                    onClick={handleAccept}
                    disabled={loading}
                    style={{ minWidth: '110px' }}
                >
                    {loading ? (
                        <Spinner animation="border" size="sm" />
                    ) : (
                        <><CheckCircleFill className="me-1" size={16} /> Accept</>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default JoinTripDialog;
