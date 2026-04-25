import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import PropTypes from 'prop-types';
import ChartWrapper from './ChartWrapper';
import { LINE_CHART_OPTIONS } from './chartTheme';
import { prepareLineData, generateColors, formatCurrency } from './chartUtils';

/**
 * LineChart Component
 * Renders a line chart using Chart.js with support for multiple series
 */
const LineChart = ({
    data,
    series = [{ label: 'Value', aggregation: 'sum' }],
    labelKey = 'date',
    valueKey = 'amount',
    title,
    subtitle,
    size = 'medium',
    loading = false,
    error = null,
    currency = '₹',
    smooth = true,
    showPoints = true,
    fill = false,
    customOptions = {},
    onPointClick = null,
    className = '',
    ...wrapperProps
}) => {
    // Prepare chart data
    const chartData = useMemo(() => {
        if (!data || data.length === 0) {
            return { labels: [], datasets: [] };
        }

        const processedData = prepareLineData(data, labelKey, valueKey, series);

        // Apply styling to datasets
        processedData.datasets = processedData.datasets.map((dataset, index) => ({
            ...dataset,
            tension: smooth ? 0.4 : 0,
            pointRadius: showPoints ? 4 : 0,
            pointHoverRadius: showPoints ? 6 : 0,
            fill: series[index]?.fill || fill,
            backgroundColor: generateColors(1, 'transparent', 0.1)[0],
            borderColor: generateColors(series.length, 'solid')[index],
            borderWidth: 3,
        }));

        return processedData;
    }, [data, series, labelKey, valueKey, smooth, showPoints, fill]);

    // Merge custom options with default options
    const chartOptions = useMemo(() => {
        const options = {
            ...LINE_CHART_OPTIONS,
            ...customOptions,
            elements: {
                ...LINE_CHART_OPTIONS.elements,
                line: {
                    ...LINE_CHART_OPTIONS.elements.line,
                    tension: smooth ? 0.4 : 0,
                },
                point: {
                    ...LINE_CHART_OPTIONS.elements.point,
                    radius: showPoints ? 4 : 0,
                    hoverRadius: showPoints ? 6 : 0,
                },
                ...customOptions.elements,
            },
            plugins: {
                ...LINE_CHART_OPTIONS.plugins,
                ...customOptions.plugins,
                tooltip: {
                    ...LINE_CHART_OPTIONS.plugins.tooltip,
                    callbacks: {
                        label: function (context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            return `${label}: ${formatCurrency(value, currency)}`;
                        },
                        ...customOptions.plugins?.tooltip?.callbacks,
                    },
                },
            },
            scales: {
                ...LINE_CHART_OPTIONS.scales,
                ...customOptions.scales,
                y: {
                    ...LINE_CHART_OPTIONS.scales.y,
                    ticks: {
                        ...LINE_CHART_OPTIONS.scales.y.ticks,
                        callback: function (value) {
                            return formatCurrency(value, currency);
                        },
                    },
                    ...customOptions.scales?.y,
                },
            },
            onClick: onPointClick ? (event, elements) => {
                if (elements.length > 0) {
                    const element = elements[0];
                    const datasetIndex = element.datasetIndex;
                    const dataIndex = element.index;
                    const dataset = chartData.datasets[datasetIndex];
                    const label = chartData.labels[dataIndex];
                    const value = dataset.data[dataIndex];

                    onPointClick({
                        series: dataset.label,
                        label,
                        value,
                        datasetIndex,
                        dataIndex,
                    });
                }
            } : undefined,
        };

        return options;
    }, [customOptions, currency, smooth, showPoints, onPointClick, chartData]);

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
            <Line
                data={chartData}
                options={chartOptions}
            />
        </ChartWrapper>
    );
};

LineChart.propTypes = {
    data: PropTypes.arrayOf(PropTypes.object).isRequired,
    series: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string.isRequired,
        aggregation: PropTypes.oneOf(['sum', 'avg', 'count']),
        fill: PropTypes.bool,
    })),
    labelKey: PropTypes.string,
    valueKey: PropTypes.string,
    title: PropTypes.string,
    subtitle: PropTypes.string,
    size: PropTypes.oneOf(['small', 'medium', 'large', 'xlarge']),
    loading: PropTypes.bool,
    error: PropTypes.string,
    currency: PropTypes.string,
    smooth: PropTypes.bool,
    showPoints: PropTypes.bool,
    fill: PropTypes.bool,
    customOptions: PropTypes.object,
    onPointClick: PropTypes.func,
    className: PropTypes.string,
};

export default LineChart;