import { db, auth } from './firebase.js';
import { doc, getDoc, updateDoc, onSnapshot, collection, addDoc, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

window.prices = {};
let sockets = [];


window.resetWallet = async function () {
    if (!confirm('Reset demo wallet?')) return;
    const ref = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(ref, { balance: 10000, portfolio: {} });
};

function startWalletPrices() {

    const pairs = [
        "btcusdt",
        "ethusdt",
        "solusdt"
    ];

    pairs.forEach(pair => {

        const socket = new WebSocket(
            `wss://stream.binance.com:9443/ws/${pair}@trade`
        );

        socket.onmessage = (event) => {

            const data = JSON.parse(event.data);

            const price = parseFloat(data.p);

            window.prices[pair.toUpperCase()] = price;

            // refresh wallet
            const uid = auth.currentUser?.uid;

            if (uid) {
                getDoc(doc(db, "users", uid)).then(snap => {
                    if (snap.exists()) renderPortfolio(snap.data());
                });
            }

        };

        sockets.push(socket);

    });

}

function renderPortfolio(data) {
    const box = document.getElementById('portfolioList');
    if (!box) return;
    box.innerHTML = '';
    const portfolio = data.portfolio || {};
    window.userPortfolio = data.portfolio || {};
    let total = data.balance || 0;
    let count = 0;
    Object.keys(portfolio).forEach(symbol => {
        const amount = portfolio[symbol];
        if (amount <= 0) return;
        count++;
        const price = (window.prices && window.prices[symbol]) || 0;
        const value = amount * price;
        total += value;
        const div = document.createElement('div');
        div.className = 'trade-card';
        div.innerHTML = `<div class='trade-left'><div class='symbol'>${symbol}</div><small>${amount.toFixed(6)}</small></div><div class='trade-right'><div class='trade-profit'>${value.toFixed(2)}$</div></div>`;
        box.appendChild(div);
    });
    document.getElementById('walletTotal').innerText = total.toFixed(2) + '$';
    document.getElementById('balance').innerText = (data.balance || 0).toFixed(2) + '$';
    document.getElementById('assetCount').innerText = count;
    document.getElementById('bestAsset').innerText = count ? Object.keys(portfolio)[0] : '-';
}

function loadWalletHistory(uid) {

    const box =
        document.getElementById("walletHistory");

    if (!box) return;

    onSnapshot(
        query(
            collection(db, "users", uid, "walletHistory"),
            orderBy("createdAt", "desc")
        ),
        (snap) => {

            box.innerHTML = "";

            snap.forEach(docu => {

                const d = docu.data();

                const div =
                    document.createElement("div");

                div.className = "trade-card";

                div.innerHTML = `
                    <div class="trade-left">
                        <div class="symbol">${d.type}</div>
                        <small>${d.symbol || ""}</small>
                    </div>

                    <div class="trade-right">
                        <div class="trade-profit">
                            ${Number(d.amount || 0).toFixed(2)}$
                        </div>
                    </div>
                `;

                box.appendChild(div);

            });

        }
    );
}

import { onAuthStateChanged } from
    "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {

    if (!user) return;

    onSnapshot(doc(db, "users", user.uid), (snap) => {

        if (snap.exists()) {
            renderPortfolio(snap.data());
        }

    });

    loadWalletHistory(user.uid);
    startWalletPrices();

});

window.fillBuyPercent = function (percent) {

    const balanceText =
        document.getElementById("balance").innerText;

    const balance =
        parseFloat(balanceText.replace("$", "")) || 0;

    const value = balance * percent / 100;

    document.getElementById("buyAmount").value =
        value.toFixed(2);
};

window.fillSellPercent = function (percent) {

    const symbol = window.currentPair.toUpperCase();

    const amount =
        window.userPortfolio?.[symbol] || 0;

    const value = amount * percent / 100;

    document.getElementById("sellAmount").value =
        value.toFixed(6);
};

export async function loadPortfolioNow() {

    if (!auth.currentUser) return;

    const ref = doc(db, "users", auth.currentUser.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
        renderPortfolio(snap.data());
    }
};

window.buyCrypto = async function (symbol, usdAmount) {

    if (!usdAmount || usdAmount <= 0) {
        alert("Enter amount");
        return;
    }

    const ref = doc(db, "users", auth.currentUser.uid);
    const snap = await getDoc(ref);

    const data = snap.data();
    const balance = data.balance || 0;

    if (usdAmount > balance) {
        alert("Not enough balance");
        return;
    }

    const price =
        window.prices?.[symbol] || 0;

    if (!price) {
        alert("Price not loaded yet");
        return;
    }

    const cryptoAmount =
        usdAmount / price;

    const portfolio =
        data.portfolio || {};

    portfolio[symbol] =
        (portfolio[symbol] || 0) + cryptoAmount;

    await updateDoc(ref, {
        balance: balance - usdAmount,
        portfolio
    });
    showToast(`Successfully bought ${symbol}`);
    await addDoc(
        collection(db, "users", auth.currentUser.uid, "walletHistory"),
        {
            type: "BUY",
            symbol,
            amount: usdAmount,
            createdAt: new Date()
        }
    );

};
window.sellCrypto = async function (symbol, cryptoAmount) {

    if (!cryptoAmount || cryptoAmount <= 0) {
        alert("Enter amount");
        return;
    }

    const ref = doc(db, "users", auth.currentUser.uid);
    const snap = await getDoc(ref);

    const data = snap.data();
    const balance = data.balance || 0;
    const portfolio = data.portfolio || {};

    const owned = portfolio[symbol] || 0;

    if (cryptoAmount > owned) {
        alert("Not enough crypto");
        return;
    }

    const price = window.prices?.[symbol];

    if (!price) {
        alert("Price not loaded");
        return;
    }

    const usdValue = cryptoAmount * price;

    // update portfolio
    portfolio[symbol] = owned - cryptoAmount;

    if (portfolio[symbol] <= 0) {
        delete portfolio[symbol];
    }

    await updateDoc(ref, {
        balance: balance + usdValue,
        portfolio
    });
    showToast(`Successfully sold ${symbol}`, "sell");
    await addDoc(
        collection(db, "users", auth.currentUser.uid, "walletHistory"),
        {
            type: "SELL",
            symbol,
            amountCrypto: cryptoAmount,
            amountUSD: usdValue,
            price,
            createdAt: new Date()
        }
    );
};

window.toggleMenu = function () {
    document.getElementById("navLinks")
        .classList.toggle("show");
};

window.addEventListener("load", () => {
    document.getElementById("navLinks")
        .classList.remove("show");
});

const links = document.querySelectorAll(".nav-links a");

links.forEach(link => {

    const href = link.getAttribute("href");

    if (window.location.pathname.includes(href)) {
        link.classList.add("active");
    }

});