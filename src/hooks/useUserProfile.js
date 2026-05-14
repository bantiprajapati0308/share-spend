import { db, auth } from "../firebase";
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

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

/**
 * Create or get user profile from Firestore
 * On first login (Google), extracts displayName, email, photoURL
 * On re-login, retrieves existing profile
 */
export const createOrUpdateUserProfile = async (user) => {
    try {
        if (!user) {
            throw new Error("User not authenticated");
        }

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        // If user exists, return existing profile
        if (userSnap.exists()) {
            return userSnap.data();
        }

        // New user: extract from Google and store
        const { firstName, lastName } = parseDisplayName(user.displayName);

        const newUserProfile = {
            uid: user.uid,
            email: user.email,
            firstName,
            lastName,
            displayName: user.displayName || "",
            photoURL: user.photoURL || "",
            // Optional fields (user can fill later)
            age: null,
            dateOfBirth: null,
            phoneNumber: user.phoneNumber || null,
            // Timestamps
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            authProvider: "google", // Can be "email", "google", etc.
        };

        await setDoc(userRef, newUserProfile);
        return newUserProfile;
    } catch (error) {
        console.error("Error creating/updating user profile:", error);
        throw error;
    }
};

/**
 * Get existing user profile
 */
export const getUserProfile = async (uid) => {
    try {
        if (!uid) {
            throw new Error("User UID not provided");
        }

        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return null;
        }

        return userSnap.data();
    } catch (error) {
        console.error("Error fetching user profile:", error);
        throw error;
    }
};

/**
 * Update user profile (for optional fields like age, DOB, phone)
 */
export const updateUserProfile = async (uid, updateData) => {
    try {
        if (!uid) {
            throw new Error("User UID not provided");
        }

        const userRef = doc(db, "users", uid);

        // Prepare update data with timestamp
        const dataToUpdate = {
            ...updateData,
            updatedAt: serverTimestamp(),
        };

        await updateDoc(userRef, dataToUpdate);
        return dataToUpdate;
    } catch (error) {
        console.error("Error updating user profile:", error);
        throw error;
    }
};

/**
 * Update last login timestamp
 */
export const updateLastLogin = async (uid) => {
    try {
        if (!uid) {
            throw new Error("User UID not provided");
        }

        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            lastLoginAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error updating last login:", error);
        // Don't throw, as this is non-critical
    }
};

/**
 * Get user display info (for UI)
 */
export const getUserDisplayName = (profile) => {
    if (!profile) return "User";
    if (profile.firstName && profile.lastName) {
        return `${profile.firstName} ${profile.lastName}`;
    }
    if (profile.firstName) {
        return profile.firstName;
    }
    if (profile.displayName) {
        return profile.displayName;
    }
    return profile.email || "User";
};
