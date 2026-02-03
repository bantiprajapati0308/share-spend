import React from 'react';
import { Button } from 'react-bootstrap';
import { FileEarmarkExcel } from 'react-bootstrap-icons';

function ExportActions({ onExportExcel }) {
    return (
        <div className="d-flex gap-2 mb-4 flex-wrap">
            <Button
                variant="success"
                className="d-flex align-items-center gap-2 fw-semibold shadow-sm px-3 py-2"
                onClick={onExportExcel}
                style={{ borderRadius: 8 }}
            >
                <FileEarmarkExcel size={18} /> Export as Excel
            </Button>
        </div>
    );
}

export default ExportActions;