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

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap | © ORS',
  maxZoom: 19
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

function loadSampleData() {
  // Data mẫu toàn quốc - tự động chọn theo vị trí người dùng
  const ALL_STATIONS = [
// Biên Hòa - Đồng Nai
      {
      name: "Trạm Sạc Vinfast - Vincom Biên Hòa",
      lat: 10.9741,
      lon: 106.8986,
      image: "/static/images/places/vincom.jpg"
      },

      {
      name: "Trạm Sạc Evgo - LotteMart Biên Hòa",
      lat: 10.9680,
      lon: 106.8830,
      image: "/static/images/places/lotte.jpg"
      },

      {
      name: "Trạm Sạc EVN - Khu CN Amata",
      lat: 10.9590,
      lon: 106.8920,
      image: "/static/images/places/amata.jpg"
      },

      {
      name: "Trạm Sạc ChargePoint - QL1A",
      lat: 10.9820,
      lon: 106.8760,
      image: "/static/images/places/ql1a.jpg"
      },
      {
      name: "Trạm Sạc Tesla - TTTM Go! Biên Hòa",  lat: 10.9500, 
      lon: 106.8650,
      image: "/static/images/places/go.jpg"
     },
      // Bình Chánh - TP.HCM
      {
      name: "Trạm Sạc Vinfast - SC VivoCity",
      lat: 10.7290,
      lon: 106.7218,
      image: "/static/images/places/vivocity.jpg"
      },

      {
      name: "Trạm Sạc 2",
      lat: 10.6850,
      lon: 106.5980,
      //image: "/static/images/places/binhchanh.jpg"
      },

      {
      name: "Trạm Sạc ChargePoint - QL50",
      lat: 10.6720,
      lon: 106.6100,
      image: "/static/images/places/ql50.jpg"
      },

      {
      name: "Trạm Sạc Vinfast - Aeon Mall BT",
      lat: 10.7435,
      lon: 106.6221,
      image: "/static/images/places/aeon.jpg"
      },

      {
      name: "Trạm Sạc Evgo - KCN Lê Minh Xuân",
      lat: 10.6540,
      lon: 106.5750,
      image: "/static/images/places/leminhxuan.jpg"
      },

      // Quận 7 / Nhà Bè
      {
      name: "Trạm Sạc Vinfast - Crescent Mall",
      lat: 10.7327,
      lon: 106.7178,
      image: "/static/images/places/crescent.jpg"
      },

      {
      name: "Trạm Sạc Tesla - Phú Mỹ Hưng",
      lat: 10.7262,
      lon: 106.7017,
      image: "/static/images/places/phumyhung.jpg"
      },

    {name: "Trạm Sạc 1", lat: 10.809, lon: 106.564},
    {name: "Trạm Sạc EVN - Bình Chánh", lat: 10.812, lon: 106.570, image: "/static/images/places/binhchanh.jpg"},
    {name: "Trạm Sạc 3", lat: 10.800, lon: 106.550},
    {name: "Trạm Sạc 4", lat: 10.820, lon: 106.600}
  ];

  if (userLat) {
    // Tự động lọc theo vị trí hiện tại + bán kính rộng để chắc có data
    const radius = parseInt(document.getElementById('radiusSlider').value);
    const autoRadius = Math.max(radius, 15000); // tối thiểu 15km để có data
    stations = ALL_STATIONS.filter(s => {
      const phi1 = Math.cos(userLat * Math.PI / 180);
      const dLat = (s.lat - userLat) * 111000;
      const dLon = (s.lon - userLon) * 111000 * phi1;
      return Math.sqrt(dLat*dLat + dLon*dLon) <= autoRadius;
    });
    if (stations.length === 0) stations = ALL_STATIONS; // fallback: load hết
  } else {
    stations = ALL_STATIONS;
  }

  renderStations();
  setStatus(`Đã load ${stations.length} trạm mẫu gần bạn`, 'ok');
  checkReady();
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

      <img src="${s.image}" class="station-img">

      <h3>⚡ ${s.name}</h3>

      <div class="station-coord">
      📍 ${s.lat.toFixed(5)}, ${s.lon.toFixed(5)}
      </div>

      <div>🔌 CCS2 / Type2</div>

      <div>⚡ Công suất: 120kW</div>

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
});