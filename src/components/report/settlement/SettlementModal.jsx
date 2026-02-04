import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Alert, Form, Row, Col } from 'react-bootstrap';
import { CashCoin, X, ArrowLeftRight, Calculator } from 'react-bootstrap-icons';
import MoneyInput from './MoneyInput';
import MemberSelect from './MemberSelect';
import { validateSettlement } from '../../../utils/settlementCalculations';

function SettlementModal({
    show,
    onClose,
    onSubmit,
    transaction,
    members,
    currency,
    loading = false
}) {
    const [formData, setFormData] = useState({
        amount: '',
        payer: '',
        receiver: ''
    });
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState('');
    const [isCustomMode, setIsCustomMode] = useState(false);

    const amountInputRef = useRef(null);

    // Reset form when modal opens/closes or transaction changes
    useEffect(() => {
        if (show && transaction) {
            // Check if this is a custom settlement (empty from/to)
            const isCustomTransaction = !transaction.from || !transaction.to;

            setFormData({
                amount: isCustomTransaction ? '' : transaction.amount.toFixed(2),
                payer: transaction.from || '',
                receiver: transaction.to || ''
            });
            setErrors({});
            setSubmitError('');
            setIsCustomMode(isCustomTransaction); // Auto-enable custom mode for custom transactions
        } else if (!show) {
            // Reset when modal closes
            setFormData({ amount: '', payer: '', receiver: '' });
            setErrors({});
            setSubmitError('');
            setIsCustomMode(false);
        }
    }, [show, transaction]);

    // Focus amount input when modal opens
    useEffect(() => {
        if (show && amountInputRef.current) {
            const timer = setTimeout(() => {
                amountInputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [show]);

    const handleFieldChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Clear field-specific error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }

        // Clear submit error when user makes changes
        if (submitError) {
            setSubmitError('');
        }
    };

    const handleModeToggle = () => {
        setIsCustomMode(!isCustomMode);
        // Clear errors when switching modes
        setErrors({});
        setSubmitError('');

        // Reset to original values when switching back to automatic
        if (isCustomMode && transaction) {
            setFormData({
                amount: transaction.amount.toFixed(2),
                payer: transaction.from,
                receiver: transaction.to
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const amount = parseFloat(formData.amount);
        const maxAmount = isCustomMode ? Infinity : (transaction?.amount || 0);

        const validation = validateSettlement(amount, formData.payer, formData.receiver, maxAmount);

        if (!validation.isValid) {
            setErrors(validation.errors);
            return;
        }

        try {
            await onSubmit({
                amount,
                payer: formData.payer,
                receiver: formData.receiver,
                originalTransaction: transaction,
                isCustomSettlement: isCustomMode
            });
            // Modal will be closed by parent component on success
        } catch (error) {
            setSubmitError(error.message || 'Failed to process settlement. Please try again.');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!transaction) return null;

    return (
        <Modal
            show={show}
            onHide={onClose}
            centered
            backdrop="static"
            onKeyDown={handleKeyDown}
            aria-labelledby="settlement-modal-title"
        >
            <Modal.Header closeButton style={{
                background: 'linear-gradient(90deg, #28a745 0%, #20c997 100%)',
                color: '#fff',
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8
            }}>
                <Modal.Title id="settlement-modal-title">
                    <CashCoin className="me-2" size={20} />
                    {!transaction.from || !transaction.to ? 'Create Custom Settlement' : 'Settle Payment'}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body style={{ background: '#f8f9fa' }}>
                {submitError && (
                    <Alert variant="danger" className="mb-3">
                        <strong>Error:</strong> {submitError}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <MoneyInput
                        ref={amountInputRef}
                        id="settlement-amount"
                        label="Settlement Amount"
                        value={formData.amount}
                        onChange={(value) => handleFieldChange('amount', value)}
                        currency={currency}
                        maxAmount={isCustomMode ? null : (transaction.amount || null)}
                        error={errors.amount}
                        placeholder="Enter settlement amount..."
                        disabled={loading}
                    />
                    {!isCustomMode && transaction.from && transaction.to && (
                        <Form.Text className="text-muted mb-3 d-block">
                            Amount is pre-filled based on optimal settlement.
                        </Form.Text>
                    )}

                    <MemberSelect
                        id="settlement-payer"
                        label="Who is paying?"
                        value={formData.payer}
                        onChange={(value) => handleFieldChange('payer', value)}
                        members={members}
                        error={errors.payer}
                        disabled={loading || (!isCustomMode && transaction.from && transaction.to)}
                    />
                    {!isCustomMode && transaction.from && transaction.to && (
                        <Form.Text className="text-muted mb-3 d-block">
                            Payer is determined by optimal settlement calculation.
                        </Form.Text>
                    )}

                    <MemberSelect
                        id="settlement-receiver"
                        label="Who is receiving?"
                        value={formData.receiver}
                        onChange={(value) => handleFieldChange('receiver', value)}
                        members={members}
                        excludeMember={formData.payer}
                        error={errors.receiver}
                        disabled={loading || (!isCustomMode && transaction.from && transaction.to)}
                    />
                    {!isCustomMode && transaction.from && transaction.to && (
                        <Form.Text className="text-muted mb-3 d-block">
                            Receiver is determined by optimal settlement calculation.
                        </Form.Text>
                    )}
                </form>
            </Modal.Body>

            <Modal.Footer style={{ background: '#e3f2fd', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
                <Button
                    variant="outline-secondary"
                    onClick={onClose}
                    disabled={loading}
                >
                    <X className="me-1" size={16} />
                    Cancel
                </Button>
                <Button
                    variant="success"
                    onClick={handleSubmit}
                    disabled={loading || !formData.amount || !formData.payer || !formData.receiver}
                    style={{ minWidth: 100 }}
                >
                    {loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Processing...
                        </>
                    ) : (
                        <>
                            <CashCoin className="me-1" size={16} />
                            Settle
                        </>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default SettlementModal;