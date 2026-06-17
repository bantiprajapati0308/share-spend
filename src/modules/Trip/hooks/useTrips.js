import { tripsApi } from '../../../services/api/tripsApi';

export const getTrips = async () => {
    const result = await tripsApi.getTrips();
    if (!result.success) throw new Error(result.error);
    // result.data each has a `role` field ('owner' | 'member') from the new schema
    return result.data;
};

export const addTrip = async (tripData) => {
    const result = await tripsApi.addTrip({ ...tripData, date: tripData.date || '' });
    if (!result.success) throw new Error(result.error);
    return result.data;
};

export const updateTrip = async (tripId, tripData) => {
    const result = await tripsApi.updateTrip(tripId, tripData);
    if (!result.success) throw new Error(result.error);
    return result.data;
};

export const deleteTrip = async (tripId) => {
    const result = await tripsApi.deleteTrip(tripId);
    if (!result.success) throw new Error(result.error);
};
