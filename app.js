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
   TUREF/TM30 ↔ WGS84 Coordinate Bridge
   Turkish National CRS — Central Meridian 30°E
   Verified: (406355, 4543843) → (28.8866, 41.0241)
   ═══════════════════════════════════════════════ */
proj4.defs('TUREF_TM30', '+proj=tmerc +lat_0=0 +lon_0=30 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs');

function toLatLng(easting, northing) {
    const [lng, lat] = proj4('TUREF_TM30', 'EPSG:4326', [easting, northing]);
    return [lat, lng];
}

/* ═══════════════════════════════════════════════
   KaTeX HELPER — Solves JS string escape issues
   String.raw prevents \f, \s, \a etc. from being
   interpreted as JS escape sequences.
   ═══════════════════════════════════════════════ */
function tex(strings, ...values) {
    // Tagged template literal that preserves backslashes
    let result = '';
    strings.forEach((str, i) => {
        result += str;
        if (i < values.length) result += values[i];
    });
    return result;
}

// Render a KaTeX display formula block
function mathBlock(texStr) {
    return '<div class="formula-render">' + katex.renderToString(texStr, { displayMode: true, throwOnError: false }) + '</div>';
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
        const indicator = document.querySelector('.nav-indicator');
        const navBar = document.getElementById('headerNav');
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');

        if (mobileMenuBtn && navBar) {
            mobileMenuBtn.addEventListener('click', () => {
                navBar.classList.toggle('nav-open');
            });
        }

        const moveIndicator = (el) => {
            if (!el || !indicator) return;
            indicator.style.width = `${el.offsetWidth}px`;
            indicator.style.transform = `translateX(${el.offsetLeft}px)`;
            indicator.style.opacity = '1';
        };

        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
                document.getElementById('page' + capitalize(btn.dataset.page)).classList.add('active');
                
                moveIndicator(btn);
                
                // Close mobile menu on click
                if (navBar && navBar.classList.contains('nav-open')) {
                    navBar.classList.remove('nav-open');
                }

                if (btn.dataset.page === 'map' && this.map) {
                    setTimeout(() => this.map.invalidateSize(), 100);
                }
            });

            btn.addEventListener('mouseenter', () => moveIndicator(btn));
        });

        if (navBar) {
            navBar.addEventListener('mouseleave', () => {
                const activeBtn = document.querySelector('.nav-btn.active');
                if (activeBtn) {
                    moveIndicator(activeBtn);
                } else if (indicator) {
                    indicator.style.opacity = '0';
                }
            });
        }

        // Initialize indicator position
        setTimeout(() => {
            const activeBtn = document.querySelector('.nav-btn.active');
            if (activeBtn) moveIndicator(activeBtn);
        }, 100);
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
            const rawHtml = '<div class="node-marker" data-id="' + escapeHTML(id) + '">' + escapeHTML(id) + '</div>';
            const safeHtml = window.DOMPurify ? DOMPurify.sanitize(rawHtml) : rawHtml;

            const icon = L.divIcon({
                className: '',
                html: safeHtml,
                iconSize: [28, 28],
                iconAnchor: [14, 14]
            });

            const marker = L.marker(ll, { icon, riseOnHover: true }).addTo(this.map);

            const tooltipHtml = '<b>Nokta ' + escapeHTML(id) + '</b><br>Y: ' + c.Y.toFixed(3) + '<br>X: ' + c.X.toFixed(3);
            marker.bindTooltip(
                window.DOMPurify ? DOMPurify.sanitize(tooltipHtml) : tooltipHtml,
                { direction: 'top', offset: [0, -10], opacity: 0.9 }
            );

            marker.on('click', () => this.toggleNode(Number(id)));
            this.markers[id] = marker;
        });

        // Auto-fit map to show all markers
        if (ids.length > 0) {
            const bounds = L.latLngBounds(ids.map(id => {
                const c = this.db.coords[id];
                return toLatLng(c.Y, c.X);
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
            list.innerHTML = this.selectedNodes.map(id => '<span class="chip">📍 ' + escapeHTML(id) + '</span>').join('');
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
                return toLatLng(c.Y, c.X);
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

        // ——— STEP 1: Internal Angles from Directions ———
        html += '<div class="result-section"><strong>① Açı Çıkarımı & Kapanma Hatası</strong>';

        const getAngle = (center, a, b) => {
            const da = this.db.dir(center, a);
            const db = this.db.dir(center, b);
            if (da === null || db === null) return null;
            let diff = Math.abs(da - db);
            if (diff > 200) diff = 400 - diff;
            return diff;
        };

        const ca = (center, na, nb) => {
            const cc = this.db.coords[center];
            const a1 = secondFundamental(cc.Y, cc.X, this.db.coords[na].Y, this.db.coords[na].X).azimuth;
            const a2 = secondFundamental(cc.Y, cc.X, this.db.coords[nb].Y, this.db.coords[nb].X).azimuth;
            let d = Math.abs(a2 - a1);
            if (d > 200) d = 400 - d;
            return d;
        };

        let angles = {};
        let isMeasured = {};
        [p1, p2, p3].forEach((p) => {
            const others = [p1, p2, p3].filter(x => x !== p);
            let ang = getAngle(p, others[0], others[1]);
            if (ang !== null) {
                angles[p] = ang;
                isMeasured[p] = true;
            } else {
                angles[p] = ca(p, others[0], others[1]);
                isMeasured[p] = false;
            }
        });

        const numMeasured = Object.values(isMeasured).filter(Boolean).length;
        
        if (numMeasured < 3 && numMeasured > 0) {
            html += '<br><span class="highlight">Eksik yatay açılar koordinatlardan tamamlandı.</span><br>';
        } else if (numMeasured === 0) {
            html += '<br><span class="err">Hiç yatay açı verisi bulunamadı → Koordinatlardan hesaplanıyor.</span><br>';
        }

        const sum = angles[p1] + angles[p2] + angles[p3];
        const w = 200 - sum;
        const corr = w / 3;

        const formatAngle = (p) => {
            let text = '&beta;<sub>' + p + '</sub> = ' + angles[p].toFixed(4) + '<sup>g</sup>';
            if (!isMeasured[p]) text += ' <i>(Koordinattan)</i>';
            return text;
        };
        
        html += '<br>' + formatAngle(p1) + '<br>';
        html += formatAngle(p2) + '<br>';
        html += formatAngle(p3) + '<br>';
        html += 'Toplam = ' + sum.toFixed(4) + '<sup>g</sup><br>';
        html += mathBlock('w = 200^g - (' + angles[p1].toFixed(4) + '^g + ' + angles[p2].toFixed(4) + '^g + ' + angles[p3].toFixed(4) + '^g) = ' + w.toFixed(4) + '^g');
        html += 'Düzeltme = ' + corr.toFixed(4) + '<sup>g</sup> / yatay açı<br>';

        angles[p1] += corr;
        angles[p2] += corr;
        angles[p3] += corr;

        html += '<span class="highlight">&beta;\'<sub>' + p1 + '</sub> = ' + angles[p1].toFixed(4) + '<sup>g</sup></span><br>';
        html += '<span class="highlight">&beta;\'<sub>' + p2 + '</sub> = ' + angles[p2].toFixed(4) + '<sup>g</sup></span><br>';
        html += '<span class="highlight">&beta;\'<sub>' + p3 + '</sub> = ' + angles[p3].toFixed(4) + '<sup>g</sup></span>';
        html += '</div>';

        // ——— STEP 2: Sine Theorem ———
        html += '<div class="result-section"><strong>② Sinüs Teoremi (Mesafe Hesabı)</strong>';

        let d12 = this.db.dist(p1, p2) || this.db.dist(p2, p1);
        let d23 = this.db.dist(p2, p3) || this.db.dist(p3, p2);
        let d31 = this.db.dist(p3, p1) || this.db.dist(p1, p3);

        let baseD, baseOpp, bA, bB;
        if      (d12) { baseD = d12; baseOpp = angles[p3]; bA = p1; bB = p2; }
        else if (d23) { baseD = d23; baseOpp = angles[p1]; bA = p2; bB = p3; }
        else if (d31) { baseD = d31; baseOpp = angles[p2]; bA = p3; bB = p1; }

        if (!baseD) {
            const c1 = this.db.coords[p1], c2 = this.db.coords[p2], c3 = this.db.coords[p3];
            d12 = secondFundamental(c1.Y, c1.X, c2.Y, c2.X).distance;
            d23 = secondFundamental(c2.Y, c2.X, c3.Y, c3.X).distance;
            d31 = secondFundamental(c3.Y, c3.X, c1.Y, c1.X).distance;

            html += '<br><span class="err">Ölçülmüş mesafe yok → Koordinatlardan hesaplanıyor.</span><br>';
            html += 'S<sub>' + p1 + '-' + p2 + '</sub> = <span class="highlight">' + d12.toFixed(3) + 'm</span><br>';
            html += 'S<sub>' + p2 + '-' + p3 + '</sub> = <span class="highlight">' + d23.toFixed(3) + 'm</span><br>';
            html += 'S<sub>' + p3 + '-' + p1 + '</sub> = <span class="highlight">' + d31.toFixed(3) + 'm</span>';
        } else {
            html += mathBlock('\\frac{S_{' + bA + bB + '}}{\\sin(\\beta\'_{kar\\text{\\c{s}}\\imath})} = \\frac{S_{bln}}{\\sin(\\beta\'_{bln})}');

            const ratio = baseD / Math.sin(baseOpp * GON_TO_RAD);
            d12 = d12 || ratio * Math.sin(angles[p3] * GON_TO_RAD);
            d23 = d23 || ratio * Math.sin(angles[p1] * GON_TO_RAD);
            d31 = d31 || ratio * Math.sin(angles[p2] * GON_TO_RAD);

            html += 'Baz mesafe: S<sub>' + bA + '-' + bB + '</sub> = ' + baseD.toFixed(3) + 'm<br>';
            html += 'S<sub>' + p1 + '-' + p2 + '</sub> = <span class="highlight">' + d12.toFixed(3) + 'm</span><br>';
            html += 'S<sub>' + p2 + '-' + p3 + '</sub> = <span class="highlight">' + d23.toFixed(3) + 'm</span><br>';
            html += 'S<sub>' + p3 + '-' + p1 + '</sub> = <span class="highlight">' + d31.toFixed(3) + 'm</span>';
        }
        html += '</div>';

        // ——— STEP 3: 2. Temel Ödev (Azimuth) ———
        html += '<div class="result-section"><strong>③ 2. Temel Ödev (Azimut & Mesafe)</strong>';
        const c1 = this.db.coords[p1], c2 = this.db.coords[p2], c3 = this.db.coords[p3];

        const r12 = secondFundamental(c1.Y, c1.X, c2.Y, c2.X);
        const r23 = secondFundamental(c2.Y, c2.X, c3.Y, c3.X);
        const r31 = secondFundamental(c3.Y, c3.X, c1.Y, c1.X);

        html += mathBlock('\\alpha_{' + p1 + p2 + '} = \\arctan\\left(\\frac{|\\Delta Y|}{|\\Delta X|}\\right) \\rightarrow ' + r12.azimuth.toFixed(4) + '^g');
        html += '(' + p1 + '→' + p2 + '): &alpha; = <span class="highlight">' + r12.azimuth.toFixed(4) + '<sup>g</sup></span>, S = ' + r12.distance.toFixed(3) + 'm<br>';
        html += '(' + p2 + '→' + p3 + '): &alpha; = <span class="highlight">' + r23.azimuth.toFixed(4) + '<sup>g</sup></span>, S = ' + r23.distance.toFixed(3) + 'm<br>';
        html += '(' + p3 + '→' + p1 + '): &alpha; = <span class="highlight">' + r31.azimuth.toFixed(4) + '<sup>g</sup></span>, S = ' + r31.distance.toFixed(3) + 'm';
        html += '</div>';

        // ——— STEP 4: 1. Temel Ödev (Coordinate Projection) ———
        html += '<div class="result-section"><strong>④ 1. Temel Ödev (Koordinat Projeksiyonu)</strong>';

        const az13_true = secondFundamental(c1.Y, c1.X, c3.Y, c3.X).azimuth;
        let az13 = r12.azimuth + angles[p1];
        if (Math.abs(normalizeGon(az13) - az13_true) > 100) az13 = r12.azimuth - angles[p1];
        az13 = normalizeGon(az13);

        const proj = firstFundamental(c1.Y, c1.X, az13, d31);

        html += mathBlock('Y_{' + p3 + '} = Y_{' + p1 + '} + S \\cdot \\sin(\\alpha) = ' + c1.Y.toFixed(3) + ' + ' + proj.dy.toFixed(3) + ' = ' + proj.y.toFixed(3));
        html += mathBlock('X_{' + p3 + '} = X_{' + p1 + '} + S \\cdot \\cos(\\alpha) = ' + c1.X.toFixed(3) + ' + ' + proj.dx.toFixed(3) + ' = ' + proj.x.toFixed(3));

        const ey = Math.abs(proj.y - c3.Y);
        const ex = Math.abs(proj.x - c3.X);
        html += 'Veritabanı: Y=' + c3.Y.toFixed(3) + ', X=' + c3.X.toFixed(3) + '<br>';
        html += 'Sapma: &Delta;Y = <span class="' + (ey > 0.05 ? 'err' : 'highlight') + '">' + ey.toFixed(3) + 'm</span>, &Delta;X = <span class="' + (ex > 0.05 ? 'err' : 'highlight') + '">' + ex.toFixed(3) + 'm</span>';
        html += '</div>';

        // ——— STEP 5: 3. Temel Ödev (Açı Nakli) ———
        html += '<div class="result-section"><strong>⑤ 3. Temel Ödev (Açı Nakli)</strong>';
        const relay = normalizeGon(r12.azimuth + 200 + angles[p2]);
        html += mathBlock('\\alpha_{' + p2 + p3 + '} = \\alpha_{' + p1 + p2 + '} + 200^g + \\beta\'_{' + p2 + '} \\pmod{400^g}');
        html += mathBlock('= ' + r12.azimuth.toFixed(4) + '^g + 200^g + ' + angles[p2].toFixed(4) + '^g = ' + relay.toFixed(4) + '^g');
        html += 'Doğrudan hesaplanan: <span class="highlight">' + r23.azimuth.toFixed(4) + '<sup>g</sup></span><br>';
        const relayErr = Math.abs(relay - r23.azimuth);
        html += 'Fark: <span class="' + (relayErr > 1 ? 'err' : 'highlight') + '">' + relayErr.toFixed(4) + '<sup>g</sup></span>';
        html += '</div>';

        document.getElementById('resultsContent').innerHTML = html;

        // Trigger adjustment calculation for the new tab
        this.calculateAdjustment(p1, p2, p3);
    }

    /* ——— Adjustment & Statistics Engine ——— */
    calculateAdjustment(p1, p2, p3) {
        const points = [p1, p2, p3];
        let residuals = []; 
        
        const getGradClass = (v, isAngle) => {
            const absV = Math.abs(v);
            if (isAngle) {
                if (absV < 0.005) return 'grad-green';
                if (absV < 0.020) return 'grad-yellow';
                return 'grad-red';
            } else {
                if (absV < 0.010) return 'grad-green';
                if (absV < 0.030) return 'grad-yellow';
                return 'grad-red';
            }
        };

        // 1. Evaluate Angles (Yatay Açı)
        points.forEach((center) => {
            const others = points.filter(p => p !== center);
            const l_meas = this.db.dir(center, others[0]) !== null && this.db.dir(center, others[1]) !== null 
                ? (() => {
                    let diff = Math.abs(this.db.dir(center, others[0]) - this.db.dir(center, others[1]));
                    return diff > 200 ? 400 - diff : diff;
                })() 
                : null;

            if (l_meas !== null) {
                const cC = this.db.coords[center];
                const c1 = this.db.coords[others[0]];
                const c2 = this.db.coords[others[1]];
                const a1 = secondFundamental(cC.Y, cC.X, c1.Y, c1.X).azimuth;
                const a2 = secondFundamental(cC.Y, cC.X, c2.Y, c2.X).azimuth;
                let l_theo = Math.abs(a2 - a1);
                if (l_theo > 200) l_theo = 400 - l_theo;

                const v = l_meas - l_theo;
                residuals.push({
                    type: 'Yatay Açı (g)',
                    label: `&beta;<sub>${center}</sub>`,
                    l_meas: l_meas.toFixed(4),
                    l_theo: l_theo.toFixed(4),
                    v: v.toFixed(4),
                    vNum: v,
                    gradClass: getGradClass(v, true)
                });
            }
        });

        // 2. Evaluate Distances (Mesafe)
        const lines = [[p1, p2], [p2, p3], [p3, p1]];
        lines.forEach(line => {
            const [a, b] = line;
            let l_meas = this.db.dist(a, b);
            if (l_meas === null) l_meas = this.db.dist(b, a);

            if (l_meas !== null) {
                const cA = this.db.coords[a];
                const cB = this.db.coords[b];
                const l_theo = secondFundamental(cA.Y, cA.X, cB.Y, cB.X).distance;
                
                const v = l_meas - l_theo;
                residuals.push({
                    type: 'Mesafe (m)',
                    label: `S<sub>${a}-${b}</sub>`,
                    l_meas: l_meas.toFixed(3),
                    l_theo: l_theo.toFixed(3),
                    v: v.toFixed(3),
                    vNum: v,
                    gradClass: getGradClass(v, false)
                });
            }
        });

        let html = '<table class="adj-table">';
        html += '<tr><th>Veri Tipi</th><th>Ölçü (Nokta)</th><th>Ölçülen (L)</th><th>Teorik (L₀)</th><th>Fark (v = L - L₀)</th></tr>';

        if (residuals.length === 0) {
            html += '<tr><td colspan="5" style="color: var(--text-3); font-style: italic;">Seçili üçgende ölçülmüş yatay açı veya mesafe bulunamadı.</td></tr>';
        } else {
            residuals.forEach(r => {
                html += `<tr class="${r.gradClass}">
                    <td>${r.type}</td>
                    <td>${r.label}</td>
                    <td>${r.l_meas}</td>
                    <td>${r.l_theo}</td>
                    <td style="font-weight:bold;">${r.v}</td>
                </tr>`;
            });
        }
        html += '</table>';

        if (residuals.length > 0) {
            let sumSq = 0;
            residuals.forEach(r => sumSq += Math.pow(r.vNum, 2));
            const n = residuals.length;
            const rms = Math.sqrt(sumSq / n);
            const u = 1;
            const m0 = n > u ? Math.sqrt(sumSq / (n - u)) : rms;
            const chiSq = sumSq * 1000; 

            html += `<div class="stat-grid">
                <div class="stat-box">
                    <span style="color:var(--text-2); font-size:0.8rem;">RMS (Kök Ortalama Kare)</span>
                    <span class="stat-val">${rms.toFixed(4)}</span>
                </div>
                <div class="stat-box">
                    <span style="color:var(--text-2); font-size:0.8rem;">Standart Sapma (m₀)</span>
                    <span class="stat-val">${m0.toFixed(4)}</span>
                </div>
                <div class="stat-box">
                    <span style="color:var(--text-2); font-size:0.8rem;">&Sigma;v² (Hata Kareleri)</span>
                    <span class="stat-val">${sumSq.toFixed(5)}</span>
                </div>
                <div class="stat-box">
                    <span style="color:var(--text-2); font-size:0.8rem;">İstatistiksel Temsil (&chi;²)</span>
                    <span class="stat-val">${chiSq.toFixed(4)}</span>
                </div>
            </div>`;
        }

        document.getElementById('adjustmentContent').innerHTML = window.DOMPurify ? DOMPurify.sanitize(html) : html;
    }

    /* ——— Static Formula Rendering ——— */
    renderStaticFormulas() {
        const r = (id, texStr) => {
            const el = document.getElementById(id);
            if (el) katex.render(texStr, el, { displayMode: true, throwOnError: false });
        };

        // 1. Temel Ödev
        r('f1eq1', 'Y_B = Y_A + S \\cdot \\sin(\\alpha)');
        r('f1eq2', 'X_B = X_A + S \\cdot \\cos(\\alpha)');

        // 2. Temel Ödev
        r('f2eq1', '\\Delta Y = Y_B - Y_A, \\quad \\Delta X = X_B - X_A');
        r('f2eq2', 'S = \\sqrt{\\Delta Y^2 + \\Delta X^2}');
        r('f2eq3', '\\alpha = \\arctan\\left(\\frac{|\\Delta Y|}{|\\Delta X|}\\right) + \\text{kadran düzeltmesi}');

        // 3. Temel Ödev
        r('f3eq1', '\\alpha_{BC} = \\alpha_{AB} + 200^g + \\beta \\pmod{400^g}');

        // Sinüs Teoremi
        r('f4eq1', '\\frac{a}{\\sin(\\alpha)} = \\frac{b}{\\sin(\\beta)} = \\frac{c}{\\sin(\\gamma)}');

        // Tolerans (Rapor Sayfası)
        r('fTolerance', 'd = 0.006\\sqrt{S} + 0.02m');
    }
}

/* ═══ UTILITY ═══ */
function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ═══ BOOT ═══ */
document.addEventListener('DOMContentLoaded', () => {
    // 2.0s After Effects Style Splash Screen Logic with Breathing Geoid
    setTimeout(() => {
        const splash = document.getElementById('splashScreen');
        if (splash) {
            splash.classList.add('hidden');
            // DOM'dan temizle
            setTimeout(() => splash.remove(), 600);
        }
    }, 2000); // Exactly 2 seconds as requested

    // --- Breathing Geoid Particle Logic ---
    const canvas = document.getElementById('geoidCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const numParticles = 2000; // Dense point cloud for premium look
        let particles = [];
        
        // Distribute points evenly on a sphere using Fibonacci lattice
        for (let i = 0; i < numParticles; i++) {
            const phi = Math.acos(1 - 2 * (i + 0.5) / numParticles);
            const theta = Math.PI * (1 + Math.sqrt(5)) * i;
            
            particles.push({
                phi: phi,
                theta: theta,
                rBase: 440 + (Math.random() * 24 - 12) // Micro-irregularities
            });
        }
        
        let startTime = Date.now();
        
        function drawGeoid() {
            if (!document.getElementById('splashScreen')) return;
            const time = (Date.now() - startTime) / 1000;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Breathing effect: scales rhythmically over a 2-second cycle
            const breath = 1 + 0.06 * Math.sin(time * Math.PI);
            
            // Global rotation
            const rotY = time * 0.4;
            const rotZ = time * 0.15;
            
            for (let i = 0; i < numParticles; i++) {
                const p = particles[i];
                
                // Geoid macro-deformations (creates continents/valleys)
                const deformation = 8 * Math.sin(p.theta * 3 + time * 2) * Math.cos(p.phi * 4 - time);
                const r = (p.rBase + deformation) * breath;
                
                // Spherical to Cartesian coordinates
                let x = r * Math.sin(p.phi) * Math.cos(p.theta);
                let y = r * Math.sin(p.phi) * Math.sin(p.theta);
                let z = r * Math.cos(p.phi);
                
                // Apply Y-axis rotation
                let x1 = x * Math.cos(rotY) - z * Math.sin(rotY);
                let z1 = x * Math.sin(rotY) + z * Math.cos(rotY);
                
                // Apply Z-axis rotation
                let x2 = x1 * Math.cos(rotZ) - y * Math.sin(rotZ);
                let y2 = x1 * Math.sin(rotZ) + y * Math.cos(rotZ);
                
                // Simple 3D perspective projection
                const fov = 400;
                const scale = fov / (fov + z1);
                const projX = canvas.width / 2 + x2 * scale;
                const projY = canvas.height / 2 + y2 * scale;
                
                // Depth fading (far particles are darker/smaller)
                const alpha = Math.min(1, Math.max(0.05, (120 - z1) / 240));
                
                if (scale > 0 && alpha > 0.05) {
                    ctx.beginPath();
                    ctx.arc(projX, projY, 0.9 * scale, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(212, 172, 130, ${alpha * 1.5})`; // --accent-light
                    ctx.fill();
                }
            }
            requestAnimationFrame(drawGeoid);
        }
        drawGeoid();
    }
    // --- End of Geoid Logic ---

    window.FCU = new App();
    
    // Initialize tsParticles with "breathing" globe-like interactive network
    if (window.tsParticles) {
        tsParticles.load("tsparticles", {
            fpsLimit: 60,
            particles: {
                number: { value: 160, density: { enable: true, value_area: 800 } },
                color: { value: ["#C4956A", "#D4AC82", "#ffffff"] },
                shape: { type: "circle" },
                opacity: { 
                    value: 0.6, 
                    random: true,
                    animation: { enable: true, speed: 1, minimumValue: 0.1, sync: false }
                },
                size: {
                    value: 3,
                    random: true,
                    animation: { enable: true, speed: 2, minimumValue: 0.5, sync: false }
                },
                links: {
                    enable: true,
                    distance: 120,
                    color: "#C4956A",
                    opacity: 0.4,
                    width: 1
                },
                move: {
                    enable: true,
                    speed: 0.4,
                    direction: "none",
                    random: true,
                    straight: false,
                    outModes: { default: "bounce" }
                }
            },
            interactivity: {
                detectsOn: "window",
                events: {
                    onHover: { enable: true, mode: "repulse" },
                    onClick: { enable: true, mode: "push" },
                    resize: true
                },
                modes: {
                    repulse: { 
                        distance: 240, 
                        duration: 0.3,     // Hızlıca eski yörüngesine/konumuna geri döner
                        factor: 3,         // İtme kuvveti şiddeti
                        speed: 3,          // İtme hızı
                        easing: "ease-out-back" // Elastik/plastik yaylanma efekti
                    },
                    push: { particles_nb: 3 }
                }
            },
            retina_detect: true,
            background: {
                color: "transparent"
            }
        });
    }
});
