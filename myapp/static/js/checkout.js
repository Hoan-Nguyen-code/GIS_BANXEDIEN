const addressInput = document.getElementById('addressInput');
const suggestions  = document.getElementById('addressSuggestions');

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
            return `
                <div class="suggestion-item" onclick="selectAddress(${i})">
                    <div class="suggestion-name">📍 ${name}</div>
                    <div class="suggestion-address">${item.display_name}</div>
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
    addressInput.value = data[index].display_name;
    suggestions.classList.remove('active');
}

document.addEventListener('click', function(e) {
    if (!e.target.closest('#addressInput') && !e.target.closest('#addressSuggestions')) {
        suggestions.classList.remove('active');
    }
});
