import React, { useState } from "react";
import { addTrip, updateTrip } from "../../hooks/useTrips";
import { Modal, Button, Form } from "react-bootstrap";

const TripForm = ({ trip, onClose }) => {
  const [name, setName] = useState(trip?.name || "");
  const [description, setDescription] = useState(trip?.description || "");
  const [currency, setCurrency] = useState(trip?.currency || "INR");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tripData = { name, description, currency };
    if (trip) {
      await updateTrip(trip.id, tripData);
    } else {
      await addTrip(tripData);
    }
    onClose();
  };

  return (
    <Modal show onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>{trip ? "Edit Trip" : "Add Trip"}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Name</Form.Label>
            <Form.Control value={name} onChange={e => setName(e.target.value)} required />
          </Form.Group>
          <Form.Group>
            <Form.Label>Description</Form.Label>
            <Form.Control value={description} onChange={e => setDescription(e.target.value)} />
          </Form.Group>
          <Form.Group>
            <Form.Label>Currency</Form.Label>
            <Form.Control value={currency} onChange={e => setCurrency(e.target.value)} required />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">{trip ? "Update" : "Add"}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default TripForm;