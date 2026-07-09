import { useState } from 'react';
import PropTypes from 'prop-types';
import { CashCoin, Plus, ShieldCheck } from 'react-bootstrap-icons';
import FloatingActionButton from '../../../components/common/FloatingActionButton';
import styles from '../styles/FloatingActionMenu.module.scss';

const actions = [
    { kind: 'lend', label: 'Lend Money', helper: 'You give money to someone', tone: 'lend', Icon: CashCoin },
    { kind: 'borrow', label: 'Borrow Money', helper: 'You take money from someone', tone: 'borrow', Icon: CashCoin },
    { kind: 'return', label: 'Money Returned', helper: 'Someone pays you back', tone: 'return', Icon: ShieldCheck },
    { kind: 'repay', label: 'Money Repaid', helper: 'You pay borrowed money', tone: 'repay', Icon: ShieldCheck },
];

function FloatingActionMenu({ onAction }) {
    const [open, setOpen] = useState(false);

    const handleAction = (kind) => {
        setOpen(false);
        onAction(kind);
    };

    return (
        <div className={`${styles.wrap} ${open ? styles.expanded : ''}`}>
            {open && (
                <div className={styles.scrim} onClick={() => setOpen(false)} aria-hidden="true" />
            )}
            <div className={styles.menu}>
                {open && actions.map(({ kind, label, helper, tone, Icon }) => (
                    <button type="button" key={kind} className={styles.action} onClick={() => handleAction(kind)}>
                        <span className={styles.actionText}>
                            <strong>{label}</strong>
                            <small> {helper}</small>
                        </span>
                        <i className={styles[tone]}><Icon size={16} /></i>
                    </button>
                ))}
                <FloatingActionButton
                    onClick={() => setOpen((value) => !value)}
                    ariaLabel="Quick actions"
                    expanded={open}
                >
                    <Plus size={24} />
                </FloatingActionButton>
            </div>
        </div>
    );
}

FloatingActionMenu.propTypes = {
    onAction: PropTypes.func.isRequired,
};

export default FloatingActionMenu;
