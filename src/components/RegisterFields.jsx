import { Form, Row, Col } from "react-bootstrap";
import styles from "../assets/scss/AuthScreen.module.scss";
import DatePickerInput from "../utils/DatePickerInput";

const FieldInput = ({ label, type, value, onChange, placeholder, required, maxDate }) => (
    <Form.Group className={styles.formGroup}>
        {type === "date" ? (
            <DatePickerInput
                label={label}
                value={value}
                onChange={onChange}
                maxDate={maxDate}
                placeholder={placeholder}
            />
        ) : (
            <>
                <Form.Label className={styles.label}>{label}</Form.Label>
                <Form.Control
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    required={required}
                    className={styles.input}
                    placeholder={placeholder}
                />
            </>
        )}
    </Form.Group>
);

const RegisterFields = ({
    firstName, setFirstName,
    lastName, setLastName,
    dateOfBirth, setDateOfBirth,
    mobile, setMobile,
    maxDobStr,
}) => {
    const fields = [
        [
            { label: "First Name", type: "text", value: firstName, onChange: setFirstName, placeholder: "First name", required: true },
            { label: "Last Name", type: "text", value: lastName, onChange: setLastName, placeholder: "Last name", required: true },
        ],
        [
            { label: "Date of Birth", type: "date", value: dateOfBirth, onChange: setDateOfBirth, placeholder: "DD/MM/YYYY", maxDate: maxDobStr },
            { label: "Mobile", type: "tel", value: mobile, onChange: setMobile, placeholder: "Mobile number", required: true },
        ],
    ];

    return (
        <>
            {fields.map((row, rowIdx) => (
                <Row key={rowIdx}>
                    {row.map((field) => (
                        <Col xs={6} key={field.label}>
                            <FieldInput {...field} />
                        </Col>
                    ))}
                </Row>
            ))}
        </>
    );
};

export default RegisterFields;
