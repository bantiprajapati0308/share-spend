import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, Button, Container, Row, Col, Card, ListGroup } from 'react-bootstrap';
import { addExpense, removeExpense } from '../redux/tripSlice';
import { useNavigate } from 'react-router-dom';
import { getCurrencySymbol } from '../Util';
import styles from '../assets/scss/Expense.module.scss'; // Import custom styles
import { PencilSquare, Trash } from 'react-bootstrap-icons';

function Expense() {
    const [expenseName, setExpenseName] = useState('');
    const [amount, setAmount] = useState('');
    const [paidBy, setPaidBy] = useState('');
    const [participants, setParticipants] = useState([]);
    const [description, setDescription] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [editIndex, setEditIndex] = useState(null);

    const { members, expenses, currency } = useSelector((state) => state.trip);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleAddExpense = (e) => {
        e.preventDefault();
        if (editMode) {
            dispatch(updateExpense(editIndex));
        } else {
            dispatch(addExpense({
                name: expenseName,
                amount: parseFloat(amount),
                paidBy,
                participants,
                description
            }));
        }
        resetForm();
    };

    const handleEditExpense = (index) => {
        const expense = expenses[index];
        setExpenseName(expense.name);
        setAmount(expense.amount.toString());
        setPaidBy(expense.paidBy);
        setParticipants(expense.participants);
        setDescription(expense.description);
        setEditMode(true);
        setEditIndex(index);
    };

    const updateExpense = (index) => {
        dispatch(addExpense({
            name: expenseName,
            amount: parseFloat(amount),
            paidBy,
            participants,
            description
        }, index));
        resetForm();
        setEditMode(false);
        setEditIndex(null);
    };

    const handleDeleteExpense = (name) => {
        dispatch(removeExpense(name));
    };

    const resetForm = () => {
        setExpenseName('');
        setAmount('');
        setPaidBy('');
        setParticipants([]);
        setDescription('');
        setEditMode(false);
        setEditIndex(null);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setParticipants([...members]);
        } else {
            setParticipants([]);
        }
    };

    const handleNext = () => {
        navigate('/share-spend/report');
    };

    const handleBack = () => {
        navigate('/share-spend/members');
    };

    return (
        <Container className={styles.expenseContainer}>
            <Row className="justify-content-center mt-4">
                <Col md="8">
                    <Card className={styles.expenseCard}>
                        <Card.Header className={styles.cardHeader}>
                            <Row className="align-items-center">
                                <Col>
                                    <h2 className={styles.cardTitle}>{editMode ? 'Edit Expense' : 'Add Expense'}</h2>
                                </Col>
                                <Col xs="auto">
                                    <Button variant="outline-primary" onClick={handleBack}>Back</Button>
                                </Col>
                            </Row>
                        </Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleAddExpense}>
                                <Row>
                                    <Col md="6">
                                        <Form.Group controlId="expenseName">
                                            <Form.Label>Expense Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Enter expense name"
                                                value={expenseName}
                                                onChange={(e) => setExpenseName(e.target.value)}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md="6">
                                        <Form.Group controlId="amount">
                                            <Form.Label>Amount</Form.Label>
                                            <Form.Control
                                                type="number"
                                                placeholder="Enter amount"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row className="mb-3">
                                    <Col md="6">
                                        <Form.Group controlId="paidBy">
                                            <Form.Label>Paid By</Form.Label>
                                            <Form.Control
                                                as="select"
                                                value={paidBy}
                                                onChange={(e) => setPaidBy(e.target.value)}
                                                required
                                            >
                                                <option value="">Select member</option>
                                                {members.map((member, index) => (
                                                    <option key={index} value={member}>
                                                        {member}
                                                    </option>
                                                ))}
                                            </Form.Control>
                                        </Form.Group>
                                    </Col>
                                    <Col md="6">
                                        <Form.Group controlId="description">
                                            <Form.Label>Description</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Enter description"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Form.Group controlId="participants" className={styles.participantCheckboxes}>
                                    <Form.Label>Participants</Form.Label>
                                    <Form.Check
                                        type="checkbox"
                                        label="Select All"
                                        onChange={handleSelectAll}
                                    />
                                    {members.map((member, index) => (
                                        <Form.Check
                                            key={index}
                                            type="checkbox"
                                            label={member}
                                            value={member}
                                            checked={participants.includes(member)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setParticipants([...participants, member]);
                                                } else {
                                                    setParticipants(participants.filter((p) => p !== member));
                                                }
                                            }}
                                        />
                                    ))}
                                </Form.Group>

                                <Button variant="primary" type="submit" className={styles.submitButton}>
                                    {editMode ? 'Update Expense' : 'Add Expense'}
                                </Button>
                                {editMode && (
                                    <Button variant="secondary" className={styles.cancelButton} onClick={() => { resetForm(); setEditMode(false); }}>
                                        Cancel
                                    </Button>
                                )}
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="justify-content-center mt-4">
                <Col md="8">
                    <Card className={styles.expenseListCard}>
                        <Card.Header className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>Expense List</h2>
                        </Card.Header>
                        <Card.Body className='p-0'>
                            <ListGroup variant="flush">
                                {expenses.length > 0 ? (
                                    expenses.map((expense, index) => (
                                        <ListGroup.Item key={index} className={styles.expenseListItem}>
                                            <div className={styles.expenseDetails}>
                                                <strong>{expense.name}</strong>
                                                <span>{getCurrencySymbol(currency)}{expense.amount.toFixed(2)}</span>
                                                <span>Paid by {expense.paidBy}</span>
                                                <span>Participants: {expense.participants.join(', ')}</span>
                                            </div>
                                            <div className={styles.actionButtons}>
                                                <Button variant="outline-warning" size="sm" onClick={() => handleEditExpense(index)}>
                                                    <PencilSquare />
                                                </Button>
                                                <Button variant="outline-danger" size="sm" onClick={() => handleDeleteExpense(expense.name)}>
                                                    <Trash />
                                                </Button>
                                            </div>
                                        </ListGroup.Item>
                                    ))
                                ) : (
                                    <ListGroup.Item className={styles.noExpensesMessage}>
                                        No expenses added yet.
                                    </ListGroup.Item>
                                )}
                            </ListGroup>
                        </Card.Body>
                    </Card>
                    {expenses.length > 0 && (
                        <Button variant="success" className={styles.nextButton} onClick={handleNext}>
                            Next
                        </Button>
                    )}
                </Col>
            </Row>
        </Container>
    );
}

export default Expense;
