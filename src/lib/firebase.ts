// Firebase configuration for PlayMe Social Platform
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCvdfAPe5vnuaSUBO3J3KfzNqhXmaDiNNE",
  authDomain: "playme-social.firebaseapp.com",
  projectId: "playme-social",
  storageBucket: "playme-social.firebasestorage.app",
  messagingSenderId: "112575229776",
  appId: "1:112575229776:web:832ff6ed2f5f26bdee0655",
  measurementId: "G-EZHCKPVRJX"
};

// Initialize Firebase (prevent duplicate initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const firebaseAuth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
export default app;
