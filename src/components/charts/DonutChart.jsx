import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import PropTypes from 'prop-types';
import ChartWrapper from './ChartWrapper';
import { DONUT_CHART_OPTIONS } from './chartTheme';
import { preparePieData, formatCurrency } from './chartUtils';

/**
 * DonutChart Component
 * Renders a donut chart using Chart.js
 */
const DonutChart = ({
    data,
    labelKey = 'category',
    valueKey = 'amount',
    title,
    subtitle,
    size = 'medium',
    loading = false,
    error = null,
    currency = '₹',
    showPercentages = true,
    centerText = null,
    customOptions = {},
    onSliceClick = null,
    className = '',
    colorPalette = 'default',
    ...wrapperProps
}) => {
    // Prepare chart data
    const chartData = useMemo(() => {
        if (!data || data.length === 0) {
            return { labels: [], datasets: [] };
        }

        return preparePieData(data, labelKey, valueKey, colorPalette);
    }, [data, labelKey, valueKey, colorPalette]);

    // Calculate total for center text
    const total = useMemo(() => {
        if (!chartData.datasets || chartData.datasets.length === 0) return 0;
        return chartData.datasets[0].data.reduce((sum, value) => sum + value, 0);
    }, [chartData]);

    // Chart options with dynamic configuration
    const chartOptions = useMemo(() => {
        const options = {
            ...DONUT_CHART_OPTIONS,
            ...customOptions,
            plugins: {
                ...DONUT_CHART_OPTIONS.plugins,
                tooltip: {
                    ...DONUT_CHART_OPTIONS.plugins?.tooltip,
                    callbacks: {
                        label: (context) => {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);

                            if (showPercentages) {
                                return `${label}: ${formatCurrency(value, currency)} (${percentage}%)`;
                            } else {
                                return `${label}: ${formatCurrency(value, currency)}`;
                            }
                        },
                        ...customOptions.plugins?.tooltip?.callbacks,
                    },
                },
            },
            onClick: onSliceClick ? (event, elements) => {
                if (elements.length > 0) {
                    const element = elements[0];
                    const dataIndex = element.index;
                    const label = chartData.labels[dataIndex];
                    const value = chartData.datasets[0].data[dataIndex];
                    const total = chartData.datasets[0].data.reduce((a, b) => a + b, 0);
                    const percentage = ((value / total) * 100).toFixed(1);

                    onSliceClick({
                        label,
                        value,
                        percentage,
                        dataIndex,
                    });
                }
            } : undefined,
        };

        return options;
    }, [customOptions, currency, showPercentages, onSliceClick, chartData]);

    // Handle empty data
    if (!loading && (!data || data.length === 0)) {
        return (
            <ChartWrapper
                title={title}
                subtitle={subtitle}
                size={size}
                className={className}
                error="No data available to display"
                {...wrapperProps}
            >
                <div />
            </ChartWrapper>
        );
    }

    return (
        <ChartWrapper
            title={title}
            subtitle={subtitle}
            size={size}
            loading={loading}
            error={error}
            className={className}
            {...wrapperProps}
        >
            <div style={{ position: 'relative' }}>
                <Doughnut
                    data={chartData}
                    options={chartOptions}
                />
                {centerText && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            textAlign: 'center',
                            pointerEvents: 'none',
                        }}
                    >
                        {typeof centerText === 'string' ? (
                            <div className="text-muted">
                                <div className="fw-bold fs-5">{formatCurrency(total, currency)}</div>
                                <div className="small">{centerText}</div>
                            </div>
                        ) : (
                            centerText
                        )}
                    </div>
                )}
            </div>
        </ChartWrapper>
    );
};

DonutChart.propTypes = {
    data: PropTypes.arrayOf(PropTypes.object).isRequired,
    labelKey: PropTypes.string,
    valueKey: PropTypes.string,
    title: PropTypes.string,
    subtitle: PropTypes.string,
    size: PropTypes.oneOf(['small', 'medium', 'large', 'xlarge']),
    loading: PropTypes.bool,
    error: PropTypes.string,
    currency: PropTypes.string,
    showPercentages: PropTypes.bool,
    centerText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    customOptions: PropTypes.object,
    onSliceClick: PropTypes.func,
    className: PropTypes.string,
    colorPalette: PropTypes.oneOf(['default', 'dark', 'pastel', 'business']),
};

export default DonutChart;