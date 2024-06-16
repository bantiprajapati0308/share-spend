import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';
import { setTrip } from '../redux/tripSlice';

function Trip() {
    const [tripName, setTripName] = useState('');
    const [description, setDescription] = useState('');
    const [organizer, setOrganizer] = useState('');
    const dispatch = useDispatch();

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(setTrip({ name: tripName, description, organizer }));
        setTripName('');
        setDescription('');
        setOrganizer('');
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

                        <Form.Group controlId="organizer">
                            <Form.Label>Organizer</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter organizer's name"
                                value={organizer}
                                onChange={(e) => setOrganizer(e.target.value)}
                            />
                        </Form.Group>

                        <Button variant="primary" type="submit">
                            Create Trip
                        </Button>
                    </Form>
                </Col>
            </Row>
        </Container>
    );
}

export default Trip;