import PropTypes from 'prop-types';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from './DatePickerInput.module.scss';

/**
 * Shared date picker input.
 *
 * Props:
 *   label           — field label text
 *   value           — selected date as 'yyyy-MM-dd' string, or 'yyyy-MM-ddTHH:mm' when showTimeSelect=true
 *   onChange        — called with 'yyyy-MM-dd' string (or 'yyyy-MM-ddTHH:mm' when showTimeSelect=true)
 *   minDate         — earliest selectable date as 'yyyy-MM-dd' string (optional)
 *   maxDate         — latest selectable date as 'yyyy-MM-dd' string (optional)
 *   required        — marks field required (default false)
 *   isClearable     — shows clear × button (default false)
 *   placeholder     — input placeholder text
 *   showTimeSelect  — shows time picker alongside date (default false)
 *   timeIntervals   — minute step for time picker (default 15)
 */
function DatePickerInput({ label, value, onChange, minDate, maxDate, required, isClearable, placeholder, showTimeSelect, timeIntervals }) {
    // Convert value string → Date object
    const toDate = (str) => {
        if (!str) return null;
        // If string contains 'T' it's a datetime string, parse directly
        if (str.includes('T')) return new Date(str);
        // Date-only string — use local midnight to avoid UTC day-shift on iOS/Safari
        return new Date(str + 'T00:00:00');
    };

    // Convert Date → 'yyyy-MM-dd' or 'yyyy-MM-ddTHH:mm' depending on showTimeSelect
    const toString = (d) => {
        if (!d) return '';
        const y = d.getFullYear();
        const mo = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        if (showTimeSelect) {
            const h = String(d.getHours()).padStart(2, '0');
            const min = String(d.getMinutes()).padStart(2, '0');
            return `${y}-${mo}-${day}T${h}:${min}`;
        }
        return `${y}-${mo}-${day}`;
    };

    return (
        <div className={styles.wrapper}>
            {label && <label className={styles.label}>{label}</label>}
            <DatePicker
                selected={toDate(value)}
                onChange={(d) => onChange(toString(d))}
                dateFormat={showTimeSelect ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy'}
                placeholderText={placeholder}
                required={required}
                isClearable={isClearable}
                minDate={toDate(minDate)}
                maxDate={toDate(maxDate)}
                wrapperClassName={styles.wrapper}
                className={styles.input}
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                showTimeSelect={showTimeSelect}
                timeFormat="HH:mm"
                timeIntervals={timeIntervals}
                timeCaption="Time"
                onFocus={(e) => e.target.blur()}
            />
        </div>
    );
}

DatePickerInput.propTypes = {
    label: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    minDate: PropTypes.string,
    maxDate: PropTypes.string,
    required: PropTypes.bool,
    isClearable: PropTypes.bool,
    placeholder: PropTypes.string,
    showTimeSelect: PropTypes.bool,
    timeIntervals: PropTypes.number,
};

DatePickerInput.defaultProps = {
    label: '',
    value: '',
    minDate: null,
    maxDate: null,
    required: false,
    isClearable: false,
    placeholder: 'Select date',
    showTimeSelect: false,
    timeIntervals: 15,
};

export default DatePickerInput;
