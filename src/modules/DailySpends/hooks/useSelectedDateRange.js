import { settingsApi } from '../../../services/api/categoriesApi';

export const useSelectedDateRange = () => {
    const saveDateRange = async (startDate, endDate) => {
        const startDateStr = startDate instanceof Date ? startDate.toISOString().split('T')[0] : startDate;
        const endDateStr = endDate instanceof Date ? endDate.toISOString().split('T')[0] : endDate;
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
