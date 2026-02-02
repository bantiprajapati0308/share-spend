import { useSelector } from 'react-redux';

// Helper function to check if user can edit a specific trip
export const useCanEditTrip = (tripId = null) => {
    const { passcodeAccess, trip } = useSelector((state) => state.trip);

    // Use current trip if no tripId provided
    const currentTripId = tripId || trip.id;

    // If no trip ID, default to no access
    if (!currentTripId) return false;

    // Check if user has passcode access for this trip
    return passcodeAccess[currentTripId] === true;
};

// Helper function to check if a trip has passcode protection
export const tripHasPasscode = (tripData) => {
    return tripData && tripData.passcode && tripData.passcode.trim() !== '';
};

// Helper function to verify passcode
export const verifyPasscode = (enteredPasscode, tripPasscode) => {
    if (!tripPasscode || tripPasscode.trim() === '') {
        // No passcode set on trip, allow access
        return true;
    }

    // Compare entered passcode with trip passcode
    return enteredPasscode === tripPasscode;
};

// Permission constants
export const PERMISSIONS = {
    VIEW_ONLY: 'view_only',
    FULL_ACCESS: 'full_access'
};

// Get permission level for current trip
export const getTripPermission = (tripData, hasPasscodeAccess) => {
    if (!tripHasPasscode(tripData)) {
        return PERMISSIONS.FULL_ACCESS; // No passcode = full access
    }

    return hasPasscodeAccess ? PERMISSIONS.FULL_ACCESS : PERMISSIONS.VIEW_ONLY;
};