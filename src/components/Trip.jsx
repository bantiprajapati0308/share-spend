import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, Button, Container, Row, Col, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { selectCurrency, setTrip } from '../redux/tripSlice';
import { useNavigate } from 'react-router-dom';
import { CURRENCY_ARRAY } from '../Util';
import { PeopleFill, Globe2, InfoCircle } from 'react-bootstrap-icons';
import styles from '../assets/scss/Trip.module.scss';
import ConfirmationModal from './common/ConfirmationModal';
import { persistor } from '../redux/store';
import { addTrip } from '../hooks/useTrips'; // Add this import

function Trip() {
    const [tripName, setTripName] = useState('');
    const [description, setDescription] = useState('');
    const [organizer, setOrganizer] = useState('');
    const [currency, setCurrency] = useState('');
    const [showModal, setShowModal] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { trip, currency: tripCurrency } = useSelector((state) => state.trip);
    console.log('trip: ', trip);

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

    return (
        <Container className={styles.container}>
            <Row className="justify-content-md-center">
                <Col md="7" lg="6">
                    <div className={styles.tripCard}>
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
    );
}

export default Trip;
