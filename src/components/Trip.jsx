import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, Button, Container, Row, Col, OverlayTrigger, Tooltip, Modal } from 'react-bootstrap';
import { selectCurrency, setTrip } from '../redux/tripSlice';
import { useNavigate } from 'react-router-dom';
import { CURRENCY_ARRAY } from '../Util';
import { PeopleFill, Globe2, InfoCircle, ArrowRightCircle, Trash } from 'react-bootstrap-icons';
import styles from '../assets/scss/Trip.module.scss';
import ConfirmationModal from './common/ConfirmationModal';
import { persistor } from '../redux/store';
import { addTrip, getTrips, deleteTrip } from '../hooks/useTrips'; // <-- Import deleteTrip
import FullScreenLoader from './common/FullScreenLoader';

function Trip() {
    const [tripName, setTripName] = useState('');
    const [description, setDescription] = useState('');
    const [organizer, setOrganizer] = useState('');
    const [currency, setCurrency] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [trips, setTrips] = useState([]); // <-- State for trips
    const [loadingTrips, setLoadingTrips] = useState(true); // <-- Loading state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [tripToDelete, setTripToDelete] = useState(null);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { trip, currency: tripCurrency } = useSelector((state) => state.trip);

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Prepare trip data
        const tripData = { name: tripName, description, organizer, currency };
        try {
            // Add trip to Firestore and get the new trip's reference
            const tripRef = await addTrip(tripData);
            // Get the tripId from Firestore
            const tripId = tripRef.id;
            // Dispatch to Redux if needed
            dispatch(setTrip({ name: tripName, description, organizer, currency, id: tripId }));
            // Navigate to members page with tripId
            navigate(`/share-spend/members/${tripId}`);
            // Reset form
            setTripName('');
            setDescription('');
            setOrganizer('');
            setCurrency('');
        } catch (err) {
            alert("Error creating trip: " + err.message);
        }
    };
    useEffect(() => {
        setTripName(trip.name);
        setDescription(trip.description);
        setCurrency(tripCurrency);
    }, [])

    // Fetch trips on mount
    useEffect(() => {
        async function fetchTrips() {
            setLoadingTrips(true);
            const data = await getTrips();
            setTrips(data);
            setLoadingTrips(false);
        }
        fetchTrips();
    }, []);

    const handleClearData = () => {
        persistor.purge(); // Clear persisted data
        window.location.reload(); // Optional: reload the page to reset the app state
    };

    const handleShowModal = () => setShowModal(true);
    const handleCloseModal = () => setShowModal(false);
    const handleConfirmClear = () => {
        handleClearData();
        handleCloseModal();
    };

    // Delete trip handler
    const handleDeleteTrip = async () => {
        if (tripToDelete) {
            await deleteTrip(tripToDelete.id);
            setTrips(trips.filter(t => t.id !== tripToDelete.id));
            setShowDeleteModal(false);
            setTripToDelete(null);
        }
    };

    return (
        <>
            {loadingTrips && <FullScreenLoader />}
            <Container className={styles.container}>
                <Row className="justify-content-md-center">
                    <Col md="7" lg="6">
                        <div className={styles.tripCard}>
                            {/* Trip List Section */}
                            {trips.length > 0 ? (
                                <div className={styles.tripListSection}>
                                    <h5 className="mb-3" style={{ color: "#6c63ff", fontWeight: 600, fontSize: "1.15rem" }}>
                                        <Globe2 size={22} className="me-2" /> Your Trips
                                    </h5>
                                    <ul className={styles.tripList}>
                                        {trips.map(tripItem => (
                                            <li key={tripItem.id} className={styles.tripListItem}>
                                                <div className={styles.tripInfo}>
                                                    <span className={styles.tripIcon}>
                                                        <PeopleFill size={20} />
                                                    </span>
                                                    <div>
                                                        <span className={styles.tripName}>{tripItem.name}</span>
                                                        <span className={styles.tripCurrency}>({tripItem.currency})</span>
                                                        <div className={styles.tripDesc}>{tripItem.description}</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <Button
                                                        size="sm"
                                                        className={styles.openBtn}
                                                        title="Open Trip"
                                                        onClick={() => {
                                                            dispatch(setTrip(tripItem));
                                                            navigate(`/share-spend/members/${tripItem.id}`);
                                                        }}
                                                    >
                                                        <ArrowRightCircle size={20} />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline-danger"
                                                        title="Delete Trip"
                                                        onClick={() => {
                                                            setTripToDelete(tripItem);
                                                            setShowDeleteModal(true);
                                                        }}
                                                    >
                                                        <Trash size={18} />
                                                    </Button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                    <hr />
                                </div>
                            ) : (
                                <div className="mb-4">No trips found. Create a new trip below!</div>
                            )}
                            <div className={styles.tripHeaderRow}>
                                <div className={styles.tripTitle}>
                                    <Globe2 size={32} className="me-2 text-primary" />
                                    Create a New Trip
                                </div>
                                <OverlayTrigger
                                    placement="left"
                                    overlay={<Tooltip id="tip-trip-info">You can edit trip details later in settings.</Tooltip>}
                                >
                                    <InfoCircle size={22} className="text-info" style={{ cursor: 'pointer' }} />
                                </OverlayTrigger>
                            </div>

                            {/* Trip Creation Form */}
                            <Form onSubmit={handleSubmit}>
                                <Form.Group controlId="tripName" className="mb-3">
                                    <Form.Label className={styles.formLabel}>Trip Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g. Goa Friends 2025"
                                        value={tripName}
                                        onChange={(e) => setTripName(e.target.value)}
                                        required
                                    />
                                </Form.Group>
                                <Form.Group controlId="description" className="mb-3">
                                    <Form.Label className={styles.formLabel}>Description</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g. Summer vacation, group trip, etc."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </Form.Group>
                                <Form.Group controlId="organizer" className="mb-3">
                                    <Form.Label className={styles.formLabel}>Organizer</Form.Label>
                                    <div className={styles.organizerRow}>
                                        <PeopleFill size={20} className={styles.organizerIcon} />
                                        <Form.Control
                                            type="text"
                                            placeholder="Your name (optional)"
                                            value={organizer}
                                            onChange={(e) => setOrganizer(e.target.value)}
                                        />
                                    </div>
                                </Form.Group>
                                <Form.Group controlId="currencyType" className="mb-3">
                                    <Form.Label className={styles.formLabel}>Currency</Form.Label>
                                    <Form.Control
                                        as="select"
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                        required
                                    >
                                        <option value="">Select Currency</option>
                                        {CURRENCY_ARRAY.map((item, index) => (
                                            <option key={index} value={item.value}>
                                                {item.value} ({item.label})
                                            </option>
                                        ))}
                                    </Form.Control>
                                </Form.Group>
                                <div className={styles.displaySpaceBetween}>
                                    <Button variant='danger' onClick={handleShowModal} className='mt-2'>Clear Data</Button>
                                    <Button variant="success" className='mt-2' type="submit" disabled={!tripName}>
                                        Next
                                    </Button>
                                </div>
                                <ConfirmationModal
                                    show={showModal}
                                    handleClose={handleCloseModal}
                                    handleConfirm={handleConfirmClear}
                                />
                                {/* Delete Trip Modal */}
                                <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                                    <Modal.Header closeButton>
                                        <Modal.Title>
                                            Delete Trip
                                        </Modal.Title>
                                    </Modal.Header>
                                    <Modal.Body>
                                        Are you sure you want to delete <strong>{tripToDelete?.name}</strong> trip?
                                    </Modal.Body>
                                    <Modal.Footer>
                                        <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                                            Cancel
                                        </Button>
                                        <Button variant="danger" onClick={handleDeleteTrip}>
                                            Delete
                                        </Button>
                                    </Modal.Footer>
                                </Modal>
                            </Form>
                            <div className="mt-4">
                                <div style={{ fontSize: '0.98rem', color: '#6c63ff', fontWeight: 500 }}>
                                    <InfoCircle size={16} className="me-1" /> Tip: Add a descriptive trip name and organizer for easy sharing!
                                </div>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>
        </>
    );
}

export default Trip;
