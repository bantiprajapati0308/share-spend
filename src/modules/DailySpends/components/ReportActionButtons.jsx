import PropTypes from 'prop-types';
import { Button } from 'react-bootstrap';
import styles from '../styles/DailySpends.module.scss';

function ReportActionButtons({
    onMasterClick,
}) {
    return (
        <div className={styles.reportActionsTop}>
            <Button
                variant="outline-primary"
                onClick={onMasterClick}
                className={styles.reportBtn}
                size="sm"
            >
                📈 Master Report
            </Button>

        </div>
    );
}

ReportActionButtons.propTypes = {
    onMasterClick: PropTypes.func.isRequired,
    onLimitsClick: PropTypes.func.isRequired,
};

export default ReportActionButtons;
