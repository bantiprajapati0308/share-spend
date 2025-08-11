import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, Button, Container, Row, Col, Card, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { PencilSquare, Trash, PersonCircle, PlusCircle, ArrowLeft, ArrowRight } from 'react-bootstrap-icons';
import { useNavigate, useParams } from 'react-router-dom';
import styles from '../assets/scss/Member.module.scss';
import { addMember as addMemberToDB, deleteMember, getMembers } from '../hooks/useMembers'; // Import Firestore API
import FullScreenLoader from './common/FullScreenLoader';
import { removeMember } from '../redux/tripSlice';

function Member() {
    const [memberName, setMemberName] = useState('');
    const [editIndex, setEditIndex] = useState(null);
    const [members, setMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(true);
    const expenses = useSelector((state) => state.trip.expenses);
    const [validated, setValidated] = useState(false);
    const navigate = useNavigate();
    const { tripId } = useParams(); // Get tripId from route
    const dispatch = useDispatch();
    async function fetchMembers() {
        setLoadingMembers(true);
        const data = await getMembers(tripId);
        setMembers(data);
        setLoadingMembers(false);
    }
    useEffect(() => {
        if (tripId) fetchMembers();
    }, [tripId]);

    const handleAddMember = async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        if (form.checkValidity() === false) {
            e.stopPropagation();
            setValidated(true);
            return;
        }

        if (editIndex !== null) {
            // Your edit logic (if you want to update Firestore, add update API)
            setEditIndex(null);
        } else {
            if (!tripId) {
                alert("Trip ID not found!");
                return;
            }
            try {
                await addMemberToDB(tripId, { name: memberName });
                setMemberName('');
                fetchMembers();
            } catch (err) {
                alert("Error adding member: " + err.message);
            }
        }
        setValidated(false);
    };

    // Check if member is used in any expense (paidBy or participants)
    const isMemberUsed = (member) => {
        return expenses.some(
            (exp) => exp.paidBy === member || (exp.participants && exp.participants.includes(member))
        );
    };
    const handleEdit = (index) => {
        if (isMemberUsed(members[index])) return;
        setMemberName(members[index].name);
        setEditIndex(index);
    };

    const handleDelete = async (memberId) => {
        if (!tripId) return;
        try {
            await deleteMember(tripId, memberId); // delete from Firestore
            await fetchMembers(); // refresh UI
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
            {loadingMembers && <FullScreenLoader />}
            <Container className={styles.container}>
                <Row className="justify-content-center mt-4">
                    <Col md={10} lg={8}>
                        <div className={styles.memberHeaderRow}>
                            <h2 className={styles.memberTitle}><PersonCircle className="me-2 text-primary" size={28} />Add Members</h2>
                            <Button variant="outline-secondary" className={styles.backBtn} onClick={() => handleNext('back')}>
                                <ArrowLeft className="me-1" size={20} /> Back
                            </Button>
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
                                            />
                                            <Button variant={editIndex !== null ? "info" : "success"} type="submit" className={styles.iconBtn} title={editIndex !== null ? 'Edit Member' : 'Add Member'}>
                                                {editIndex !== null ? <PencilSquare size={22} /> : <PlusCircle size={22} />}
                                            </Button>
                                        </div>
                                    </Form.Group>
                                </Form>
                            </Card.Body>
                        </Card>
                        <div className={styles.memberList}>
                            {members.map((member, index) => {
                                // Avatar color
                                let color = '#6c63ff';
                                if (member.name.length > 0) {
                                    const code = member.name.charCodeAt(0) + member.length * 13;
                                    color = `hsl(${code * 13 % 360}, 70%, 70%)`;
                                }
                                const initials = member.name.split(' ').map(n => n[0]).join('').toUpperCase();
                                const used = isMemberUsed(member.name);
                                return (
                                    <div key={index} className={styles.memberCardItem}>
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
                                            <Button variant={used ? "outline-danger" : "outline-danger"}
                                                size="sm"
                                                className={styles.iconBtn}
                                                disabled={used}
                                                style={{ pointerEvents: used ? 'auto' : 'auto' }}
                                                onClick={() => handleDelete(member.id)}
                                                title={used ? 'Cannot delete' : 'Delete'}>
                                                <Trash size={18} />
                                            </Button>
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
        </>
    );
}

export default Member;
