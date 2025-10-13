import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.SLA_FIREBASE_API_KEY,
  authDomain: import.meta.env.SLA_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.SLA_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.SLA_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.SLA_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.SLA_FIREBASE_APP_ID,
  measurementId: import.meta.env.SLA_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase Authentication
export const auth = getAuth(app);

// Firestore Database
export const db = getFirestore(app);

// Firebase Cloud Messaging
export const messaging = getMessaging(app);

export default app;