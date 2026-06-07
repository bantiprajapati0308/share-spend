import React, { useRef, useEffect, useState } from 'react';
import { Card } from 'react-bootstrap';
import PropTypes from 'prop-types';
import './chartSetup';
import { CHART_SIZES } from './chartTheme';
import styles from '../../assets/scss/Charts.module.scss';

/**
 * Higher-Order Component for wrapping Chart.js components
 * Provides common functionality like loading states, error handling, and responsive containers
 */
const ChartWrapper = ({
    children,
    title,
    subtitle,
    size = 'medium',
    loading = false,
    error = null,
    className = '',
    headerActions = null,
    containerStyle = {},
    cardProps = {},
    ...props
}) => {
    const chartRef = useRef(null);
    const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const updateDimensions = () => {
            if (chartRef.current) {
                const { offsetWidth } = chartRef.current;
                const height = CHART_SIZES[size]?.height || 300;
                setChartDimensions({ width: offsetWidth, height });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);

        return () => window.removeEventListener('resize', updateDimensions);
    }, [size]);

    const renderContent = () => {
        if (loading) {
            return (
                <div className={styles.chartLoading}>
                    <div className="text-center">
                        <div className="spinner-border text-primary mb-2" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <div className="text-muted small">Loading chart data...</div>
                    </div>
                </div>
            );
        }

        if (error) {
            return (
                <div className={styles.chartError}>
                    <div className={styles.errorIcon}>
                        ⚠️
                    </div>
                    <div className={styles.errorMessage}>Chart Error</div>
                    <div className={styles.errorDetails}>{error}</div>
                </div>
            );
        }

        return (
            <div
                ref={chartRef}
                className={styles.chartContainer}
                style={{
                    height: CHART_SIZES[size]?.height || 300,
                    position: 'relative',
                    ...containerStyle
                }}
            >
                {React.cloneElement(children, {
                    ...props,
                    width: chartDimensions.width,
                    height: chartDimensions.height,
                })}
            </div>
        );
    };

    const hasHeader = title || subtitle || headerActions;

    return (
        <Card className={`${styles.chartWrapper} ${className}`} {...cardProps}>
            {hasHeader && (
                <Card.Header className="d-flex justify-content-between align-items-start bg-white border-bottom">
                    <div className="flex-grow-1">
                        {title && (
                            <h5 className="mb-0 fw-bold text-dark">
                                {title}
                            </h5>
                        )}
                        {subtitle && (
                            <p className="mb-0 text-muted small mt-1">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {headerActions && (
                        <div className="ms-2">
                            {headerActions}
                        </div>
                    )}
                </Card.Header>
            )}
            <Card.Body className="p-3">
                {renderContent()}
            </Card.Body>
        </Card>
    );
};

ChartWrapper.propTypes = {
    children: PropTypes.element.isRequired,
    title: PropTypes.string,
    subtitle: PropTypes.string,
    size: PropTypes.oneOf(['small', 'medium', 'large', 'xlarge']),
    loading: PropTypes.bool,
    error: PropTypes.string,
    className: PropTypes.string,
    headerActions: PropTypes.node,
    containerStyle: PropTypes.object,
    cardProps: PropTypes.object,
};

export default ChartWrapper;