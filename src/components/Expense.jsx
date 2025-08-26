import React, { useState, useEffect, useRef } from 'react';
import { Spinner } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { Form, Button, Container, Row, Col, Card, ListGroup, Accordion } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { getCurrencySymbol } from '../Util';
import styles from '../assets/scss/Expense.module.scss';
import { PlusCircle, Save2, XCircle, PeopleFill, ListUl, Pencil, Trash3 } from 'react-bootstrap-icons';
import { getMembers } from '../hooks/useMembers';
import { addExpense as addExpenseToDB, getExpenses, deleteExpense, updateExpense } from '../hooks/useExpenses';
import FullScreenLoader from './common/FullScreenLoader';
import { serverTimestamp } from 'firebase/firestore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Expense() {
    const [expenseName, setExpenseName] = useState('');
    const [amount, setAmount] = useState('');
    const [paidBy, setPaidBy] = useState('');
    const [participants, setParticipants] = useState([]);
    const [description, setDescription] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [activeAccordion, setActiveAccordion] = useState('add');
    const [activeAccordion2, setActiveAccordion2] = useState('list');
    const [members, setMembers] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingExpenses, setLoadingExpenses] = useState(true);
    const [addExpenseLoading, setAddExpenseLoading] = useState(false);
    const addDebounceRef = useRef(null);

    const { tripId } = useParams();
    const navigate = useNavigate();
    const currency = useSelector((state) => state.trip.currency);

    // Fetch members and expenses on mount
    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            const memberList = await getMembers(tripId);
            setMembers(memberList);
            const expenseList = await getExpenses(tripId);
            setExpenses(expenseList);
            setLoading(false);
        }
        fetchData();
    }, [tripId]);

    useEffect(() => {
        async function fetchExpenses() {
            setLoadingExpenses(true);
            const data = await getExpenses(tripId);
            setExpenses(data);
            setLoadingExpenses(false);
        }
        if (tripId) fetchExpenses();
    }, [tripId]);

    const handleAddExpense = async (e) => {
        e.preventDefault();
        if (addExpenseLoading) return;
        if (participants.length === 0) {
            toast.error('Please select at least one participant.');
            return;
        }
        setAddExpenseLoading(true);
        if (addDebounceRef.current) {
            clearTimeout(addDebounceRef.current);
        }
        addDebounceRef.current = setTimeout(async () => {
            const newExpense = {
                name: expenseName,
                amount: parseFloat(amount),
                paidBy,
                participants,
                description,
                createdAt: serverTimestamp()
            };
            try {
                if (editMode && editId) {
                    // Update existing expense
                    await updateExpense(tripId, editId, newExpense);
                } else {
                    // Add new expense
                    await addExpenseToDB(tripId, newExpense);
                }
                setExpenseName('');
                setAmount('');
                setPaidBy('');
                setParticipants([]);
                setDescription('');
                setEditMode(false);
                setEditId(null);
                // Refresh expenses
                const expenseList = await getExpenses(tripId);
                setExpenses(expenseList);
            } catch (err) {
                toast.error("Error saving expense: " + err.message);
            }
            setAddExpenseLoading(false);
        }, 400);
    };

    const handleDeleteExpense = async (id) => {
        try {
            await deleteExpense(tripId, id);
            const expenseList = await getExpenses(tripId);
            setExpenses(expenseList);
        } catch (err) {
            toast.error("Error deleting expense: " + err.message);
        }
    };

    const handleEditExpense = (id) => {
        const expense = expenses.find((exp) => exp.id === id);
        if (!expense) return;
        setExpenseName(expense.name);
        setAmount(expense.amount.toString());
        setPaidBy(expense.paidBy);
        setParticipants(expense.participants);
        setDescription(expense.description);
        setEditMode(true);
        setEditId(id);
        setActiveAccordion('add');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setExpenseName('');
        setAmount('');
        setPaidBy('');
        setParticipants([]);
        setDescription('');
        setEditMode(false);
        setEditId(null);
    };

    const handleSelectAll = () => {
        if (members.length === participants.length) {
            setParticipants([]);
        } else {
            setParticipants([...members]);
        }
    };

    const isAllSelected = members.length > 0 && participants.length === members.length;
    const handleNext = () => {
        navigate(`/share-spend/report/${tripId}`);
    };

    const handleBack = () => {
        navigate(`/share-spend/members/${tripId}`);
    };

    return (
        <>
            {loadingExpenses && <FullScreenLoader />}
            <Container className={styles.expenseContainer}>
                <Row className="justify-content-center mt-0">
                    <Col md="8">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <Button variant="outline-secondary" className={styles.backBtn} onClick={handleBack} title="Back to Add Members">
                                <PeopleFill className="me-2" size={20} />
                                <span className="fw-semibold">Back to Add Members</span>
                            </Button>
                            <Button variant="success" className={styles.nextButton} onClick={handleNext}>
                                Next
                            </Button>
                        </div>
                        <Accordion activeKey={activeAccordion} onSelect={setActiveAccordion} className={styles.expenseAccordion}>
                            <Accordion.Item eventKey="add">
                                <Accordion.Header>
                                    <PlusCircle className="me-2 text-primary" size={22} />
                                    <span className={styles.cardTitle}>{editMode ? 'Edit Expense' : 'Add Expense'}</span>
                                </Accordion.Header>
                                <Accordion.Body>
                                    <Form onSubmit={handleAddExpense}>
                                        <Row className="gy-2 gx-2 align-items-center mb-2">
                                            <Col xs={6} md={3} className="p-1">
                                                <Form.Group controlId="amount" className={styles.inlineFormGroup}>
                                                    <Form.Label className={styles.inlineLabel}>Amount</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        placeholder="Amount"
                                                        value={amount}
                                                        onChange={(e) => setAmount(e.target.value)}
                                                        required
                                                        size="sm"
                                                        className={styles.inlineInput}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col xs={6} md={3} className="p-1">
                                                <Form.Group controlId="expenseName" className={styles.inlineFormGroup}>
                                                    <Form.Label className={styles.inlineLabel}>Name</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        placeholder="Expense name"
                                                        value={expenseName}
                                                        onChange={(e) => setExpenseName(e.target.value)}
                                                        required
                                                        size="sm"
                                                        className={styles.inlineInput}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col xs={6} md={3} className="p-1">
                                                <Form.Group controlId="paidBy" className={styles.inlineFormGroup}>
                                                    <Form.Label className={styles.inlineLabel}>Paid By</Form.Label>
                                                    <Form.Control
                                                        as="select"
                                                        value={paidBy}
                                                        onChange={(e) => setPaidBy(e.target.value)}
                                                        required
                                                        size="sm"
                                                        className={styles.inlineInput}
                                                    >
                                                        <option value="">Select</option>
                                                        {members.map((member, index) => (
                                                            <option key={index} value={member.name}>
                                                                {member.name}
                                                            </option>
                                                        ))}
                                                    </Form.Control>
                                                </Form.Group>
                                            </Col>
                                            <Col xs={6} md={3} className="p-1">
                                                <Form.Group controlId="description" className={styles.inlineFormGroup}>
                                                    <Form.Label className={styles.inlineLabel}>Desc</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        placeholder="Description"
                                                        value={description}
                                                        onChange={(e) => setDescription(e.target.value)}
                                                        size="sm"
                                                        className={styles.inlineInput}
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        <Form.Group controlId="participants" className={styles.participantCheckboxes}>
                                            <div className={styles.participantHeader}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <PeopleFill className="me-2 text-info" size={24} />
                                                    <span className={styles.participantHeading}>Participants</span>
                                                </div>
                                                <div className={styles.formActionBtns}>
                                                    {!editMode && (
                                                        <Button
                                                            variant="success"
                                                            type="submit"
                                                            className={styles.iconBtn}
                                                            title="Add Expense"
                                                            style={{ fontWeight: 600, fontSize: '0.75rem', padding: '0.32rem 1.1rem' }}
                                                            disabled={addExpenseLoading}
                                                        >
                                                            {addExpenseLoading ? <Spinner animation="border" size="sm" className="me-1" /> : <PlusCircle size={22} className="me-1" />}Add
                                                        </Button>
                                                    )}
                                                    {editMode && (
                                                        <>
                                                            <Button variant="success" type="submit" className={styles.iconBtn} title="Update" style={{ fontWeight: 600, fontSize: '0.75rem', marginRight: '0.25rem' }}>
                                                                <Save2 size={22} className="me-1" />Update
                                                            </Button>
                                                            <Button className={styles.iconBtn} onClick={() => { resetForm(); setEditMode(false); }} title="Cancel" style={{ fontWeight: 600, fontSize: '0.75rem' }}>
                                                                <XCircle size={22} />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className={styles.participantGrid}>
                                                {/* Select All button */}
                                                <div
                                                    className={`${styles.participantBtn} ${isAllSelected ? styles.selected : ''}`}
                                                    onClick={handleSelectAll}
                                                    tabIndex={0}
                                                    role="button"
                                                >
                                                    <div className={styles.avatar} style={{ background: '#adb5bd' }}>ALL</div>
                                                    <div className={styles.name}>All</div>
                                                    {isAllSelected && <span className={styles.checkmark}>✓</span>}
                                                </div>
                                                {members.map((member, index) => {
                                                    const selected = participants.some((p) => p.id === member.id);
                                                    const initials = member.name.split(' ').map(n => n[0]).join('').toUpperCase();
                                                    const btnStyle = selected
                                                        ? {
                                                            background: 'linear-gradient(135deg, #0d223a 0%, #1e62d0 100%)',
                                                            border: '2.5px solid #1e62d0',
                                                            color: '#f3f6fa',
                                                        }
                                                        : {
                                                            background: '#f6f8fa',
                                                            border: '2.5px solid #e3e8ee',
                                                            color: '#232946',
                                                        };
                                                    let avatarBg = '#e3e8ee';
                                                    let avatarColor = '#232946';
                                                    if (member.length > 0) {
                                                        const code = member.name.charCodeAt(0) + member.length * 13;
                                                        const hue = (code * 13) % 360;
                                                        avatarBg = selected
                                                            ? `hsl(${hue}, 80%, 82%)`
                                                            : `hsl(${hue}, 40%, 92%)`;
                                                        avatarColor = selected ? '#1e223a' : '#232946';
                                                    }
                                                    return (
                                                        <div
                                                            key={index}
                                                            className={`${styles.participantBtn} ${selected ? styles.selected : ''}`}
                                                            style={btnStyle}
                                                            onClick={() => {
                                                                if (selected) {
                                                                    setParticipants(participants.filter((p) => p.id !== member.id));
                                                                } else {
                                                                    setParticipants([...participants, member]);
                                                                }
                                                            }}
                                                            tabIndex={0}
                                                            role="button"
                                                        >
                                                            <div className={styles.avatar} style={{ background: avatarBg, color: avatarColor }}>{initials}</div>
                                                            <div className={styles.name} style={{ color: btnStyle.color, fontWeight: 700 }}>{member.name}</div>
                                                            {selected && <span className={styles.checkmark}>✓</span>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </Form.Group>
                                    </Form>
                                </Accordion.Body>
                            </Accordion.Item>
                        </Accordion>
                        <Accordion activeKey={activeAccordion2} onSelect={setActiveAccordion2} className={styles.expenseAccordion}>
                            <Accordion.Item eventKey="list">
                                <Accordion.Header>
                                    <ListUl className="me-2 text-success" size={22} />
                                    <span className={styles.cardTitle}>Expense List</span>
                                </Accordion.Header>
                                <Accordion.Body className="p-0">
                                    <div className={styles.expenseListScroller}>
                                        <ListGroup variant="flush">
                                            {expenses.length > 0 ? (
                                                [...expenses].reverse().map((expense) => (
                                                    <ListGroup.Item key={expense.id} className={`${styles.expenseListItem} p-3`}>
                                                        <Row className="align-items-center">
                                                            <Col xs={12} md={8}>
                                                                <div className={styles.expenseInfo}>
                                                                    <div className={`${styles.expenseHeader} d-flex justify-content-between`}>
                                                                        <strong className={styles.expenseName}>{expense.name}</strong>
                                                                        <span className={`${styles.expenseAmount} d-block d-md-none`}>{getCurrencySymbol(currency)}{expense.amount.toFixed(2)}</span>
                                                                    </div>
                                                                    <div className={styles.expenseMeta}>
                                                                        <span>Paid by: <strong>{expense.paidBy}</strong></span>
                                                                        <span className={`${styles.expenseAmount} d-none d-md-inline ms-4`}>{getCurrencySymbol(currency)}{expense.amount.toFixed(2)}</span>
                                                                        <span className={styles.actionButtonsInline}>
                                                                            <Button variant="outline-primary" size="sm" onClick={() => handleEditExpense(expense.id)} title="Edit">
                                                                                <Pencil size={18} />
                                                                            </Button>
                                                                            <Button variant="outline-danger" size="sm" onClick={() => handleDeleteExpense(expense.id)} className="ms-1" title="Delete">
                                                                                <Trash3 size={18} />
                                                                            </Button>
                                                                        </span>
                                                                    </div>
                                                                    <div className={styles.expenseParticipants}>
                                                                        <small>Participants: {expense.participants.map(p => p.name).join(', ')}</small>
                                                                    </div>
                                                                    {expense.description && <div className={styles.expenseParticipants}>
                                                                        <small>Description: {expense.description}</small>
                                                                    </div>}
                                                                </div>
                                                            </Col>
                                                        </Row>
                                                    </ListGroup.Item>
                                                ))
                                            ) : (
                                                <ListGroup.Item className={styles.noExpensesMessage}>
                                                    No expenses added yet.
                                                </ListGroup.Item>
                                            )}
                                        </ListGroup>
                                    </div>
                                </Accordion.Body>
                            </Accordion.Item>
                        </Accordion>
                    </Col>
                </Row>
                <Row>
                    <Col md="8"> {expenses.length > 0 && (
                        <div className="d-flex justify-content-end p-2">
                            <Button variant="success" className={styles.nextButton} onClick={handleNext}>
                                Next
                            </Button>
                        </div>
                    )}
                    </Col>
                </Row>
            </Container>
            <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
        </>
    );
}

export default Expense;
