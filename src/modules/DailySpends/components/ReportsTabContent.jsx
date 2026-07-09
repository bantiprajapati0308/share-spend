import { useState, useMemo } from 'react';
import { Spinner, Alert } from 'react-bootstrap';
import { useReportData } from '../reporting/hooks/useReportData';
import ChartsCarousel from '../reporting/components/ChartsCarousel';

function ReportsTabContent({ transactions, startDate, endDate }) {
    const [chartTransactionType, setChartTransactionType] = useState('spend');

    const reportData = useReportData(startDate, endDate, transactions);

    const weeklyDataObj = useMemo(
        () => reportData.getWeeklyBreakdownData(chartTransactionType),
        // reportData.getWeeklyBreakdownData is a new fn ref each render;
        // depend on the actual inputs that drive the computation instead
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [reportData.transactions, startDate, endDate, chartTransactionType]
    );

    const pieChartDataByType = useMemo(() => {
        const categoryTotals = {};
        reportData.transactions
            .filter(tx => tx.type === chartTransactionType)
            .forEach(tx => {
                const amount = parseFloat(tx.amount) || 0;
                if (amount <= 0) return;
                const cat = tx.category || 'Other';
                categoryTotals[cat] = (categoryTotals[cat] || 0) + amount;
            });
        return Object.entries(categoryTotals)
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount);
    }, [reportData.transactions, chartTransactionType]);

    const legendRows = Math.max(1, Math.ceil((weeklyDataObj.categories?.length || 1) / 4));
    const legendMaxHeight = Math.min(170, 45 + legendRows * 14);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                align: 'start',
                labels: {
                    boxWidth: 8,
                    boxHeight: 8,
                    padding: 4,
                    font: { size: 9, family: "'Inter', sans-serif" },
                    usePointStyle: true,
                    textAlign: 'left',
                },
                maxHeight: legendMaxHeight,
                onClick: (evt, legendItem, legend) => {
                    const index = legendItem.datasetIndex !== undefined ? legendItem.datasetIndex : legendItem.index;
                    const chart = legend.chart;
                    if (legendItem.datasetIndex !== undefined) {
                        const meta = chart.getDatasetMeta(index);
                        meta.hidden = meta.hidden === null ? !chart.data.datasets[index].hidden : null;
                    } else {
                        const meta = chart.getDatasetMeta(0);
                        if (meta.data[index]) meta.data[index].hidden = !meta.data[index].hidden;
                    }
                    chart.update();
                },
            },
        },
        layout: { padding: { bottom: 5 } },
    };

    const pieChartOptions = {
        ...chartOptions,
        plugins: {
            ...chartOptions.plugins,
            legend: {
                ...chartOptions.plugins.legend,
                onClick: (evt, legendItem, legend) => {
                    const index = legendItem.index;
                    const chart = legend.chart;
                    const meta = chart.getDatasetMeta(0);
                    if (meta.data[index]) {
                        meta.data[index].hidden = !meta.data[index].hidden;
                        chart.update();
                    }
                },
            },
        },
    };

    if (reportData.loading) {
        return (
            <div className="d-flex justify-content-center py-4">
                <Spinner animation="border" size="sm" />
            </div>
        );
    }

    if (reportData.error) {
        return <Alert variant="danger">Error loading report: {reportData.error}</Alert>;
    }

    if (!reportData.transactions.length) {
        return <Alert variant="info">No transactions found for this period.</Alert>;
    }

    return (
        <ChartsCarousel
            pieChartData={pieChartDataByType}
            stackedBarData={{ data: weeklyDataObj.data, labels: weeklyDataObj.labels }}
            categories={weeklyDataObj.categories}
            chartOptions={chartOptions}
            pieChartOptions={pieChartOptions}
            onPieSliceClick={() => { }}
            onBarClick={() => { }}
            loading={false}
            startDate={startDate}
            endDate={endDate}
            transactionType={chartTransactionType}
            onTransactionTypeChange={setChartTransactionType}
            currency="₹"
            transactions={reportData.transactions}
        />
    );
}

export default ReportsTabContent;
