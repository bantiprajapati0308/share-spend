import PropTypes from 'prop-types';
import styles from '../styles/StatusBadge.module.scss';

function StatusBadge({ status }) {
    const normalized = String(status || 'Pending').toLowerCase();
    return (
        <span className={`${styles.badge} ${styles[normalized] || styles.pending}`}>
            {status || 'Pending'}
        </span>
    );
}

StatusBadge.propTypes = {
    status: PropTypes.string,
};

StatusBadge.defaultProps = {
    status: 'Pending',
};

export default StatusBadge;
