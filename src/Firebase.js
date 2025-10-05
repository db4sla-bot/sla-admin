// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDf32jXvyZ1LV64eHROqHy4DdBi1NEFGAM",
  authDomain: "sla-admin.firebaseapp.com",
  projectId: "sla-admin",
  storageBucket: "sla-admin.appspot.com",   // ✅ FIXED
  messagingSenderId: "955414735935",
  appId: "1:955414735935:web:cb682720b136212b9a5c8a",
  measurementId: "G-NT675TELYG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase Authentication
export const auth = getAuth(app);

// Firestore Database
export const db = getFirestore(app);

export default app;
