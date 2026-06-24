import React from 'react';
import { PeopleFill } from 'react-bootstrap-icons';
import styles from '../../../assets/scss/TripDashboard.module.scss';

function TripDashboard({ trips, onNewTripClick }) {
    const totalMembers = trips.reduce((sum, trip) => sum + (trip.totalMember || 0), 0);
    const totalExpenses = trips.reduce((sum, trip) => sum + (trip.totalAmount || 0), 0);
    const activeTrips = trips.length;

    return (
        <div className={styles.dashboard}>
            {/* Hero Summary Card */}
            <div className={styles.heroCard}>
                <div className={styles.heroContent}>
                    <div className={styles.greeting}>
                        <span className={styles.emoji}>🌴</span>
                        <div>
                            <h1 className={styles.title}>Trip Dashboard</h1>
                            <p className={styles.subtitle}>
                                Manage your trips and expenses
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className={styles.statsGrid}>
                    <div className={styles.stat}>
                        <div className={styles.statValue}>{activeTrips}</div>
                        <div className={styles.statLabel}>Active Trips</div>
                    </div>
                    <div className={styles.statDivider} />
                    <div className={styles.stat}>
                        <div className={styles.statValue}>{totalMembers}</div>
                        <div className={styles.statLabel}>Members</div>
                    </div>
                    <div className={styles.statDivider} />
                    <div className={styles.stat}>
                        <div className={styles.statValue}>
                            ₹{(totalExpenses || 0).toLocaleString('en-IN')}
                        </div>
                        <div className={styles.statLabel}>Total Expenses</div>
                    </div>
                </div>

                {/* CTA */}
                <button className={styles.ctaButton} onClick={onNewTripClick}>
                    <span className={styles.icon}>+</span> New Trip
                </button>
            </div>
        </div>
    );
}

export default TripDashboard;
