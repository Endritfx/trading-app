import { saveOpenTrade } from "./app.js";
import { db, auth } from "./firebase.js";

import {
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

window.prices = {};
let socket;

window.currentPair = "btcusdt";
window.currentPrice = 0;

/* MAIN SOCKET */
function startSocket(pair) {

    if (socket) socket.close();

    socket = new WebSocket(
        `wss://stream.binance.com:9443/ws/${pair}@trade`
    );

    socket.onmessage = (event) => {

        const data = JSON.parse(event.data);

        const price = parseFloat(data.p);

        window.currentPrice = price;

        // active pair price
        window.prices[pair.toUpperCase()] = price;

        const priceEl = document.getElementById("livePrice");

        if (priceEl) {
            priceEl.innerText = price.toFixed(2);
        }

        if (window.renderOpenTrades) {
            window.renderOpenTrades();
        }

        if (window.loadPortfolioNow) {
            window.loadPortfolioNow();
        }

    };
}

/* EXTRA SOCKETS FOR PORTFOLIO */
function startMiniSocket(symbol) {

    const ws = new WebSocket(
        `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`
    );

    ws.onmessage = (event) => {

        const data = JSON.parse(event.data);

        window.prices[symbol] = parseFloat(data.p);

        if (window.loadPortfolioNow) {
            window.loadPortfolioNow();
        }
    };
}

/* CHART */
function loadChart(pair) {

    document.getElementById("tvchart").innerHTML = "";

    new TradingView.widget({
        container_id: "tvchart",
        autosize: true,
        symbol: "BINANCE:" + pair.toUpperCase(),
        interval: window.innerWidth < 768 ? "5" : "15",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#0b0e11",

        hide_side_toolbar: false,
        allow_symbol_change: true,

        withdateranges: true,
        details: false,
        hotlist: false,
        calendar: false
    });

}

/* CHANGE PAIR */
window.changePair = function () {

    const select = document.getElementById("pairSelect");

    if (!select) return;

    window.currentPair = select.value;

    startSocket(window.currentPair);
    loadChart(window.currentPair);
};

/* OPEN TRADE */
window.openTrade = async function () {

    const amount =
        parseFloat(document.getElementById("amount").value) || 0;

    const leverage =
        parseFloat(document.getElementById("leverage").value) || 1;

    const tp =
        parseFloat(document.getElementById("tp").value) || 0;

    const sl =
        parseFloat(document.getElementById("sl").value) || 0;

    const side =
        document.getElementById("side").value;

    const currentPrice = window.currentPrice;

    const userRef = doc(db, "users", auth.currentUser.uid);
    const snap = await getDoc(userRef);
    const balance = snap.data()?.balance || 0;

    if (amount > balance) {
        alert("Not enough balance");
        return;
    }

    if (amount <= 0) {
        alert("Enter amount");
        return;
    }

    if (tp && side === "buy" && tp <= currentPrice) {
        alert("TP must be above entry for BUY");
        return;
    }

    if (sl && side === "buy" && sl >= currentPrice) {
        alert("SL must be below entry for BUY");
        return;
    }

    if (tp && side === "sell" && tp >= currentPrice) {
        alert("TP must be below entry for SELL");
        return;
    }

    if (sl && side === "sell" && sl <= currentPrice) {
        alert("SL must be above entry for SELL");
        return;
    }

    await saveOpenTrade({
        pair: window.currentPair.toUpperCase(),
        side,
        entry: currentPrice,
        amount,
        leverage,
        tp,
        sl
    });
};

/* START */
window.addEventListener("load", () => {

    setTimeout(() => {

        startSocket(window.currentPair);
        loadChart(window.currentPair);

        // portfolio prices
        startMiniSocket("BTCUSDT");
        startMiniSocket("ETHUSDT");
        startMiniSocket("SOLUSDT");

    }, 500);
});

/* =========================
   BUY SLIDER
========================= */
window.updateBuySlider = function (value) {

    const percent = Number(value);

    document.getElementById("buySliderValue").innerText =
        percent + "%";

    const balanceText =
        document.getElementById("balance").innerText;

    const balance =
        parseFloat(balanceText.replace("$", "")) || 0;

    const amount =
        balance * percent / 100;

    document.getElementById("buyAmount").value =
        amount.toFixed(2);
};

/* =========================
   SELL SLIDER
========================= */
window.updateSellSlider = function (value) {

    const percent = Number(value);

    document.getElementById("sliderValue").innerText =
        percent + "%";

    const symbol = window.currentPair.toUpperCase();

    const owned =
        window.userPortfolio?.[symbol] || 0;

    const amount =
        owned * percent / 100;

    document.getElementById("sellAmount").value =
        amount.toFixed(6);
};

