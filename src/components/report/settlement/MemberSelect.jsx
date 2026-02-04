import React from 'react';
import { Form } from 'react-bootstrap';

function MemberSelect({
    value,
    onChange,
    members,
    excludeMember = null,
    error,
    label,
    placeholder = "Select member...",
    disabled = false,
    required = true,
    ...props
}) {
    const availableMembers = excludeMember
        ? members.filter(member => member !== excludeMember)
        : members;

    return (
        <div className="mb-3">
            <Form.Label className="small fw-semibold mb-2" htmlFor={props.id}>
                {label} {required && <span className="text-danger">*</span>}
            </Form.Label>
            <Form.Select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                isInvalid={!!error}
                aria-describedby={error ? `${props.id}-error` : undefined}
                {...props}
            >
                <option value="">{placeholder}</option>
                {availableMembers.map((member) => (
                    <option key={member} value={member}>
                        {member}
                    </option>
                ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid" id={`${props.id}-error`}>
                {error}
            </Form.Control.Feedback>
        </div>
    );
}

export default MemberSelect;