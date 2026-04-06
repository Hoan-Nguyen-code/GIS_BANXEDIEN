// ═══════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════
let userLat = null, userLon = null;
let stations = [];
let selectedStation = null; // Trạm đích được chọn thủ công
let map, userMarker, radiusCircle;
let stationMarkers = [];
let routeLayers = [];

// ✅ THÊM: Phương tiện mặc định
let selectedProfile = 'driving-car';

// ═══════════════════════════════════════════
// ✅ THÊM: VEHICLE PROFILES
// ═══════════════════════════════════════════
const VEHICLE_PROFILES = {
  'driving-car':      { label: 'Xe hơi',  icon: '🚗' },
  'driving-car-moto': { label: 'Xe máy',  icon: '🏍️' },
  'cycling-regular':  { label: 'Xe đạp',  icon: '🚲' },
  'foot-walking':     { label: 'Đi bộ',   icon: '🚶' },
};

// ✅ THÊM: Map profile sang ORS (xe máy dùng driving-car)
function getOrsProfile(profile) {
  if (profile === 'driving-car-moto') return 'driving-car';
  return profile;
}

// ✅ THÊM: Build UI vehicle selector
function buildVehicleSelector() {
  const container = document.getElementById('vehicleSelector');
  if (!container) return;
  container.innerHTML = '';
  Object.entries(VEHICLE_PROFILES).forEach(([key, v]) => {
    const btn = document.createElement('button');
    btn.className = 'vehicle-btn' + (key === selectedProfile ? ' active' : '');
    btn.innerHTML = `<span class="v-icon">${v.icon}</span><span class="v-label">${v.label}</span>`;
    btn.onclick = () => {

  selectedProfile = key;

  document.querySelectorAll('.vehicle-btn')
    .forEach(b => b.classList.remove('active'));

  btn.classList.add('active');

  // nếu đã có route thì tự tính lại
  if (routeLayers.length > 0) {
      findRoutes();
  }

  };
    container.appendChild(btn);
    });
  }

// ═══════════════════════════════════════════
// MAP INIT
// ═══════════════════════════════════════════
map = L.map('map', { zoomControl: true }).setView([10.95, 106.82], 13);

// Sử dụng CartoDB tile server (ổn định hơn và không yêu cầu referer)
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 20
}).addTo(map);

// ═══════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════
const userIcon = L.divIcon({
  className: '',
  html: `<div style="position:relative; width:32px; height:42px;">
    <svg viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg" style="width:32px;height:42px;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.4));">
      <path d="M16 0 C7.163 0 0 7.163 0 16 C0 28 16 42 16 42 C16 42 32 28 32 16 C32 7.163 24.837 0 16 0 Z" fill="#ef4444"/>
      <circle cx="16" cy="16" r="7" fill="white"/>
      <circle cx="16" cy="16" r="4" fill="#ef4444"/>
    </svg>
  </div>`,
  iconSize: [32, 42], iconAnchor: [16, 42]
});

function stationIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};
           border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.5);"></div>`,
    iconSize: [14, 14], iconAnchor: [7, 7]
  });
}

const COLORS = ['#22c55e','#a78bfa','#f59e0b','#ec4899','#06b6d4','#84cc16'];

// ═══════════════════════════════════════════
// LOCATION
// ═══════════════════════════════════════════
function getLocation() {
  if (!navigator.geolocation) {
    setStatus('Trình duyệt không hỗ trợ geolocation', 'err');
    return;
  }
  setStatus('Đang lấy vị trí...', 'pulse');
  navigator.geolocation.getCurrentPosition(pos => {
    userLat = pos.coords.latitude;
    userLon = pos.coords.longitude;

    document.getElementById('locInfo').innerHTML =
      `<span style="color:#00d4ff">📍 Lat: ${userLat.toFixed(5)}, Lon: ${userLon.toFixed(5)}</span>`;

    if (userMarker) map.removeLayer(userMarker);
    if (radiusCircle) map.removeLayer(radiusCircle);

    userMarker = L.marker([userLat, userLon], { icon: userIcon })
      .addTo(map).bindPopup('<b>📍 Vị trí của bạn</b>').openPopup();

    const radius = parseInt(document.getElementById('radiusSlider').value);
    drawRadius(radius);

    map.setView([userLat, userLon], 15);
    setStatus('Đã lấy vị trí thành công', 'ok');
    checkReady();
  }, err => {
    setStatus('Không lấy được vị trí: ' + err.message, 'err');
  });
}

document.getElementById('radiusSlider').addEventListener('input', function() {
  if (userLat && radiusCircle) drawRadius(parseInt(this.value));
  filterStationsInRadius();
});

function drawRadius(r) {
  if (radiusCircle) map.removeLayer(radiusCircle);
  radiusCircle = L.circle([userLat, userLon], {
    radius: r,
    color: '#00d4ff',
    fillColor: '#00d4ff',
    fillOpacity: 0.06,
    weight: 2,
    dashArray: '6,4'
  }).addTo(map);
}

// ═══════════════════════════════════════════
// STATIONS
// ═══════════════════════════════════════════
async function loadNearbyStations() {
  if (!userLat) {
    setStatus('Vui lòng lấy vị trí trước', 'err');
    return;
  }
  setStatus('Đang tìm trạm sạc gần bạn từ OpenStreetMap...', 'pulse');

  const radius = parseInt(document.getElementById('radiusSlider').value) + 3000;
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="charging_station"](around:${radius},${userLat},${userLon});
      way["amenity"="charging_station"](around:${radius},${userLat},${userLon});
    );
    out center;
  `;

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query
    });
    const data = await res.json();

    if (!data.elements || data.elements.length === 0) {
      setStatus('Không tìm thấy trạm sạc nào trên OSM gần bạn, dùng data mẫu', 'err');
      loadSampleData();
      return;
    }

    stations = data.elements.map((el, i) => {
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      const name = el.tags?.name || el.tags?.operator || `Trạm sạc #${i + 1}`;
      return { name, lat, lon };
    }).filter(s => s.lat && s.lon);

    renderStations();
    setStatus(`Tìm thấy ${stations.length} trạm sạc gần bạn (OSM)`, 'ok');
    checkReady();
  } catch (e) {
    setStatus('Lỗi Overpass API, dùng data mẫu thay thế', 'err');
    loadSampleData();
  }
}

async function loadSampleData() {
    try {
        const res = await fetch('/api/stations/');
        const data = await res.json();

        stations = data.stations.map(s => ({
            id: s.id,
            name: s.name,
            lat: s.lat,
            lon: s.lon,
            address: s.address,
            type: s.type,
            power: s.power,
            total_ports: s.total_ports,
            available_ports: s.available_ports,
            status: s.status,
        }));

        if (userLat) {
            const radius = parseInt(document.getElementById('radiusSlider').value);
            const autoRadius = Math.max(radius, 15000);
            const filtered = stations.filter(s => {
                const phi1 = Math.cos(userLat * Math.PI / 180);
                const dLat = (s.lat - userLat) * 111000;
                const dLon = (s.lon - userLon) * 111000 * phi1;
                return Math.sqrt(dLat * dLat + dLon * dLon) <= autoRadius;
            });
            if (filtered.length > 0) stations = filtered;
        }

        renderStations();
        setStatus(`Đã load ${stations.length} trạm sạc từ database`, 'ok');
        checkReady();

    } catch (e) {
        setStatus('Lỗi load data: ' + e.message, 'err');
    }
}
function addStation() {
  const name = document.getElementById('newName').value.trim();
  const lat  = parseFloat(document.getElementById('newLat').value);
  const lon  = parseFloat(document.getElementById('newLon').value);
  if (!name || isNaN(lat) || isNaN(lon)) {
    setStatus('Vui lòng nhập đầy đủ tên, lat, lon', 'err');
    return;
  }
  stations.push({ name, lat, lon });
  document.getElementById('newName').value = '';
  document.getElementById('newLat').value  = '';
  document.getElementById('newLon').value  = '';
  renderStations();
  checkReady();
}

function renderStations() {
  // Remove old markers
  stationMarkers.forEach(m => map.removeLayer(m));
  stationMarkers = [];

  const list = document.getElementById('stationList');
  if (!stations.length) {
    list.innerHTML = '<div class="empty"><div class="empty-icon">🔌</div>Chưa có trạm sạc</div>';
    return;
  }

  list.innerHTML = '';
  stations.forEach((s, i) => {
    const color = COLORS[i % COLORS.length];

    const div = document.createElement('div');
    div.className = 'station-item';
    div.id = `st-${i}`;
    div.innerHTML = `
      <div class="station-dot" style="background:${color}"></div>
      <div class="station-info">
        <div class="station-name">${s.name}</div>
        <div class="station-dist">${s.lat.toFixed(4)}, ${s.lon.toFixed(4)}</div>
      </div>
      <div style="font-size:10px; color:var(--text-muted);">click chọn</div>
    `;
    div.onclick = () => selectStation(i);
    list.appendChild(div);

    const m = L.marker([s.lat, s.lon], { icon: stationIcon(color) })
      .addTo(map)
      .bindPopup(`
          <div class="station-popup">
              ${s.image ? `<img src="${s.image}" class="station-img" style="width:100%;border-radius:8px;margin-bottom:8px;">` : ''}
              <h3>⚡ ${s.name}</h3>
              <div class="station-coord">📍 ${s.lat.toFixed(5)}, ${s.lon.toFixed(5)}</div>
              <div>📌 ${s.address || ''}</div>
              <div>🔌 Loại: ${s.type || 'DC Fast'}</div>
              <div>⚡ Công suất: ${s.power || '50kW'}</div>
              <div>🅿️ Tổng cổng: ${s.total_ports || 0} | Còn trống: ${s.available_ports || 0}</div>
              <div>🟢 Trạng thái: ${s.status === 'ACTIVE' ? 'Hoạt động' : s.status === 'MAINTENANCE' ? 'Bảo trì' : 'Ngừng'}</div>
          </div>
      `);
    stationMarkers.push(m);
  });

  filterStationsInRadius();
}

function selectStation(idx) {
  selectedStation = { ...stations[idx], i: idx };

  // Highlight UI
  document.querySelectorAll('.station-item').forEach(el => el.classList.remove('active'));
  const el = document.getElementById(`st-${idx}`);
  if (el) el.classList.add('active');

  // Hiện box trạm đã chọn
  document.getElementById('selectedStationBox').style.display = 'block';
  document.getElementById('selectedStationName').textContent = selectedStation.name;

  // Zoom vào trạm
  map.setView([selectedStation.lat, selectedStation.lon], 15);
  setStatus(`Đã chọn: ${selectedStation.name}`, 'ok');
}

function clearSelectedStation() {
  selectedStation = null;
  document.getElementById('selectedStationBox').style.display = 'none';
  document.querySelectorAll('.station-item').forEach(el => el.classList.remove('active'));
  setStatus('Sẽ dùng trạm gần nhất tự động', 'ok');
}

function filterStationsInRadius() {
  if (!userLat) return;
  const radius = parseInt(document.getElementById('radiusSlider').value);
  stations.forEach((s, i) => {
    const d = haversine(userLat, userLon, s.lat, s.lon);
    const el = document.getElementById(`st-${i}`);
    if (el) el.style.opacity = d <= radius ? '1' : '0.35';
  });
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
            Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ═══════════════════════════════════════════
// FIND ROUTES — CORE FUNCTION
// ═══════════════════════════════════════════
async function findRoutes() {
  const apiKey = document.getElementById('apiKey').value.trim();
  if (!apiKey) { setStatus('Vui lòng nhập ORS API Key', 'err'); return; }
  if (!userLat) { setStatus('Vui lòng lấy vị trí trước', 'err'); return; }
  if (!stations.length) { setStatus('Chưa có dữ liệu trạm sạc', 'err'); return; }

  const radius = parseInt(document.getElementById('radiusSlider').value);

  // ✅ THÊM: Lấy profile và thông tin phương tiện
  const vehicle = VEHICLE_PROFILES[selectedProfile];
  const orsProfile = getOrsProfile(selectedProfile);

  // Dùng trạm đã chọn thủ công, hoặc tự động lấy trạm gần nhất
  let target;
  if (selectedStation) {
    target = { ...selectedStation, dist: haversine(userLat, userLon, selectedStation.lat, selectedStation.lon) };
  } else {
    const nearby = stations
      .map((s, i) => ({ ...s, i, dist: haversine(userLat, userLon, s.lat, s.lon) }))
      .filter(s => s.dist <= radius)
      .sort((a, b) => a.dist - b.dist);

    if (nearby.length < 1) {
      setStatus('Không có trạm nào trong bán kính', 'err');
      return;
    }
    target = nearby[0];
  }

  // ✅ THÊM: Hiện icon phương tiện trong status
  setStatus(`${vehicle.icon} Đang tính đường cho ${vehicle.label} đến "${target.name}"...`, 'pulse');
  document.getElementById('findBtn').disabled = true;

  // Xóa route cũ
  routeLayers.forEach(l => map.removeLayer(l));
  routeLayers = [];

  try {
    // ✅ THÊM: Truyền orsProfile vào
    const data = await fetchAlternativeRoutes(apiKey, userLat, userLon, target.lat, target.lon, orsProfile);
    const features = data.features;

    if (!features || features.length < 1) {
      setStatus('ORS không trả về đường đi nào', 'err');
      document.getElementById('findBtn').disabled = false;
      return;
    }

    const lineColors = ['#00d4ff', '#ff6b35'];
    const lineWidths = [6, 3];
    const lineDash   = [null, '10,6'];
    const results = [];

    features.slice(0, 2).forEach((feature, idx) => {
      const coords = feature.geometry.coordinates.map(c => [c[1], c[0]]);
      const opts = {
        color: lineColors[idx],
        weight: lineWidths[idx],
        opacity: 0.9,
      };
      if (lineDash[idx]) opts.dashArray = lineDash[idx];

      const poly = L.polyline(coords, opts).addTo(map);
      routeLayers.push(poly);

      // Animate
      poly.setStyle({ opacity: 0 });
      setTimeout(() => poly.setStyle({ opacity: 0.9 }), idx * 500);

      const summary = feature.properties.summary;
      results.push({
        label: idx === 0 ? 'Ngắn nhất' : 'Ngắn thứ 2',
        target,
        dist_m: Math.round(summary.distance),
        time_s: Math.round(summary.duration),
      });
    });

    // Fit bounds
    const allCoords = routeLayers.flatMap(l => l.getLatLngs());
    if (allCoords.length) map.fitBounds(L.latLngBounds(allCoords), { padding: [50, 50] });

    // Highlight trạm đích
    const el = document.getElementById(`st-${target.i}`);
    if (el) el.classList.add('active');

    // ✅ THÊM: Truyền vehicle vào renderRouteResults
    renderRouteResults(results, lineColors, target, vehicle);
    setStatus(`${vehicle.icon} Đã tìm thấy ${results.length} đường đi (${vehicle.label}) đến ${target.name}`, 'ok');

  } catch (e) {
    setStatus('Lỗi ORS API: ' + e.message, 'err');
  }

  document.getElementById('findBtn').disabled = false;
}

// ✅ THÊM: Nhận thêm tham số profile
async function fetchAlternativeRoutes(apiKey, fromLat, fromLon, toLat, toLon, profile) {
  const res = await fetch(`https://api.openrouteservice.org/v2/directions/${profile}/geojson`, {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8'
    },
    body: JSON.stringify({
      coordinates: [[fromLon, fromLat], [toLon, toLat]],
      alternative_routes: {
        target_count: 2,   // Yêu cầu 2 đường
        weight_factor: 1.6,
        share_factor: 0.6
      }
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ✅ THÊM: Hiện thêm icon phương tiện trong kết quả
function renderRouteResults(results, lineColors, target, vehicle) {
  const container = document.getElementById('routeResults');
  container.innerHTML = '';

  // Header trạm đích + phương tiện
  const header = document.createElement('div');
  header.style.cssText = 'font-size:11px;color:var(--text-muted);margin-bottom:10px;padding:8px 10px;background:var(--bg);border-radius:8px;line-height:1.8;';
  header.innerHTML = `
    🎯 Đích đến: <span style="color:var(--accent1);font-weight:600">${target.name}</span><br>
    ${vehicle.icon} Phương tiện: <span style="color:var(--accent1);font-weight:600">${vehicle.label}</span>
  `;
  container.appendChild(header);

  results.forEach(({ label, dist_m, time_s }, idx) => {
    const dText = dist_m >= 1000 ? (dist_m/1000).toFixed(2) + ' km' : dist_m + ' m';
    const tText = time_s >= 60 ? Math.floor(time_s/60) + ' phút ' + (time_s%60) + 's' : time_s + 's';

    const card = document.createElement('div');
    card.className = 'route-card';
    card.innerHTML = `
      <div class="route-card-header">
        <div class="route-badge badge-${idx+1}">ĐƯỜNG ${idx+1}</div>
        <span class="route-card-title">${label}</span>
      </div>
      <div class="route-stats">
        <div class="stat-box">
          <div class="stat-label">Khoảng cách</div>
          <div class="stat-val" style="color:${lineColors[idx]}">${dText}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Thời gian</div>
          <div class="stat-val">${tText}</div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════
function setStatus(msg, type) {
  document.getElementById('statusText').textContent = msg;
  const dot = document.getElementById('statusDot');
  dot.style.display = 'block';
  dot.className = 'dot-pulse';
  if (type === 'ok')  { dot.className = ''; dot.style.cssText = 'width:7px;height:7px;border-radius:50%;background:#22c55e;flex-shrink:0'; }
  if (type === 'err') { dot.className = ''; dot.style.cssText = 'width:7px;height:7px;border-radius:50%;background:#ef4444;flex-shrink:0'; document.getElementById('statusText').style.color = '#ef4444'; }
  else { document.getElementById('statusText').style.color = ''; }
}

function checkReady() {
  const ok = userLat && stations.length >= 1;
  document.getElementById('findBtn').disabled = !ok;
}

// ✅ THÊM: Khởi tạo vehicle selector khi DOM ready
document.addEventListener('DOMContentLoaded', () => {
    buildVehicleSelector();

    // Đọc destination từ URL params
    const params = new URLSearchParams(window.location.search);
    const destLat = params.get('dest_lat');
    const destLon = params.get('dest_lon');
    const destName = params.get('dest_name');

    if (destLat && destLon && destName) {
        const lat = parseFloat(destLat);
        const lon = parseFloat(destLon);
        const name = decodeURIComponent(destName);

        setTimeout(() => {
            stations.push({ name, lat, lon });
            renderStations();
            selectStation(stations.length - 1);
            map.setView([lat, lon], 16);
            setStatus(`✅ Đã chọn điểm đến: ${name}`, 'ok');
        }, 500);
    }
});
// ═══════════════════════════════════════════
// 🔍 PLACE SEARCH FUNCTIONALITY
// ═══════════════════════════════════════════

let searchMarker = null;
let searchTimeout = null;
let searchResults = [];
let selectedSearchIndex = -1;
let currentPlace = null;

// Initialize search functionality
function initPlaceSearch() {
  const searchInput = document.getElementById('placeSearch');
  const resultsContainer = document.getElementById('searchResults');
  
  if (!searchInput) return;

  // Input event - search as user types
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    
    clearTimeout(searchTimeout);
    
    if (query.length < 3) {
      hideSearchResults();
      return;
    }

    // Debounce search
    searchTimeout = setTimeout(() => {
      searchPlaces(query);
    }, 500);
  });

  // Keyboard navigation
  searchInput.addEventListener('keydown', (e) => {
    if (!resultsContainer.classList.contains('active')) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedSearchIndex = Math.min(selectedSearchIndex + 1, searchResults.length - 1);
      highlightSearchResult(selectedSearchIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedSearchIndex = Math.max(selectedSearchIndex - 1, 0);
      highlightSearchResult(selectedSearchIndex);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSearchIndex >= 0 && searchResults[selectedSearchIndex]) {
        selectPlace(searchResults[selectedSearchIndex]);
      }
    } else if (e.key === 'Escape') {
      hideSearchResults();
    }
  });

  // Click outside to close
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box')) {
      hideSearchResults();
    }
  });
}

// Search for places using Nominatim API
async function searchPlaces(query) {
  const resultsContainer = document.getElementById('searchResults');
  const statusEl = document.getElementById('searchStatus');
  
  // Show loading
  resultsContainer.innerHTML = `
    <div class="search-loading">
      <div class="search-spinner"></div>
      <div style="margin-top:8px;">Đang tìm kiếm...</div>
    </div>
  `;
  resultsContainer.classList.add('active');
  
  if (statusEl) {
    statusEl.innerHTML = '<span class="search-spinner"></span> Đang tìm kiếm...';
  }

  try {
    // Use Nominatim API (OpenStreetMap geocoding)
    // Thêm countrycodes=vn để ưu tiên kết quả ở Việt Nam
    const url = `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(query)}&` +
      `format=json&` +
      `addressdetails=1&` +
      `limit=10&` +
      `countrycodes=vn&` +
      `accept-language=vi`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'WebGIS-XeDien/1.0' // Required by Nominatim
      }
    });

    if (!response.ok) {
      throw new Error('Search API error');
    }

    const data = await response.json();
    searchResults = data;
    selectedSearchIndex = -1;

    if (data.length === 0) {
      resultsContainer.innerHTML = `
        <div class="search-empty">
          <div class="search-empty-icon">🔍</div>
          <div>Không tìm thấy "${query}"</div>
        </div>
      `;
      if (statusEl) {
        statusEl.textContent = 'Không tìm thấy kết quả';
      }
      return;
    }

    // Render results
    renderSearchResults(data);
    
    if (statusEl) {
      statusEl.textContent = `Tìm thấy ${data.length} kết quả`;
    }

  } catch (error) {
    console.error('Search error:', error);
    resultsContainer.innerHTML = `
      <div class="search-empty">
        <div class="search-empty-icon">❌</div>
        <div>Lỗi tìm kiếm. Vui lòng thử lại.</div>
      </div>
    `;
    if (statusEl) {
      statusEl.textContent = 'Lỗi tìm kiếm';
    }
  }
}

// Render search results
function renderSearchResults(results) {
  const container = document.getElementById('searchResults');
  
  container.innerHTML = results.map((place, index) => {
    const icon = getPlaceIcon(place.type);
    const name = place.display_name.split(',')[0];
    const address = place.display_name;
    const type = getPlaceType(place.type);

    return `
      <div class="search-result-item" onclick="selectPlace(searchResults[${index}])" data-index="${index}">
        <div class="search-result-name">
          <span class="search-result-icon">${icon}</span>
          <span>${name}</span>
        </div>
        <div class="search-result-address">${address}</div>
        ${type ? `<span class="search-result-type">${type}</span>` : ''}
      </div>
    `;
  }).join('');

  container.classList.add('active');
}

// Get icon based on place type
function getPlaceIcon(type) {
  const icons = {
    'university': '🎓',
    'school': '🏫',
    'hospital': '🏥',
    'pharmacy': '💊',
    'restaurant': '🍽️',
    'cafe': '☕',
    'hotel': '🏨',
    'shopping': '🛒',
    'mall': '🏬',
    'park': '🌳',
    'museum': '🏛️',
    'theatre': '🎭',
    'cinema': '🎬',
    'stadium': '🏟️',
    'airport': '✈️',
    'train_station': '🚂',
    'bus_station': '🚌',
    'place_of_worship': '⛪',
    'bank': '🏦',
    'atm': '🏧',
    'fuel': '⛽',
    'charging_station': '🔌',
    'building': '🏢',
    'residential': '🏘️',
    'default': '📍'
  };

  return icons[type] || icons['default'];
}

// Get Vietnamese place type
function getPlaceType(type) {
  const types = {
    'university': 'Đại học',
    'school': 'Trường học',
    'hospital': 'Bệnh viện',
    'pharmacy': 'Nhà thuốc',
    'restaurant': 'Nhà hàng',
    'cafe': 'Quán cà phê',
    'hotel': 'Khách sạn',
    'shopping': 'Mua sắm',
    'mall': 'Trung tâm thương mại',
    'park': 'Công viên',
    'museum': 'Bảo tàng',
    'cinema': 'Rạp chiếu phim',
    'stadium': 'Sân vận động',
    'airport': 'Sân bay',
    'train_station': 'Ga tàu',
    'bus_station': 'Bến xe',
    'place_of_worship': 'Nhà thờ/Chùa',
    'bank': 'Ngân hàng',
    'fuel': 'Cây xăng',
    'charging_station': 'Trạm sạc',
  };

  return types[type] || '';
}

// Select a place from search results
async function selectPlace(place) {
  if (!place) return;

  const lat = parseFloat(place.lat);
  const lon = parseFloat(place.lon);

  // Hide search results
  hideSearchResults();

  // Clear search input
  document.getElementById('placeSearch').value = place.display_name.split(',')[0];

  // Remove old search marker
  if (searchMarker) {
    map.removeLayer(searchMarker);
  }

  // Create custom icon for search result
  const searchIcon = L.divIcon({
    className: '',
    html: `<div style="position:relative; width:32px; height:42px;">
      <svg viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg" style="width:32px;height:42px;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.4));">
        <path d="M16 0 C7.163 0 0 7.163 0 16 C0 28 16 42 16 42 C16 42 32 28 32 16 C32 7.163 24.837 0 16 0 Z" fill="#00d4ff"/>
        <circle cx="16" cy="16" r="7" fill="white"/>
        <circle cx="16" cy="16" r="4" fill="#00d4ff"/>
      </svg>
    </div>`,
    iconSize: [32, 42],
    iconAnchor: [16, 42]
  });

  // Add marker
  searchMarker = L.marker([lat, lon], { icon: searchIcon })
    .addTo(map)
    .bindPopup(`
      <div style="min-width:200px;">
        <b>${place.display_name.split(',')[0]}</b><br>
        <small>${place.display_name}</small>
      </div>
    `)
    .openPopup();

  // Fly to location with smooth animation
  map.flyTo([lat, lon], 17, {
    duration: 1.5,
    easeLinearity: 0.25
  });

  // Store current place
  currentPlace = place;

  // Update status
  const statusEl = document.getElementById('searchStatus');
  if (statusEl) {
    statusEl.innerHTML = `
      <span style="color:var(--accent1);">📍 Đã chọn: ${place.display_name.split(',')[0]}</span>
    `;
  }

  // Try to get place image from Wikimedia (optional)
  fetchPlaceImage(place);

  // Show place detail card
  showPlaceDetail(place);
}

// Fetch place image from Wikimedia Commons (optional enhancement)
async function fetchPlaceImage(place) {
    try {
        const name = place.display_name.split(',')[0];
        const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        return data.thumbnail?.source || null;
    } catch (e) {
        return null;
    }
}

// Show place detail card
function showPlaceDetail(place) {
  const statusEl = document.getElementById('searchStatus');
  if (!statusEl) return;

  const detailHTML = `
    <div class="place-detail-card">
      <div class="place-detail-content">
        <div class="place-detail-name">${place.display_name.split(',')[0]}</div>
        <div class="place-detail-address">${place.display_name}</div>
        <div class="place-detail-coords">
          📍 Lat: ${parseFloat(place.lat).toFixed(5)}, Lon: ${parseFloat(place.lon).toFixed(5)}
        </div>
        <div class="place-detail-actions">
          <button class="place-detail-btn primary" onclick="setAsDestination(currentPlace)">
            🎯 Đặt làm điểm đến
          </button>
          <button class="place-detail-btn secondary" onclick="clearSearchPlace()">
            ✖️ Xóa
          </button>
        </div>
      </div>
    </div>
  `;

  statusEl.innerHTML = detailHTML;
}

// Set search place as destination (for routing)
function setAsDestination(place) {
  if (!place) return;

  const lat = parseFloat(place.lat);
  const lon = parseFloat(place.lon);
  const name = place.display_name.split(',')[0];

  // Add as a custom station
  stations.push({
    name: name,
    lat: lat,
    lon: lon
  });

  renderStations();
  
  // Select this station
  selectStation(stations.length - 1);

  // Show notification
  setStatus(`✅ Đã thêm "${name}" làm trạm đích`, 'ok');
}

// Clear search place
function clearSearchPlace() {
  if (searchMarker) {
    map.removeLayer(searchMarker);
    searchMarker = null;
  }

  currentPlace = null;
  document.getElementById('placeSearch').value = '';
  
  const statusEl = document.getElementById('searchStatus');
  if (statusEl) {
    statusEl.textContent = '';
  }

  setStatus('Đã xóa địa điểm tìm kiếm', 'ok');
}

// Highlight search result (keyboard navigation)
function highlightSearchResult(index) {
  const items = document.querySelectorAll('.search-result-item');
  items.forEach((item, i) => {
    item.classList.remove('keyboard-focus');
    if (i === index) {
      item.classList.add('keyboard-focus');
      item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });
}

// Hide search results
function hideSearchResults() {
  const container = document.getElementById('searchResults');
  if (container) {
    container.classList.remove('active');
  }
  selectedSearchIndex = -1;
}

// Initialize on page load
if (typeof document !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlaceSearch);
  } else {
    initPlaceSearch();
  }
}