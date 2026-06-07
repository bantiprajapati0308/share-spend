import PropTypes from 'prop-types';
import TabToggle from '../../../components/common/TabToggle';

function TransactionViewToggle({ selectedType, onTypeChange }) {
    const transactionTabs = [
        { key: 'spend', label: 'Expenses', icon: '💸' },
        { key: 'income', label: 'Income', icon: '💵' }
    ];

    return (
        <TabToggle
            tabs={transactionTabs}
            activeTab={selectedType}
            onTabChange={onTypeChange}
        />
    );
}

TransactionViewToggle.propTypes = {
    selectedType: PropTypes.string.isRequired,
    onTypeChange: PropTypes.func.isRequired,
};

export default TransactionViewToggle;
