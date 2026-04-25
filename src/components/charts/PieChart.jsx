import React, { useMemo } from 'react';
import { Pie } from 'react-chartjs-2';
import PropTypes from 'prop-types';
import ChartWrapper from './ChartWrapper';
import { PIE_CHART_OPTIONS } from './chartTheme';
import { preparePieData, formatCurrency } from './chartUtils';

/**
 * PieChart Component
 * Renders a pie chart using Chart.js
 */
const PieChart = ({
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

    // Chart options with dynamic configuration
    const chartOptions = useMemo(() => {
        const options = {
            ...PIE_CHART_OPTIONS,
            ...customOptions,
            plugins: {
                ...PIE_CHART_OPTIONS.plugins,
                tooltip: {
                    ...PIE_CHART_OPTIONS.plugins?.tooltip,
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
            <Pie
                data={chartData}
                options={chartOptions}
            />
        </ChartWrapper>
    );
};

PieChart.propTypes = {
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
    customOptions: PropTypes.object,
    onSliceClick: PropTypes.func,
    className: PropTypes.string,
    colorPalette: PropTypes.oneOf(['default', 'dark', 'pastel', 'business']),
};

export default PieChart;