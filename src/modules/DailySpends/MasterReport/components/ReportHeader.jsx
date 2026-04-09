import React from 'react';
import { Button } from 'react-bootstrap';
import { ArrowLeft, Download } from 'react-bootstrap-icons';
import PropTypes from 'prop-types';
import styles from '../styles/MasterReport.module.scss';

/**
 * Reusable report header component
 * Provides back navigation, title, and action buttons
 */
function ReportHeader({
    title,
    subtitle,
    onBack,
    onExport,
    exportLabel = "Export CSV",
    children
}) {
    return (
        <div className={styles.header}>
            <div className={styles.backButtonWrapper}>
                <Button
                    variant="outline-secondary"
                    onClick={onBack}
                    className={styles.backBtn}
                >
                    <ArrowLeft size={18} /> Back
                </Button>
            </div>

            <div className={styles.title}>
                <h2>{title}</h2>
                {subtitle && (
                    <p className={styles.subtitle}>
                        {subtitle}
                    </p>
                )}
            </div>

            <div className={styles.headerActions}>
                {children}
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