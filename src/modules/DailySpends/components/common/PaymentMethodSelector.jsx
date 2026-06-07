import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { CashStack, CreditCard2Front, CreditCard, Bank, CheckCircleFill } from 'react-bootstrap-icons';
import { useSelector } from 'react-redux';
import usePaymentMethods from '../../hooks/usePaymentMethods';
import styles from '../../styles/DailySpends.module.scss';

const PM_ICONS = {
    cash: <CashStack size={26} color="#28a745" />,
    upi: (
        <svg width="30" height="24" viewBox="0 0 30 24" fill="none">
            <polygon points="8,0 16,16 0,16" fill="#FF6B00" />
            <polygon points="22,24 14,8 30,8" fill="#00A651" />
        </svg>
    ),
    credit_card: <CreditCard2Front size={26} color="#6c757d" />,
    debit_card: <CreditCard size={26} color="#0d6efd" />,
    net_banking: <Bank size={26} color="#6610f2" />,
};

function PaymentMethodSelector({ value, onChange }) {
    const { paymentMethods } = usePaymentMethods();
    const transactions = useSelector(state => state.dailySpends.transactions);

    const mostUsedId = useMemo(() => {
        const counts = {};
        transactions.forEach(t => {
            if (t.paymentMethodId) counts[t.paymentMethodId] = (counts[t.paymentMethodId] || 0) + 1;
        });
        const keys = Object.keys(counts);
        return keys.length > 0 ? keys.reduce((a, b) => counts[a] > counts[b] ? a : b) : null;
    }, [transactions]);

    if (!paymentMethods.length) return null;

    return (
        <div className={styles.formGroup}>
            <label>Payment Method *</label>
            <div className={styles.paymentMethodCards}>
                {paymentMethods.map(pm => {
                    const isSelected = value === pm.value;
                    const isMostUsed = mostUsedId === pm.value;
                    return (
                        <div
                            key={pm.value}
                            className={`${styles.paymentMethodCard} ${isSelected ? styles.paymentMethodCardSelected : ''}`}
                            onClick={() => onChange(isSelected ? null : pm.value)}
                            role="radio"
                            aria-checked={isSelected}
                            tabIndex={0}
                            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onChange(isSelected ? null : pm.value)}
                        >
                            <div className={styles.pmRadio}>
                                {isSelected
                                    ? <CheckCircleFill size={17} color="#667eea" />
                                    : <div className={styles.pmRadioEmpty} />}
                            </div>
                            <div className={styles.pmIcon}>
                                {PM_ICONS[pm.value] ?? <CreditCard2Front size={26} color="#6c757d" />}
                            </div>
                            <div className={styles.pmLabel}>{pm.label}</div>
                            {isMostUsed && <span className={styles.pmMostUsed}>Most Used</span>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

PaymentMethodSelector.propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
};

export default PaymentMethodSelector;
