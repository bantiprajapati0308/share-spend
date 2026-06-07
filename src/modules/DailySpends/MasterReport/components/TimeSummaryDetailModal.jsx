import React from 'react';
import { Modal } from 'react-bootstrap';
import PropTypes from 'prop-types';
import ExpenseList from '../../components/ExpenseList';

import { formatCurrencyINR } from '../../../../Util';

function TimeSummaryDetailModal({ show, onHide, title, transactions, isIncome, dateHide = false }) {
    const totalAmount = transactions.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);

    return (
        <Modal show={show} onHide={onHide} size="md" centered>
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <ExpenseList
                    expenses={transactions}
                    title={title}
                    // Hide edit/delete by passing no-op handlers
                    dateHide={dateHide}
                    onDelete={undefined}
                    onEdit={undefined}
                />
            </Modal.Body>
            <Modal.Footer className="d-flex justify-content-between align-items-center">
                <h4 className='ms-4'> Total:</h4>
                <div className="fw-semibold me-4 pe-1">
                    <h5 className={isIncome ? 'text-success' : 'text-danger'}>
                        {formatCurrencyINR(totalAmount)}
                    </h5>
                </div>
            </Modal.Footer>
        </Modal>
    );
}

TimeSummaryDetailModal.propTypes = {
    show: PropTypes.bool.isRequired,
    onHide: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    transactions: PropTypes.array.isRequired,
    isIncome: PropTypes.bool
};

export default TimeSummaryDetailModal;
