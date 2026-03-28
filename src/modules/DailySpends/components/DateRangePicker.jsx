import React, { useState } from 'react';
import { Form, Row, Col, Button } from 'react-bootstrap';
import styles from '../styles/DateRangePicker.module.scss';

function DateRangePicker({ onDateRangeChange, defaultStartDate, defaultEndDate }) {
    const [startDate, setStartDate] = useState(defaultStartDate || '');
    const [endDate, setEndDate] = useState(defaultEndDate || '');

    const handleStartDateChange = (e) => {
        setStartDate(e.target.value);
    };

    const handleEndDateChange = (e) => {
        setEndDate(e.target.value);
    };

    const handleApply = () => {
        if (startDate && endDate) {
            if (new Date(startDate) <= new Date(endDate)) {
                onDateRangeChange({
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                });
            } else {
                alert('Start date must be before end date');
            }
        } else {
            alert('Please select both start and end dates');
        }
    };

    const handleToday = () => {
        const today = new Date().toISOString().split('T')[0];
        setStartDate(today);
        setEndDate(today);
        onDateRangeChange({
            startDate: new Date(today),
            endDate: new Date(today),
        });
    };

    const handleThisMonth = () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const start = firstDay.toISOString().split('T')[0];
        const end = lastDay.toISOString().split('T')[0];

        setStartDate(start);
        setEndDate(end);
        onDateRangeChange({
            startDate: firstDay,
            endDate: lastDay,
        });
    };

    const handleLastMonth = () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);

        const start = firstDay.toISOString().split('T')[0];
        const end = lastDay.toISOString().split('T')[0];

        setStartDate(start);
        setEndDate(end);
        onDateRangeChange({
            startDate: firstDay,
            endDate: lastDay,
        });
    };

    return (
        <div className={styles.dateRangeContainer}>
            <div className={styles.pickerSection}>
                <Row className="g-3">
                    <Col md={5}>
                        <Form.Group>
                            <Form.Label className={styles.label}>Start Date</Form.Label>
                            <Form.Control
                                type="date"
                                value={startDate}
                                onChange={handleStartDateChange}
                                className={styles.dateInput}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={5}>
                        <Form.Group>
                            <Form.Label className={styles.label}>End Date</Form.Label>
                            <Form.Control
                                type="date"
                                value={endDate}
                                onChange={handleEndDateChange}
                                className={styles.dateInput}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={2}>
                        <Button
                            variant="primary"
                            onClick={handleApply}
                            className={styles.applyBtn}
                        >
                            Apply
                        </Button>
                    </Col>
                </Row>
            </div>

            <div className={styles.presets}>
                <div className={styles.presetsLabel}>Quick Presets:</div>
                <div className={styles.presetButtons}>
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={handleToday}
                        className={styles.presetBtn}
                    >
                        Today
                    </Button>
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={handleThisMonth}
                        className={styles.presetBtn}
                    >
                        This Month
                    </Button>
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={handleLastMonth}
                        className={styles.presetBtn}
                    >
                        Last Month
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default DateRangePicker;
