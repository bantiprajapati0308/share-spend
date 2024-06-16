import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';
import { PencilSquare, Trash } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import { addMember, editMember, removeMember } from '../redux/tripSlice';
import styles from '../assets/scss/Member.module.scss'; // Import the SCSS module

function Member() {
    const [memberName, setMemberName] = useState('');
    const [editIndex, setEditIndex] = useState(null);
    const members = useSelector((state) => state.trip.members);
    const [validated, setValidated] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleAddMember = (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        if (form.checkValidity() === false) {
            e.stopPropagation();
            setValidated(true);
            return;
        }

        if (editIndex !== null) {
            dispatch(editMember({ memberName, editIndex }));
            setEditIndex(null);
        } else {
            dispatch(addMember(memberName));
        }
        setMemberName('');
        setValidated(false);
    };

    const handleEdit = (index) => {
        setMemberName(members[index]);
        setEditIndex(index);
    };

    const handleDelete = (member) => {
        dispatch(removeMember(member));
    };

    const handleNext = () => {
        navigate('/share-spend/expenses');
    };

    return (
        <Container className={styles.container}>
            <Row className="justify-content-md-center">
                <Col md="6">
                    <h2>Add Members</h2>
                    <Form validated={validated} onSubmit={handleAddMember}>
                        <Form.Group controlId="memberName" className={styles.formGroup}>
                            <Form.Label className={styles.formLabel}>Member Name</Form.Label>
                            <Form.Control
                                required
                                type="text"
                                placeholder="Enter member's name"
                                value={memberName}
                                onChange={(e) => setMemberName(e.target.value)}
                                className={styles.formControl}
                            />
                            <Button variant="primary" type="submit" className={styles.submitButton}>
                                {editIndex !== null ? 'Edit Member' : 'Add Member'}
                            </Button>
                        </Form.Group>
                    </Form>
                    <ul className="list-group mt-3">
                        {members.map((member, index) => (
                            <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                                <div><span className={styles.index}>{index + 1}</span> {member}</div>
                                <div className={styles.buttons}>
                                    <Button variant="outline-primary" size="sm" onClick={() => handleEdit(index)}>
                                        <PencilSquare />
                                    </Button>
                                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(member)}>
                                        <Trash />
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    {members.length === 0 ? <p className={styles.noMembers}>No members added yet.</p> :
                        <Button variant='success' onClick={handleNext} className={styles.nextButton}>Next</Button>}
                </Col>
            </Row>
        </Container>
    );
}

export default Member;
