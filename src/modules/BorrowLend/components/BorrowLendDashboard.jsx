import PropTypes from 'prop-types';
import { Bell, Calendar2, HouseDoor, Search } from 'react-bootstrap-icons';
import StatusBadge from './StatusBadge';
import { getInitials } from '../utils/ledgerViewModel';
import styles from '../styles/BorrowLendDashboard.module.scss';

function BorrowLendDashboard({
    people,
    totalLent,
    totalBorrowed,
    formatAmount,
    onSelectPerson,
}) {
    const remainingBalance = totalLent - totalBorrowed;
    const isPositiveBalance = remainingBalance >= 0;

    return (
        <div className={styles.screen}>
            <section className={styles.topSummary}>
                <div className={styles.cardGrid}>
                    <article className={styles.balanceCard}>
                        <div className={`${styles.iconWrap} ${styles.iconGreen}`}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <polyline points="19 12 12 19 5 12" />
                            </svg>
                        </div>
                        <span className={styles.cardLabel}>Total to Receive</span>
                        <strong className={`${styles.cardAmount} ${styles.owed}`}>{formatAmount(totalLent)}</strong>
                        <small>from lenders</small>
                    </article>

                    <article className={styles.balanceCard}>
                        <div className={`${styles.iconWrap} ${styles.iconRed}`}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <line x1="12" y1="19" x2="12" y2="5" />
                                <polyline points="5 12 12 5 19 12" />
                            </svg>
                        </div>
                        <span className={styles.cardLabel}>Total to Pay</span>
                        <strong className={`${styles.cardAmount} ${styles.owe}`}>{formatAmount(totalBorrowed)}</strong>
                        <small>to people</small>
                    </article>

                    <article className={`${styles.balanceCard} ${isPositiveBalance ? styles.balancePositive : styles.balanceNegative}`}>
                        <div className={styles.balanceFace}>{isPositiveBalance ? '₹' : '!'}</div>
                        <span className={styles.cardLabel}>Remaining</span>
                        <strong className={`${styles.cardAmount} ${isPositiveBalance ? styles.owed : styles.owe}`}>
                            {isPositiveBalance ? '' : '-'}{formatAmount(Math.abs(remainingBalance))}
                        </strong>
                        <small>{isPositiveBalance ? 'You will receive' : 'You owe more'}</small>
                    </article>
                </div>
            </section>

            <section className={styles.peopleHeader}>
                <h2>People ({people.length})</h2>
                <button aria-label="Search people" className={styles.searchButton}>
                    <Search size={16} />
                </button>
            </section>

            {people.length === 0 ? (
                <section className={styles.emptyState}>
                    <div className={styles.emptyIcon}>₹</div>
                    <h3>Start by adding your first transaction.</h3>
                    <p>Your person-wise ledger will appear here.</p>
                </section>
            ) : (
                <section className={styles.peopleList}>
                    {people.map((person) => (
                        <button
                            type="button"
                            key={person.key}
                            className={styles.personCard}
                            onClick={() => onSelectPerson(person)}
                        >
                            <span className={`${styles.avatar} ${person.type === 'took' ? styles.borrow : ''}`}>
                                {getInitials(person.personName)}
                            </span>
                            <span className={styles.personInfo}>
                                <strong>{person.personName}</strong>
                                <small>{person.subtitle}</small>
                            </span>
                            <span className={styles.amountInfo}>
                                <strong className={person.type === 'took' ? styles.owe : styles.owed}>
                                    {formatAmount(person.remaining)}
                                </strong>
                                <StatusBadge status={person.status} />
                            </span>
                        </button>
                    ))}
                </section>
            )}

            <nav className={styles.bottomNav} aria-label="Borrow lend navigation preview">
                <span><Calendar2 size={16} />Daily</span>
                <span className={styles.activeNav}>↗ Borrow/Lend</span>
                <span><HouseDoor size={16} />Trip</span>
                <span>⋯ More</span>
            </nav>
        </div>
    );
}

BorrowLendDashboard.propTypes = {
    people: PropTypes.arrayOf(PropTypes.object).isRequired,
    totalLent: PropTypes.number.isRequired,
    totalBorrowed: PropTypes.number.isRequired,
    formatAmount: PropTypes.func.isRequired,
    onSelectPerson: PropTypes.func.isRequired,
};

export default BorrowLendDashboard;
