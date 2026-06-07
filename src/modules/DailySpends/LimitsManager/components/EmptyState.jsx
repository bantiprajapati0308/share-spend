import PropTypes from 'prop-types';
import { Plus } from 'react-bootstrap-icons';
import styles from '../styles/LimitsManager.module.scss';

/**
 * EmptyState — shown when no limits exist for the active type.
 */
function EmptyState({ limitType, onAddClick }) {
    const label = limitType === 'income' ? 'Income' : 'Spending';
    const description = limitType === 'income'
        ? 'Set income targets for your categories'
        : 'Set spending limits to control your expenses';

    return (
        <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📊</div>
            <p className={styles.emptyTitle}>No {label} Limits Yet</p>
            <p className={styles.emptyText}>{description}</p>
            <button type="button" className={styles.addBtn} onClick={onAddClick}>
                <Plus size={16} /> Add First {label} Limit
            </button>
        </div>
    );
}

EmptyState.propTypes = {
    limitType: PropTypes.oneOf(['spend', 'income']).isRequired,
    onAddClick: PropTypes.func.isRequired,
};

export default EmptyState;
