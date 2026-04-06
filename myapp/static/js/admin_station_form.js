// ── AUTOCOMPLETE ĐỊA CHỈ ──
const addressInput = document.getElementById('addressInput');
const suggestions  = document.getElementById('addressSuggestions');
const latInput     = document.getElementById('latitude');
const lonInput     = document.getElementById('longitude');

let searchTimeout = null;

addressInput.addEventListener('input', function() {
    const q = this.value.trim();
    clearTimeout(searchTimeout);

    if (q.length < 3) {
        suggestions.classList.remove('active');
        return;
    }

    searchTimeout = setTimeout(() => searchAddress(q), 400);
});

async function searchAddress(q) {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&countrycodes=vn&accept-language=vi`,
            { headers: { 'User-Agent': 'WebGIS-XeDien/1.0' } }
        );
        const data = await res.json();

        if (!data.length) {
            suggestions.classList.remove('active');
            return;
        }

        suggestions.innerHTML = data.map((item, i) => {
            const name = item.display_name.split(',')[0];
            const addr = item.display_name;
            return `
                <div class="suggestion-item" onclick="selectAddress(${i})">
                    <div class="suggestion-name">📍 ${name}</div>
                    <div class="suggestion-address">${addr}</div>
                </div>
            `;
        }).join('');

        suggestions.dataset.results = JSON.stringify(data);
        suggestions.classList.add('active');

    } catch(e) {
        suggestions.classList.remove('active');
    }
}

function selectAddress(index) {
    const data = JSON.parse(suggestions.dataset.results);
    const item = data[index];

    addressInput.value = item.display_name;
    latInput.value     = item.lat;
    lonInput.value     = item.lon;
    suggestions.classList.remove('active');
}

// Đóng khi click ra ngoài
document.addEventListener('click', function(e) {
    if (!e.target.closest('#addressInput') && !e.target.closest('#addressSuggestions')) {
        suggestions.classList.remove('active');
    }
});

// ── SUBMIT ──
document.querySelector('form').addEventListener('submit', async function(e) {
    const address = addressInput.value.trim();
    if (!address) return;

    // Đã có lat/lon từ autocomplete → submit luôn
    if (latInput.value && latInput.value !== '0') return;

    // Chưa chọn gợi ý → geocode lần cuối
    e.preventDefault();
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=vn`,
            { headers: { 'User-Agent': 'WebGIS-XeDien/1.0' } }
        );
        const data = await res.json();
        latInput.value = data.length ? data[0].lat : 0;
        lonInput.value = data.length ? data[0].lon : 0;
    } catch(err) {
        latInput.value = 0;
        lonInput.value = 0;
    }
    this.submit();
});