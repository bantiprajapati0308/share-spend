import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Spinner, Badge } from 'react-bootstrap';
import { EnvelopeFill, ClockFill, CheckCircleFill, XCircleFill } from 'react-bootstrap-icons';
import { tripsApi } from '../../../services/api/tripsApi';

const STATUS_BADGE = {
    pending: { bg: 'warning', text: 'dark', icon: <ClockFill size={12} className="me-1" /> },
    accepted: { bg: 'success', text: 'white', icon: <CheckCircleFill size={12} className="me-1" /> },
    rejected: { bg: 'danger', text: 'white', icon: <XCircleFill size={12} className="me-1" /> },
    expired: { bg: 'secondary', text: 'white', icon: null },
};

/**
 * Modal for trip owners to invite users by email and see existing invites.
 *
 * Props:
 *   tripId  - current trip ID
 *   show    - boolean visibility
 *   onClose - close callback
 */
function InviteUserModal({ tripId, show, onClose }) {
    const [email, setEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState(null);
    const [sendSuccess, setSendSuccess] = useState(false);
    const [invites, setInvites] = useState([]);
    const [loadingInvites, setLoadingInvites] = useState(false);

    useEffect(() => {
        if (show && tripId) {
            fetchInvites();
        }
    }, [show, tripId]);

    const fetchInvites = async () => {
        setLoadingInvites(true);
        const result = await tripsApi.getInvitesForTrip(tripId);
        if (result.success) setInvites(result.data || []);
        setLoadingInvites(false);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!email.trim()) return;
        setSending(true);
        setSendError(null);
        setSendSuccess(false);
        try {
            const result = await tripsApi.createInvite(tripId, email.trim());
            if (!result.success) throw new Error(result.error);
            setSendSuccess(true);
            setEmail('');
            await fetchInvites();
        } catch (err) {
            setSendError(err.message || 'Failed to send invite');
        } finally {
            setSending(false);
        }
    };

    const handleClose = () => {
        setEmail('');
        setSendError(null);
        setSendSuccess(false);
        onClose?.();
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e62d0' }}>
                    <EnvelopeFill className="me-2" size={20} />
                    Invite to Trip
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSend}>
                    <Form.Group className="mb-3">
                        <Form.Label style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                            Email Address
                        </Form.Label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Form.Control
                                type="email"
                                placeholder="friend@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={sending}
                                autoComplete="email"
                            />
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={sending || !email.trim()}
                                style={{ whiteSpace: 'nowrap', minWidth: '90px' }}
                            >
                                {sending ? <Spinner animation="border" size="sm" /> : 'Send Invite'}
                            </Button>
                        </div>
                    </Form.Group>

                    {sendSuccess && (
                        <div
                            style={{
                                padding: '0.5rem 0.75rem',
                                background: '#d1e7dd',
                                borderRadius: '6px',
                                color: '#0f5132',
                                fontSize: '0.875rem',
                                marginBottom: '0.75rem',
                            }}
                        >
                            Invite sent successfully!
                        </div>
                    )}
                    {sendError && (
                        <div
                            style={{
                                padding: '0.5rem 0.75rem',
                                background: '#fff3f3',
                                border: '1px solid #f5c2c7',
                                borderRadius: '6px',
                                color: '#842029',
                                fontSize: '0.875rem',
                                marginBottom: '0.75rem',
                            }}
                        >
                            {sendError}
                        </div>
                    )}
                </Form>

                {/* Invite history */}
                <div style={{ borderTop: '1px solid #e9ecef', paddingTop: '1rem', marginTop: '0.5rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#555', marginBottom: '0.5rem' }}>
                        Sent Invites
                    </div>
                    {loadingInvites ? (
                        <div className="text-center py-2">
                            <Spinner animation="border" size="sm" />
                        </div>
                    ) : invites.length === 0 ? (
                        <div style={{ color: '#aaa', fontSize: '0.85rem' }}>No invites sent yet.</div>
                    ) : (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {invites.map((inv) => {
                                const badge = STATUS_BADGE[inv.status] || STATUS_BADGE.expired;
                                return (
                                    <li
                                        key={inv.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '0.45rem 0',
                                            borderBottom: '1px solid #f3f3f3',
                                            fontSize: '0.875rem',
                                        }}
                                    >
                                        <span style={{ color: '#333' }}>{inv.email}</span>
                                        <Badge bg={badge.bg} text={badge.text} style={{ fontSize: '0.75rem' }}>
                                            {badge.icon}{inv.status}
                                        </Badge>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="outline-secondary" onClick={handleClose}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default InviteUserModal;
