import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'react-bootstrap';
import { ChevronLeft, ChevronRight } from 'react-bootstrap-icons';
import { StackedBarChart, PieChart } from '../../../../components/charts';
import styles from '../styles/ChartsCarousel.module.scss';

/**
 * Charts Carousel Component
 * Renders charts in a sliding carousel format with touch support
 */
function ChartsCarousel({
    pieChartData,
    stackedBarData,
    categories,
    chartOptions,
    pieChartOptions,
    onPieSliceClick,
    onBarClick,
    loading,
    startDate,
    endDate,
    currency = '₹'
}) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const carouselRef = useRef(null);

    // Minimum swipe distance (in pixels)
    const minSwipeDistance = 50;

    const charts = [
        {
            id: 'pie',
            title: 'Category Distribution',
            subtitle: startDate && endDate ? `${startDate.toDateString()} - ${endDate.toDateString()}` : "All Time",
            component: (
                <div className={styles.chartContainer}>
                    <PieChart
                        data={pieChartData}
                        labelKey="category"
                        valueKey="amount"
                        title="Category Distribution"
                        subtitle={startDate && endDate ? `${startDate.toDateString()} - ${endDate.toDateString()}` : "All Time"}
                        size="medium"
                        loading={loading}
                        currency={currency}
                        showPercentages={true}
                        customOptions={{
                            ...pieChartOptions,
                            responsive: true,
                            maintainAspectRatio: false,
                            layout: {
                                padding: {
                                    left: 5,
                                    right: 5,
                                    top: 5,
                                    bottom: 5
                                }
                            }
                        }}
                        onSliceClick={onPieSliceClick}
                        colorPalette="default"
                        className={categories.length > 4 ? "multi-category-legend-chart" : "compact-legend-chart"}
                    />
                </div>
            )
        },
        {
            id: 'stacked',
            title: 'Breakdown by Weeks',
            subtitle: 'Weekly spending trends',
            component: (
                <div className={styles.chartContainer}>
                    <StackedBarChart
                        data={stackedBarData}
                        categories={categories}
                        title="Breakdown by Weeks"
                        size="medium"
                        loading={loading}
                        currency={currency}
                        showValues={true}
                        customOptions={{
                            ...chartOptions,
                            responsive: true,
                            maintainAspectRatio: false,
                            layout: {
                                padding: {
                                    left: 5,
                                    right: 5,
                                    top: 5,
                                    bottom: 5
                                }
                            }
                        }}
                        className={categories.length > 4 ? "multi-category-legend-chart" : "compact-legend-chart"}
                        colorPalette="default"
                        onBarClick={onBarClick}
                    />
                </div>
            )
        }
    ];

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % charts.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + charts.length) % charts.length);
    };

    const handleDotClick = (index) => {
        setCurrentIndex(index);
    };

    // Touch event handlers for swipe support
    const handleTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            handleNext();
        } else if (isRightSwipe) {
            handlePrev();
        }
    };

    // Keyboard support and chart resize handling
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === 'ArrowLeft') {
                handlePrev();
            } else if (e.key === 'ArrowRight') {
                handleNext();
            }
        };

        // Handle window resize for charts
        const handleResize = () => {
            // Trigger chart resize after a small delay
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 100);
        };

        document.addEventListener('keydown', handleKeyPress);
        window.addEventListener('resize', handleResize);

        return () => {
            document.removeEventListener('keydown', handleKeyPress);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Trigger chart resize when currentIndex changes
    useEffect(() => {
        // Force chart resize when slide changes
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 350); // After transition completes
    }, [currentIndex]);

    return (
        <div className={`${styles.chartsCarousel} chartsCarousel`} ref={carouselRef}>
            {/* Navigation Header */}
            <div className={styles.carouselHeader}>
                <div className={styles.chartTitle}>
                    <h5 className="mb-0">{charts[currentIndex].title}</h5>
                    <small className="text-muted">{charts[currentIndex].subtitle}</small>
                </div>
                <div className={styles.carouselControls}>
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={handlePrev}
                        disabled={charts.length <= 1}
                        className={styles.carouselBtn}
                    >
                        <ChevronLeft size={16} />
                    </Button>
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={handleNext}
                        disabled={charts.length <= 1}
                        className={styles.carouselBtn}
                    >
                        <ChevronRight size={16} />
                    </Button>
                </div>
            </div>

            {/* Chart Container with smooth transition */}
            <div
                className={styles.carouselContainer}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div
                    className={styles.carouselSlider}
                    style={{
                        width: `${charts.length * 100}%`,
                        transform: `translateX(-${currentIndex * (100 / charts.length)}%)`,
                        transition: 'transform 0.3s ease-in-out'
                    }}
                >
                    {charts.map((chart, index) => (
                        <div key={chart.id} className={styles.carouselSlide} style={{ width: `${100 / charts.length}%` }}>
                            <div className={styles.chartWrapper}>
                                {chart.component}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Dot Indicators */}
            <div className={styles.carouselIndicators}>
                {charts.map((_, index) => (
                    <button
                        key={index}
                        className={`${styles.carouselDot} ${index === currentIndex ? styles.active : ''}`}
                        onClick={() => handleDotClick(index)}
                        aria-label={`Go to chart ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}

ChartsCarousel.propTypes = {
    pieChartData: PropTypes.array.isRequired,
    stackedBarData: PropTypes.array.isRequired,
    categories: PropTypes.array.isRequired,
    chartOptions: PropTypes.object.isRequired,
    pieChartOptions: PropTypes.object.isRequired,
    onPieSliceClick: PropTypes.func,
    onBarClick: PropTypes.func,
    loading: PropTypes.bool,
    startDate: PropTypes.instanceOf(Date),
    endDate: PropTypes.instanceOf(Date),
    currency: PropTypes.string
};

export default ChartsCarousel;