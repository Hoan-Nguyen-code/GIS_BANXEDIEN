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


    if (typeof onAddressSelect === "function") {
        onAddressSelect(item.lat, item.lon, item.display_name);
    }
}

document.addEventListener('click', function(e) {
    if (!e.target.closest('#addressInput') && !e.target.closest('#addressSuggestions')) {
        suggestions.classList.remove('active');
    }
});

document.querySelector('form').addEventListener('submit', async function(e) {
    const address = addressInput.value.trim();
    if (!address) return;

    if (latInput.value && latInput.value !== '0') return;

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
// --- Đoạn code thêm mới vào cuối file ---
let adminMap, adminMarker;

function initAdminMap() {
    // Lấy tọa độ hiện tại từ input (nếu là sửa trạm) hoặc mặc định
    const latInput = document.getElementById('latitude');
    const lonInput = document.getElementById('longitude');
    const initialLat = (latInput && latInput.value !== "0") ? parseFloat(latInput.value) : 10.8231;
    const initialLon = (lonInput && lonInput.value !== "0") ? parseFloat(lonInput.value) : 106.6297;

    // Khởi tạo map
    adminMap = L.map('adminMiniMap').setView([initialLat, initialLon], 15);

    // Thay nguồn bản đồ sang CartoDB để không bị lỗi 403
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(adminMap);

    // Nếu đã có tọa độ thì cắm marker luôn
    if (latInput && latInput.value !== "0") {
        updateAdminMarker(initialLat, initialLon);
    }

    // Click vào map để ghim thủ công theo ý thầy
    adminMap.on('click', function(e) {
        updateAdminMarker(e.latlng.lat, e.latlng.lng);
    });
}

function updateAdminMarker(lat, lon) {
    if (adminMarker) adminMap.removeLayer(adminMarker);
    
    adminMarker = L.marker([lat, lon], { draggable: true }).addTo(adminMap);
    
    // Gán giá trị vào input để lưu vào database
    document.getElementById('latitude').value = lat.toFixed(6);
    document.getElementById('longitude').value = lon.toFixed(6);

    adminMarker.on('dragend', function(e) {
        const pos = adminMarker.getLatLng();
        document.getElementById('latitude').value = pos.lat.toFixed(6);
        document.getElementById('longitude').value = pos.lng.toFixed(6);
    });
}

// Hàm này để gọi khi nhấn vào danh sách gợi ý địa chỉ
function onAddressSelect(lat, lon, addressName) {
    document.getElementById('addressInput').value = addressName;
    const newLat = parseFloat(lat);
    const newLon = parseFloat(lon);
    
    adminMap.flyTo([newLat, newLon], 18); 
    updateAdminMarker(newLat, newLon);
}

// Chạy khởi tạo
document.addEventListener('DOMContentLoaded', initAdminMap);