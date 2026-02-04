import React from 'react';
import { Table, Badge, Accordion } from 'react-bootstrap';
import { Clock, CheckCircle, Person } from 'react-bootstrap-icons';
import { getCurrencySymbol } from '../../../Util';
import styles from '../../../assets/scss/Report.module.scss';

function SettlementHistory({ settlements, currency, show = false }) {
    if (!settlements || settlements.length === 0) {
        return (
            <div className="text-center text-muted py-4">
                <Clock size={32} className="mb-2" />
                <p>No settlement history yet</p>
                <small>Settlements will appear here once processed</small>
            </div>
        );
    }

    const formatDate = (date) => {
        if (!date) return 'Unknown';

        const settlementDate = date instanceof Date ? date : new Date(date);

        return {
            date: settlementDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: '2-digit'
            }),
            time: settlementDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            })
        };
    };

    return (
        <div>
            <div className="d-flex align-items-center mb-3">
                <CheckCircle className="me-2 text-success" size={20} />
                <h6 className="mb-0 fw-bold">Settlement History ({settlements.length})</h6>
            </div>

            <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                border: '1px solid #e3e3e3',
                borderRadius: 8,
                background: '#fafafa'
            }}>
                <Table responsive hover className="mb-0 small">
                    <thead className="table-success sticky-top">
                        <tr>
                            <th style={{ minWidth: '80px' }}>Date</th>
                            <th style={{ minWidth: '70px' }}>From</th>
                            <th style={{ minWidth: '70px' }}>To</th>
                            <th style={{ minWidth: '70px' }}>Amount</th>
                            <th style={{ minWidth: '60px' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {settlements.map((settlement, index) => {
                            const dateTime = formatDate(settlement.createdAt);
                            return (
                                <tr key={settlement.id || index}>
                                    <td className="text-muted small">
                                        <div>{dateTime.date}</div>
                                        <div className="text-primary" style={{ fontSize: '0.75rem' }}>
                                            {dateTime.time}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <Person size={12} className="me-1 text-primary d-none d-md-inline" />
                                            <span className="fw-bold text-truncate" style={{ maxWidth: '80px' }}>
                                                {settlement.payer}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <Person size={12} className="me-1 text-success d-none d-md-inline" />
                                            <span className="fw-bold text-truncate" style={{ maxWidth: '80px' }}>
                                                {settlement.receiver}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="fw-bold text-success">
                                        <div>{getCurrencySymbol(currency)}{settlement.amount.toFixed(2)}</div>
                                    </td>
                                    <td>
                                        <Badge
                                            bg={settlement.status === 'completed' ? 'success' : 'warning'}
                                            className="text-uppercase"
                                            style={{ fontSize: '0.65rem' }}
                                        >
                                            {settlement.status === 'completed' ? '✓' : settlement.status}
                                        </Badge>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            </div>

            {/* Summary Statistics */}
            {settlements.length > 0 && (
                <div className="mt-3 p-2 bg-light rounded border">
                    <div className="row text-center small">
                        <div className="col-4">
                            <strong className="text-primary">{settlements.length}</strong>
                            <br />
                            <span className="text-muted">Settlements</span>
                        </div>
                        <div className="col-4">
                            <strong className="text-success">
                                {getCurrencySymbol(currency)}{
                                    settlements.reduce((total, s) => total + s.amount, 0).toFixed(2)
                                }
                            </strong>
                            <br />
                            <span className="text-muted">Total Settled</span>
                        </div>
                        <div className="col-4">
                            <strong className="text-info">
                                {new Set(settlements.flatMap(s => [s.payer, s.receiver])).size}
                            </strong>
                            <br />
                            <span className="text-muted">Members Involved</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SettlementHistory;