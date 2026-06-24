import React, { useState } from 'react';
import { XCircle, Plus, ChevronDown, Trash2 } from 'react-bootstrap-icons';
import { addTrip } from '../hooks/useTrips';
import { addMember } from '../hooks/useMembers';
import TripIconSelector from './TripIconSelector';
import MembersSection from './MembersSection';
import styles from '../../../assets/scss/CreateTripModal.module.scss';

function CreateTripModal({ isOpen, onClose, onTripCreated }) {
    const [step, setStep] = useState(1); // Step 1: Details, Step 2: Members
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Trip details state
    const [tripData, setTripData] = useState({
        name: '',
        description: '',
        date: '',
        endDate: '',
        icon: '⛰️',
    });

    // Members state
    const [members, setMembers] = useState([
        {
            id: 'owner-temp',
            name: 'You',
            email: '',
            status: 'owner',
            role: 'owner',
        },
    ]);
    const [newMember, setNewMember] = useState({ name: '', email: '' });

    const handleTripChange = (field, value) => {
        setTripData(prev => ({ ...prev, [field]: value }));
    };

    const handleIconSelect = (icon) => {
        setTripData(prev => ({ ...prev, icon }));
    };

    const addMemberToList = () => {
        if (!newMember.name.trim()) {
            setError('Member name is required');
            return;
        }

        const memberToAdd = {
            id: `member-${Date.now()}`,
            name: newMember.name.trim(),
            email: newMember.email.trim() || null,
            status: newMember.email ? 'pending' : 'active',
            role: 'member',
        };

        setMembers(prev => [...prev, memberToAdd]);
        setNewMember({ name: '', email: '' });
        setError('');
    };

    const removeMember = (id) => {
        setMembers(prev => prev.filter(m => m.id !== id));
    };

    const handleCreateTrip = async () => {
        if (!tripData.name.trim()) {
            setError('Trip name is required');
            return;
        }
        if (!tripData.date) {
            setError('Start date is required');
            return;
        }
        if (!tripData.endDate) {
            setError('End date is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Create trip
            const createdTrip = await addTrip({
                name: tripData.name.trim(),
                description: tripData.description.trim(),
                date: tripData.date,
                endDate: tripData.endDate,
                currency: 'INR',
            });

            // Add members (exclude owner)
            const nonOwnerMembers = members.filter(m => m.role !== 'owner');
            for (const member of nonOwnerMembers) {
                await addMember(createdTrip.id, {
                    name: member.name,
                    email: member.email,
                });
            }

            onTripCreated?.(createdTrip);
            resetModal();
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to create trip');
        } finally {
            setLoading(false);
        }
    };

    const resetModal = () => {
        setStep(1);
        setTripData({
            name: '',
            description: '',
            date: '',
            endDate: '',
            icon: '⛰️',
        });
        setMembers([
            {
                id: 'owner-temp',
                name: 'You',
                email: '',
                status: 'owner',
                role: 'owner',
            },
        ]);
        setNewMember({ name: '', email: '' });
        setError('');
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.modalHeader}>
                    <div className={styles.headerLeft}>
                        <div className={styles.headerIcon}>🌍</div>
                        <div>
                            <h2 className={styles.modalTitle}>Create a New Trip</h2>
                            <p className={styles.modalSubtitle}>Add trip details and invite members</p>
                        </div>
                    </div>
                    <button
                        className={styles.closeBtn}
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <XCircle size={24} />
                    </button>
                </div>

                {/* Steps Indicator */}
                <div className={styles.stepsIndicator}>
                    <div className={`${styles.step} ${step === 1 ? styles.active : ''}`}>
                        <div className={styles.stepNumber}>1</div>
                        <span>Details</span>
                    </div>
                    <div className={styles.stepDivider} />
                    <div className={`${styles.step} ${step === 2 ? styles.active : ''}`}>
                        <div className={styles.stepNumber}>2</div>
                        <span>Members</span>
                    </div>
                </div>

                {/* Content */}
                <div className={styles.modalBody}>
                    {step === 1 && (
                        <div className={styles.stepContent}>
                            {/* Trip Name */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>
                                    Trip Name <span className={styles.required}>*</span>
                                </label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="e.g. Goa Friends Trip 2026"
                                    value={tripData.name}
                                    onChange={e => handleTripChange('name', e.target.value)}
                                    maxLength={50}
                                />
                                <span className={styles.charCount}>
                                    {tripData.name.length}/50
                                </span>
                            </div>

                            {/* Description */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Description</label>
                                <textarea
                                    className={styles.textarea}
                                    placeholder="A fun vacation with college friends"
                                    value={tripData.description}
                                    onChange={e => handleTripChange('description', e.target.value)}
                                    maxLength={200}
                                    rows={3}
                                />
                                <span className={styles.charCount}>
                                    {tripData.description.length}/200
                                </span>
                            </div>

                            {/* Dates */}
                            <div className={styles.dateRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        Start Date <span className={styles.required}>*</span>
                                    </label>
                                    <input
                                        type="date"
                                        className={styles.input}
                                        value={tripData.date}
                                        onChange={e => handleTripChange('date', e.target.value)}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        End Date <span className={styles.required}>*</span>
                                    </label>
                                    <input
                                        type="date"
                                        className={styles.input}
                                        value={tripData.endDate}
                                        onChange={e => handleTripChange('endDate', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Trip Icon Selector */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Trip Icon</label>
                                <TripIconSelector
                                    selectedIcon={tripData.icon}
                                    onSelectIcon={handleIconSelect}
                                />
                            </div>

                            {error && <div className={styles.error}>{error}</div>}
                        </div>
                    )}

                    {step === 2 && (
                        <div className={styles.stepContent}>
                            <MembersSection
                                members={members}
                                onRemoveMember={removeMember}
                                onAddMember={addMemberToList}
                                newMember={newMember}
                                onNewMemberChange={setNewMember}
                            />
                            {error && <div className={styles.error}>{error}</div>}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={styles.modalFooter}>
                    <button
                        className={styles.secondaryBtn}
                        onClick={step === 1 ? onClose : () => setStep(1)}
                    >
                        {step === 1 ? 'Cancel' : 'Back'}
                    </button>
                    {step === 1 && (
                        <button
                            className={styles.primaryBtn}
                            onClick={() => setStep(2)}
                        >
                            Next: Add Members
                            <ChevronDown size={18} />
                        </button>
                    )}
                    {step === 2 && (
                        <button
                            className={styles.primaryBtn}
                            onClick={handleCreateTrip}
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create Trip'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CreateTripModal;
