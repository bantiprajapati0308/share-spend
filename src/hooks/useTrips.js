import { db, auth } from "../firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";

// Get all trips for current user
export const getTrips = async () => {
    const userId = auth.currentUser.uid;
    const tripsSnap = await getDocs(collection(db, "users", userId, "trips"));
    return tripsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Add a new trip
export const addTrip = async (tripData) => {
    const userId = auth.currentUser.uid;
    return await addDoc(collection(db, "users", userId, "trips"), tripData); // Return the reference
};

// Update a trip
export const updateTrip = async (tripId, tripData) => {
    const userId = auth.currentUser.uid;
    const tripRef = doc(db, "users", userId, "trips", tripId);
    await updateDoc(tripRef, tripData);
};

// Delete a trip
export const deleteTrip = async (tripId) => {
    const userId = auth.currentUser.uid;
    const tripRef = doc(db, "users", userId, "trips", tripId);
    await deleteDoc(tripRef);
};