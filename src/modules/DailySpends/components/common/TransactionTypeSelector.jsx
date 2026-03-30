import PropTypes from 'prop-types';
import styles from '../../styles/TransactionTypeSelector.module.scss';

/**
 * Reusable Transaction Type Selector Component
 * Used in multiple places: AddExpenseForm, CategoryLimitsManagement, etc.
 * Handles spend/income selection with consistent styling
 */
function TransactionTypeSelector({
    value,
    onChange,
    label = 'Transaction Type',
    showLabel = true,
    variant = 'inline' // 'inline' or 'stacked'
}) {
    return (
        <div className={`${styles.typeSelector} ${styles[variant]}`}>
            {showLabel && <label className={styles.label}>{label}</label>}
            <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                    <input
                        type="radio"
                        name="transactionType"
                        value="spend"
                        checked={value === 'spend'}
                        onChange={(e) => onChange(e.target.value)}
                    />
                    <span className={styles.radioText}>💰 Spend</span>
                </label>
                <label className={styles.radioLabel}>
                    <input
                        type="radio"
                        name="transactionType"
                        value="income"
                        checked={value === 'income'}
                        onChange={(e) => onChange(e.target.value)}
                    />
                    <span className={styles.radioText}>📈 Income</span>
                </label>
            </div>
        </div>
    );
}

TransactionTypeSelector.propTypes = {
    value: PropTypes.oneOf(['spend', 'income']).isRequired,
    onChange: PropTypes.func.isRequired,
    label: PropTypes.string,
    showLabel: PropTypes.bool,
    variant: PropTypes.oneOf(['inline', 'stacked']),
};

export default TransactionTypeSelector;
