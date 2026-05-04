function stripHTML(html) {
    let doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
}

function shuffleArray(array) {
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

async function loadNews() {
    const loading = document.getElementById('loading');
    const left = document.getElementById('newsLeft');
    const right = document.getElementById('newsRight');
    const grid = document.getElementById('newsGrid');

    try {
        const response = await fetch('/api/news/');
        const data = await response.json();

        loading.style.display = 'none';

        if (!data || data.length === 0) {
            loading.innerHTML = "Không có tin tức.";
            return;
        }

        const largeImages = shuffleArray([
            "/static/images/news/news7.jpg",
            "/static/images/news/news8.jpg",
            "/static/images/news/news9.jpg",
            "/static/images/news/news12.jpg"
        ]);

        const smallImages = shuffleArray([
            "/static/images/news/news1.jpg",
            "/static/images/news/news2.jpg",
            "/static/images/news/news3.jpg",
            "/static/images/news/news4.jpg",
            "/static/images/news/news5.jpg",
            "/static/images/news/news6.jpg",
            "/static/images/news/news10.jpg",
            "/static/images/news/news11.jpg",
            "/static/images/news/news12.jpg",
            "/static/images/news/news13.jpg",
            "/static/images/news/news14.jpg",
            "/static/images/news/news15.jpg",
        ]);

        const featured = data[0];
        const featuredImg = largeImages[0];

        right.innerHTML = `
            <div class="featured-news" onclick="window.open('${featured.link}', '_blank')">
                <img src="${featuredImg}">
                <div class="featured-content">
                    <h2>${featured.title || ""}</h2>
                    <p>${stripHTML(featured.content || "").substring(0, 150)}...</p>
                </div>
            </div>
        `;

        left.innerHTML = "";

        data.slice(1, 10).forEach((item, index) => {
            const img = smallImages[index];

            const div = document.createElement('div');
            div.classList.add('news-item');

            div.innerHTML = `
                <img src="${img}">
                <h4>${item.title || ""}</h4>
            `;

            div.onclick = () => {
                window.open(item.link, '_blank');
            };

            left.appendChild(div);
        });

        grid.innerHTML = "";

        data.slice(10, 20).forEach((item, index) => {
            const img = smallImages[index + 9] || smallImages[index % smallImages.length];

            const div = document.createElement('div');
            div.classList.add('news-card');

            div.innerHTML = `
                <img src="${img}">
                <div class="news-card-content">
                    <h3>${item.title || ""}</h3>
                </div>
            `;

            div.onclick = () => {
                window.open(item.link, '_blank');
            };

            grid.appendChild(div);
        });

    } catch (error) {
        loading.innerHTML = "❌ Lỗi tải Google News!";
        console.error(error);
    }
}

loadNews();