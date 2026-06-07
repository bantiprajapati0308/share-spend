import React from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import { getCurrencySymbol } from '../../../Util';

function MoneyInput({
    value,
    onChange,
    currency,
    maxAmount,
    error,
    label = "Amount",
    placeholder = "Enter amount...",
    disabled = false,
    required = true,
    ...props
}) {
    const handleChange = (e) => {
        const inputValue = e.target.value;

        // Allow empty input for user convenience while typing
        if (inputValue === '') {
            onChange('');
            return;
        }

        // Only allow positive numbers with up to 2 decimal places
        const numberValue = parseFloat(inputValue);
        if (!isNaN(numberValue) && numberValue >= 0) {
            onChange(inputValue);
        }
    };

    const handleBlur = (e) => {
        const inputValue = e.target.value;
        if (inputValue !== '' && !isNaN(parseFloat(inputValue))) {
            // Format to 2 decimal places on blur
            const formatted = parseFloat(inputValue).toFixed(2);
            onChange(formatted);
        }
    };

    return (
        <div className="mb-3">
            <Form.Label className="small fw-semibold mb-2" htmlFor={props.id}>
                {label} {required && <span className="text-danger">*</span>}
            </Form.Label>
            <InputGroup>
                <InputGroup.Text>{getCurrencySymbol(currency)}</InputGroup.Text>
                <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    // max={maxAmount}
                    value={value}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    disabled={disabled}
                    isInvalid={!!error}
                    aria-describedby={error ? `${props.id}-error` : undefined}
                    {...props}
                />
                <Form.Control.Feedback type="invalid" id={`${props.id}-error`}>
                    {error}
                </Form.Control.Feedback>
            </InputGroup>
            {maxAmount && (
                <Form.Text className="text-muted small">
                    Maximum: {getCurrencySymbol(currency)}{maxAmount.toFixed(2)}
                </Form.Text>
            )}
        </div>
    );
}

export default MoneyInput;