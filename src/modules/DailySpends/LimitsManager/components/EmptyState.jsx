import PropTypes from 'prop-types';
import { Button } from 'react-bootstrap';
import { Plus } from 'react-bootstrap-icons';
import styles from '../styles/LimitsManager.module.scss';

/**
 * EmptyState Component
 * Displays when no limits exist for a type
 */
function EmptyState({ limitType, onAddClick }) {
    const titleText = limitType === 'income' ? 'Income Limits' : 'Spending Limits';
    const descriptionText = limitType === 'income'
        ? 'Set income targets for your categories'
        : 'Set spending limits to control your expenses';

    return (
        <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
                <span>📊</span>
            </div>
            <h5>No {titleText} Yet</h5>
            <p>{descriptionText}</p>
            <Button
                variant="primary"
                onClick={onAddClick}
                className={styles.emptyButton}
            >
                <Plus size={16} /> Add First {limitType === 'income' ? 'Income' : 'Spending'} Limit
            </Button>
        </div>
    );
}

EmptyState.propTypes = {
    limitType: PropTypes.oneOf(['spend', 'income']).isRequired,
    onAddClick: PropTypes.func.isRequired,
};

export default EmptyState;
