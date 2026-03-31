import PropTypes from 'prop-types';
import styles from './TabFilter.module.scss';

/**
 * Reusable Tab Filter Component
 * Used for filtering content by tabs (e.g., All, Spend, Income, etc.)
 *
 * @param {Array} tabs - Array of tab objects: { id, label, count }
 * @param {string} activeTab - Currently active tab id
 * @param {function} onTabChange - Callback when tab is clicked
 */
function TabFilter({ tabs, activeTab, onTabChange }) {
    if (!tabs || tabs.length === 0) return null;

    return (
        <div className={styles.tabFilter}>
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                    onClick={() => onTabChange(tab.id)}
                    type="button"
                >
                    <span className={styles.label}>{tab.label}</span>
                    {tab.count !== undefined && (
                        <span className={styles.count}>({tab.count})</span>
                    )}
                </button>
            ))}
        </div>
    );
}

TabFilter.propTypes = {
    tabs: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            count: PropTypes.number,
        })
    ).isRequired,
    activeTab: PropTypes.string.isRequired,
    onTabChange: PropTypes.func.isRequired,
};

export default TabFilter;
