import React from "react";

const TripDetails = ({ trip }) => {
    if (!trip) return <div>Select a trip to view details.</div>;
    return (
        <div>
            <h4>{trip.name}</h4>
            <p>{trip.description}</p>
            <p>Currency: {trip.currency}</p>
            {/* Add members/expenses UI here */}
        </div>
    );
};

export default TripDetails;