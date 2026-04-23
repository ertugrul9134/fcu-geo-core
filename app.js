import { coordinates as DEFAULT_COORDS, measurements as DEFAULT_MEAS } from './data.js';

/* ═══════════════════════════════════════════════
   GEODETIC ENGINE — Mathematically Verified Core
   ═══════════════════════════════════════════════ */
const GON_TO_RAD = Math.PI / 200.0;
const RAD_TO_GON = 200.0 / Math.PI;

function normalizeGon(a) {
    a = a % 400;
    return a < 0 ? a + 400 : a;
}

function firstFundamental(ya, xa, azimuth, distance) {
    const r = azimuth * GON_TO_RAD;
    const dy = distance * Math.sin(r);
    const dx = distance * Math.cos(r);
    return { y: ya + dy, x: xa + dx, dy, dx };
}

function secondFundamental(ya, xa, yb, xb) {
    const dy = yb - ya;
    const dx = xb - xa;
    const dist = Math.sqrt(dy * dy + dx * dx);
    if (dist < 1e-12) return { azimuth: 0, distance: 0, dy, dx };

    const base = dx !== 0
        ? Math.abs(Math.atan(Math.abs(dy / dx))) * RAD_TO_GON
        : 100.0;

    let az;
    if      (dy >= 0 && dx >= 0) az = base;
    else if (dy >= 0 && dx <  0) az = 200 - base;
    else if (dy <  0 && dx <  0) az = 200 + base;
    else                         az = 400 - base;

    return { azimuth: normalizeGon(az), distance: dist, dy, dx };
}

/* ═══════════════════════════════════════════════
   DATABASE — localStorage with Default Fallback
   ═══════════════════════════════════════════════ */
class Database {
    constructor() { this.load(); }

    load() {
        const sc = localStorage.getItem('fcu_coords');
        const sm = localStorage.getItem('fcu_meas');
        this.coords = sc ? JSON.parse(sc) : JSON.parse(JSON.stringify(DEFAULT_COORDS));
        this.meas   = sm ? JSON.parse(sm) : JSON.parse(JSON.stringify(DEFAULT_MEAS));
    }

    save(c, m) {
        this.coords = c;
        this.meas = m;
        localStorage.setItem('fcu_coords', JSON.stringify(c));
        localStorage.setItem('fcu_meas', JSON.stringify(m));
    }

    reset() {
        localStorage.removeItem('fcu_coords');
        localStorage.removeItem('fcu_meas');
        this.coords = JSON.parse(JSON.stringify(DEFAULT_COORDS));
        this.meas   = JSON.parse(JSON.stringify(DEFAULT_MEAS));
    }

    dir(from, to) {
        const m = this.meas.find(r => r.dn == from && r.bn == to);
        return m ? m.dir : null;
    }

    dist(from, to) {
        const m = this.meas.find(r => r.dn == from && r.bn == to);
        return m && m.dist != null ? m.dist : null;
    }
}

/* ═══════════════════════════════════════════════
   UTM ↔ WGS84 Coordinate Bridge (Zone 35N)
   ═══════════════════════════════════════════════ */
proj4.defs('EPSG:32635', '+proj=utm +zone=35 +datum=WGS84 +units=m +no_defs');

function utmToLatLng(easting, northing) {
    const [lng, lat] = proj4('EPSG:32635', 'EPSG:4326', [easting, northing]);
    return [lat, lng];
}

/* ═══════════════════════════════════════════════
   APPLICATION CONTROLLER
   ═══════════════════════════════════════════════ */
class App {
    constructor() {
        this.db = new Database();
        this.selectedNodes = [];
        this.markers = {};
        this.triangleLayer = null;
        this.map = null;

        this.bindNav();
        this.bindControls();
        this.initMap();
        this.renderStaticFormulas();
    }

    /* ——— Navigation ——— */
    bindNav() {
        const btns = document.querySelectorAll('.nav-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
                document.getElementById('page' + capitalize(btn.dataset.page)).classList.add('active');
                if (btn.dataset.page === 'map' && this.map) {
                    setTimeout(() => this.map.invalidateSize(), 100);
                }
            });
        });
    }

    /* ——— Control Bindings ——— */
    bindControls() {
        document.getElementById('calculateBtn').addEventListener('click', () => this.calculate());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearSelection());

        // Database page
        document.getElementById('saveDbBtn').addEventListener('click', () => this.saveDb());
        document.getElementById('resetDbBtn').addEventListener('click', () => this.resetDb());

        // Populate DB editors
        this.populateDbEditors();
    }

    populateDbEditors() {
        document.getElementById('coordsEditor').value = JSON.stringify(this.db.coords, null, 2);
        document.getElementById('measEditor').value = JSON.stringify(this.db.meas, null, 2);
    }

    saveDb() {
        try {
            const c = JSON.parse(document.getElementById('coordsEditor').value);
            const m = JSON.parse(document.getElementById('measEditor').value);
            this.db.save(c, m);
            this.clearSelection();
            this.rebuildMapMarkers();
            alert('✅ Veritabanı başarıyla güncellendi.');
        } catch (e) {
            alert('❌ JSON ayrıştırma hatası:\n' + e.message);
        }
    }

    resetDb() {
        if (!confirm('Tüm veriler varsayılan değerlere sıfırlanacak. Devam?')) return;
        this.db.reset();
        this.populateDbEditors();
        this.clearSelection();
        this.rebuildMapMarkers();
    }

    /* ——— Map Init ——— */
    initMap() {
        // Hardcoded center from Commander's coordinates
        const CENTER = [41.02424225534065, 28.88684129461136];

        this.map = L.map('geoMap', {
            center: CENTER,
            zoom: 18,
            zoomControl: true
        });

        // --- Tile Layers (All free, no API key required) ---
        const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        });

        const googleSat = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            attribution: '© Google'
        });

        const googleHybrid = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            attribution: '© Google'
        });

        const topoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            maxZoom: 17,
            attribution: '© OpenTopoMap'
        });

        osm.addTo(this.map); // Default: OSM (most reliable)

        L.control.layers(
            {
                'Sokak (OSM)': osm,
                'Uydu (Google)': googleSat,
                'Hibrit (Google)': googleHybrid,
                'Topoğrafik': topoMap
            },
            null,
            { position: 'topright' }
        ).addTo(this.map);

        this.rebuildMapMarkers();
    }

    rebuildMapMarkers() {
        // Clear existing markers
        Object.values(this.markers).forEach(m => this.map.removeLayer(m));
        this.markers = {};
        if (this.triangleLayer) { this.map.removeLayer(this.triangleLayer); this.triangleLayer = null; }

        const ids = Object.keys(this.db.coords);

        ids.forEach(id => {
            const c = this.db.coords[id];
            const ll = utmToLatLng(c.Y, c.X);

            const icon = L.divIcon({
                className: '',
                html: `<div class="node-marker" data-id="${id}">${id}</div>`,
                iconSize: [28, 28],
                iconAnchor: [14, 14]
            });

            const marker = L.marker(ll, { icon, riseOnHover: true }).addTo(this.map);

            marker.bindPopup(
                `<b>Nokta ${id}</b><br>Y: ${c.Y.toFixed(3)}<br>X: ${c.X.toFixed(3)}`,
                { closeButton: false, offset: [0, -8] }
            );

            marker.on('click', () => this.toggleNode(Number(id)));
            this.markers[id] = marker;
        });

        // Auto-fit map to show all markers
        if (ids.length > 0) {
            const bounds = L.latLngBounds(ids.map(id => {
                const c = this.db.coords[id];
                return utmToLatLng(c.Y, c.X);
            }));
            this.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 19 });
        }
    }

    /* ——— Selection Logic ——— */
    toggleNode(id) {
        const idx = this.selectedNodes.indexOf(id);
        if (idx > -1) {
            this.selectedNodes.splice(idx, 1);
        } else if (this.selectedNodes.length < 3) {
            this.selectedNodes.push(id);
        }
        this.updateSelectionUI();
    }

    clearSelection() {
        this.selectedNodes = [];
        this.updateSelectionUI();
        document.getElementById('resultsContent').innerHTML = '<span class="empty-hint">Üç nokta seçip "Hesapla" butonuna basın...</span>';
    }

    updateSelectionUI() {
        const list = document.getElementById('selectedNodesList');
        if (this.selectedNodes.length === 0) {
            list.innerHTML = '<span class="empty-hint">Haritadan nokta seçin...</span>';
        } else {
            list.innerHTML = this.selectedNodes.map(id => `<span class="chip">📍 ${id}</span>`).join('');
        }

        document.getElementById('calculateBtn').disabled = this.selectedNodes.length !== 3;

        // Update marker visuals
        Object.keys(this.markers).forEach(id => {
            const el = this.markers[id].getElement();
            if (!el) return;
            const inner = el.querySelector('.node-marker');
            if (!inner) return;
            if (this.selectedNodes.includes(Number(id))) {
                inner.classList.add('selected');
            } else {
                inner.classList.remove('selected');
            }
        });

        // Draw/remove triangle
        if (this.triangleLayer) { this.map.removeLayer(this.triangleLayer); this.triangleLayer = null; }

        if (this.selectedNodes.length >= 2) {
            const latlngs = this.selectedNodes.map(id => {
                const c = this.db.coords[id];
                return utmToLatLng(c.Y, c.X);
            });
            this.triangleLayer = L.polygon(latlngs, {
                color: '#C4956A',
                weight: 3,
                dashArray: this.selectedNodes.length < 3 ? '8 6' : null,
                fillColor: '#C4956A',
                fillOpacity: this.selectedNodes.length === 3 ? 0.18 : 0.05
            }).addTo(this.map);
        }
    }

    /* ——— Calculation Engine ——— */
    calculate() {
        if (this.selectedNodes.length !== 3) return;
        const [p1, p2, p3] = this.selectedNodes;
        let html = '';

        const fm = (tex) => `<div class="formula-render">$$${tex}$$</div>`;

        // ——— STEP 1: Internal Angles from Directions ———
        html += `<div class="result-section"><strong>① Açı Çıkarımı & Kapanma Hatası</strong>`;

        const getAngle = (center, a, b) => {
            const da = this.db.dir(center, a);
            const db = this.db.dir(center, b);
            if (da === null || db === null) return null;
            let diff = Math.abs(da - db);
            if (diff > 200) diff = 400 - diff;
            return diff;
        };

        let angles = {
            [p1]: getAngle(p1, p2, p3),
            [p2]: getAngle(p2, p1, p3),
            [p3]: getAngle(p3, p1, p2)
        };

        const hasMeasuredAngles = angles[p1] !== null && angles[p2] !== null && angles[p3] !== null;

        if (!hasMeasuredAngles) {
            // Fallback: theoretical from coordinates
            html += `<br><span class="err">Yeterli doğrultu verisi bulunamadı → Koordinatlardan hesaplanıyor.</span><br>`;

            const ca = (center, na, nb) => {
                const cc = this.db.coords[center];
                const a1 = secondFundamental(cc.Y, cc.X, this.db.coords[na].Y, this.db.coords[na].X).azimuth;
                const a2 = secondFundamental(cc.Y, cc.X, this.db.coords[nb].Y, this.db.coords[nb].X).azimuth;
                let d = Math.abs(a2 - a1);
                if (d > 200) d = 400 - d;
                return d;
            };

            angles[p1] = ca(p1, p2, p3);
            angles[p2] = ca(p2, p1, p3);
            angles[p3] = ca(p3, p1, p2);
        }

        const sum = angles[p1] + angles[p2] + angles[p3];
        const w = 200 - sum;

        html += `<br>β<sub>${p1}</sub> = ${angles[p1].toFixed(4)}<sup>g</sup><br>`;
        html += `β<sub>${p2}</sub> = ${angles[p2].toFixed(4)}<sup>g</sup><br>`;
        html += `β<sub>${p3}</sub> = ${angles[p3].toFixed(4)}<sup>g</sup><br>`;
        html += `Toplam = ${sum.toFixed(4)}<sup>g</sup><br>`;

        html += fm(`w = 200^g - (${angles[p1].toFixed(4)}^g + ${angles[p2].toFixed(4)}^g + ${angles[p3].toFixed(4)}^g) = ${w.toFixed(4)}^g`);

        // Distribute error
        const corr = w / 3;
        angles[p1] += corr;
        angles[p2] += corr;
        angles[p3] += corr;

        html += `Düzeltme = ${corr.toFixed(4)}<sup>g</sup> / açı<br>`;
        html += `<span class="highlight">β'<sub>${p1}</sub> = ${angles[p1].toFixed(4)}<sup>g</sup></span><br>`;
        html += `<span class="highlight">β'<sub>${p2}</sub> = ${angles[p2].toFixed(4)}<sup>g</sup></span><br>`;
        html += `<span class="highlight">β'<sub>${p3}</sub> = ${angles[p3].toFixed(4)}<sup>g</sup></span>`;
        html += `</div>`;

        // ——— STEP 2: Sine Theorem ———
        html += `<div class="result-section"><strong>② Sinüs Teoremi (Kenar Hesabı)</strong>`;

        let d12 = this.db.dist(p1, p2) || this.db.dist(p2, p1);
        let d23 = this.db.dist(p2, p3) || this.db.dist(p3, p2);
        let d31 = this.db.dist(p3, p1) || this.db.dist(p1, p3);

        let baseD, baseOpp, bA, bB;
        if      (d12) { baseD = d12; baseOpp = angles[p3]; bA = p1; bB = p2; }
        else if (d23) { baseD = d23; baseOpp = angles[p1]; bA = p2; bB = p3; }
        else if (d31) { baseD = d31; baseOpp = angles[p2]; bA = p3; bB = p1; }

        if (!baseD) {
            // Fallback: compute from coordinates
            const c1 = this.db.coords[p1], c2 = this.db.coords[p2], c3 = this.db.coords[p3];
            d12 = secondFundamental(c1.Y, c1.X, c2.Y, c2.X).distance;
            d23 = secondFundamental(c2.Y, c2.X, c3.Y, c3.X).distance;
            d31 = secondFundamental(c3.Y, c3.X, c1.Y, c1.X).distance;

            html += `<br><span class="err">Ölçülmüş mesafe yok → Koordinatlardan hesaplanıyor.</span><br>`;
            html += `S<sub>${p1}-${p2}</sub> = <span class="highlight">${d12.toFixed(3)}m</span><br>`;
            html += `S<sub>${p2}-${p3}</sub> = <span class="highlight">${d23.toFixed(3)}m</span><br>`;
            html += `S<sub>${p3}-${p1}</sub> = <span class="highlight">${d31.toFixed(3)}m</span>`;
        } else {
            html += fm(`\frac{S_{${bA}${bB}}}{\sin(\beta'_{karşı})} = \frac{S_{bln}}{\sin(\beta'_{bln})}`);

            const ratio = baseD / Math.sin(baseOpp * GON_TO_RAD);
            d12 = d12 || ratio * Math.sin(angles[p3] * GON_TO_RAD);
            d23 = d23 || ratio * Math.sin(angles[p1] * GON_TO_RAD);
            d31 = d31 || ratio * Math.sin(angles[p2] * GON_TO_RAD);

            html += `Baz kenar: S<sub>${bA}-${bB}</sub> = ${baseD.toFixed(3)}m<br>`;
            html += `S<sub>${p1}-${p2}</sub> = <span class="highlight">${d12.toFixed(3)}m</span><br>`;
            html += `S<sub>${p2}-${p3}</sub> = <span class="highlight">${d23.toFixed(3)}m</span><br>`;
            html += `S<sub>${p3}-${p1}</sub> = <span class="highlight">${d31.toFixed(3)}m</span>`;
        }
        html += `</div>`;

        // ——— STEP 3: 2. Temel Ödev (Azimuth) ———
        html += `<div class="result-section"><strong>③ 2. Temel Ödev (Azimut & Mesafe)</strong>`;
        const c1 = this.db.coords[p1], c2 = this.db.coords[p2], c3 = this.db.coords[p3];

        const r12 = secondFundamental(c1.Y, c1.X, c2.Y, c2.X);
        const r23 = secondFundamental(c2.Y, c2.X, c3.Y, c3.X);
        const r31 = secondFundamental(c3.Y, c3.X, c1.Y, c1.X);

        html += fm(`\alpha_{${p1}${p2}} = \arctan\left(\frac{|\Delta Y|}{|\Delta X|}\right) \rightarrow ${r12.azimuth.toFixed(4)}^g`);
        html += `(${p1}→${p2}): α = <span class="highlight">${r12.azimuth.toFixed(4)}<sup>g</sup></span>, S = ${r12.distance.toFixed(3)}m<br>`;
        html += `(${p2}→${p3}): α = <span class="highlight">${r23.azimuth.toFixed(4)}<sup>g</sup></span>, S = ${r23.distance.toFixed(3)}m<br>`;
        html += `(${p3}→${p1}): α = <span class="highlight">${r31.azimuth.toFixed(4)}<sup>g</sup></span>, S = ${r31.distance.toFixed(3)}m`;
        html += `</div>`;

        // ——— STEP 4: 1. Temel Ödev (Coordinate Projection) ———
        html += `<div class="result-section"><strong>④ 1. Temel Ödev (Koordinat Projeksiyonu)</strong>`;

        const az13_true = secondFundamental(c1.Y, c1.X, c3.Y, c3.X).azimuth;
        let az13 = r12.azimuth + angles[p1];
        if (Math.abs(normalizeGon(az13) - az13_true) > 100) az13 = r12.azimuth - angles[p1];
        az13 = normalizeGon(az13);

        const proj = firstFundamental(c1.Y, c1.X, az13, d31);

        html += fm(`Y_{${p3}} = Y_{${p1}} + S \cdot \sin(\alpha) = ${c1.Y.toFixed(3)} + ${proj.dy.toFixed(3)} = ${proj.y.toFixed(3)}`);
        html += fm(`X_{${p3}} = X_{${p1}} + S \cdot \cos(\alpha) = ${c1.X.toFixed(3)} + ${proj.dx.toFixed(3)} = ${proj.x.toFixed(3)}`);

        const ey = Math.abs(proj.y - c3.Y);
        const ex = Math.abs(proj.x - c3.X);
        html += `Veritabanı: Y=${c3.Y.toFixed(3)}, X=${c3.X.toFixed(3)}<br>`;
        html += `Sapma: ΔY = <span class="${ey > 0.05 ? 'err' : 'highlight'}">${ey.toFixed(3)}m</span>, ΔX = <span class="${ex > 0.05 ? 'err' : 'highlight'}">${ex.toFixed(3)}m</span>`;
        html += `</div>`;

        // ——— STEP 5: 3. Temel Ödev (Azimuth Relay) ———
        html += `<div class="result-section"><strong>⑤ 3. Temel Ödev (Açı Nakli)</strong>`;
        const relay = normalizeGon(r12.azimuth + 200 + angles[p2]);
        html += fm(`\alpha_{${p2}${p3}} = \alpha_{${p1}${p2}} + 200^g + \beta'_{${p2}} \pmod{400^g}`);
        html += fm(`= ${r12.azimuth.toFixed(4)}^g + 200^g + ${angles[p2].toFixed(4)}^g = ${relay.toFixed(4)}^g`);
        html += `Doğrudan hesaplanan: <span class="highlight">${r23.azimuth.toFixed(4)}<sup>g</sup></span><br>`;
        const relayErr = Math.abs(relay - r23.azimuth);
        html += `Fark: <span class="${relayErr > 1 ? 'err' : 'highlight'}">${relayErr.toFixed(4)}<sup>g</sup></span>`;
        html += `</div>`;

        document.getElementById('resultsContent').innerHTML = html;

        // Render math
        renderMathInElement(document.getElementById('resultsContent'), {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '\\(', right: '\\)', display: false }
            ],
            throwOnError: false
        });
    }

    /* ——— Static Formula Rendering ——— */
    renderStaticFormulas() {
        const r = (id, tex) => {
            const el = document.getElementById(id);
            if (el) katex.render(tex, el, { displayMode: true, throwOnError: false });
        };

        // 1. Temel Ödev
        r('f1eq1', 'Y_B = Y_A + S \cdot \sin(\alpha)');
        r('f1eq2', 'X_B = X_A + S \cdot \cos(\alpha)');

        // 2. Temel Ödev
        r('f2eq1', '\Delta Y = Y_B - Y_A, \quad \Delta X = X_B - X_A');
        r('f2eq2', 'S = \sqrt{\Delta Y^2 + \Delta X^2}');
        r('f2eq3', '\alpha = \arctan\left(\frac{|\Delta Y|}{|\Delta X|}\right) + \text{kadran düzeltmesi}');

        // 3. Temel Ödev
        r('f3eq1', '\alpha_{BC} = \alpha_{AB} + 200^g + \beta \pmod{400^g}');

        // Sine
        r('f4eq1', '\frac{a}{\sin(\alpha)} = \frac{b}{\sin(\beta)} = \frac{c}{\sin(\gamma)}');
    }
}

/* ═══ UTILITY ═══ */
function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ═══ BOOT ═══ */
document.addEventListener('DOMContentLoaded', () => {
    window.FCU = new App();
});
