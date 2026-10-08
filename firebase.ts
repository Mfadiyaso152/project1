import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  projectId: "citric-phenomenon-f7854",
  appId: "1:861861448789:web:19627ed12a42279a4218dc",
  apiKey: "AIzaSyBd9q2uMl7WyADoGHukxnLJjmTHGOogu3E",
  authDomain: "citric-phenomenon-f7854.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-77d4c6b1-d7c0-4f06-aefa-d2bff8279f8c",
  storageBucket: "citric-phenomenon-f7854.firebasestorage.app",
  messagingSenderId: "861861448789",
  measurementId: ""
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Initialize Firestore with the exact named database provisioned for this applet
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
