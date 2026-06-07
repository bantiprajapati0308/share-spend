// Chart theme configurations and color palettes

export const CHART_COLORS = {
    primary: '#007bff',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40',

    // Enhanced color palette with 30 colors (mix of dark and pastel)
    palette: [
        // Dark vibrant colors (1-10)
        '#2E86AB', '#A23B72', '#F18F01', '#C73E1D', '#7209B7',
        '#2A5A5B', '#264653', '#E76F51', '#F4A261', '#E9C46A',

        // Medium tones (11-20)
        '#457B9D', '#E63946', '#F77F00', '#FCBF49', '#F72585',
        '#4361EE', '#4CC9F0', '#7209B7', '#F72585', '#4895EF',

        // Pastel colors (21-30)
        '#FFD6E8', '#E4C1F9', '#D0F4DE', '#FCF6BD', '#FFE5CC',
        '#C7CEEA', '#FFC8DD', '#CDB4DB', '#A2D2FF', '#F8AD9D'
    ],

    // Specific palettes for different use cases
    darkPalette: [
        '#2E86AB', '#A23B72', '#F18F01', '#C73E1D', '#7209B7',
        '#2A5A5B', '#264653', '#E76F51', '#F4A261', '#E9C46A',
        '#457B9D', '#E63946', '#F77F00', '#FCBF49', '#F72585'
    ],

    pastelPalette: [
        '#FFD6E8', '#E4C1F9', '#D0F4DE', '#FCF6BD', '#FFE5CC',
        '#C7CEEA', '#FFC8DD', '#CDB4DB', '#A2D2FF', '#F8AD9D',
        '#B7E4C7', '#95D5B2', '#74C69D', '#52B788', '#40916C'
    ],

    // Business/Professional colors
    businessPalette: [
        '#003f5c', '#2f4b7c', '#665191', '#a05195', '#d45087',
        '#f95d6a', '#ff7c43', '#ffa600', '#58508d', '#bc5090'
    ],

    // Gradient colors
    gradients: {
        blue: ['rgba(46, 134, 171, 0.8)', 'rgba(46, 134, 171, 0.2)'],
        purple: ['rgba(162, 59, 114, 0.8)', 'rgba(162, 59, 114, 0.2)'],
        orange: ['rgba(241, 143, 1, 0.8)', 'rgba(241, 143, 1, 0.2)'],
        red: ['rgba(199, 62, 29, 0.8)', 'rgba(199, 62, 29, 0.2)'],
        green: ['rgba(40, 167, 69, 0.8)', 'rgba(40, 167, 69, 0.2)'],
    },
};

// Common chart options used across all chart types
export const COMMON_OPTIONS = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        intersect: false,
        mode: 'index',
    },
    plugins: {
        legend: {
            position: 'top',
            labels: {
                padding: 20,
                usePointStyle: true,
                font: {
                    size: 14,
                    family: "'Inter', sans-serif",
                },
            },
        },
        tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
            displayColors: true,
            titleFont: {
                size: 14,
                weight: 'bold',
            },
            bodyFont: {
                size: 13,
            },
        },
    },
    scales: {
        x: {
            grid: {
                display: false,
            },
            ticks: {
                font: {
                    size: 11,
                    family: "'Inter', sans-serif",
                },
                color: '#6c757d',
            },
        },
        y: {
            grid: {
                color: 'rgba(0, 0, 0, 0.05)',
                drawBorder: false,
            },
            ticks: {
                font: {
                    size: 11,
                    family: "'Inter', sans-serif",
                },
                color: '#6c757d',
            },
        },
    },
};

// Specific chart type options
export const BAR_CHART_OPTIONS = {
    ...COMMON_OPTIONS,
    plugins: {
        ...COMMON_OPTIONS.plugins,
        legend: {
            ...COMMON_OPTIONS.plugins.legend,
            display: true,
        },
    },
};

export const STACKED_BAR_OPTIONS = {
    ...BAR_CHART_OPTIONS,
    interaction: {
        intersect: true,
        mode: 'point',
    },
    scales: {
        ...BAR_CHART_OPTIONS.scales,
        x: {
            ...BAR_CHART_OPTIONS.scales.x,
            stacked: true,
        },
        y: {
            ...BAR_CHART_OPTIONS.scales.y,
            stacked: true,
        },
    },
};

export const LINE_CHART_OPTIONS = {
    ...COMMON_OPTIONS,
    elements: {
        line: {
            tension: 0.4,
            borderWidth: 3,
        },
        point: {
            radius: 4,
            hoverRadius: 6,
            borderWidth: 2,
        },
    },
};

export const PIE_CHART_OPTIONS = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'right',
            labels: {
                padding: 20,
                usePointStyle: true,
                font: {
                    size: 12,
                    family: "'Inter', sans-serif",
                },
            },
        },
        tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
            displayColors: true,
        },
    },
};

export const DONUT_CHART_OPTIONS = {
    ...PIE_CHART_OPTIONS,
    plugins: {
        ...PIE_CHART_OPTIONS.plugins,
        legend: {
            ...PIE_CHART_OPTIONS.plugins.legend,
            position: 'bottom',
        },
    },
    cutout: '60%',
};

// Chart size configurations
export const CHART_SIZES = {
    small: { height: 200 },
    medium: { height: 300 },
    large: { height: 400 },
    xlarge: { height: 500 },
};