import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';
import { selectCurrency, setTrip } from '../redux/tripSlice';
import { useNavigate } from 'react-router-dom';
import { CURRENCY_ARRAY } from '../Util';
import ConfirmationModal from './common/ConfirmationModal';
import { persistor } from '../redux/store';
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

    const handleSubmit = (e) => {
        e.preventDefault();
        navigate('members');
        dispatch(setTrip({ name: tripName, description, organizer }));
        dispatch(currency(currency));
        setTripName('');
        setDescription('');
        setOrganizer('');
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
        <Container>
            <Row className="justify-content-md-center">
                <Col md="6">
                    <h2>Create Trip</h2>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group controlId="tripName">
                            <Form.Label>Trip Name</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter trip name"
                                value={tripName}
                                onChange={(e) => setTripName(e.target.value)}
                            />
                        </Form.Group>

                        <Form.Group controlId="description">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter trip description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group controlId="currencyType">
                            <Form.Label>Currency</Form.Label>
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
                        <div className='display-space-between'>
                            <Button variant='danger' onClick={handleShowModal} className='mt-2 float-start'>Clear Data</Button>
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
                </Col>
            </Row>
        </Container>
    );
}

export default Trip;
