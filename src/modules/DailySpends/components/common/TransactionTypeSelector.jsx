import PropTypes from 'prop-types';
import styles from '../../styles/TransactionTypeSelector.module.scss';

const DEFAULT_OPTIONS = [
    { value: 'spend', label: '💰 Spend' },
    { value: 'income', label: '📈 Income' },
];

/**
 * Pill-style toggle used in AddExpenseForm, CategoryManager, LimitsManager.
 * Pass a custom `options` array to override labels/values.
 */
function TransactionTypeSelector({ value, onChange, options, showLabel, label, compact }) {
    const opts = options || DEFAULT_OPTIONS;
    return (
        <div className={`${styles.pillToggle} ${compact ? styles.compact : ''}`}>
            {showLabel && <span className={styles.toggleLabel}>{label}</span>}
            <div className={styles.pillGroup}>
                {opts.map((opt) => (
                    <button
                        key={opt.value}
                        type="button"
                        className={`${styles.pillBtn} ${value === opt.value ? styles.pillBtnActive : ''}`}
                        onClick={() => onChange(opt.value)}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

TransactionTypeSelector.propTypes = {
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    options: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.string, label: PropTypes.string })),
    label: PropTypes.string,
    showLabel: PropTypes.bool,
    compact: PropTypes.bool,
};

TransactionTypeSelector.defaultProps = {
    options: null,
    label: 'Transaction Type',
    showLabel: false,
    compact: false,
};

export default TransactionTypeSelector;

