import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB0qgmL_VFigqe0tE8ui3n1EYeqWK6RMVU",
    authDomain: "trading-app-69a65.firebaseapp.com",
    projectId: "trading-app-69a65",
    storageBucket: "trading-app-69a65.firebasestorage.app",
    messagingSenderId: "469501224440",
    appId: "1:469501224440:web:18ac4518ebdf266bc8220d"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);