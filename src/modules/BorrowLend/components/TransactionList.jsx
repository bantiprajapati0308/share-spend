
import PropTypes from 'prop-types';
import TabFilter from '../../../components/common/TabFilter';
import styles from '../styles/BorrowLend.module.scss';
import TransactionItem from './TransactionItem';
import { TRANSACTION_TYPES } from '../constants/transactionTypes';

function TransactionList({ transactions, filterType, onFilterChange, onDelete }) {
    const buildTabs = () => {
        const all = transactions.length;
        const gave = transactions.filter(t => t.type === TRANSACTION_TYPES.GAVE).length;
        const took = transactions.filter(t => t.type === TRANSACTION_TYPES.TOOK).length;

        return [
            { id: 'all', label: 'All Transactions', count: all },
            { id: TRANSACTION_TYPES.GAVE, label: 'Lent', count: gave },
            { id: TRANSACTION_TYPES.TOOK, label: 'Borrowed', count: took },
        ];
    };

    return (
        <div className={styles.transactionList}>
            <h3>Transaction History</h3>

            {transactions.length > 0 && (
                <TabFilter
                    tabs={buildTabs()}
                    activeTab={filterType}
                    onTabChange={onFilterChange}
                />
            )}

            {transactions.length === 0 ? (
                <div className={styles.noTransactions}>
                    <p>No transactions yet. Start tracking your lending and borrowing above!</p>
                </div>
            ) : (
                <div className={styles.transactionItemsContainer}>
                    {transactions.map((transaction) => (
                        <TransactionItem
                            key={transaction.id}
                            transaction={transaction}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

TransactionList.propTypes = {
    transactions: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            personName: PropTypes.string.isRequired,
            amount: PropTypes.number.isRequired,
            type: PropTypes.oneOf(['gave', 'took']).isRequired,
            date: PropTypes.string.isRequired,
            dueDate: PropTypes.string,
            description: PropTypes.string,
            createdAt: PropTypes.any,
        })
    ).isRequired,
    filterType: PropTypes.string.isRequired,
    onFilterChange: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
};

export default TransactionList;
