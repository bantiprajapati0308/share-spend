import React, { useState, useEffect } from 'react';
import { Row, Col, Button } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from '../styles/DateRangePicker.module.scss';
import { parseLocalDate } from '../utils/dateUtils';

function DateRangePicker({ onDateRangeChange, defaultStartDate, defaultEndDate }) {
    const normalizeStartOfDay = (val) => {
        const d = parseLocalDate(val);
        if (!d) return null;
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const normalizeEndOfDay = (val) => {
        const d = parseLocalDate(val);
        if (!d) return null;
        d.setHours(23, 59, 59, 999);
        return d;
    };

    const [startDate, setStartDate] = useState(normalizeStartOfDay(defaultStartDate));
    const [endDate, setEndDate] = useState(normalizeEndOfDay(defaultEndDate));

    // Sync internal state when pareFvnt updates props (e.g. after API load)
    useEffect(() => {
        setStartDate(normalizeStartOfDay(defaultStartDate));
    }, [defaultStartDate]);

    useEffect(() => {
        setEndDate(normalizeEndOfDay(defaultEndDate));
    }, [defaultEndDate]);

    const handleApply = () => {
        if (startDate && endDate) {
            const start = normalizeStartOfDay(startDate);
            const end = normalizeEndOfDay(endDate);
            if (start <= end) {
                onDateRangeChange({ startDate: start, endDate: end });
            } else {
                alert('Start date must be before end date');
            }
        } else {
            alert('Please select both start and end dates');
        }
    };

    const handleToday = () => {
        const today = new Date();
        const start = normalizeStartOfDay(today);
        const end = normalizeEndOfDay(today);
        setStartDate(start);
        setEndDate(end);
        onDateRangeChange({ startDate: start, endDate: end });
    };

    const handleThisMonth = () => {
        const now = new Date();
        const firstDay = normalizeStartOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
        const lastDay = normalizeEndOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
        setStartDate(firstDay);
        setEndDate(lastDay);
        onDateRangeChange({ startDate: firstDay, endDate: lastDay });
    };

    const handleLastMonth = () => {
        const now = new Date();
        const firstDay = normalizeStartOfDay(new Date(now.getFullYear(), now.getMonth() - 1, 1));
        const lastDay = normalizeEndOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
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
                                onChange={(d) => setStartDate(normalizeStartOfDay(d))}
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
                                onFocus={(e) => e.target.blur()}
                            />
                        </div>
                    </Col>
                    <Col md={5}>
                        <div className={styles.datePickerGroup}>
                            <label className={styles.label}>End Date</label>
                            <DatePicker
                                selected={endDate}
                                onChange={(d) => setEndDate(normalizeEndOfDay(d))}
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
                                onFocus={(e) => e.target.blur()}
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
