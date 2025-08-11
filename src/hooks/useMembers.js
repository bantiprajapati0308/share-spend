import { db, auth } from "../firebase";
import { collection, addDoc, getDocs, doc, deleteDoc } from "firebase/firestore";

// Add a member to a trip
export const addMember = async (tripId, memberData) => {
    const userId = auth.currentUser.uid;
    await addDoc(collection(db, "users", userId, "trips", tripId, "members"), memberData);
};

// Get all members for a trip
export const getMembers = async (tripId) => {
    const userId = auth.currentUser.uid;
    const snap = await getDocs(collection(db, "users", userId, "trips", tripId, "members"));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// ❌ Delete a member from a trip
export const deleteMember = async (tripId, memberId) => {
    const userId = auth.currentUser.uid;
    await deleteDoc(doc(db, "users", userId, "trips", tripId, "members", memberId));
};
