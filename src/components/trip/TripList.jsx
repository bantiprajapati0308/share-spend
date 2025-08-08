import React, { useEffect, useState } from "react";
import { getTrips, deleteTrip } from "../../hooks/useTrips";
import TripForm from "./TripForm";
import { Button, Table } from "react-bootstrap";

const TripList = ({ onSelectTrip }) => {
  const [trips, setTrips] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editTrip, setEditTrip] = useState(null);

  const fetchTrips = async () => {
    const data = await getTrips();
    setTrips(data);
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleDelete = async (id) => {
    await deleteTrip(id);
    fetchTrips();
  };

  return (
    <div>
      <Button onClick={() => { setEditTrip(null); setShowForm(true); }}>Add Trip</Button>
      {showForm && (
        <TripForm
          trip={editTrip}
          onClose={() => { setShowForm(false); fetchTrips(); }}
        />
      )}
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Currency</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {trips.map(trip => (
            <tr key={trip.id}>
              <td>{trip.name}</td>
              <td>{trip.description}</td>
              <td>{trip.currency}</td>
              <td>
                <Button size="sm" onClick={() => onSelectTrip(trip)}>View</Button>{" "}
                <Button size="sm" variant="warning" onClick={() => { setEditTrip(trip); setShowForm(true); }}>Edit</Button>{" "}
                <Button size="sm" variant="danger" onClick={() => handleDelete(trip.id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default TripList;