import { db, auth } from "./firebase.js";
import { loadPortfolioNow } from "./portfolio.js";
import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    onSnapshot,
    updateDoc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import {
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";



let openTradesData = [];
let closingTrades = new Set();
let unsubscribeTrades = null;
let unsubscribeOpenTrades = null;
let showAllTrades = false;

/* =====================================
   LOGOUT
===================================== */
window.logout = async function () {
    await signOut(auth);
    window.location.href = "index.html";
};


/* =====================================
   SAVE OPEN TRADE
===================================== */
export async function saveOpenTrade(trade) {
    try {
        await addDoc(
            collection(db, "users", auth.currentUser.uid, "openTrades"),
            {
                ...trade,
                createdAt: new Date()
            }
        );
    } catch (err) {
        console.error("❌ Save trade error:", err);
    }
}


/* =====================================
   CLOSE TRADE (manual + auto)
===================================== */
window.closeTrade = async function (id, data) {

    try {

        closingTrades.add(id);

        const livePrice = window.currentPrice || data.entry;

        const positionSize =
            (data.amount * data.leverage) / data.entry;

        const profit =
            (data.side === "buy"
                ? livePrice - data.entry
                : data.entry - livePrice
            ) * positionSize;

        // 💰 UPDATE BALANCE
        const userRef = doc(db, "users", auth.currentUser.uid);

        const userSnap = await getDoc(userRef);
        const currentBalance = userSnap.data()?.balance || 0;

        const oldProfit =
            userSnap.data()?.totalProfit || 0;

        const oldTrades =
            userSnap.data()?.totalTrades || 0;

        const oldWins =
            userSnap.data()?.wins || 0;

        await updateDoc(userRef, {
            balance: currentBalance + profit,
            totalProfit: oldProfit + profit,
            totalTrades: oldTrades + 1,
            wins: profit > 0 ? oldWins + 1 : oldWins
        });

        // 📊 SAVE TO HISTORY
        await addDoc(
            collection(db, "users", auth.currentUser.uid, "trades"),
            {
                symbol: data.pair,
                entry: data.entry,
                exit: livePrice,
                amount: data.amount,
                profit,
                createdAt: new Date()
            }
        );

        // ❌ REMOVE FROM OPEN
        await deleteDoc(
            doc(db, "users", auth.currentUser.uid, "openTrades", id)
        );

    } catch (err) {

        console.error("❌ Close trade error:", err);

    } finally {

        closingTrades.delete(id);

    }
};

/* =====================================
   LOAD CLOSED TRADES + STATS
===================================== */
function loadTrades() {

    if (unsubscribeTrades) unsubscribeTrades();

    const filterInput = document.getElementById("filter");

    unsubscribeTrades = onSnapshot(
        query(
            collection(db, "users", auth.currentUser.uid, "trades"),
            orderBy("createdAt", "desc")
        ),
        (snapshot) => {

            const sortType =
                document.getElementById("sortTrades")?.value || "new";

            const filter =
                (filterInput?.value || "").toLowerCase();

            const list = document.getElementById("tradeList");

            const totalProfit = document.getElementById("totalProfit");
            const winRate = document.getElementById("winRate");
            const totalTradesEl = document.getElementById("totalTrades");
            const bestTradeEl = document.getElementById("bestTrade");
            const worstTradeEl = document.getElementById("worstTrade");

            if (list) list.innerHTML = "";

            let total = 0;
            let wins = 0;
            let count = 0;

            let best = -Infinity;
            let worst = Infinity;

            let trades = [];

            // 🔹 collect ALL trades
            snapshot.forEach(item => {
                trades.push({
                    id: item.id,
                    ...item.data()
                });
            });

            // 🔹 FILTER
            trades = trades.filter(t => {
                const symbol = (t.symbol || "")
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, "");

                const cleanFilter =
                    filter.replace(/[^a-z0-9]/g, "");

                return !cleanFilter || symbol.includes(cleanFilter);
            });

            // 🔹 STATS (IMPORTANT → BEFORE LIMIT)
            trades.forEach(t => {
                const profitValue = Number(t.profit);

                if (profitValue > best) best = profitValue;
                if (profitValue < worst) worst = profitValue;

                count++;
                if (profitValue > 0) wins++;

                total += profitValue;
            });

            // 🔹 SORT
            if (sortType === "new") {
                trades.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
            }

            if (sortType === "old") {
                trades.sort((a, b) => a.createdAt.seconds - b.createdAt.seconds);
            }

            if (sortType === "profitHigh") {
                trades.sort((a, b) => b.profit - a.profit);
            }

            if (sortType === "profitLow") {
                trades.sort((a, b) => a.profit - b.profit);
            }

            // 🔹 LIMIT (ONLY FOR UI)
            const visibleTrades = showAllTrades
                ? trades
                : trades.slice(0, 5);

            // 🔹 RENDER
            visibleTrades.forEach(data => {

                const profitValue = Number(data.profit);

                if (list) {

                    const div = document.createElement("div");
                    div.className = "trade-card";

                    div.innerHTML = `
                        <div class="trade-left">
                            <div class="symbol">${data.symbol}</div>
                            <small>
                                Entry: ${data.entry} | Exit: ${data.exit}
                            </small>
                        </div>

                        <div class="trade-right">
                            <div class="trade-profit"
                            style="color:${profitValue >= 0 ? 'lime' : 'red'}">
                                ${profitValue.toFixed(2)}$
                            </div>
                        </div>
                    `;

                    list.appendChild(div);
                }
            });

            // 🔹 UPDATE STATS
            if (totalProfit)
                totalProfit.innerText = total.toFixed(2) + "$";

            if (winRate)
                winRate.innerText =
                    count > 0
                        ? ((wins / count) * 100).toFixed(1) + "%"
                        : "0%";

            if (totalTradesEl)
                totalTradesEl.innerText = count;

            if (bestTradeEl)
                bestTradeEl.innerText =
                    best === -Infinity ? "0$" : best.toFixed(2) + "$";

            if (worstTradeEl)
                worstTradeEl.innerText =
                    worst === Infinity ? "0$" : worst.toFixed(2) + "$";

            if (bestTradeEl) bestTradeEl.style.color = "lime";
            if (worstTradeEl) worstTradeEl.style.color = "red";

            // 🔹 TOGGLE BUTTON TEXT
            const btn = document.getElementById("toggleTradesBtn");

            if (btn) {

                if (trades.length <= 5) {
                    btn.style.display = "none";
                } else {
                    btn.style.display = "inline-block";
                    btn.innerText = showAllTrades
                        ? "Show Less"
                        : "⋯ Show More";
                }

            }

        }
    );
}

window.loadTrades = loadTrades;
window.toggleTrades = function () {
    showAllTrades = !showAllTrades;
    loadTrades();
};

/* =====================================
   LOAD OPEN TRADES
===================================== */
function loadOpenTrades() {

    if (unsubscribeOpenTrades) unsubscribeOpenTrades();

    unsubscribeOpenTrades = onSnapshot(
        collection(db, "users", auth.currentUser.uid, "openTrades"),
        (snapshot) => {

            openTradesData = [];

            snapshot.forEach(item => {
                openTradesData.push({
                    id: item.id,
                    ...item.data()
                });
            });

            renderOpenTrades();
        }
    );
}

window.safeCloseTrade = async function (id, data) {

    const btn = document.getElementById("btn-" + id);

    if (btn) {
        btn.disabled = true;
        btn.innerText = "...";
    }

    await closeTrade(id, data);
};

/* =====================================
   RENDER OPEN TRADES + TP/SL AUTO CLOSE
===================================== */
window.renderOpenTrades = function () {

    const box = document.getElementById("openTrades");
    const livePnlEl = document.getElementById("livePnl");

    if (!box) return;

    box.innerHTML = "";

    let totalPnl = 0;

    openTradesData.forEach(data => {

        const livePrice = window.currentPrice || data.entry;

        // 🔥 TP/SL AUTO CLOSE
        const shouldClose =
            (data.side === "buy" && (
                (data.tp && livePrice >= data.tp) ||
                (data.sl && livePrice <= data.sl)
            )) ||
            (data.side === "sell" && (
                (data.tp && livePrice <= data.tp) ||
                (data.sl && livePrice >= data.sl)
            ));
        const liquidation =
            data.side === "buy"
                ? data.entry - (data.entry / data.leverage)
                : data.entry + (data.entry / data.leverage);

        if (shouldClose && !closingTrades.has(data.id)) {

            closingTrades.add(data.id);

            closeTrade(data.id, data).catch(() => {
                closingTrades.delete(data.id);
            });

            return;
        }

        const positionSize =
            (data.amount * data.leverage) / data.entry;

        const pnl =
            (data.side === "buy"
                ? livePrice - data.entry
                : data.entry - livePrice
            ) * positionSize;

        totalPnl += pnl;

        const div = document.createElement("div");
        div.className = "trade-card";

        div.innerHTML = `
            <div class="trade-left">
                <div class="symbol">${data.pair}</div>
                <small>
                    ${data.side.toUpperCase()} | ${data.leverage}x | Entry ${data.entry.toFixed(2)}
                </small>
            </div>

            <div class="trade-right">
                <div class="trade-profit"
                style="color:${pnl >= 0 ? 'lime' : 'red'}">
                    ${pnl.toFixed(2)}$
                </div>

                <button class="delete-btn"
id="btn-${data.id}"
onclick='safeCloseTrade("${data.id}", ${JSON.stringify(data)})'>
✖
</button>
            </div>
        `;

        box.appendChild(div);
    });

    // ✅ LIVE PNL (vetëm kjo mbetet)
    if (livePnlEl) {
        livePnlEl.innerText = totalPnl.toFixed(2) + "$";
        livePnlEl.style.color = totalPnl >= 0 ? "lime" : "red";
    }
};

async function initUser() {

    const userRef = doc(db, "users", auth.currentUser.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {

        await setDoc(userRef, {
            username: auth.currentUser.email.split("@")[0],
            email: auth.currentUser.email,

            balance: 10000,
            totalProfit: 0,
            totalTrades: 0,
            wins: 0,
            portfolio: {},
            createdAt: new Date()
        });

    } else {

        const data = snap.data();

        let updates = {};

        // vetëm nëse mungon username
        if (!data.username) {
            updates.username = auth.currentUser.email.split("@")[0];
        }

        // vetëm nëse mungon email
        if (!data.email) {
            updates.email = auth.currentUser.email;
        }

        if (data.totalProfit === undefined) {
            updates.totalProfit = 0;
        }

        if (data.totalTrades === undefined) {
            updates.totalTrades = 0;
        }

        if (data.wins === undefined) {
            updates.wins = 0;
        }

        // vetëm nëse ka diçka për update
        if (Object.keys(updates).length > 0) {
            await updateDoc(userRef, updates);
        }

    }
}
function loadBalance() {

    const userRef = doc(db, "users", auth.currentUser.uid);

    onSnapshot(userRef, (snap) => {

        const data = snap.data();

        if (data && data.balance !== undefined) {
            document.getElementById("balance").innerText =
                data.balance.toFixed(2) + "$";
        }

    });
}

function loadUserPortfolio() {

    const userRef = doc(db, "users", auth.currentUser.uid);

    onSnapshot(userRef, (snap) => {

        const data = snap.data();

        window.userPortfolio =
            data?.portfolio || {};

    });

}

window.toggleMenu = function () {
    document.getElementById("navLinks")
        .classList.toggle("show");
};

window.showToast = function (message, type = "success") {

    const toast = document.getElementById("toast");

    toast.innerText = message;
    toast.className = "";

    if (type === "error") toast.classList.add("error");
    if (type === "sell") toast.classList.add("sell");

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

/* =====================================
   AUTH
===================================== */
onAuthStateChanged(auth, async (user) => {

    console.log("AUTH STATE:", user);

    if (user) {


        await initUser(); // ✅ tash funksionon

        loadTrades();
        loadOpenTrades();
        loadBalance();
        loadPortfolioNow();
        loadUserPortfolio();

    } else {
        window.location.href = "index.html";
    }
});
