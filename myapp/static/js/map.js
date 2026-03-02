const map = L.map("map").setView([10.7769, 106.7009], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

L.marker([10.7769, 106.7009])
    .addTo(map)
    .bindPopup("📍 Trạm sạc mẫu")
    .openPopup();
