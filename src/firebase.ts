import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDx7T7F3spgYu_Ly-GZiznwk4GUz6-Fjxo",
  authDomain: "shakewebapp.firebaseapp.com",
  projectId: "shakewebapp",
  storageBucket: "shakewebapp.firebasestorage.app",
  messagingSenderId: "476947023412",
  appId: "1:476947023412:web:be47dd6332ca707955ec61",
  measurementId: "G-RS8RSD6XEG",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
