import PropTypes from 'prop-types';
import { Accordion } from 'react-bootstrap';
import DateRangePicker from './DateRangePicker';
import styles from '../styles/DailySpends.module.scss';

function DateRangeAccordion({
    startDate,
    endDate,
    onDateRangeChange
}) {
    const formatDateRange = () => {
        const start = startDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        const end = endDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        return `${start} - ${end}`;
    };

    return (
        <Accordion className={styles.dateRangeAccordion} defaultActiveKey="" flush>
            <Accordion.Item eventKey="0" className={styles.accordionItem}>
                <Accordion.Header className={styles.accordionHeader}>
                    <span className={styles.dateDisplayLabel}>
                        Selected Range: <strong>{formatDateRange()}</strong>
                    </span>
                </Accordion.Header>
                <Accordion.Body className={styles.accordionBody}>
                    <DateRangePicker
                        onDateRangeChange={onDateRangeChange}
                        defaultStartDate={startDate}
                        defaultEndDate={endDate}
                    />
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );
}

DateRangeAccordion.propTypes = {
    startDate: PropTypes.instanceOf(Date).isRequired,
    endDate: PropTypes.instanceOf(Date).isRequired,
    onDateRangeChange: PropTypes.func.isRequired,
};

export default DateRangeAccordion;
