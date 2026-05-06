const grid = document.getElementById("newsGrid");
const breaking = document.getElementById("breakingNews");

const API =
    "https://api.rss2json.com/v1/api.json?rss_url=https://cointelegraph.com/rss";


async function loadNews() {

    grid.innerHTML =
        `<div class="loading">Loading crypto news...</div>`;

    try {

        const res = await fetch(API);
        const data = await res.json();

        let news = data.items || [];

        const search =
            document.getElementById("searchNews").value.toLowerCase();

        const category =
            document.getElementById("category").value.toLowerCase();

        news = news.filter(item => {

            const title = item.title.toLowerCase();
            const desc = item.description.toLowerCase();

            const matchSearch =
                !search ||
                title.includes(search) ||
                desc.includes(search);

            const matchCategory =
                !category ||
                title.includes(category) ||
                desc.includes(category);

            return matchSearch && matchCategory;

        });

        if (news.length > 0) {
            breaking.innerHTML = "🔥 " + news[0].title;
        }

        grid.innerHTML = "";

        news.slice(0, 18).forEach(item => {

            const card = document.createElement("div");
            card.className = "news-card";

            card.innerHTML = `
<img class="news-img"src="${item.thumbnail && item.thumbnail.includes('http')
                    ? item.thumbnail
                    : 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800'}"
                    onerror="this.src='https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800'">

<div class="news-content">

<div class="news-source">
<span>CoinTelegraph</span>
<span>${item.pubDate.split(" ")[0]}</span>
</div>

<div class="news-title">${item.title}</div>

<div class="news-desc">
${item.description.replace(/<[^>]*>/g, '').substring(0, 120)}...
</div>

<div class="news-footer">
<div class="sentiment bullish">Live</div>

<a class="news-link"
href="${item.link}"
target="_blank">
Read
</a>
</div>

</div>
`;

            grid.appendChild(card);

        });

    } catch (err) {

        grid.innerHTML =
            `<div class="loading">Failed loading news.</div>`;

    }

}

document
    .getElementById("searchNews")
    .addEventListener("input", loadNews);

document
    .getElementById("category")
    .addEventListener("change", loadNews);

loadNews();
setInterval(loadNews, 60000);

const links = document.querySelectorAll(".nav-links a");

links.forEach(link => {
    if (window.location.pathname.includes(link.getAttribute("href"))) {
        link.classList.add("active");
    }
});


window.toggleMenu = function () {
    document.getElementById("navLinks")
        .classList.toggle("show");
};

window.addEventListener("load", () => {
    document.getElementById("navLinks")
        .classList.remove("show");
});