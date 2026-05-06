import { db, auth } from "./firebase.js";

import {
    collection,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

let unsubscribeLeaderboard = null;

function loadLeaderboard() {

    if (unsubscribeLeaderboard) unsubscribeLeaderboard();

    const box = document.getElementById("leaderboardList");
    const rankBox = document.getElementById("myRank");
    const sort = document.getElementById("sortType").value;

    unsubscribeLeaderboard = onSnapshot(
        collection(db, "users"),
        (snapshot) => {

            console.log("SNAPSHOT SIZE:", snapshot.size); // DEBUG

            let users = [];

            snapshot.forEach((docSnap) => {

                const d = docSnap.data();

                users.push({
                    uid: docSnap.id,
                    username: d.username || "Trader",
                    balance: Number(d.balance || 0),
                    totalProfit: Number(d.totalProfit || 0),
                    wins: Number(d.wins || 0),
                    totalTrades: Number(d.totalTrades || 0)
                });

            });

            // 🔥 IMPORTANT
            if (users.length === 0) {
                box.innerHTML = "<p>No users found</p>";
                return;
            }

            // SORT
            if (sort === "profit") {
                users.sort((a, b) => b.totalProfit - a.totalProfit);
            }

            if (sort === "balance") {
                users.sort((a, b) => b.balance - a.balance);
            }

            if (sort === "winrate") {
                users.sort((a, b) => {

                    const aRate = a.totalTrades > 0
                        ? (a.wins / a.totalTrades) * 100
                        : 0;

                    const bRate = b.totalTrades > 0
                        ? (b.wins / b.totalTrades) * 100
                        : 0;

                    return bRate - aRate;
                });
            }

            box.innerHTML = "";

            users.forEach((u, i) => {

                let medal = "#" + (i + 1);

                if (i === 0) medal = "🥇";
                if (i === 1) medal = "🥈";
                if (i === 2) medal = "🥉";

                const winRate =
                    u.totalTrades > 0
                        ? ((u.wins / u.totalTrades) * 100).toFixed(1)
                        : "0";

                box.innerHTML += `
                    <div class="row">
                        <div>${medal}</div>
                        <div>${u.username}</div>
                        <div>${u.balance.toFixed(2)}$</div>
                        <div>${u.totalProfit.toFixed(2)}$</div>
                        <div>${winRate}%</div>
                    </div>
                `;
            });

            // RANK
            const me = auth.currentUser.uid;

            const myIndex =
                users.findIndex(x => x.uid === me);

            rankBox.innerText =
                myIndex >= 0
                    ? "Your Rank: #" + (myIndex + 1)
                    : "Your Rank: --";

        }
    );
}
window.loadLeaderboard = loadLeaderboard;

onAuthStateChanged(auth, (user) => {

    if (!user) {
        window.location.href = "index.html";
        return;
    }

    console.log("USER:", user.uid); // DEBUG

    loadLeaderboard();
});

window.toggleMenu = function () {
    document.getElementById("navLinks")
        .classList.toggle("show");
};


const links = document.querySelectorAll(".nav-links a");

links.forEach(link => {
    if (window.location.pathname.includes(link.getAttribute("href"))) {
        link.classList.add("active");
    }
});

window.addEventListener("load", () => {
    document.getElementById("navLinks")
        .classList.remove("show");
});