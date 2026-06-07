import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import PropTypes from 'prop-types';
import ChartWrapper from './ChartWrapper';
import { BAR_CHART_OPTIONS } from './chartTheme';
import { generateColors, formatCurrency } from './chartUtils';

/**
 * BarChart Component
 * Renders a standard bar chart using Chart.js
 */
const BarChart = ({
    data,
    labelKey = 'label',
    valueKey = 'value',
    title,
    subtitle,
    size = 'medium',
    loading = false,
    error = null,
    currency = '₹',
    horizontal = false,
    customOptions = {},
    onBarClick = null,
    className = '',
    colorScheme = 'default',
    ...wrapperProps
}) => {
    // Prepare chart data
    const chartData = useMemo(() => {
        if (!data || data.length === 0) {
            return { labels: [], datasets: [] };
        }

        const labels = data.map(item => item[labelKey]);
        const values = data.map(item => item[valueKey]);
        const colors = generateColors(values.length, 'transparent', 0.7);
        const borderColors = generateColors(values.length, 'solid');

        return {
            labels,
            datasets: [{
                label: 'Value',
                data: values,
                backgroundColor: colors,
                borderColor: borderColors,
                borderWidth: 1,
            }]
        };
    }, [data, labelKey, valueKey]);

    // Merge custom options with default options
    const chartOptions = useMemo(() => {
        const baseOptions = horizontal ? {
            ...BAR_CHART_OPTIONS,
            indexAxis: 'y',
            scales: {
                x: {
                    ...BAR_CHART_OPTIONS.scales.y,
                    ticks: {
                        ...BAR_CHART_OPTIONS.scales.y.ticks,
                        callback: function (value) {
                            return formatCurrency(value, currency);
                        },
                    },
                },
                y: BAR_CHART_OPTIONS.scales.x,
            },
        } : BAR_CHART_OPTIONS;

        const options = {
            ...baseOptions,
            ...customOptions,
            plugins: {
                ...baseOptions.plugins,
                ...customOptions.plugins,
                tooltip: {
                    ...baseOptions.plugins.tooltip,
                    callbacks: {
                        label: function (context) {
                            const value = context.parsed[horizontal ? 'x' : 'y'];
                            return `${context.label}: ${formatCurrency(value, currency)}`;
                        },
                        ...customOptions.plugins?.tooltip?.callbacks,
                    },
                },
            },
            scales: horizontal ? {
                ...baseOptions.scales,
                ...customOptions.scales,
            } : {
                ...baseOptions.scales,
                ...customOptions.scales,
                y: {
                    ...baseOptions.scales.y,
                    ticks: {
                        ...baseOptions.scales.y.ticks,
                        callback: function (value) {
                            return formatCurrency(value, currency);
                        },
                    },
                    ...customOptions.scales?.y,
                },
            },
            onClick: onBarClick ? (event, elements) => {
                if (elements.length > 0) {
                    const element = elements[0];
                    const dataIndex = element.index;
                    const label = chartData.labels[dataIndex];
                    const value = chartData.datasets[0].data[dataIndex];

                    onBarClick({
                        label,
                        value,
                        dataIndex,
                    });
                }
            } : undefined,
        };

        return options;
    }, [customOptions, currency, horizontal, onBarClick, chartData]);

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
            <Bar
                data={chartData}
                options={chartOptions}
            />
        </ChartWrapper>
    );
};

BarChart.propTypes = {
    data: PropTypes.arrayOf(PropTypes.object).isRequired,
    labelKey: PropTypes.string,
    valueKey: PropTypes.string,
    title: PropTypes.string,
    subtitle: PropTypes.string,
    size: PropTypes.oneOf(['small', 'medium', 'large', 'xlarge']),
    loading: PropTypes.bool,
    error: PropTypes.string,
    currency: PropTypes.string,
    horizontal: PropTypes.bool,
    customOptions: PropTypes.object,
    onBarClick: PropTypes.func,
    className: PropTypes.string,
    colorScheme: PropTypes.string,
};

export default BarChart;