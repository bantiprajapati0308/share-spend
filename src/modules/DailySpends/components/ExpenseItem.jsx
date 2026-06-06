import React, { useState, useRef, useEffect } from 'react';
import { BoxArrowDown, BoxArrowUp, Trash3, PencilSquare, ThreeDotsVertical, CashStack, CreditCard2Front, CreditCard, Bank } from 'react-bootstrap-icons';
import { useSelector } from 'react-redux';
import styles from '../styles/DailySpends.module.scss';
import { formatCurrencyINR } from '../../../Util';
import { DeleteModal } from '../../../utils/CustomModal';

const PM_ICONS = {
    cash: <CashStack size={12} color="#28a745" />,
    upi: (
        <svg width="13" height="11" viewBox="0 0 30 24" fill="none">
            <polygon points="8,0 16,16 0,16" fill="#FF6B00" />
            <polygon points="22,24 14,8 30,8" fill="#00A651" />
        </svg>
    ),
    credit_card: <CreditCard2Front size={12} color="#6c757d" />,
    debit_card: <CreditCard size={12} color="#0d6efd" />,
    net_banking: <Bank size={12} color="#6610f2" />,
};

function ExpenseItem({ expense, onDelete, onEdit, dateHide = false }) {
    const incomeTypeData = expense.type;
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [popoverOpen, setPopoverOpen] = useState(false);
    const popoverRef = useRef(null);

    const paymentMethods = useSelector((state) => state.appConfig.paymentMethods);

    // Close popover when clicking outside
    useEffect(() => {
        if (!popoverOpen) return;
        const handler = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target)) {
                setPopoverOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [popoverOpen]);

    const handleConfirmDelete = () => {
        setShowDeleteModal(false);
        onDelete(expense.id);
    };

    // Parse date robustly — handles 'yyyy-MM-dd' and 'yyyy-MM-ddTHH:mm'
    const parsedDate = (() => {
        const raw = expense.date;
        if (!raw) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return new Date(raw + 'T00:00:00');
        return new Date(raw);
    })();

    const hasTime = expense.date && expense.date.includes('T');

    const dateLabel = parsedDate
        ? parsedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
        : '';

    const timeLabel = hasTime && parsedDate
        ? parsedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        : '';

    // Resolve payment method label from redux store; fall back to id
    const pmLabel = (() => {
        if (!expense.paymentMethodId) return null;
        const pm = paymentMethods.find((m) => m.value === expense.paymentMethodId);
        return pm ? pm.label : expense.paymentMethodId;
    })();

    const pmIcon = PM_ICONS[expense.paymentMethodId] ?? null;
    const showActions = typeof onEdit === 'function' || typeof onDelete === 'function';

    return (
        <>
            <DeleteModal
                showModal={showDeleteModal}
                setShowModal={setShowDeleteModal}
                modalHeader="Delete Transaction"
                onClick={handleConfirmDelete}
            >
                Are you sure you want to delete <strong>{expense.name}</strong>? This action cannot be undone.
            </DeleteModal>



            <div className={styles.expenseItemCard}>
                {/* Left: category emoji in colored box */}
                <div className={`${styles.categoryIconBox} ${incomeTypeData === 'income' ? styles.categoryIconBoxIncome : styles.categoryIconBoxSpend}`}>
                    {expense.categoryIcon || '📝'}
                </div>

                {/* Center: name, category/notes tags */}
                <div className={styles.expenseItemCenter}>
                    <div className={styles.expenseItemName} title={expense.name}>{expense.name}</div>
                    <div className={styles.expenseItemTags}>
                        <span className={styles.categoryBadge}>{expense.category}</span>
                        {expense.notes && <span className={styles.notesBadge}>Notes</span>}
                    </div>
                </div>

                {/* Right: amount row + pm below */}
                <div className={styles.expenseItemRight}>
                    <div className={styles.expenseItemInlineRow}>
                        <div className={styles.expenseItemMeta}>
                            {timeLabel && <span className={styles.timeLabel}>{timeLabel}</span>}
                            {!dateHide && dateLabel && <span className={styles.dateLabel}>{dateLabel}</span>}
                        </div>
                        <div className={`${styles.expenseItemAmount} ${incomeTypeData === 'income' ? styles.amountIncome : styles.amountSpend}`}>
                            {formatCurrencyINR(expense.amount)}
                        </div>
                        {showActions && (
                            <div ref={popoverRef} style={{ position: 'relative' }}>
                                <button
                                    className={styles.menuBtn}
                                    onClick={() => setPopoverOpen((o) => !o)}
                                    title="More options"
                                >
                                    <ThreeDotsVertical size={14} />
                                </button>
                                {popoverOpen && (
                                    <div className={styles.actionPopover}>
                                        {typeof onEdit === 'function' && (
                                            <button
                                                className={styles.actionPopoverItem}
                                                onClick={() => { setPopoverOpen(false); onEdit(expense); }}
                                            >
                                                <PencilSquare size={14} className="text-primary" />
                                                Edit Transaction
                                            </button>
                                        )}
                                        {typeof onDelete === 'function' && (
                                            <button
                                                className={`${styles.actionPopoverItem} ${styles.actionPopoverItemDanger}`}
                                                onClick={() => { setPopoverOpen(false); setShowDeleteModal(true); }}
                                            >
                                                <Trash3 size={14} />
                                                Delete Transaction
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    {pmLabel && (
                        <div className={styles.pmBadge}>
                            {pmIcon && <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '0.2rem' }}>{pmIcon}</span>}
                            {pmLabel}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default ExpenseItem;

