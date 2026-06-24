import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, Funnel } from 'react-bootstrap-icons';
import TripCard from './TripCard';
import DeleteTripModal from './DeleteTripModal';
import styles from '../../../assets/scss/TripList.module.scss';

const STATUS_OPTIONS = ['All Status', 'Active', 'Completed'];
const SORT_OPTIONS = ['Recent', 'Oldest', 'Name'];

function TripList({ trips, onTripDeleted }) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [sortBy, setSortBy] = useState('Recent');
    const [completedOpen, setCompletedOpen] = useState(false);
    const [tripToDelete, setTripToDelete] = useState(null);
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [showSortMenu, setShowSortMenu] = useState(false);

    const closeMenus = () => {
        setShowStatusMenu(false);
        setShowSortMenu(false);
    };

    const filtered = useMemo(() => {
        let list = trips.filter(t =>
            t.name?.toLowerCase().includes(search.toLowerCase()) ||
            t.description?.toLowerCase().includes(search.toLowerCase()) ||
            t.location?.toLowerCase().includes(search.toLowerCase())
        );

        if (statusFilter === 'Active') list = list.filter(t => t.status !== 'completed');
        if (statusFilter === 'Completed') list = list.filter(t => t.status === 'completed');

        if (sortBy === 'Recent') {
            list = [...list].sort((a, b) => new Date(b.updatedAt || b.date || 0) - new Date(a.updatedAt || a.date || 0));
        } else if (sortBy === 'Oldest') {
            list = [...list].sort((a, b) => new Date(a.updatedAt || a.date || 0) - new Date(b.updatedAt || b.date || 0));
        } else if (sortBy === 'Name') {
            list = [...list].sort((a, b) => a.name.localeCompare(b.name));
        }

        return list;
    }, [trips, search, statusFilter, sortBy]);

    const activeTrips = filtered.filter(t => t.status !== 'completed');
    const completedTrips = filtered.filter(t => t.status === 'completed');
    // offset index so colours remain consistent across active/completed split
    const completedStartIndex = activeTrips.length;

    return (
        <div className={styles.section} onClick={closeMenus}>
            {/* Header row */}
            <div className={styles.headerRow}>
                <h2 className={styles.heading}>My Trips</h2>
                <div className={styles.controls}>
                    {/* Status filter */}
                    <div className={styles.dropdownWrap} onClick={e => e.stopPropagation()}>
                        <button
                            className={styles.dropdownBtn}
                            onClick={() => { setShowStatusMenu(p => !p); setShowSortMenu(false); }}
                        >
                            {statusFilter} <ChevronDown size={13} />
                        </button>
                        {showStatusMenu && (
                            <div className={styles.dropdownMenu}>
                                {STATUS_OPTIONS.map(opt => (
                                    <button
                                        key={opt}
                                        className={`${styles.dropdownMenuItem} ${statusFilter === opt ? styles.active : ''}`}
                                        onClick={() => { setStatusFilter(opt); setShowStatusMenu(false); }}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sort */}
                    <div className={styles.dropdownWrap} onClick={e => e.stopPropagation()}>
                        <button
                            className={styles.dropdownBtn}
                            onClick={() => { setShowSortMenu(p => !p); setShowStatusMenu(false); }}
                        >
                            {sortBy} <ChevronDown size={13} />
                        </button>
                        {showSortMenu && (
                            <div className={styles.dropdownMenu}>
                                {SORT_OPTIONS.map(opt => (
                                    <button
                                        key={opt}
                                        className={`${styles.dropdownMenuItem} ${sortBy === opt ? styles.active : ''}`}
                                        onClick={() => { setSortBy(opt); setShowSortMenu(false); }}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button className={styles.filterIconBtn} title="More filters">
                        <Funnel size={16} />
                    </button>
                </div>
            </div>

            {/* Search bar */}
            <div className={styles.searchWrap}>
                <Search size={15} className={styles.searchIcon} />
                <input
                    className={styles.searchInput}
                    type="text"
                    placeholder="Search trips by name or description..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Active trips list */}
            {activeTrips.length === 0 && completedTrips.length === 0 && (
                <div className={styles.empty}>
                    No trips found. Try adjusting your search or filters.
                </div>
            )}

            {activeTrips.map((trip, i) => (
                <TripCard
                    key={trip.id}
                    trip={trip}
                    index={i}
                    onDelete={setTripToDelete}
                />
            ))}

            {/* Completed trips collapsible */}
            {completedTrips.length > 0 && (
                <div className={styles.completedSection}>
                    <button
                        className={styles.completedToggle}
                        onClick={() => setCompletedOpen(p => !p)}
                    >
                        <span className={styles.completedToggleLabel}>
                            🕐 Completed Trips
                        </span>
                        {completedOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {completedOpen && completedTrips.map((trip, i) => (
                        <TripCard
                            key={trip.id}
                            trip={trip}
                            index={completedStartIndex + i}
                            onDelete={setTripToDelete}
                        />
                    ))}
                </div>
            )}

            <DeleteTripModal
                trip={tripToDelete}
                onClose={() => setTripToDelete(null)}
                onConfirm={() => {
                    onTripDeleted(tripToDelete);
                    setTripToDelete(null);
                }}
            />
        </div>
    );
}

export default TripList;
