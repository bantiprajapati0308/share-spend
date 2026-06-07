import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { setTrip, setPasscodeAccess, clearPasscodeAccess } from '../../redux/tripSlice';
import { verifyPasscode, tripHasPasscode } from '../../utils/tripPermissions';
import TripAccessControl from './TripAccessControl';
import FullScreenLoader from './FullScreenLoader';
import { getTrips } from '../../hooks/useTrips';

function ProtectedTripRoute({ children }) {
    const { tripId } = useParams();
    const dispatch = useDispatch();
    const { trip, passcodeAccess } = useSelector((state) => state.trip);
    const [loading, setLoading] = useState(true);
    const [tripData, setTripData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadTripData = async () => {
            if (!tripId) {
                setError('Trip ID not found');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                dispatch(clearPasscodeAccess({ tripId }));

                if (trip.id === tripId && trip.name) {
                    setTripData(trip);
                } else {
                    // Fetch trip data from database
                    const trips = await getTrips();
                    const currentTrip = trips.find(t => t.id === tripId);

                    if (!currentTrip) {
                        setError('Trip not found');
                        setLoading(false);
                        return;
                    }

                    setTripData(currentTrip);
                    dispatch(setTrip(currentTrip));
                }

                // If trip has no passcode, grant access automatically
                if (!tripHasPasscode(tripData || trip)) {
                    dispatch(setPasscodeAccess({ tripId, hasAccess: true }));
                }

                setLoading(false);
            } catch (err) {
                setError('Failed to load trip data');
                setLoading(false);
            }
        };

        loadTripData();
    }, [tripId, dispatch, trip]);

    if (loading) {
        return <FullScreenLoader />;
    }

    if (error) {
        return (
            <Container className="mt-4">
                <Row className="justify-content-center">
                    <Col md={6}>
                        <div className="text-center">
                            <h4 className="text-danger">Error</h4>
                            <p>{error}</p>
                        </div>
                    </Col>
                </Row>
            </Container>
        );
    }

    const currentTripData = tripData || trip;
    const hasAccess = passcodeAccess[tripId] === true;
    const needsPasscode = tripHasPasscode(currentTripData) && !hasAccess;

    return (
        <>
            {needsPasscode && (
                <Container className="mt-3">
                    <TripAccessControl
                        tripData={currentTripData}
                        hasAccess={hasAccess}
                    />
                </Container>
            )}

            {React.cloneElement(children, {
                tripData: currentTripData,
                hasAccess,
                canEdit: !tripHasPasscode(currentTripData) || hasAccess
            })}
        </>
    );
}

export default ProtectedTripRoute;