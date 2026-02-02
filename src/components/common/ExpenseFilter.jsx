import React from 'react';
import { Row, Col, Form, Button } from 'react-bootstrap';
import Select from 'react-select';
import { Search, X } from 'react-bootstrap-icons';

function ExpenseFilter({ filters, onFilterChange, members, onClearFilters }) {
    const memberOptions = members.map(member => ({
        value: member,
        label: member
    }));

    const handleInputChange = (field, value) => {
        onFilterChange({
            ...filters,
            [field]: value
        });
    };

    const handleMultiSelectChange = (field, selectedOptions) => {
        const values = selectedOptions ? selectedOptions.map(option => option.value) : [];
        onFilterChange({
            ...filters,
            [field]: values
        });
    };

    const clearAllFilters = () => {
        onClearFilters();
    };

    const hasActiveFilters = () => {
        return filters.name ||
            filters.amount ||
            (filters.paidBy && filters.paidBy.length > 0) ||
            (filters.participants && filters.participants.length > 0);
    };

    return (
        <div className="mb-3 p-3" style={{
            background: '#f8f9fa',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
            <Row className="g-3 align-items-end">
                <Col md={3}>
                    <Form.Label className="fw-semibold text-muted mb-1">
                        <Search size={14} className="me-1" />
                        Filter by Name
                    </Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Search expense name..."
                        value={filters.name || ''}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        style={{ borderRadius: '6px' }}
                    />
                </Col>

                <Col md={2}>
                    <Form.Label className="fw-semibold text-muted mb-1">
                        Filter by Amount
                    </Form.Label>
                    <Form.Control
                        type="number"
                        placeholder="Min amount..."
                        value={filters.amount || ''}
                        onChange={(e) => handleInputChange('amount', e.target.value)}
                        style={{ borderRadius: '6px' }}
                    />
                </Col>

                <Col md={3}>
                    <Form.Label className="fw-semibold text-muted mb-1">
                        Filter by Paid By
                    </Form.Label>
                    <Select
                        isMulti
                        options={memberOptions}
                        value={memberOptions.filter(option =>
                            filters.paidBy && filters.paidBy.includes(option.value)
                        )}
                        onChange={(selected) => handleMultiSelectChange('paidBy', selected)}
                        placeholder="Select members..."
                        styles={{
                            control: (base) => ({
                                ...base,
                                borderRadius: '6px',
                                border: '1px solid #ced4da',
                                fontSize: '14px'
                            })
                        }}
                        theme={(theme) => ({
                            ...theme,
                            colors: {
                                ...theme.colors,
                                primary: '#0d6efd',
                                primary25: '#e3f2fd'
                            }
                        })}
                    />
                </Col>

                <Col md={3}>
                    <Form.Label className="fw-semibold text-muted mb-1">
                        Filter by Participants
                    </Form.Label>
                    <Select
                        isMulti
                        options={memberOptions}
                        value={memberOptions.filter(option =>
                            filters.participants && filters.participants.includes(option.value)
                        )}
                        onChange={(selected) => handleMultiSelectChange('participants', selected)}
                        placeholder="Select participants..."
                        styles={{
                            control: (base) => ({
                                ...base,
                                borderRadius: '6px',
                                border: '1px solid #ced4da',
                                fontSize: '14px'
                            })
                        }}
                        theme={(theme) => ({
                            ...theme,
                            colors: {
                                ...theme.colors,
                                primary: '#0d6efd',
                                primary25: '#e3f2fd'
                            }
                        })}
                    />
                </Col>

                <Col md={1}>
                    {hasActiveFilters() && (
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={clearAllFilters}
                            title="Clear all filters"
                            className="d-flex align-items-center justify-content-center"
                            style={{ borderRadius: '6px', height: '38px' }}
                        >
                            <X size={16} />
                        </Button>
                    )}
                </Col>
            </Row>

            {hasActiveFilters() && (
                <Row className="mt-2">
                    <Col>
                        <small className="text-muted">
                            <em>Filters applied - showing filtered results</em>
                        </small>
                    </Col>
                </Row>
            )}
        </div>
    );
}

export default ExpenseFilter;