import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setTrip } from '../../../redux/tripSlice';
import { PeopleFill, ArrowRight, Trash2 } from 'react-bootstrap-icons';
import styles from '../../../assets/scss/TripCard.module.scss';
import { timeAgo, toDateTime } from '../../../utils/dateTime';

function TripCard({ trip, index, onDelete }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const updatedAtValue = toDateTime(trip.updatedAt);

    const handleOpen = () => {
        dispatch(setTrip(trip));
        navigate(`/members/${trip.id}`);
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = (e) => {
        e.stopPropagation();
        setShowDeleteConfirm(false);
        onDelete(trip);
    };

    const getRoleBadge = () => {
        if (trip.role === 'owner') {
            return 'OWNER';
        }
        return 'MEMBER';
    };

    return (
        <>
            <div className={styles.card} onClick={handleOpen}>
                {/* Trip Icon & Main Info */}
                <div className={styles.iconSection}>
                    <div className={styles.iconBox}>{trip.icon || '📍'}</div>
                </div>

                <div className={styles.mainContent}>
                    {/* Header Row: Name & Badge */}
                    <div className={styles.headerRow}>
                        <h3 className={styles.tripName}>{trip.name}</h3>
                        <span
                            className={`${styles.roleBadge} ${trip.role === 'owner'
                                    ? styles.ownerBadge
                                    : styles.memberBadge
                                }`}
                        >
                            {getRoleBadge()}
                        </span>
                    </div>

                    {/* Stats Row: Members & Expenses */}
                    <div className={styles.statsRow}>
                        <div className={styles.stat}>
                            <span className={styles.icon}>👥</span>
                            <span>{trip.totalMember || 0} Members</span>
                        </div>
                        <div className={styles.separator}>•</div>
                        <div className={styles.stat}>
                            <span className={styles.icon}>💰</span>
                            <span>
                                ₹
                                {(trip.totalAmount || 0).toLocaleString(
                                    'en-IN'
                                )}
                            </span>
                        </div>
                    </div>

                    {/* Footer Row: Activity & Action */}
                    <div className={styles.footerRow}>
                        <span className={styles.activityTime}>
                            Updated {timeAgo(updatedAtValue)}
                        </span>
                        <div className={styles.actions}>
                            {trip.role === 'owner' && (
                                <button
                                    className={styles.deleteBtn}
                                    onClick={handleDeleteClick}
                                    aria-label="Delete trip"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                            <button
                                className={styles.openBtn}
                                onClick={handleOpen}
                                aria-label="Open trip"
                            >
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div
                    className={styles.confirmOverlay}
                    onClick={() => setShowDeleteConfirm(false)}
                >
                    <div
                        className={styles.confirmBox}
                        onClick={e => e.stopPropagation()}
                    >
                        <h4 className={styles.confirmTitle}>Delete Trip?</h4>
                        <p className={styles.confirmText}>
                            This action cannot be undone.
                        </p>
                        <div className={styles.confirmActions}>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.confirmDeleteBtn}
                                onClick={handleConfirmDelete}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default TripCard;
