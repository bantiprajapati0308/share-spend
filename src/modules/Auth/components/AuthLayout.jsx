import PropTypes from 'prop-types';
import { Alert } from 'react-bootstrap';
import styles from '../styles/AuthLayout.module.scss';

/**
 * Full-screen wrapper shared by all auth views.
 * Renders the blob background image + centred white card.
 */
export default function AuthLayout({ children, error, onDismissError }) {
    return (
        <div className={styles.authBg}>
            <div className={styles.card}>
                {error && (
                    <Alert
                        variant="danger"
                        onClose={onDismissError}
                        dismissible
                        className={styles.errorAlert}
                    >
                        {error}
                    </Alert>
                )}
                {children}
            </div>
        </div>
    );
}

AuthLayout.propTypes = {
    children: PropTypes.node.isRequired,
    error: PropTypes.string,
    onDismissError: PropTypes.func,
};
