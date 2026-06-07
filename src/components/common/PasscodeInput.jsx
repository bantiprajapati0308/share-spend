import React, { useState } from 'react';
import { Form, InputGroup, Button } from 'react-bootstrap';
import { EyeFill, EyeSlashFill, ShieldLock } from 'react-bootstrap-icons';

function PasscodeInput({
    value,
    onChange,
    placeholder = "Enter passcode (optional)",
    required = false,
    label = "Passcode",
    helperText = "Leave empty for unrestricted access"
}) {
    const [showPasscode, setShowPasscode] = useState(false);

    const togglePasscodeVisibility = () => {
        setShowPasscode(!showPasscode);
    };

    return (
        <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">
                <ShieldLock size={16} className="me-2" />
                {label} {required && <span style={{ color: 'red' }}>*</span>}
            </Form.Label>
            <InputGroup>
                <Form.Control
                    type={showPasscode ? "text" : "password"}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    required={required}
                />
                {value && (
                    <Button
                        variant="outline-secondary"
                        onClick={togglePasscodeVisibility}
                        style={{ borderLeft: 0 }}
                    >
                        {showPasscode ? <EyeSlashFill size={16} /> : <EyeFill size={16} />}
                    </Button>
                )}
            </InputGroup>
            {helperText && (
                <Form.Text className="text-muted">
                    {helperText}
                </Form.Text>
            )}
        </Form.Group>
    );
}

export default PasscodeInput;