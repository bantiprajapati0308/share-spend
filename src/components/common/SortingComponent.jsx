import React, { useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import {
    SortDown,
    CalendarEvent,
    Clock,
    CurrencyDollar,
    SortNumericDown,
    Check
} from 'react-bootstrap-icons';
import PropTypes from 'prop-types';
import styles from './SortingComponent.module.scss';

/**
 * Reusable Sorting Component
 * 
 * A dropdown component that provides sorting options with Bootstrap styling.
 * Features:
 * - Customizable sort options with icons
 * - Visual indication of selected sort option
 * - Responsive design
 * - Bootstrap theming support
 * 
 * Usage:
 * ```jsx
 * <SortingComponent
 *   currentSort="date-newest"
 *   onSortChange={(sortKey) => handleSort(sortKey)}
 *   sortOptions={customSortOptions} // optional
 *   buttonSize="sm" // optional
 * />
 * ```
 */

const defaultSortOptions = [
    {
        key: 'date-newest',
        label: 'By Date (Newest First)',
        icon: CalendarEvent,
    },
    {
        key: 'latest-entry',
        label: 'Latest Entry',
        icon: Clock,
    },
    {
        key: 'highest-amount',
        label: 'Highest Amount',
        icon: CurrencyDollar,
    },
    {
        key: 'lowest-amount',
        label: 'Lowest Amount',
        icon: SortNumericDown,
    }
];

function SortingComponent({
    onSortChange,
    currentSort = 'date-newest',
    sortOptions = defaultSortOptions,
    buttonSize = 'sm',
    buttonVariant = 'outline-primary',
    disabled = false
}) {
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const handleSortSelect = (sortKey) => {
        onSortChange(sortKey);
        setDropdownOpen(false);
    };

    const currentSortOption = sortOptions.find(option => option.key === currentSort);

    return (
        <Dropdown
            show={dropdownOpen}
            onToggle={setDropdownOpen}
            className={styles.sortingDropdown}
        >
            <Dropdown.Toggle
                variant={buttonVariant}
                size={buttonSize}
                disabled={disabled}
                className={`${styles.sortButton} d-flex align-items-center gap-2`}
            >
                <SortDown size={16} />
                Sort
            </Dropdown.Toggle>

            <Dropdown.Menu className={styles.sortMenu}>
                <div className={styles.menuHeader}>
                    <SortDown size={16} className="me-2" />
                    Sort Options
                </div>

                {sortOptions.map((option) => {
                    const IconComponent = option.icon;
                    const isSelected = currentSort === option.key;

                    return (
                        <Dropdown.Item
                            key={option.key}
                            onClick={() => handleSortSelect(option.key)}
                            className={`${styles.sortOption} ${isSelected ? styles.selected : ''}`}
                        >
                            <div className="d-flex align-items-center justify-content-between w-100">
                                <div className="d-flex align-items-center gap-3">
                                    <IconComponent
                                        size={16}
                                        className={styles.optionIcon}
                                    />
                                    <span className={styles.optionLabel}>
                                        {option.label}
                                    </span>
                                </div>
                                {isSelected && (
                                    <Check
                                        size={16}
                                        className={styles.checkIcon}
                                    />
                                )}
                            </div>
                        </Dropdown.Item>
                    );
                })}
            </Dropdown.Menu>
        </Dropdown>
    );
}

SortingComponent.propTypes = {
    onSortChange: PropTypes.func.isRequired,
    currentSort: PropTypes.string,
    sortOptions: PropTypes.arrayOf(PropTypes.shape({
        key: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        icon: PropTypes.elementType.isRequired,
    })),
    buttonSize: PropTypes.oneOf(['sm', 'md', 'lg']),
    buttonVariant: PropTypes.string,
    disabled: PropTypes.bool,
};

export default SortingComponent;
export { defaultSortOptions };