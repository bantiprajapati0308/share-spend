import React, { useEffect, useState } from 'react';
import FullScreenLoader from '../../../components/common/FullScreenLoader';

import TripList from './TripList';
import TripDashboard from './TripDashboard';
import CreateTripModal from './CreateTripModal';
import { getTrips, deleteTrip } from '../hooks/useTrips';
import styles from '../../../assets/scss/Trip.module.scss';

function Trip() {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;
        async function fetchTrips() {
            try {
                const data = await getTrips();
                if (!cancelled) setTrips(data);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchTrips();
        return () => { cancelled = true; };
    }, []);

    const handleNewTrip = () => {
        setIsModalOpen(true);
    };

    const handleTripCreated = async (newTrip) => {
        // Refresh trips list
        const updatedTrips = await getTrips();
        setTrips(updatedTrips);
    };

    const handleTripDeleted = async (trip) => {
        await deleteTrip(trip.id);
        setTrips(prev => prev.filter(t => t.id !== trip.id));
    };

    if (loading) return <FullScreenLoader />;

    return (
        <div className={styles.page}>
            {/* Dashboard Hero Section */}
            <TripDashboard
                trips={trips}
                onNewTripClick={handleNewTrip}
            />

            {/* Trip List */}
            {trips.length > 0 && (
                <div className={styles.listSection}>
                    <h2 className={styles.sectionTitle}>Your Trips</h2>
                    <TripList trips={trips} onTripDeleted={handleTripDeleted} />
                </div>
            )}

            {/* Empty State */}
            {trips.length === 0 && !loading && (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🎒</div>
                    <h3 className={styles.emptyTitle}>No trips yet</h3>
                    <p className={styles.emptyText}>
                        Create your first trip to get started!
                    </p>
                </div>
            )}

            {/* Create Trip Modal */}
            <CreateTripModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onTripCreated={handleTripCreated}
            />
        </div>
    );
}

export default Trip;
