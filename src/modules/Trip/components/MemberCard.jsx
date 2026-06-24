import React from 'react';
import { Trash2 } from 'react-bootstrap-icons';
import styles from '../../../assets/scss/MemberCard.module.scss';

function MemberCard({ member, onRemove, onResendInvite }) {
    const getStatusBadge = () => {
        if (member.role === 'owner') {
            return <span className={`${styles.badge} ${styles.owner}`}>Owner</span>;
        }
        if (member.status === 'active' && member.email) {
            return <span className={`${styles.badge} ${styles.connected}`}>Connected</span>;
        }
        if (member.status === 'pending') {
            return <span className={`${styles.badge} ${styles.pending}`}>Pending</span>;
        }
        return <span className={`${styles.badge} ${styles.local}`}>Local Member</span>;
    };

    const getInitial = () => {
        return member.name.charAt(0).toUpperCase();
    };

    return (
        <div className={styles.card}>
            <div className={styles.avatar}>{getInitial()}</div>
            <div className={styles.content}>
                <div className={styles.name}>{member.name}</div>
                {member.email && (
                    <div className={styles.email}>{member.email}</div>
                )}
            </div>
            <div className={styles.badge}>{getStatusBadge()}</div>
            {onRemove && (
                <button
                    className={styles.removeBtn}
                    onClick={onRemove}
                    aria-label="Remove member"
                    type="button"
                >
                    <Trash2 size={16} />
                </button>
            )}
        </div>
    );
}

export default MemberCard;
