import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
    doc,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* =========================
   CREATE USER IN FIRESTORE
========================= */
async function createUserIfNotExists(user, usernameInput = null) {

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {

        await setDoc(userRef, {
            username:
                usernameInput ||
                user.displayName ||
                user.email.split("@")[0],

            email: user.email,

            balance: 10000,
            totalProfit: 0,
            totalTrades: 0,
            wins: 0,
            portfolio: {},

            createdAt: new Date()
        });

    }
}

/* =========================
   REGISTER
========================= */
window.register = async function () {

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!username || !email || !password) {
        alert("Fill all fields");
        return;
    }

    try {

        const userCred =
            await createUserWithEmailAndPassword(auth, email, password);

        await createUserIfNotExists(userCred.user, username);

        alert("Registered Successfully!");
        window.location.href = "dashboard.html";

    } catch (error) {
        alert(error.message);
    }
};

/* =========================
   LOGIN
========================= */
window.login = async function () {

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {

        const userCred =
            await signInWithEmailAndPassword(auth, email, password);

        await createUserIfNotExists(userCred.user);

        window.location.href = "dashboard.html";

    } catch (error) {
        alert(error.message);
    }
};

/* =========================
   GOOGLE LOGIN
========================= */
window.googleLogin = async function () {

    const provider = new GoogleAuthProvider();

    try {

        const result = await signInWithPopup(auth, provider);

        await createUserIfNotExists(result.user);

        window.location.href = "dashboard.html";

    } catch (error) {
        alert(error.message);
    }
};

