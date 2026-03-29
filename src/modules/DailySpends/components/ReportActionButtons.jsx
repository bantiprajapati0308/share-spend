import PropTypes from 'prop-types';
import { Button } from 'react-bootstrap';
import styles from '../styles/DailySpends.module.scss';

function ReportActionButtons({
    onMasterClick,
    onLimitsClick
}) {
    return (
        <div className={styles.reportActionsTop}>
            {/* <Button
                variant="primary"
                onClick={onBreakdownClick}
                className={styles.reportBtn}
                size="sm"
            >
                📊 Breakdown Report
            </Button> */}
            <Button
                variant="outline-primary"
                onClick={onMasterClick}
                className={styles.reportBtn}
                size="sm"
            >
                📈 Master Report
            </Button>
            <Button
                variant="outline-secondary"
                onClick={onLimitsClick}
                className={styles.reportBtn}
                size="sm"
            >
                💰 Spending Limits
            </Button>
        </div>
    );
}

ReportActionButtons.propTypes = {
    onMasterClick: PropTypes.func.isRequired,
    onLimitsClick: PropTypes.func.isRequired,
};

export default ReportActionButtons;
