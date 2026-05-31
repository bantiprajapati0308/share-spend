import React, { useState, useEffect } from 'react';
import { Row, Col, Button } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from '../styles/DateRangePicker.module.scss';

function DateRangePicker({ onDateRangeChange, defaultStartDate, defaultEndDate }) {
    // Accepts: Date object, 'yyyy-MM-dd' string, or null
    const toDate = (val) => {
        if (!val) return null;
        if (val instanceof Date) return val;
        // String from API (e.g. "2024-01-15") — append local time to avoid UTC shift
        return new Date(val + 'T00:00:00');
    };

    const [startDate, setStartDate] = useState(toDate(defaultStartDate));
    const [endDate, setEndDate] = useState(toDate(defaultEndDate));

    // Sync internal state when parent updates props (e.g. after API load)
    useEffect(() => {
        setStartDate(toDate(defaultStartDate));
    }, [defaultStartDate]);

    useEffect(() => {
        setEndDate(toDate(defaultEndDate));
    }, [defaultEndDate]);

    const handleApply = () => {
        if (startDate && endDate) {
            if (startDate <= endDate) {
                onDateRangeChange({ startDate, endDate });
            } else {
                alert('Start date must be before end date');
            }
        } else {
            alert('Please select both start and end dates');
        }
    };

    const handleToday = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setStartDate(today);
        setEndDate(today);
        onDateRangeChange({ startDate: today, endDate: today });
    };

    const handleThisMonth = () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        setStartDate(firstDay);
        setEndDate(lastDay);
        onDateRangeChange({ startDate: firstDay, endDate: lastDay });
    };

    const handleLastMonth = () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
        setStartDate(firstDay);
        setEndDate(lastDay);
        onDateRangeChange({ startDate: firstDay, endDate: lastDay });
    };

    return (
        <div className={styles.dateRangeContainer}>
            <div className={styles.pickerSection}>
                <Row className="g-3">
                    <Col md={5}>
                        <div className={styles.datePickerGroup}>
                            <label className={styles.label}>Start Date</label>
                            <DatePicker
                                selected={startDate}
                                onChange={(d) => setStartDate(d)}
                                selectsStart
                                startDate={startDate}
                                endDate={endDate}
                                dateFormat="dd/MM/yyyy"
                                placeholderText="Select start date"
                                wrapperClassName={styles.datePickerFull}
                                className={styles.dateInput}
                                showMonthDropdown
                                showYearDropdown
                                dropdownMode="select"
                            />
                        </div>
                    </Col>
                    <Col md={5}>
                        <div className={styles.datePickerGroup}>
                            <label className={styles.label}>End Date</label>
                            <DatePicker
                                selected={endDate}
                                onChange={(d) => setEndDate(d)}
                                selectsEnd
                                startDate={startDate}
                                endDate={endDate}
                                minDate={startDate}
                                dateFormat="dd/MM/yyyy"
                                placeholderText="Select end date"
                                wrapperClassName={styles.datePickerFull}
                                className={styles.dateInput}
                                showMonthDropdown
                                showYearDropdown
                                dropdownMode="select"
                            />
                        </div>
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
                    <Button variant="outline-secondary" size="sm" onClick={handleToday} className={styles.presetBtn}>Today</Button>
                    <Button variant="outline-secondary" size="sm" onClick={handleThisMonth} className={styles.presetBtn}>This Month</Button>
                    <Button variant="outline-secondary" size="sm" onClick={handleLastMonth} className={styles.presetBtn}>Last Month</Button>
                </div>
            </div>
        </div>
    );
}

export default DateRangePicker;
