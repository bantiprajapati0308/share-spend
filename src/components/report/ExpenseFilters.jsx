import React from 'react';
import { Button, Form } from 'react-bootstrap';
import { Filter } from 'react-bootstrap-icons';
import Select from 'react-select';

function ExpenseFilters({
    showFilters,
    toggleFilters,
    filters,
    onFilterChange,
    onMultiSelectChange,
    onClearFilters,
    memberOptions,
    currency
}) {
    const hasActiveFilters = filters.name || filters.amount ||
        (filters.paidBy && filters.paidBy.length > 0) ||
        (filters.participants && filters.participants.length > 0);

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <Button
                    variant={showFilters ? "primary" : "outline-primary"}
                    size="sm"
                    onClick={toggleFilters}
                    className="d-flex align-items-center gap-1"
                >
                    <Filter size={14} />
                    Filters
                    {hasActiveFilters && (
                        <span className="badge bg-warning text-dark ms-1">ON</span>
                    )}
                </Button>
                {hasActiveFilters && (
                    <Button variant="outline-secondary" size="sm" onClick={onClearFilters}>
                        Clear
                    </Button>
                )}
            </div>

            {showFilters && (
                <div className="mb-3 p-3 border rounded-3" style={{ background: '#f8f9fa' }}>
                    <div className="mb-3">
                        <Form.Label className="small fw-semibold mb-2">Search by name</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Type expense name..."
                            value={filters.name || ''}
                            onChange={(e) => onFilterChange('name', e.target.value)}
                        />
                    </div>
                    <div className="mb-3">
                        <Form.Label className="small fw-semibold mb-2">Minimum amount</Form.Label>
                        <Form.Control
                            type="number"
                            placeholder={`Min amount in ${currency}...`}
                            value={filters.amount || ''}
                            onChange={(e) => onFilterChange('amount', e.target.value)}
                        />
                    </div>
                    <div className="mb-3">
                        <Form.Label className="small fw-semibold mb-2">Who paid</Form.Label>
                        <Select
                            isMulti
                            options={memberOptions}
                            value={memberOptions.filter(option =>
                                filters.paidBy && filters.paidBy.includes(option.value)
                            )}
                            onChange={(selected) => onMultiSelectChange('paidBy', selected)}
                            placeholder="Select who paid..."
                        />
                    </div>
                    <div className="mb-0">
                        <Form.Label className="small fw-semibold mb-2">Participants</Form.Label>
                        <Select
                            isMulti
                            options={memberOptions}
                            value={memberOptions.filter(option =>
                                filters.participants && filters.participants.includes(option.value)
                            )}
                            onChange={(selected) => onMultiSelectChange('participants', selected)}
                            placeholder="Select participants..."
                        />
                    </div>
                </div>
            )}
        </>
    );
}

export default ExpenseFilters;