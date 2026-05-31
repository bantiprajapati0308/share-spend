import PropTypes from 'prop-types';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from './DatePickerInput.module.scss';

/**
 * Shared date picker input.
 *
 * Props:
 *   label        — field label text
 *   value        — selected date as 'yyyy-MM-dd' string (matches API format)
 *   onChange     — called with 'yyyy-MM-dd' string (or '' when cleared)
 *   minDate      — earliest selectable date as 'yyyy-MM-dd' string (optional)
 *   maxDate      — latest selectable date as 'yyyy-MM-dd' string (optional)
 *   required     — marks field required (default false)
 *   isClearable  — shows clear × button (default false)
 *   placeholder  — input placeholder text
 */
function DatePickerInput({ label, value, onChange, minDate, maxDate, required, isClearable, placeholder }) {
    // Convert 'yyyy-MM-dd' string → local midnight Date (avoids UTC day-shift on iOS/Safari)
    const toDate = (str) => (str ? new Date(str + 'T00:00:00') : null);

    // Convert Date → 'yyyy-MM-dd' string — safe on all browsers/locales
    const toYMD = (d) => {
        if (!d) return '';
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    return (
        <div className={styles.wrapper}>
            {label && <label className={styles.label}>{label}</label>}
            <DatePicker
                selected={toDate(value)}
                onChange={(d) => onChange(toYMD(d))}
                dateFormat="dd/MM/yyyy"
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
};

DatePickerInput.defaultProps = {
    label: '',
    value: '',
    minDate: null,
    maxDate: null,
    required: false,
    isClearable: false,
    placeholder: 'Select date',
};

export default DatePickerInput;
