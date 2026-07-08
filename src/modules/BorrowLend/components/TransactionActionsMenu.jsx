import PropTypes from 'prop-types';
import { Dropdown } from 'react-bootstrap';
import { Eye, PencilSquare, ThreeDotsVertical, Trash3 } from 'react-bootstrap-icons';
import styles from '../styles/TransactionActionsMenu.module.scss';

function TransactionActionsMenu({ transaction, onEdit, onView, onDelete }) {
    return (
        <Dropdown align="end">
            <Dropdown.Toggle className={styles.moreButton} aria-label="Transaction actions">
                <ThreeDotsVertical size={15} />
            </Dropdown.Toggle>
            <Dropdown.Menu className={styles.menu}>
                <Dropdown.Item onClick={() => onEdit(transaction)}>
                    <PencilSquare size={14} /> Edit Transaction
                </Dropdown.Item>
                <Dropdown.Item onClick={() => onView(transaction)}>
                    <Eye size={14} /> View Details
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item className={styles.deleteItem} onClick={() => onDelete(transaction)}>
                    <Trash3 size={14} /> Delete Transaction
                </Dropdown.Item>
            </Dropdown.Menu>
        </Dropdown>
    );
}

TransactionActionsMenu.propTypes = {
    transaction: PropTypes.object.isRequired,
    onEdit: PropTypes.func.isRequired,
    onView: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
};

export default TransactionActionsMenu;
