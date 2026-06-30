import { settingsApi } from '../../../services/api/categoriesApi';
import { formatLocalDate } from '../utils/dateUtils';

export const useSelectedDateRange = () => {
    const saveDateRange = async (startDate, endDate) => {
        const startDateStr = formatLocalDate(startDate) || startDate;
        const endDateStr = formatLocalDate(endDate) || endDate;
        const result = await settingsApi.saveDateRange(startDateStr, endDateStr);
        if (!result.success) throw new Error(result.error);
    };

    const loadDateRange = async () => {
        const result = await settingsApi.getDateRange();
        if (!result.success) throw new Error(result.error);
        return result.data || null;
    };

    return { saveDateRange, loadDateRange };
};

export default useSelectedDateRange;
