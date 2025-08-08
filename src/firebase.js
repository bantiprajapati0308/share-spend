// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB0da2mYw-OstqycXFrlOKnxr7sIAhN3Sg",
  authDomain: "share-spend.firebaseapp.com",
  projectId: "share-spend",
  storageBucket: "share-spend.firebasestorage.app",
  messagingSenderId: "444616717757",
  appId: "1:444616717757:web:66f6f7a91018dc2a18ced4",
  measurementId: "G-LN26NDZQLF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);