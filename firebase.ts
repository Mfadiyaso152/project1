import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

export const firebaseConfig = {
  apiKey: "AIzaSyDJEQVsDsULKJlhrmbOTxqYkp7rFJJehxM",
  authDomain: "wthiq-f6b9d.firebaseapp.com",
  projectId: "wthiq-f6b9d",
  storageBucket: "wthiq-f6b9d.firebasestorage.app",
  messagingSenderId: "260579486284",
  appId: "1:260579486284:web:a8847d960f44e669fb22e9",
  measurementId: "G-GYZC2EDDCL"
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
