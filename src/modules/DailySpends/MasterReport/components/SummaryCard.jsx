import React from 'react';
import { Card } from 'react-bootstrap';
import PropTypes from 'prop-types';
import styles from '../styles/MasterReport.module.scss';

/**
 * Reusable summary card component
 * Can be used in multiple places to display summary information
 */
function SummaryCard({
    label,
    value,
    subtext,
    variant = 'default',
    currencySymbol = '',
    className = ''
}) {
    const cardClass = `${styles.summaryCard} ${variant !== 'default' ? styles[variant] : ''} ${className}`;

    return (
        <Card className={cardClass}>
            <Card.Body>
                <p className={styles.cardLabel}>{label}</p>
                <h3 className={styles.cardAmount}>
                    {currencySymbol}{value}
                </h3>
                {subtext && (
                    <p className={styles.cardSubtext}>
                        {subtext}
                    </p>
                )}
            </Card.Body>
        </Card>
    );
}

SummaryCard.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    subtext: PropTypes.string,
    variant: PropTypes.oneOf(['default', 'income', 'highlight', 'success', 'warning', 'danger']),
    currencySymbol: PropTypes.string,
    className: PropTypes.string
};

export default SummaryCard;