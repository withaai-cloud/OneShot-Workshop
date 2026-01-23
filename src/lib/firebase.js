// src/lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDRuuhx0gtllDZliS7eLFyrbCXgHsk23MM",
  authDomain: "oneshot-workshop.firebaseapp.com",
  projectId: "oneshot-workshop",
  storageBucket: "oneshot-workshop.firebasestorage.app",
  messagingSenderId: "552265384602",
  appId: "1:552265384602:web:dbe2a413a98b54b8e51523"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Cloud Firestore
export const db = getFirestore(app);

export default app;
