import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import PropTypes from 'prop-types';
import ChartWrapper from './ChartWrapper';
import { STACKED_BAR_OPTIONS } from './chartTheme';
import { prepareStackedBarData, formatCurrency } from './chartUtils';

/**
 * StackedBarChart Component
 * Renders a stacked bar chart using Chart.js
 */
const StackedBarChart = ({
    data,
    categories = [],
    labelKey = 'date',
    valueKey = 'amount',
    title,
    subtitle,
    size = 'medium',
    loading = false,
    error = null,
    currency = '₹',
    showValues = false,
    customOptions = {},
    onBarClick = null,
    className = '',
    colorPalette = 'default',
    ...wrapperProps
}) => {
    // Prepare chart data
    const chartData = useMemo(() => {
        if (!data || data.length === 0) {
            return { labels: [], datasets: [] };
        }

        return prepareStackedBarData(data, categories, labelKey, valueKey, colorPalette);
    }, [data, categories, labelKey, valueKey, colorPalette]);

    // Chart options with dynamic configuration
    const chartOptions = useMemo(() => {
        const options = {
            ...STACKED_BAR_OPTIONS,
            ...customOptions,
            plugins: {
                ...STACKED_BAR_OPTIONS.plugins,
                ...customOptions.plugins,
                legend: {
                    ...STACKED_BAR_OPTIONS.plugins?.legend,
                    ...customOptions.plugins?.legend,
                },
                tooltip: {
                    ...STACKED_BAR_OPTIONS.plugins?.tooltip,
                    ...customOptions.plugins?.tooltip,
                    callbacks: {
                        footer: showValues ? (tooltipItems) => {
                            const total = tooltipItems.reduce((sum, item) => sum + item.parsed.y, 0);
                            return `Total: ${formatCurrency(total, currency)}`;
                        } : undefined,
                        ...customOptions.plugins?.tooltip?.callbacks,
                    },
                },
            },
            scales: {
                ...STACKED_BAR_OPTIONS.scales,
                ...customOptions.scales,
                y: {
                    ...STACKED_BAR_OPTIONS.scales.y,
                    ticks: {
                        ...STACKED_BAR_OPTIONS.scales.y.ticks,
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
                    const datasetIndex = element.datasetIndex;
                    const dataIndex = element.index;
                    const dataset = chartData.datasets[datasetIndex];
                    const label = chartData.labels[dataIndex];
                    const value = dataset.data[dataIndex];

                    onBarClick({
                        category: dataset.label,
                        label,
                        value,
                        datasetIndex,
                        dataIndex,
                    });
                }
            } : undefined,
        };

        return options;
    }, [customOptions, currency, showValues, onBarClick, chartData]);
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

StackedBarChart.propTypes = {
    data: PropTypes.arrayOf(PropTypes.object).isRequired,
    categories: PropTypes.arrayOf(PropTypes.string),
    labelKey: PropTypes.string,
    valueKey: PropTypes.string,
    title: PropTypes.string,
    subtitle: PropTypes.string,
    size: PropTypes.oneOf(['small', 'medium', 'large', 'xlarge']),
    loading: PropTypes.bool,
    error: PropTypes.string,
    currency: PropTypes.string,
    showValues: PropTypes.bool,
    customOptions: PropTypes.object,
    onBarClick: PropTypes.func,
    className: PropTypes.string,
    colorPalette: PropTypes.oneOf(['default', 'dark', 'pastel', 'business']),
};
export default StackedBarChart;