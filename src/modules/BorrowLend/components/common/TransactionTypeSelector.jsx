import PropTypes from 'prop-types';
import { TRANSACTION_TYPES, getTransactionTypeOptions } from '../../constants/transactionTypes';
import styles from '../../styles/TransactionTypeSelector.module.scss';

/**
 * Reusable Transaction Type Selector for Borrow/Lend
 * Handles lend/borrow selection with consistent radio button styling
 */
function TransactionTypeSelector({
    value,
    onChange,
    label = 'Transaction Type',
    showLabel = true,
    variant = 'inline' // 'inline' or 'stacked'
}) {
    const options = getTransactionTypeOptions();

    return (
        <div className={`${styles.typeSelector} ${styles[variant]}`}>
            {showLabel && <label className={styles.label}>{label}</label>}
            <div className={styles.radioGroup}>
                {options.map((option) => (
                    <label key={option.id} className={styles.radioLabel}>
                        <input
                            type="radio"
                            name="borrowLendType"
                            value={option.id}
                            checked={value === option.id}
                            onChange={(e) => onChange(e.target.value)}
                        />
                        <span className={styles.radioText}>{option.emoji} {option.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}

const transactionTypeIds = Object.values(TRANSACTION_TYPES);

TransactionTypeSelector.propTypes = {
    value: PropTypes.oneOf(transactionTypeIds).isRequired,
    onChange: PropTypes.func.isRequired,
    label: PropTypes.string,
    showLabel: PropTypes.bool,
    variant: PropTypes.oneOf(['inline', 'stacked']),
};

export default TransactionTypeSelector;
