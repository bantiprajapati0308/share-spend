import React, { useState, useEffect, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch, useSelector } from 'react-redux';
import { Form, Button, Container, Row, Col, Card, OverlayTrigger, Tooltip, Spinner } from 'react-bootstrap';
import { PencilSquare, Trash, PersonCircle, PlusCircle, ArrowLeft, ArrowRight } from 'react-bootstrap-icons';
import { useNavigate, useParams } from 'react-router-dom';
import styles from '../assets/scss/Member.module.scss';
import { addMember as addMemberToDB, deleteMember, getMembers } from '../hooks/useMembers'; // Import Firestore API
import FullScreenLoader from './common/FullScreenLoader';
import InlineLoader from './common/InlineLoader';
import { removeMember } from '../redux/tripSlice';
import { getExpenses } from '../hooks/useExpenses';
import { serverTimestamp } from 'firebase/firestore';

function Member() {
    const [memberName, setMemberName] = useState('');
    const [editIndex, setEditIndex] = useState(null);
    const [members, setMembers] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(true);
    const isInitialMount = useRef(true);
    const [deleteLoader, setDeleteLoader] = useState(false);
    const [validated, setValidated] = useState(false);
    const [addLoader, setAddLoader] = useState(false);
    const navigate = useNavigate();
    const { tripId } = useParams(); // Get tripId from route
    const dispatch = useDispatch();
    async function fetchMembers({ initial = false } = {}) {
        if (initial) {
            setLoadingMembers(true);
        }
        const data = await getMembers(tripId);
        const expensesData = await getExpenses(tripId);
        setMembers(data);
        setExpenses(expensesData);
        if (initial) {
            setLoadingMembers(false);
        }
    }
    useEffect(() => {
        if (tripId) {
            fetchMembers({ initial: true });
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

        setAddLoader(true);
        // Check for duplicate name (case-insensitive, trimmed)
        const nameToCheck = memberName.trim().toLowerCase();
        const isDuplicate = members.some(m => m.name.trim().toLowerCase() === nameToCheck);
        if (isDuplicate) {
            toast.error('Already added this member!');
            setAddLoader(false);
            setValidated(false);
            return;
        }
        if (editIndex !== null) {
            // Your edit logic (if you want to update Firestore, add update API)
            setEditIndex(null);
            setAddLoader(false);
        } else {
            if (!tripId) {
                toast.error("Trip ID not found!");
                setAddLoader(false);
                return;
            }
            try {
                await addMemberToDB(tripId, { name: memberName, createdAt: serverTimestamp() });
                setMemberName('');
                await fetchMembers(); // Don't trigger full-page loader
            } catch (err) {
                toast.error("Error adding member: " + err.message);
            }
            setAddLoader(false);
        }
        setValidated(false);
    };

    // Check if member is used in any expense (paidBy or participants)
    const isMemberUsed = (member) => {
        const data = expenses.some(
            (exp) => exp.paidBy === member || (exp.participants && exp.participants.map(p => p.name).includes(member))
        );
        return data
    };
    const handleEdit = (index) => {
        if (isMemberUsed(members[index])) return;
        setMemberName(members[index].name);
        setEditIndex(index);
    };

    const handleDelete = async (memberId) => {
        if (!tripId) return;
        try {
            setDeleteLoader(true)
            await deleteMember(tripId, memberId); // delete from Firestore
            await fetchMembers(); // refresh UI
            setDeleteLoader(false)
        } catch (err) {
            alert("Error deleting member: " + err.message);
        }
    };

    const handleNext = (type) => {
        let path = '';
        if (type === 'back') {
            path = '/share-spend/trip';
        } else if (type === 'next') {
            path = `/share-spend/expenses/${tripId}`; // Pass tripId in the route
        }
        navigate(path);
    };

    return (
        <>
            {/* Only show FullScreenLoader for initial load, not for add member */}
            {/* Only show FullScreenLoader for initial load, not after add/update */}
            {loadingMembers && isInitialMount.current && <FullScreenLoader />}
            <Container className={styles.container}>
                <Row className="justify-content-center mt-4">
                    <Col md={10} lg={8}>
                        <div className={styles.memberHeaderRow}>
                            <h2 className={styles.memberTitle}><PersonCircle className="me-2 text-primary" size={28} />Add Members</h2>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <Button variant="outline-secondary" className={styles.backBtn} onClick={() => handleNext('back')}>
                                <ArrowLeft className="me-1" size={20} /> Back
                            </Button>
                            {members.length > 0 && (
                                <Button variant='success' onClick={() => handleNext('next')} className={`${styles.nextButton} mt-0`}>
                                    Next <ArrowRight className="ms-1" size={20} />
                                </Button>
                            )}
                        </div>
                        <Card className={styles.memberCard}>
                            <Card.Body>
                                <Form validated={validated} onSubmit={handleAddMember} className={styles.addMemberForm}>
                                    <Form.Group controlId="memberName" className={styles.formGroup}>
                                        <div className={styles.addMemberRow}>
                                            <Form.Control
                                                required
                                                type="text"
                                                placeholder="Enter member's name"
                                                value={memberName}
                                                onChange={(e) => setMemberName(e.target.value)}
                                                className={styles.formControl}
                                                disabled={addLoader}
                                            />
                                            <Button
                                                variant={editIndex !== null ? "info" : "success"}
                                                type="submit"
                                                className={styles.iconBtn}
                                                title={editIndex !== null ? 'Edit Member' : 'Add Member'}
                                                disabled={addLoader}
                                            >
                                                {addLoader ? <Spinner animation="border" size="sm" /> : (editIndex !== null ? <PencilSquare size={22} /> : <PlusCircle size={22} />)}
                                            </Button>
                                        </div>
                                    </Form.Group>
                                </Form>
                            </Card.Body>
                        </Card>
                        <div className={styles.memberList}>
                            {addLoader && <InlineLoader />}
                            {members.map((member, index) => {
                                // Avatar color
                                let color = '#6c63ff';
                                if (member.name.length > 0) {
                                    const code = member.name.charCodeAt(0) + member.name.length * 13;
                                    color = `hsl(${code * 13 % 360}, 70%, 70%)`;
                                }
                                const initials = member.name.split(' ').map(n => n[0]).join('').toUpperCase();
                                const used = isMemberUsed(member.name);
                                return (
                                    <div key={member.id} className={styles.memberCardItem}>
                                        <div className="d-flex align-items-center"><span>{index + 1}. </span> <div className={styles.avatar} style={{ background: color }}> {initials}</div></div>
                                        <div className={styles.memberName} title={member.name}>{member.name}</div>
                                        <div className={styles.memberActions}>
                                            <OverlayTrigger
                                                placement="top"
                                                overlay={used ? <Tooltip id={`tooltip-edit-${index}`}>Please remove this user from all expenses to edit</Tooltip> : <></>}
                                            >
                                                <span>
                                                    <Button
                                                        variant={used ? "outline-secondary" : "outline-primary"}
                                                        size="sm"
                                                        className={styles.iconBtn}
                                                        onClick={() => handleEdit(index)}
                                                        disabled={used}
                                                        style={{ pointerEvents: used ? 'auto' : 'auto' }}
                                                        title={used ? 'Cannot edit' : 'Edit'}
                                                    >
                                                        <PencilSquare size={18} />
                                                    </Button>
                                                </span>
                                            </OverlayTrigger>
                                            <OverlayTrigger
                                                placement="top"
                                                overlay={used ? <Tooltip id={`tooltip-edit-${index}`}>Please remove this user from all expenses to delete</Tooltip> : <></>}
                                            >
                                                <Button variant={used ? "outline-danger" : "outline-danger"}
                                                    size="sm"
                                                    className={styles.iconBtn}
                                                    disabled={used || deleteLoader}
                                                    style={{ pointerEvents: used ? 'auto' : 'auto' }}
                                                    onClick={() => handleDelete(member.id)}
                                                    title={used ? 'Cannot delete' : 'Delete'}>
                                                    {deleteLoader ? <Spinner animation="border" size="sm" /> : <Trash size={18} />}
                                                </Button>
                                            </OverlayTrigger>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="d-flex justify-content-end mt-3">
                            {members.length > 0 && (
                                <Button variant='success' onClick={() => handleNext('next')} className={styles.nextButton}>
                                    Next <ArrowRight className="ms-1" size={20} />
                                </Button>
                            )}
                        </div>
                        {members.length === 0 && <p className={styles.noMembers}>No members added yet.</p>}
                    </Col>
                </Row>
            </Container>
            <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
        </>
    );
}

export default Member;
