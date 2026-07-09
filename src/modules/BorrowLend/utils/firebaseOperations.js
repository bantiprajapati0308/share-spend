import { borrowLendApi } from '../../../services/api/borrowLendApi';

export const deleteEntryByUuid = async (uuid, refresh) => {
    const result = await borrowLendApi.deleteEntry(uuid);
    if (!result.success) throw new Error(result.error);
    refresh?.();
};
