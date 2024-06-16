import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';
import { selectCurrency, setTrip } from '../redux/tripSlice';
import { useNavigate } from 'react-router-dom';
import { CURRENCY_ARRAY } from '../Util';
function Trip() {
    const [tripName, setTripName] = useState('');
    const [description, setDescription] = useState('');
    const [organizer, setOrganizer] = useState('');
    const [currency, setCurrency] = useState('');
    const dispatch = useDispatch();
    const navigate = useNavigate();

    console.log('currency: ', currency);
    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(setTrip({ name: tripName, description, organizer }));
        dispatch(currency(currency));
        setTripName('');
        setDescription('');
        setOrganizer('');
    };
    const handleNext = (e) => {
        navigate('members');
        e.preventDefault();
        dispatch(setTrip({ name: tripName, description, organizer }));
        dispatch(selectCurrency(currency));
        setTripName('');
        setDescription('');
        setOrganizer('');
    }

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
                            <Button variant="primary" className='mt-2' type="submit">
                                Create Trip
                            </Button>
                            <Button variant="success" className='mt-2' type="button" disabled={!tripName} onClick={handleNext}>
                                Next
                            </Button>
                        </div>

                    </Form>
                </Col>
            </Row>
        </Container>
    );
}

export default Trip;
