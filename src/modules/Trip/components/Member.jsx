import React, { useState, useEffect, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Form, Button, Container, Row, Col, Card, OverlayTrigger, Tooltip, Spinner, Badge } from 'react-bootstrap';
import { PencilSquare, Trash, PersonCircle, PlusCircle, ArrowLeft, ArrowRight, PersonFill, EnvelopeArrowUp } from 'react-bootstrap-icons';
import { useNavigate, useParams } from 'react-router-dom';
import styles from '../../../assets/scss/Member.module.scss';
import { addMember as addMemberToDB, deleteMember, getMembers, resendInvite } from '../hooks/useMembers';
import FullScreenLoader from '../../../components/common/FullScreenLoader';
import InlineLoader from '../../../components/common/InlineLoader';
import { getExpenses } from '../hooks/useExpenses';

function Member() {
    const [memberName, setMemberName] = useState('');
    const [memberEmail, setMemberEmail] = useState('');
    const [members, setMembers] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(true);
    const isInitialMount = useRef(true);
    const [deleteLoader, setDeleteLoader] = useState(null); // memberId being deleted
    const [resendLoader, setResendLoader] = useState(null); // memberId being resent
    const [validated, setValidated] = useState(false);
    const [addLoader, setAddLoader] = useState(false);
    const navigate = useNavigate();
    const { tripId } = useParams();

    async function fetchMembers({ initial = false } = {}) {
        if (initial) setLoadingMembers(true);
        const data = await getMembers(tripId);
        setMembers(data);
        if (initial) setLoadingMembers(false);
    }

    async function fetchExpenses() {
        const expensesData = await getExpenses(tripId);
        setExpenses(expensesData);
    }

    useEffect(() => {
        if (tripId) {
            fetchMembers({ initial: true });
            fetchExpenses();
            isInitialMount.current = false;
        }
    }, [tripId]);

    const handleAddMember = async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        if (form.checkValidity() === false) {
            e.stopPropagation();
            setValidated(true);
            return;
        }

        if (!tripId) { toast.error('Trip ID not found!'); return; }

        setAddLoader(true);
        try {
            await addMemberToDB(tripId, {
                name: memberName.trim(),
                email: memberEmail.trim() || undefined,
            });
            setMemberName('');
            setMemberEmail('');
            setValidated(false);
            await fetchMembers();
        } catch (err) {
            toast.error(err.message || 'Error adding member');
        } finally {
            setAddLoader(false);
            setValidated(false);
        }
    };

    // Only active members count as "used" â€” pending/guest-without-expenses can still be deleted
    const isMemberUsed = (memberName) =>
        expenses.some(
            (exp) =>
                exp.paidBy === memberName ||
                (exp.participants && exp.participants.map((p) => p.name).includes(memberName))
        );

    const handleDelete = async (memberId, memberName) => {
        if (!tripId) return;
        try {
            setDeleteLoader(memberId);
            await deleteMember(tripId, memberId);
            await fetchMembers();
        } catch (err) {
            toast.error(err.message || 'Error deleting member');
        } finally {
            setDeleteLoader(null);
        }
    };

    const handleResend = async (memberId) => {
        try {
            setResendLoader(memberId);
            await resendInvite(tripId, memberId);
            toast.success('Invite resent!');
            await fetchMembers();
        } catch (err) {
            toast.error(err.message || 'Error resending invite');
        } finally {
            setResendLoader(null);
        }
    };

    const handleNav = (type) => {
        navigate(type === 'back' ? '/trip' : `/expenses/${tripId}`);
    };

    const statusBadge = (member) => {
        if (member.status === 'pending') return <Badge bg="warning" text="dark" className="ms-1" style={{ fontSize: '0.65rem' }}>Pending</Badge>;
        if (member.status === 'rejected') return <Badge bg="danger" className="ms-1" style={{ fontSize: '0.65rem' }}>Rejected</Badge>;
        if (member.role === 'owner') return <Badge bg="info" text="dark" className="ms-1" style={{ fontSize: '0.65rem' }}>Owner</Badge>;
        if (member.userId) return <Badge bg="success" className="ms-1" style={{ fontSize: '0.65rem' }}>Joined</Badge>;
        return null;
    };

    const activeMembers = members.filter((m) => m.status === 'active');

    return (
        <>
            {loadingMembers && isInitialMount.current && <FullScreenLoader />}
            <Container className={styles.container}>
                <Row className="justify-content-center mt-4">
                    <Col md={10} lg={8}>
                        <div className={styles.memberHeaderRow}>
                            <h2 className={styles.memberTitle}>
                                <PersonCircle className="me-2 text-primary" size={28} />Add Members
                            </h2>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <Button variant="outline-secondary" className={styles.backBtn} onClick={() => handleNav('back')}>
                                <ArrowLeft className="me-1" size={20} /> Back
                            </Button>
                            {activeMembers.length > 0 && (
                                <Button variant="success" onClick={() => handleNav('next')} className={`${styles.nextButton} mt-0`}>
                                    Next <ArrowRight className="ms-1" size={20} />
                                </Button>
                            )}
                        </div>

                        {/* Add member form */}
                        <Card className={styles.memberCard}>
                            <Card.Body>
                                <Form validated={validated} onSubmit={handleAddMember} className={styles.addMemberForm}>
                                    <Form.Group controlId="memberName" className={styles.formGroup}>
                                        <div className={styles.addMemberRow}>
                                            <div className="flex-grow-1 me-2">
                                                <Form.Control
                                                    required
                                                    type="text"
                                                    placeholder="Member name *"
                                                    value={memberName}
                                                    onChange={(e) => setMemberName(e.target.value)}
                                                    className={styles.formControl}
                                                    disabled={addLoader}
                                                />
                                                <Form.Control
                                                    type="email"
                                                    placeholder="Email (optional â€” sends invite)"
                                                    value={memberEmail}
                                                    onChange={(e) => setMemberEmail(e.target.value)}
                                                    className={`${styles.formControl} mt-2`}
                                                    disabled={addLoader}
                                                />
                                            </div>
                                            <Button
                                                variant="success"
                                                type="submit"
                                                className={styles.iconBtn}
                                                title="Add Member"
                                                disabled={addLoader}
                                            >
                                                {addLoader ? <Spinner animation="border" size="sm" /> : <PlusCircle size={22} />}
                                            </Button>
                                        </div>
                                    </Form.Group>
                                </Form>
                            </Card.Body>
                        </Card>

                        {/* Member list */}
                        <div className={styles.memberList}>
                            {addLoader && <InlineLoader />}
                            {members.map((member, index) => {
                                const code = member.name.charCodeAt(0) + member.name.length * 13;
                                const color = `hsl(${(code * 13) % 360}, 70%, 70%)`;
                                const initials = member.name.split(' ').map((n) => n[0]).join('').toUpperCase();
                                const used = isMemberUsed(member.name);
                                const isActiveRegistered = member.status === 'active' && !!member.userId;
                                const isPending = member.status === 'pending';
                                const isGuest = member.type === 'guest';
                                const canDelete = !used && !isActiveRegistered;

                                return (
                                    <div key={member.id} className={styles.memberCardItem}>
                                        <div className="d-flex align-items-center">
                                            <span>{index + 1}. </span>
                                            <div className={styles.avatar} style={{ background: color }}>
                                                {isActiveRegistered ? <PersonFill size={14} /> : initials}
                                            </div>
                                        </div>
                                        <div className={styles.memberName} title={member.name}>
                                            {member.name}
                                            {statusBadge(member)}
                                            {member.email && (
                                                <div style={{ fontSize: '0.72rem', color: '#888', marginTop: 1 }}>
                                                    {member.email}
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.memberActions}>
                                            {/* Resend invite button â€” pending members only */}
                                            {isPending && (
                                                <OverlayTrigger
                                                    placement="top"
                                                    overlay={<Tooltip>Resend invite</Tooltip>}
                                                >
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        className={styles.iconBtn}
                                                        onClick={() => handleResend(member.id)}
                                                        disabled={resendLoader === member.id}
                                                    >
                                                        {resendLoader === member.id
                                                            ? <Spinner animation="border" size="sm" />
                                                            : <EnvelopeArrowUp size={18} />}
                                                    </Button>
                                                </OverlayTrigger>
                                            )}
                                            {/* Delete button */}
                                            <OverlayTrigger
                                                placement="top"
                                                overlay={
                                                    !canDelete
                                                        ? <Tooltip>{isActiveRegistered ? 'Active member â€” cannot delete' : 'Remove from all expenses first'}</Tooltip>
                                                        : <></>
                                                }
                                            >
                                                <span>
                                                    <Button
                                                        variant={canDelete ? 'outline-danger' : 'outline-secondary'}
                                                        size="sm"
                                                        className={styles.iconBtn}
                                                        disabled={!canDelete || deleteLoader === member.id}
                                                        onClick={() => handleDelete(member.id, member.name)}
                                                    >
                                                        {deleteLoader === member.id
                                                            ? <Spinner animation="border" size="sm" />
                                                            : <Trash size={18} />}
                                                    </Button>
                                                </span>
                                            </OverlayTrigger>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="d-flex justify-content-end mt-3">
                            {activeMembers.length > 0 && (
                                <Button variant="success" onClick={() => handleNav('next')} className={styles.nextButton}>
                                    Next <ArrowRight className="ms-1" size={20} />
                                </Button>
                            )}
                        </div>
                        {members.length === 0 && <p className={styles.noMembers}>No members added yet.</p>}
                    </Col>
                </Row>
            </Container>
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
        </>
    );
}

export default Member;
