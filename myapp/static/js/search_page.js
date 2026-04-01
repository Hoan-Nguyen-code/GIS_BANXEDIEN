// ===== SEARCH PAGE JS =====

// ═══════════════════════════════════════════
// MAP INIT
// ═══════════════════════════════════════════
const map = L.map('map').setView([10.95, 106.82], 13);

L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

let searchMarker = null;
let currentPlace = null;
let searchTimeout = null;

// ═══════════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════════
const searchInput = document.getElementById('searchInput');

searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    clearTimeout(searchTimeout);
    if (query.length < 3) {
        hideResults();
        return;
    }
    searchTimeout = setTimeout(() => searchPlaces(query), 500);
});

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch();
    if (e.key === 'Escape') hideResults();
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-bar-wrapper')) hideResults();
});

async function doSearch() {
    const query = searchInput.value.trim();
    if (query.length < 2) return;
    searchPlaces(query);
}

async function searchPlaces(query) {
    const panel = document.getElementById('searchResultsPanel');
    panel.innerHTML = `
        <div class="search-loading">
            <div class="spinner"></div>
            <div>Đang tìm kiếm...</div>
        </div>
    `;
    panel.classList.add('active');

    try {
        const url = `https://nominatim.openstreetmap.org/search?` +
            `q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=8&countrycodes=vn&accept-language=vi`;

        const res = await fetch(url, { headers: { 'User-Agent': 'WebGIS-XeDien/1.0' } });
        const data = await res.json();

        if (data.length === 0) {
            panel.innerHTML = `
                <div class="search-loading">
                    <div>🔍 Không tìm thấy kết quả</div>
                </div>
            `;
            return;
        }

        panel.innerHTML = data.map((place, i) => {
            const icon = getPlaceIcon(place.type);
            const name = place.display_name.split(',')[0];
            const type = getPlaceType(place.type);
            return `
                <div class="result-item" onclick="selectPlace(${i})">
                    <div class="result-icon">${icon}</div>
                    <div class="result-info">
                        <div class="result-name">${name}</div>
                        <div class="result-address">${place.display_name}</div>
                        ${type ? `<span class="result-type">${type}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        // Lưu kết quả vào biến global
        window._searchResults = data;

    } catch (e) {
        panel.innerHTML = `<div class="search-loading">❌ Lỗi tìm kiếm</div>`;
    }
}

function hideResults() {
    const panel = document.getElementById('searchResultsPanel');
    panel.classList.remove('active');
}

// ═══════════════════════════════════════════
// SELECT PLACE
// ═══════════════════════════════════════════
async function selectPlace(index) {
    const place = window._searchResults[index];
    if (!place) return;

    hideResults();
    searchInput.value = place.display_name.split(',')[0];

    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);

    currentPlace = place;

    // Zoom map
    map.flyTo([lat, lon], 17, { duration: 1.5 });

    // Marker
    if (searchMarker) map.removeLayer(searchMarker);
    const icon = L.divIcon({
        className: '',
        html: `<div style="position:relative; width:32px; height:42px;">
            <svg viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg"
                style="width:32px;height:42px;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.4));">
                <path d="M16 0 C7.163 0 0 7.163 0 16 C0 28 16 42 16 42 C16 42 32 28 32 16 C32 7.163 24.837 0 16 0 Z" fill="#0891b2"/>
                <circle cx="16" cy="16" r="7" fill="white"/>
                <circle cx="16" cy="16" r="4" fill="#0891b2"/>
            </svg>
        </div>`,
        iconSize: [32, 42], iconAnchor: [16, 42]
    });
    searchMarker = L.marker([lat, lon], { icon }).addTo(map);

    // Hiện panel detail
    showPlaceDetail(place, null);

    // Lấy ảnh Wikipedia
    const imageUrl = await fetchWikiImage(
    place.display_name.split(',')[0],
    parseFloat(place.lat),
    parseFloat(place.lon)
);

    // Cập nhật ảnh
    showPlaceDetail(place, imageUrl);

    // Lưu lịch sử
    saveHistory(place, imageUrl);
}

function selectFromHistory(query, lat, lon, displayName, imageUrl) {
    searchInput.value = query;

    const place = {
        display_name: displayName,
        lat: lat,
        lon: lon,
        type: ''
    };

    currentPlace = place;

    map.flyTo([lat, lon], 17, { duration: 1.5 });

    if (searchMarker) map.removeLayer(searchMarker);
    const icon = L.divIcon({
        className: '',
        html: `<div style="position:relative; width:32px; height:42px;">
            <svg viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg"
                style="width:32px;height:42px;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.4));">
                <path d="M16 0 C7.163 0 0 7.163 0 16 C0 28 16 42 16 42 C16 42 32 28 32 16 C32 7.163 24.837 0 16 0 Z" fill="#0891b2"/>
                <circle cx="16" cy="16" r="7" fill="white"/>
                <circle cx="16" cy="16" r="4" fill="#0891b2"/>
            </svg>
        </div>`,
        iconSize: [32, 42], iconAnchor: [16, 42]
    });
    searchMarker = L.marker([lat, lon], { icon }).addTo(map);

    showPlaceDetail(place, imageUrl || null);
}

// ═══════════════════════════════════════════
// PLACE DETAIL PANEL
// ═══════════════════════════════════════════
function showPlaceDetail(place, imageUrl) {
    const name = place.display_name.split(',')[0];
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);
    const type = getPlaceType(place.type);

    // Ảnh
    const imgContainer = document.getElementById('placeImageContainer');
    if (imageUrl) {
        imgContainer.innerHTML = `
            <img src="${imageUrl}" class="place-image" alt="${name}"
                 onerror="this.parentElement.innerHTML='<div class=\'place-image-placeholder\'>📍</div>'">
        `;
    } else {
        imgContainer.innerHTML = `
            <div class="place-image-placeholder">
                ${getPlaceIcon(place.type)}
            </div>
        `;
    }

    // Tên
    document.getElementById('placeName').textContent = name;

    // Badge
    const badge = document.getElementById('placeTypeBadge');
    badge.textContent = type || 'Địa điểm';
    badge.style.display = type ? 'inline-block' : 'none';

    // Địa chỉ
    document.getElementById('placeAddress').querySelector('span').textContent = place.display_name;

    // Tọa độ
    document.getElementById('placeCoords').querySelector('span').textContent =
        `${lat.toFixed(5)}, ${lon.toFixed(5)}`;

    // Hiện panel
    document.getElementById('placeDetail').classList.add('active');
    document.getElementById('historySection').style.display = 'none';
}

function closePlaceDetail() {
    document.getElementById('placeDetail').classList.remove('active');
    document.getElementById('historySection').style.display = 'block';
    if (searchMarker) { map.removeLayer(searchMarker); searchMarker = null; }
    searchInput.value = '';
    currentPlace = null;
}

function goToMap() {
    if (!currentPlace) return;
    const lat = parseFloat(currentPlace.lat);
    const lon = parseFloat(currentPlace.lon);
    const name = encodeURIComponent(currentPlace.display_name.split(',')[0]);
    window.location.href = `/map/?dest_lat=${lat}&dest_lon=${lon}&dest_name=${name}`;
}

function copyCoords() {
    if (!currentPlace) return;
    const lat = parseFloat(currentPlace.lat).toFixed(5);
    const lon = parseFloat(currentPlace.lon).toFixed(5);
    navigator.clipboard.writeText(`${lat}, ${lon}`).then(() => {
        alert('Đã sao chép tọa độ!');
    });
}

// ═══════════════════════════════════════════
// WIKIPEDIA IMAGE
// ═══════════════════════════════════════════
async function fetchWikiImage(name, lat, lon) {
    try {
        // Thử Wikipedia tiếng Việt trước
        const urlVi = `https://vi.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`;
        const resVi = await fetch(urlVi);
        if (resVi.ok) {
            const dataVi = await resVi.json();
            if (dataVi.thumbnail?.source) return dataVi.thumbnail.source;
        }

        // Thử Wikipedia tiếng Anh
        const urlEn = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`;
        const resEn = await fetch(urlEn);
        if (resEn.ok) {
            const dataEn = await resEn.json();
            if (dataEn.thumbnail?.source) return dataEn.thumbnail.source;
        }

        // Dùng OpenStreetMap Static Map làm ảnh thay thế
        if (lat && lon) {
            return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=17&size=400x200&markers=${lat},${lon},red`;
        }

        return null;
    } catch (e) {
        // Fallback: dùng OpenStreetMap Static Map
        if (lat && lon) {
            return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=17&size=400x200&markers=${lat},${lon},red`;
        }
        return null;
    }
}

// ═══════════════════════════════════════════
// SAVE HISTORY
// ═══════════════════════════════════════════
async function saveHistory(place, imageUrl) {
    try {
        await fetch('/api/search-history/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
            body: JSON.stringify({
                query: place.display_name.split(',')[0],
                display_name: place.display_name,
                latitude: parseFloat(place.lat),
                longitude: parseFloat(place.lon),
                image_url: imageUrl || '',
            })
        });

        // Reload history list
        loadHistory();
    } catch (e) {
        console.log('Lỗi lưu lịch sử:', e);
    }
}

async function loadHistory() {
    try {
        const res = await fetch('/api/search-history/');
        const data = await res.json();
        const list = document.getElementById('historyList');

        if (!data.history || data.history.length === 0) {
            list.innerHTML = `
                <div class="empty-history">
                    <div class="empty-history-icon">🔍</div>
                    <div style="font-size:14px; font-weight:500; margin-bottom:4px;">Chưa có lịch sử</div>
                    <div style="font-size:12px;">Bắt đầu tìm kiếm để lưu lịch sử</div>
                </div>
            `;
            return;
        }

        list.innerHTML = data.history.map(item => `
            <div class="history-item" onclick="selectFromHistory(
                '${item.query.replace(/'/g, "\\'")}',
                ${item.latitude},
                ${item.longitude},
                '${item.display_name.replace(/'/g, "\\'")}',
                '${item.image_url || ''}'
            )">
                <div class="history-icon">
                    ${item.image_url
                        ? `<img src="${item.image_url}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">`
                        : '<i class="fas fa-history"></i>'
                    }
                </div>
                <div class="history-info">
                    <div class="history-name">${item.query}</div>
                    <div class="history-time">${formatDate(item.searched_at)}</div>
                </div>
            </div>
        `).join('');

    } catch (e) {
        console.log('Lỗi load lịch sử:', e);
    }
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════
function getPlaceIcon(type) {
    const icons = {
        'university': '🎓', 'school': '🏫', 'hospital': '🏥',
        'restaurant': '🍽️', 'cafe': '☕', 'hotel': '🏨',
        'mall': '🏬', 'park': '🌳', 'museum': '🏛️',
        'airport': '✈️', 'train_station': '🚂', 'bus_station': '🚌',
        'bank': '🏦', 'fuel': '⛽', 'charging_station': '🔌',
        'default': '📍'
    };
    return icons[type] || icons['default'];
}

function getPlaceType(type) {
    const types = {
        'university': 'Đại học', 'school': 'Trường học',
        'hospital': 'Bệnh viện', 'restaurant': 'Nhà hàng',
        'cafe': 'Quán cà phê', 'hotel': 'Khách sạn',
        'mall': 'Trung tâm thương mại', 'park': 'Công viên',
        'museum': 'Bảo tàng', 'airport': 'Sân bay',
        'train_station': 'Ga tàu', 'bus_station': 'Bến xe',
        'bank': 'Ngân hàng', 'fuel': 'Cây xăng',
        'charging_station': 'Trạm sạc',
    };
    return types[type] || '';
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        document.cookie.split(';').forEach(cookie => {
            cookie = cookie.trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
            }
        });
    }
    return cookieValue;
}

// Load history khi trang load
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
});