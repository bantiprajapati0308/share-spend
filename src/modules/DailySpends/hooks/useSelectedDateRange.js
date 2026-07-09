import { useCallback, useMemo } from 'react';
import { settingsApi } from '../../../services/api/categoriesApi';
import { formatLocalDate } from '../utils/dateUtils';

export const useSelectedDateRange = () => {
    const saveDateRange = useCallback(async (startDate, endDate) => {
        const startDateStr = formatLocalDate(startDate) || startDate;
        const endDateStr = formatLocalDate(endDate) || endDate;
        const result = await settingsApi.saveDateRange(startDateStr, endDateStr);
        if (!result.success) throw new Error(result.error);
    }, []);

    const loadDateRange = useCallback(async () => {
        const result = await settingsApi.getDateRange();
        if (!result.success) throw new Error(result.error);
        return result.data || null;
    }, []);

    return useMemo(() => ({ saveDateRange, loadDateRange }), [saveDateRange, loadDateRange]);
};

export default useSelectedDateRange;
