import PropTypes from 'prop-types';
import { Modal, Spinner } from 'react-bootstrap';
import CategoryLimitsManagement from './CategoryLimitsManagement';
import SpendingLimitsSummary from './SpendingLimitsSummary';
import styles from '../styles/DailySpends.module.scss';

function CategoryLimitsModalView({
    show,
    onHide,
    categories,
    limits,
    categoryTotals,
    startDate,
    endDate,
    onAddLimit,
    onUpdateLimit,
    onDeleteLimit,
    loading,
    error
}) {
    return (
        <Modal
            show={show}
            onHide={onHide}
            size="lg"
            centered
            className={styles.limitsModal}
        >
            <Modal.Header closeButton className={styles.modalHeader}>
                <Modal.Title className={styles.modalTitle}>
                    💰 Spending Limits
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className={styles.modalBody}>
                {loading ? (
                    <div className={styles.loadingSpinner}>
                        <Spinner animation="border" size="sm" />
                        <span>Loading limits...</span>
                    </div>
                ) : (
                    <>
                        {/* Overall Spending Summary */}
                        <SpendingLimitsSummary
                            limits={limits}
                            categoryTotals={categoryTotals}
                        />

                        {/* Individual Category Limits */}
                        <CategoryLimitsManagement
                            categories={categories}
                            limits={limits}
                            categoryTotals={categoryTotals}
                            startDate={startDate}
                            endDate={endDate}
                            onAddLimit={onAddLimit}
                            onUpdateLimit={onUpdateLimit}
                            onDeleteLimit={onDeleteLimit}
                            loading={loading}
                            error={error}
                        />
                    </>
                )}
            </Modal.Body>
        </Modal>
    );
}

CategoryLimitsModalView.propTypes = {
    show: PropTypes.bool.isRequired,
    onHide: PropTypes.func.isRequired,
    categories: PropTypes.array.isRequired,
    limits: PropTypes.array.isRequired,
    categoryTotals: PropTypes.object.isRequired,
    startDate: PropTypes.instanceOf(Date),
    endDate: PropTypes.instanceOf(Date),
    onAddLimit: PropTypes.func.isRequired,
    onUpdateLimit: PropTypes.func.isRequired,
    onDeleteLimit: PropTypes.func.isRequired,
    loading: PropTypes.bool,
    error: PropTypes.string,
};

export default CategoryLimitsModalView;
