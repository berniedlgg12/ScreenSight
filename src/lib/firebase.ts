import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyA_mGqYxJ-gL_uT9jRz8tY2W_l_sN7wE-4",
    authDomain: "dlg.cc",
    projectId: "studio-8383673190-f5959",
    storageBucket: "studio-8383673190-f5959.firebasestorage.app",
    messagingSenderId: "8383673190",
    appId: "1:8383673190:web:d87f79435581179185a228",
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
