import PropTypes from 'prop-types';
import styles from '../styles/DailySpends.module.scss';

function TransactionViewToggle({ selectedType, onTypeChange }) {
    return (
        <div className={styles.viewToggle}>
            <button
                className={`${styles.toggleBtn} ${selectedType === 'spend' ? styles.active : ''}`}
                onClick={() => onTypeChange('spend')}
            >
                💸 Expenses
            </button>
            <button
                className={`${styles.toggleBtn} ${selectedType === 'income' ? styles.active : ''}`}
                onClick={() => onTypeChange('income')}
            >
                💵 Income
            </button>
        </div>
    );
}

TransactionViewToggle.propTypes = {
    selectedType: PropTypes.string.isRequired,
    onTypeChange: PropTypes.func.isRequired,
};

export default TransactionViewToggle;
