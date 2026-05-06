import { db, auth } from "./firebase.js";

import {
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";


const lessons = [

    {
        title: "🟡 What is Cryptocurrency?",
        level: "Beginner",
        content: "Cryptocurrency is a type of digital asset designed to work as a medium of exchange using blockchain technology. Unlike traditional currencies controlled by banks or governments, cryptocurrencies are decentralized and operate on peer-to-peer networks. This means users can send, receive, and store funds globally with lower fees, faster transactions, and greater financial freedom."
    },

    {
        title: "₿ What is Bitcoin?",
        level: "Beginner",
        content: "Bitcoin (BTC) is the first cryptocurrency, created in 2009 by an anonymous person or group known as Satoshi Nakamoto. Bitcoin introduced decentralized finance and blockchain technology to the world. It has a maximum supply of 21 million coins, making it scarce like digital gold."
    },

    {
        title: "⛓️ What is Blockchain?",
        level: "Beginner",
        content: "Blockchain is a decentralized digital ledger that records transactions across multiple computers. Each block contains data, and once verified, it links to the previous block, creating a chain. This system increases transparency, security, and prevents fraud or data manipulation."
    },

    {
        title: "🏦 What is a Crypto Wallet?",
        level: "Beginner",
        content: "A crypto wallet is a tool that allows users to store, send, and receive cryptocurrencies securely. Hot wallets are connected to the internet (MetaMask, Trust Wallet), while cold wallets are offline hardware devices (Ledger, Trezor) offering stronger security."
    },

    {
        title: "🔑 Private Key & Seed Phrase",
        level: "Security",
        content: "A private key gives full access to your crypto funds. A seed phrase (usually 12 or 24 words) is a backup to recover your wallet. If someone gets your seed phrase, they control your assets. Never share it with anyone."
    },

    {
        title: "🌐 What is Ethereum?",
        level: "Beginner",
        content: "Ethereum is a blockchain platform that allows developers to create decentralized applications (dApps), smart contracts, NFTs, and DeFi platforms. ETH is Ethereum’s native cryptocurrency used for paying gas fees."
    },

    {
        title: "📜 Smart Contracts",
        level: "Intermediate",
        content: "Smart contracts are self-executing digital agreements stored on a blockchain. They automatically execute actions when certain conditions are met, removing middlemen and enabling trustless systems."
    },

    {
        title: "🖼️ What are NFTs?",
        level: "Intermediate",
        content: "NFTs (Non-Fungible Tokens) are unique digital assets stored on blockchain that prove ownership of items like art, music, gaming items, or collectibles. Unlike Bitcoin, each NFT is unique."
    },

    {
        title: "💰 Market Cap",
        level: "Trading",
        content: "Market capitalization is the total value of a cryptocurrency. It is calculated by multiplying the coin price by circulating supply. Large market cap coins are usually more stable than small-cap coins."
    },

    {
        title: "📈 Bull Market vs Bear Market",
        level: "Trading",
        content: "A bull market is when prices rise and investor confidence is high. A bear market is when prices fall and fear dominates. Understanding market cycles helps investors make smarter decisions."
    },

    {
        title: "📊 Buy vs Sell",
        level: "Trading",
        content: "Buying means entering the market expecting prices to increase. Selling means exiting for profit or minimizing losses. Good traders use strategy rather than emotions."
    },

    {
        title: "🛡️ Stop Loss",
        level: "Trading",
        content: "Stop Loss is a risk management tool that automatically closes a trade when price hits a certain loss level. It protects traders from major losses."
    },

    {
        title: "🎯 Take Profit",
        level: "Trading",
        content: "Take Profit automatically closes your trade when your desired profit target is reached. This helps lock in gains without emotional decision-making."
    },

    {
        title: "⚡ Volatility",
        level: "Intermediate",
        content: "Volatility measures how much crypto prices move up or down. Crypto markets are highly volatile, meaning prices can change rapidly, creating both opportunity and risk."
    },

    {
        title: "💎 HODL",
        level: "Beginner",
        content: "HODL means holding cryptocurrency long-term despite market fluctuations. It started as a typo of 'hold' and became a strategy for long-term believers."
    },

    {
        title: "🏊 Liquidity",
        level: "Intermediate",
        content: "Liquidity refers to how easily a cryptocurrency can be bought or sold without affecting its price. High liquidity means smoother trading."
    },

    {
        title: "🌾 Staking",
        level: "Advanced",
        content: "Staking allows users to lock crypto assets in a blockchain network to support operations and earn rewards. It is common in Proof-of-Stake systems."
    },

    {
        title: "⛏️ Mining",
        level: "Advanced",
        content: "Mining is the process of validating blockchain transactions using computing power. Miners solve complex problems and receive rewards, mainly in Proof-of-Work systems like Bitcoin."
    },

    {
        title: "🧠 Trading Psychology",
        level: "Advanced",
        content: "Success in trading often depends on emotional discipline. Fear, greed, FOMO, and revenge trading can destroy portfolios. Smart traders follow plans and manage risk."
    },

    {
        title: "🚨 Avoid Crypto Scams",
        level: "Security",
        content: "Common scams include phishing websites, fake giveaways, pump-and-dump schemes, and fake tokens. Always verify URLs, use official platforms, and never trust guaranteed profits."
    }

];

const grid = document.getElementById("lessonGrid");
const search = document.getElementById("searchLesson");

let completed = [];
function renderLessons(filter = "") {

    grid.innerHTML = "";

    lessons.forEach((lesson, index) => {

        if (
            !lesson.title.toLowerCase()
                .includes(filter.toLowerCase())
        ) return;

        const done = completed.includes(index);

        const card = document.createElement("div");
        card.className = "lesson-card";

        // HIC INLINE onclick sepse po shkakton problem
        card.innerHTML = `
<div class="lesson-head">

<div>
<div class="lesson-title">${lesson.title}</div>
</div>

<div class="lesson-level">${lesson.level}</div>

</div>

<div class="lesson-body" id="body${index}">
${lesson.content}

<br>

<button
class="complete-btn ${done ? "done" : ""}"
onclick="completeLesson(event,${index})">

${done ? "✓ Completed" : "Mark Complete"}

</button>

</div>
`;

        // EVENT LISTENER VEQ KTU
        const head = card.querySelector(".lesson-head");

        head.addEventListener("click", () => {

            const currentBody = document.getElementById("body" + index);
            const isOpen = currentBody.classList.contains("open");

            document.querySelectorAll(".lesson-body").forEach(body => {
                body.classList.remove("open");
            });

            document.querySelectorAll(".lesson-card").forEach(card => {
                card.classList.remove("active");
            });

            if (!isOpen) {
                currentBody.classList.add("open");
                card.classList.add("active");
            }

        });

        grid.appendChild(card);

    });

    updateProgress();

}

// NDRYSHO VETËM këtë pjesë:

window.toggleLesson = function (index) {

    // Gjeje card-in aktual
    const currentLesson = document.getElementById("body" + index);

    // Kontrollo a osht open para se mi mbyll tjerat
    const isOpen = currentLesson.classList.contains("open");

    // Mbylli krejt lessons
    document.querySelectorAll(".lesson-body").forEach(body => {
        body.classList.remove("open");
    });

    // Nëse nuk ka qenë open, hape veq qat
    if (!isOpen) {
        currentLesson.classList.add("open");
    }

}

window.completeLesson = async function (e, index) {

    e.stopPropagation();

    if (!completed.includes(index)) {

        completed.push(index);

        await updateDoc(
            doc(db, "users", auth.currentUser.uid),
            {
                completedLessons: completed
            }
        );
    }

    renderLessons(search.value);

}

function updateProgress() {

    document.getElementById("doneLessons")
        .innerText = completed.length;

    const percent =
        (completed.length / lessons.length) * 100;

    document.getElementById("progressFill")
        .style.width = percent + "%";

}

search.oninput = () => {
    renderLessons(search.value);
}

/* LOAD USER PROGRESS */
onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "index.html";
        return;
    }

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    completed =
        snap.data()?.completedLessons || [];

    renderLessons();

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