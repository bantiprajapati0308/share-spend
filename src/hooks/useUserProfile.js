import { authApi } from '../services/api/authApi';

/**
 * Parse Google user displayName into first and last name
 */
export const parseDisplayName = (displayName = "") => {
    const parts = displayName.trim().split(/\s+/);
    return {
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" ") || "",
    };
};

export const createOrUpdateUserProfile = async (user) => {
    try {
        if (!user) throw new Error("User not authenticated");
        const { firstName, lastName } = parseDisplayName(user.displayName || "");
        const result = await authApi.createOrUpdateProfile({
            email: user.email,
            firstName,
            lastName,
            displayName: user.displayName || "",
            photoURL: user.photoURL || "",
            authProvider: "google",
        });
        if (!result.success) throw new Error(result.error);
        return result.data;
    } catch (error) {
        console.error("Error creating/updating user profile:", error);
        throw error;
    }
};

/**
 * Ensures a backend profile exists for the given Firebase user.
 * Called on every login — creates the profile + seeds categories if missing.
 * Does NOT throw so it never blocks the main auth flow.
 */
export const ensureUserProfile = async (user) => {
    if (!user) return;
    try {
        const profileResult = await authApi.getProfile();
        if (profileResult.success) return profileResult.data;

        // Profile missing (404) or server error — try to create it
        const { firstName, lastName } = parseDisplayName(user.displayName || "");
        const createResult = await authApi.createOrUpdateProfile({
            email: user.email,
            firstName,
            lastName,
            displayName: user.displayName || "",
            photoURL: user.photoURL || "",
            authProvider: user.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email',
        });
        if (!createResult.success) {
            console.error('ensureUserProfile: profile creation failed', createResult.error);
        }
        return createResult.data;
    } catch (error) {
        console.error('ensureUserProfile error:', error.message);
        // Swallow — never block the app from loading
    }
};

export const getUserProfile = async () => {
    try {
        const result = await authApi.getProfile();
        if (!result.success) throw new Error(result.error);
        return result.data;
    } catch (error) {
        console.error("Error getting user profile:", error);
        throw error;
    }
};

export const updateUserProfile = async (updates) => {
    try {
        const result = await authApi.updateProfile(updates);
        if (!result.success) throw new Error(result.error);
        return result.data;
    } catch (error) {
        console.error("Error updating user profile:", error);
        throw error;
    }
};

export const updateLastLogin = async () => {
    try {
        await authApi.updateLastLogin();
    } catch (error) {
        console.error("Error updating last login:", error);
    }
};

export const getUserDisplayName = (profile) => {
    if (!profile) return "User";
    if (profile.firstName && profile.lastName) return `${profile.firstName} ${profile.lastName}`;
    if (profile.firstName) return profile.firstName;
    if (profile.displayName) return profile.displayName;
    return profile.email || "User";
};
