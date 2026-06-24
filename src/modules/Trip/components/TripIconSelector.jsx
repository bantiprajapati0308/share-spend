import React from 'react';
import styles from '../../../assets/scss/TripIconSelector.module.scss';

const TRIP_ICONS = [
    { emoji: '⛰️', label: 'Camping' },
    { emoji: '✈️', label: 'Flight' },
    { emoji: '🚗', label: 'Road Trip' },
    { emoji: '🏖️', label: 'Beach' },
    { emoji: '🎉', label: 'Party' },
    { emoji: '⭐', label: 'More' },
];

function TripIconSelector({ selectedIcon, onSelectIcon }) {
    return (
        <div className={styles.iconGrid}>
            {TRIP_ICONS.map((icon) => (
                <button
                    key={icon.emoji}
                    className={`${styles.iconButton} ${selectedIcon === icon.emoji ? styles.selected : ''
                        }`}
                    onClick={() => onSelectIcon(icon.emoji)}
                    title={icon.label}
                    aria-label={icon.label}
                    type="button"
                >
                    <span className={styles.emoji}>{icon.emoji}</span>
                    <span className={styles.label}>{icon.label}</span>
                </button>
            ))}
        </div>
    );
}

export default TripIconSelector;
