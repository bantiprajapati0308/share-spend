import React from 'react';
import { Button } from 'react-bootstrap';
import { ArrowLeft, Download } from 'react-bootstrap-icons';
import PropTypes from 'prop-types';
import styles from '../styles/MasterReport.module.scss';


function ReportHeader({
    onBack,
    onExport,
    exportLabel = "Export CSV",
}) {
    return (
        <div className={styles.header}>
            <div className={`${styles.backButtonWrapper} d-flex justify-content-between align-items-center`}>
                <Button
                    variant="outline-secondary"
                    onClick={onBack}
                    className={styles.backBtn}
                >
                    <ArrowLeft size={18} /> Back
                </Button>
                {onExport && (
                    <Button
                        variant="success"
                        onClick={onExport}
                        className={styles.exportBtn}
                    >
                        <Download size={18} /> {exportLabel}
                    </Button>
                )}
            </div>
        </div>
    );
}

ReportHeader.propTypes = {
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    onBack: PropTypes.func.isRequired,
    onExport: PropTypes.func,
    exportLabel: PropTypes.string,
    children: PropTypes.node
};

export default ReportHeader;