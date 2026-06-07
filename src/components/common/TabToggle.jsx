import PropTypes from 'prop-types';
import styles from './TabToggle.module.scss';

/**
 * Reusable Tab Toggle Component
 * 
 * A horizontal tab switcher component that can be used anywhere in the app.
 * Features:
 * - Dynamic tab options with labels and optional icons
 * - Clean design matching the app's style system
 * - Responsive layout
 * 
 * Usage:
 * ```jsx
 * const tabs = [
 *   { key: 'category', label: 'By Category', icon: '📊' },
 *   { key: 'monthly', label: 'By Month', icon: '📅' },
 *   { key: 'recent', label: 'Recent', icon: '🕐' }
 * ];
 * 
 * <TabToggle
 *   tabs={tabs}
 *   activeTab="category"
 *   onTabChange={(key) => setActiveTab(key)}
 * />
 * ```
 */
function TabToggle({ tabs, activeTab, onTabChange, className = '' }) {
    return (
        <div className={`${styles.tabToggle} ${className}`}>
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    className={`${styles.toggleBtn} ${activeTab === tab.key ? styles.active : ''}`}
                    onClick={() => onTabChange(tab.key)}
                    type="button"
                >
                    {tab.icon && <span className={styles.tabIcon}>{tab.icon}</span>}
                    <span className={styles.tabLabel}>{tab.label}</span>
                </button>
            ))}
        </div>
    );
}

TabToggle.propTypes = {
    tabs: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            icon: PropTypes.string, // Optional emoji or icon
        })
    ).isRequired,
    activeTab: PropTypes.string.isRequired,
    onTabChange: PropTypes.func.isRequired,
    className: PropTypes.string,
};

export default TabToggle;