import { borrowLendApi } from '../../../services/api/borrowLendApi';

export const archiveEntryByUuid = async (uuid, refresh) => {
    const result = await borrowLendApi.archiveEntry(uuid);
    if (!result.success) throw new Error(result.error);
    refresh?.();
};

export const unarchiveEntryByUuid = async (uuid, refresh) => {
    const result = await borrowLendApi.unarchiveEntry(uuid);
    if (!result.success) throw new Error(result.error);
    refresh?.();
};

export const toggleMarkAsDoneByUuid = async (uuid, refresh) => {
    const result = await borrowLendApi.toggleMarkDone(uuid);
    if (!result.success) throw new Error(result.error);
    refresh?.();
    return result.data?.markAsDone;
};

export const deleteEntryByUuid = async (uuid, refresh) => {
    const result = await borrowLendApi.deleteEntry(uuid);
    if (!result.success) throw new Error(result.error);
    refresh?.();
};

export const updateEntryByUuid = async (uuid, updateFn, refresh) => {
    // updateFn is a local transform — not supported directly; caller should use specific API methods
    console.warn('updateEntryByUuid: use specific API methods instead');
    refresh?.();
};
