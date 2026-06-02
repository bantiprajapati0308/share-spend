import React, { useState } from 'react';
import { BoxArrowDown, BoxArrowDownRight, BoxArrowUp, Trash3, PencilSquare } from 'react-bootstrap-icons';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import styles from '../styles/DailySpends.module.scss';
import { formatCurrencyINR, getCurrencySymbol } from '../../../Util';
import { DeleteModal } from '../../../utils/CustomModal';

function ExpenseItem({ expense, onDelete, onEdit, dateHide = false }) {
    const currency = localStorage.getItem('defaultCurrency') || 'INR';
    const currencySymbol = getCurrencySymbol(currency);
    const incomeTypeData = expense.type;
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleConfirmDelete = () => {
        setShowDeleteModal(false);
        onDelete(expense.id);
    };

    return (
        <>
            <DeleteModal
                showModal={showDeleteModal}
                setShowModal={setShowDeleteModal}
                modalHeader="Delete Transaction"
                onClick={handleConfirmDelete}
            >
                Are you sure you want to delete <strong>{expense.name}</strong>? This action cannot be undone.
            </DeleteModal>
            <div className="d-flex align-items-center justify-content-between border-0 rounded-3 px-3 py-2 mb-2 bg-white shadow-sm">
                {/* Left Section */}
                <div className="flex-grow-1 overflow-hidden">
                    {/* Line 1 */}
                    <div className="d-flex justify-content-between align-items-center">
                        <div
                            className="fw-semibold text-dark text-truncate"
                            title={expense.name || ''}
                            style={{ maxWidth: '70%' }}
                        >
                            {expense.name}
                        </div>
                    </div>
                    {/* Line 2 */}
                    <div className="d-flex justify-content-between align-items-center mt-1">
                        <div className="text-muted text-truncate">
                            <span className="badge bg-light text-dark border me-2">
                                {expense.categoryIcon || '📝'}{expense.category}
                            </span>
                            {expense.notes && (
                                <OverlayTrigger
                                    placement="top"
                                    overlay={
                                        <Tooltip id={`note-tooltip-${expense.id}`}>
                                            {expense.notes}
                                        </Tooltip>
                                    }
                                >
                                    <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle">
                                        Notes
                                    </span>
                                </OverlayTrigger>
                            )}
                        </div>

                    </div>
                </div>
                <div className='d-flex gap-1'>
                    <div className={`fw-bold ${incomeTypeData === 'income' ? 'text-success' : 'text-danger'} d-flex flex-column align-items-center justify-content-end fs-6`}>
                        {incomeTypeData === 'income' ? <BoxArrowDown size={18} className='me-1' /> : <BoxArrowUp size={18} className='mb-1' />}
                        <div> {formatCurrencyINR(expense.amount)}</div>
                    </div>
                    <div className='d-flex gap-1 flex-column align-items-center'>
                        {/* Action Buttons (hide if no handlers) */}
                        {(typeof onEdit === 'function' || typeof onDelete === 'function') && (
                            <div className="d-flex gap-1 ms-2">
                                {typeof onEdit === 'function' && (
                                    <button
                                        className="btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                                        style={{ width: '32px', height: '32px' }}
                                        onClick={() => onEdit(expense)}
                                        title="Edit expense"
                                    >
                                        <PencilSquare size={16} className="text-warning" />
                                    </button>
                                )}
                                {typeof onDelete === 'function' && (
                                    <button
                                        className="btn btn-sm btn-light border-0 d-flex align-items-center justify-content-center"
                                        style={{ width: '32px', height: '32px' }}
                                        onClick={() => setShowDeleteModal(true)}
                                        title="Delete expense"
                                    >
                                        <Trash3 size={18} className="text-danger" />
                                    </button>
                                )}
                            </div>
                        )}
                        <div
                            className="badge border border-primary-subtle text-primary-emphasis bg-primary-subtle text-nowrap ms-1 fw-semibold"
                            title={new Date(expense.date).toLocaleDateString('en-US', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                            })}
                            style={{ letterSpacing: '0.2px', fontSize: '0.78rem' }}
                            hidden={dateHide}
                        >
                            {new Date(expense.date).toLocaleDateString('en-US', {
                                day: 'numeric',
                                month: 'short'
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ExpenseItem;
