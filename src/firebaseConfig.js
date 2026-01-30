// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDaoAaJ6K0d9sVESAoDCVzl9PMtpFUPIMk",
    authDomain: "shakti-9f317.firebaseapp.com",
    projectId: "shakti-9f317",
    storageBucket: "shakti-9f317.firebasestorage.app",
    messagingSenderId: "134958144900",
    appId: "1:134958144900:web:37bfdcb9ceea836826d1d1",
    measurementId: "G-PK2MMLBENZ"
};

import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
const analytics = getAnalytics(app);
