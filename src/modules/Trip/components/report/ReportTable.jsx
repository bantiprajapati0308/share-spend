import React from 'react';
import { Table } from 'react-bootstrap';

function ReportTable({ headers, data, renderRow, maxHeight = null, emptyMessage = "No data found" }) {
    const tableStyle = maxHeight ? {
        maxHeight,
        overflowY: 'auto',
        overflowX: 'auto',
        boxShadow: '0 2px 8px #2196f322',
        border: '1px solid #e3e3e3',
        background: '#f8fafc'
    } : {};

    return (
        <div className="bg-white" style={tableStyle}>
            <Table responsive bordered hover className="mb-0 align-middle text-nowrap">
                <thead className="table-primary">
                    <tr>
                        {headers.map((header, index) => (
                            <th key={index} className={header.className || ''}>
                                {header.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.length > 0 ? (
                        data.map((item, index) => renderRow(item, index))
                    ) : (
                        <tr>
                            <td colSpan={headers.length} className="text-center text-muted py-4">
                                {emptyMessage}
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </div>
    );
}

export default ReportTable;