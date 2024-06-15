import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';
import { addMember, editMember, removeMember } from '../redux/tripSlice';
import { PencilSquare, Trash } from 'react-bootstrap-icons';

function Member() {
    const [memberName, setMemberName] = useState('');
    const [editIndex, setEditIndex] = useState(null); // State to store the index of member being edited
    const members = useSelector((state) => state.trip.members);
    const [validated, setValidated] = useState(false);
    const dispatch = useDispatch();

    const handleAddMember = (e) => {

        e.preventDefault();
        const form = e.currentTarget;
        if (form.checkValidity() === false) {
            e.stopPropagation();
            setValidated(true);
        }
        if (editIndex !== null) {
            // Editing existing member
            dispatch(editMember({ memberName, editIndex }));
            setEditIndex(null);
        } else {
            // Adding new member
            dispatch(addMember(memberName));
        }
        setMemberName('');


    };

    const handleEdit = (index) => {
        setMemberName(members[index]);
        setEditIndex(index);
    };

    const handleDelete = (mebmer) => {
        dispatch(removeMember(mebmer));
    };

    return (
        <Container>
            <Row className="justify-content-md-center">
                <Col md="6">
                    <h2>Add Members</h2>

                    <Form validated={validated} onSubmit={handleAddMember}>
                        <div className='d-flex align-items-center'>
                            <Form.Group controlId="memberName">
                                <Form.Label>Member Name</Form.Label>
                                <Form.Control
                                    required
                                    type="text"
                                    placeholder="Enter member's name"
                                    value={memberName}
                                    onChange={(e) => setMemberName(e.target.value)}
                                />
                            </Form.Group>
                            <div className='mt-2'>
                                <Button variant="primary ms-2 mt-4" type="submit">
                                    {editIndex !== null ? 'Edit Member' : 'Add Member'}
                                </Button>
                            </div>
                        </div>
                    </Form>
                    <ul className="list-group mt-3">
                        {members.map((member, index) => (
                            <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                                <div><span className='me-3'>{index + 1}</span> {member}</div>
                                <div>
                                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEdit(index)}>
                                        <PencilSquare />
                                    </Button>
                                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(member)}>
                                        <Trash />
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Col>
            </Row>
        </Container>
    );
}

export default Member;
