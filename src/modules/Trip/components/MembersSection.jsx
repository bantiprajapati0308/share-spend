import React from 'react';
import { Trash2, Send } from 'react-bootstrap-icons';
import MemberCard from './MemberCard';
import styles from '../../../assets/scss/MembersSection.module.scss';

function MembersSection({
    members,
    onRemoveMember,
    onAddMember,
    newMember,
    onNewMemberChange,
}) {
    return (
        <div className={styles.container}>
            <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>
                    Members ({members.length})
                </h3>
                <p className={styles.sectionDesc}>
                    Send invite link or add by email/phone
                </p>
            </div>

            {/* Existing Members */}
            <div className={styles.membersList}>
                {members.map(member => (
                    <MemberCard
                        key={member.id}
                        member={member}
                        onRemove={
                            member.role !== 'owner'
                                ? () => onRemoveMember(member.id)
                                : null
                        }
                    />
                ))}
            </div>

            {/* Add New Member */}
            <div className={styles.addMemberSection}>
                <div className={styles.inputRow}>
                    <input
                        type="text"
                        className={styles.input}
                        placeholder="Member name *"
                        value={newMember.name}
                        onChange={e =>
                            onNewMemberChange({
                                ...newMember,
                                name: e.target.value,
                            })
                        }
                        maxLength={50}
                    />
                    <input
                        type="email"
                        className={styles.input}
                        placeholder="Email (optional)"
                        value={newMember.email}
                        onChange={e =>
                            onNewMemberChange({
                                ...newMember,
                                email: e.target.value,
                            })
                        }
                    />
                    <button
                        className={styles.addBtn}
                        onClick={onAddMember}
                        type="button"
                        aria-label="Add member"
                    >
                        <span>+</span> Add
                    </button>
                </div>
                <p className={styles.helperText}>
                    Use comma to add multiple emails
                </p>
            </div>

            {/* Info Box */}
            <div className={styles.infoBox}>
                <p className={styles.infoText}>
                    💡 You can manage members anytime after creation.
                </p>
            </div>
        </div>
    );
}

export default MembersSection;
