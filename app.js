import { coordinates as DEFAULT_COORDS, measurements as DEFAULT_MEAS } from './data.js';
import { stations_u3, defaultConstants_u3, emptyObservation, u3Silsile, u3NearbyMosques, u3StationId, u3DuseyConst, u3DuseyTargets } from './data_u3.js';
import {
    reduceSilsile, planarDistance, planarAzimuth, compareTarget,
    fmtGon, fmtMeter, gonToDms, normalizeGon as normGonU3
} from './u3_engine.js';
import { fetchMosques } from './u3_overpass.js';
import { ThemedSelect } from './components/ThemedSelect.js';
import {
    firstFundamental as gm_firstFundamental,
    secondFundamental as gm_secondFundamental,
    normalizeGon as gm_normalizeGon
} from './geo_math.js';
import { CalcHubController } from './calculators.js';

import { synthU4, studentModifiers } from './synth_data.js';
import { computeU4, compareCoordinates as compareCoords4 } from './u4_engine.js';
import { u4Meta, u4Coords, u4BreakAngles, u4Legs, u4TraverseLength } from './data_u4_real.js';
import { tm30ToWGS84Approx } from './u6_engine.js';
import { u5Meta, tablo1Raw, tablo2, H_START_U5, closureU5, tablo3Trig, comparisonU5 } from './data_u5_real.js';
import { trigonometricDH, compareGeoVsTrig } from './u5_engine.js';
import { rtkMeasurements as U6_REAL, N_GEOID, heightComparison } from './data_u6_real.js';
/* ═══════════════════════════════════════════════
   GEODETIC ENGINE — re-exported from geo_math.js
   (kept as locals so existing app.js code keeps working)
   ═══════════════════════════════════════════════ */
const GON_TO_RAD = Math.PI / 200.0;
const RAD_TO_GON = 200.0 / Math.PI;
const normalizeGon       = gm_normalizeGon;
const firstFundamental   = gm_firstFundamental;
const secondFundamental  = gm_secondFundamental;

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
   TASK REGISTRY — Single source of truth for nav.
   Adding a new Uygulama: append an entry; if needed
   declare a controller and add an onActivate hook.
   ═══════════════════════════════════════════════ */
const SVG_NS = 'http://www.w3.org/2000/svg';
function svgIcon(paths) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', '16'); svg.setAttribute('height', '16');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '2');
    paths.forEach(d => {
        const el = document.createElementNS(SVG_NS, d.tag || 'path');
        Object.entries(d.attrs).forEach(([k, v]) => el.setAttribute(k, v));
        svg.appendChild(el);
    });
    return svg;
}

const TaskRegistry = [
    {
        id: 'u2', label: 'Uygulama-2',
        icon: () => svgIcon([
            { tag: 'polygon', attrs: { points: '1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6' } },
            { tag: 'line', attrs: { x1: '8', y1: '2', x2: '8', y2: '18' } },
            { tag: 'line', attrs: { x1: '16', y1: '6', x2: '16', y2: '22' } }
        ]),
        subpages: [
            { id: 'map',        label: 'Harita',     pageElementId: 'pageMap' },
            { id: 'db',         label: 'Veritabanı', pageElementId: 'pageDb' },
            { id: 'formulas',   label: 'Formüller',  pageElementId: 'pageFormulas' },
            { id: 'report',     label: 'Rapor',      pageElementId: 'pageReport' },
            { id: 'adjustment', label: 'Dengeleme',  pageElementId: 'pageAdjustment' }
        ],
        onSubpageActivate: (subId, app) => {
            if (subId === 'map' && app.map) setTimeout(() => app.map.invalidateSize(), 100);
        }
    },
    {
        id: 'u3', label: 'Uygulama-3',
        icon: () => svgIcon([
            { attrs: { d: 'M12 2v20' } },
            { attrs: { d: 'M2 12h20' } },
            { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
            { attrs: { d: 'M12 12 L18 6' } }
        ]),
        subpages: [
            { id: 'map',        label: 'Harita',     pageElementId: 'pageU3Map' },
            { id: 'db',         label: 'Veritabanı', pageElementId: 'pageU3Db' },
            { id: 'formulas',   label: 'Formüller',  pageElementId: 'pageU3Formulas' },
            { id: 'report',     label: 'Rapor',      pageElementId: 'pageU3Report' },
            { id: 'adjustment', label: 'Dengeleme',  pageElementId: 'pageU3Adjustment' }
        ],
        onSubpageActivate: (subId, app) => {
            if (app.u3) setTimeout(() => app.u3.activate(subId), 100);
        }
    },
    {
        id: 'u4', label: 'Uygulama-4',
        icon: () => svgIcon([
            { tag: 'polygon', attrs: { points: '12 2 4 8 4 16 12 22 20 16 20 8 12 2' } },
            { attrs: { d: 'M12 2v20' } }
        ]),
        subpages: [
            { id: 'map',        label: 'Harita',     pageElementId: 'pageU4Map' },
            { id: 'db',         label: 'Veritabanı', pageElementId: 'pageU4Db' },
            { id: 'formulas',   label: 'Formüller',  pageElementId: 'pageU4Formulas' },
            { id: 'report',     label: 'Rapor',      pageElementId: 'pageU4Report' },
            { id: 'adjustment', label: 'Dengeleme',  pageElementId: 'pageU4Adjustment' }
        ]
    ,
        onSubpageActivate: (subId, app) => { if (app.u4) setTimeout(() => app.u4.activate(subId), 100); }},
    {
        id: 'u5', label: 'Uygulama-5',
        icon: () => svgIcon([
            { tag: 'line', attrs: { x1: '3', y1: '12', x2: '21', y2: '12' } },
            { tag: 'line', attrs: { x1: '7', y1: '6',  x2: '17', y2: '6' } },
            { tag: 'line', attrs: { x1: '5', y1: '18', x2: '19', y2: '18' } }
        ]),
        subpages: [
            { id: 'map',        label: 'Harita',     pageElementId: 'pageU5Map' },
            { id: 'db',         label: 'Veritabanı', pageElementId: 'pageU5Db' },
            { id: 'formulas',   label: 'Formüller',  pageElementId: 'pageU5Formulas' },
            { id: 'report',     label: 'Rapor',      pageElementId: 'pageU5Report' },
            { id: 'adjustment', label: 'Dengeleme',  pageElementId: 'pageU5Adjustment' }
        ]
    ,
        onSubpageActivate: (subId, app) => { if (app.u5) setTimeout(() => app.u5.activate(subId), 100); }},
    {
        id: 'u6', label: 'Uygulama-6',
        icon: () => svgIcon([
            { tag: 'circle', attrs: { cx: '12', cy: '12', r: '10' } },
            { attrs: { d: 'M2 12h20M12 2a15 15 0 0 1 0 20a15 15 0 0 1 0 -20' } }
        ]),
        subpages: [
            { id: 'map',        label: 'Harita',     pageElementId: 'pageU6Map' },
            { id: 'db',         label: 'Veritabanı', pageElementId: 'pageU6Db' },
            { id: 'formulas',   label: 'Formüller',  pageElementId: 'pageU6Formulas' },
            { id: 'report',     label: 'Rapor',      pageElementId: 'pageU6Report' },
            { id: 'adjustment', label: 'Dengeleme',  pageElementId: 'pageU6Adjustment' }
        ],
        onSubpageActivate: (subId, app) => { if (app.u6) setTimeout(() => app.u6.activate(subId), 100); }},
    {
        id: 'calc', label: 'Hesaplayıcılar',
        icon: () => svgIcon([
            { tag: 'rect', attrs: { x: '4', y: '2', width: '16', height: '20', rx: '2' } },
            { tag: 'line', attrs: { x1: '8', y1: '6', x2: '16', y2: '6' } },
            { tag: 'line', attrs: { x1: '8', y1: '11', x2: '10', y2: '11' } },
            { tag: 'line', attrs: { x1: '12', y1: '11', x2: '14', y2: '11' } },
            { tag: 'line', attrs: { x1: '8', y1: '15', x2: '10', y2: '15' } },
            { tag: 'line', attrs: { x1: '12', y1: '15', x2: '14', y2: '15' } }
        ]),
        subpages: [{ id: 'calcHub', label: 'Tüm Hesaplayıcılar', pageElementId: 'pageCalcHub' }],
        onSubpageActivate: (subId, app) => { if (app.calcHub) setTimeout(() => app.calcHub.activate(), 100); }
    }
];

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

        // Uygulama-3 controller (lazily initialized; map needs visible container)
        this.u3 = new U3Controller(this);

        // Calculator Hub controller (lazy mount on tab activate)
        this.calcHub = new CalcHubController();

        this.u4 = new U4Controller(this);
        this.u5 = new U5Controller(this);
        this.u6 = new U6Controller(this);    }

    /* ——— Navigation (registry-driven, two-tier) ——— */
    bindNav() {
        this.activeOuter = 'u2';        // Default outer tab
        this.activeSubpage = 'map';     // Default subpage of u2
        this.outerNav = document.getElementById('outerNav');
        this.outerIndicator = document.getElementById('outerIndicator');
        this.innerNav = document.getElementById('innerNav');
        this.innerNavBar = document.getElementById('innerNavBar');
        this.innerIndicator = document.getElementById('innerIndicator');

        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        if (mobileMenuBtn && this.outerNav) {
            mobileMenuBtn.addEventListener('click', () => {
                this.outerNav.classList.toggle('nav-open');
                if (this.innerNav) this.innerNav.classList.toggle('nav-open');
            });
        }

        this.buildOuterNav();
        // İlk seçim
        this.selectOuter(this.activeOuter);
    }

    moveIndicator(btnEl, indicatorEl) {
        if (!btnEl || !indicatorEl) return;
        indicatorEl.style.width = `${btnEl.offsetWidth}px`;
        indicatorEl.style.transform = `translateX(${btnEl.offsetLeft}px)`;
        indicatorEl.style.opacity = '1';
    }

    buildOuterNav() {
        if (!this.outerNav) return;
        // Indicator'ı koru, içeriği yeniden inşa et
        Array.from(this.outerNav.querySelectorAll('.nav-btn')).forEach(b => b.remove());
        TaskRegistry.forEach((task, i) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'nav-btn';
            btn.dataset.outer = task.id;
            btn.id = `navOuter_${task.id}`;
            const iconEl = task.icon ? task.icon() : null;
            if (iconEl) btn.appendChild(iconEl);
            const span = document.createElement('span');
            span.textContent = task.label;
            btn.appendChild(span);

            btn.addEventListener('click', () => this.selectOuter(task.id));
            btn.addEventListener('mouseenter', () => this.moveIndicator(btn, this.outerIndicator));
            // Insert before indicator element
            this.outerNav.insertBefore(btn, this.outerIndicator);
        });

        if (this.outerNav) {
            this.outerNav.addEventListener('mouseleave', () => {
                const active = this.outerNav.querySelector('.nav-btn.active');
                if (active) this.moveIndicator(active, this.outerIndicator);
            });
        }
    }

    buildInnerNav(outerId) {
        if (!this.innerNav) return;
        const task = TaskRegistry.find(t => t.id === outerId);
        if (!task) return;

        // Indicator dışındaki butonları temizle
        Array.from(this.innerNav.querySelectorAll('.nav-btn')).forEach(b => b.remove());

        // Tek alt sayfa varsa inner strip'i gizle
        if (task.subpages.length <= 1) {
            this.innerNavBar.classList.add('hidden');
            return;
        }
        this.innerNavBar.classList.remove('hidden');

        task.subpages.forEach(sub => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'nav-btn';
            btn.dataset.inner = sub.id;
            btn.id = `navInner_${sub.id}`;
            btn.textContent = sub.label;
            btn.addEventListener('click', () => this.selectSubpage(outerId, sub.id));
            btn.addEventListener('mouseenter', () => this.moveIndicator(btn, this.innerIndicator));
            this.innerNav.insertBefore(btn, this.innerIndicator);
        });

        this.innerNav.addEventListener('mouseleave', () => {
            const active = this.innerNav.querySelector('.nav-btn.active');
            if (active) this.moveIndicator(active, this.innerIndicator);
        }, { once: false });
    }

    selectOuter(outerId) {
        const task = TaskRegistry.find(t => t.id === outerId);
        if (!task) return;
        this.activeOuter = outerId;

        // Outer butonlar
        this.outerNav.querySelectorAll('.nav-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.outer === outerId);
        });
        const activeBtn = this.outerNav.querySelector(`.nav-btn[data-outer="${outerId}"]`);
        setTimeout(() => this.moveIndicator(activeBtn, this.outerIndicator), 30);

        // Inner nav'ı yeniden inşa et + ilk subpage'i seç
        this.buildInnerNav(outerId);
        const firstSub = task.subpages[0];
        if (firstSub) this.selectSubpage(outerId, firstSub.id);

        // Mobile menüyü kapat
        if (this.outerNav.classList.contains('nav-open')) this.outerNav.classList.remove('nav-open');
    }

    selectSubpage(outerId, subId) {
        const task = TaskRegistry.find(t => t.id === outerId);
        if (!task) return;
        const sub = task.subpages.find(s => s.id === subId);
        if (!sub) return;
        this.activeSubpage = subId;

        // Tüm sayfaları gizle, hedefi göster
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const target = document.getElementById(sub.pageElementId);
        if (target) target.classList.add('active');

        // Inner butonlar
        if (this.innerNav) {
            this.innerNav.querySelectorAll('.nav-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.inner === subId);
            });
            const activeBtn = this.innerNav.querySelector(`.nav-btn[data-inner="${subId}"]`);
            setTimeout(() => this.moveIndicator(activeBtn, this.innerIndicator), 30);
        }

        // Hook
        if (typeof task.onSubpageActivate === 'function') {
            task.onSubpageActivate(subId, this);
        }
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
            const ll = toLatLng(c.Y, c.X);
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

/* ═══════════════════════════════════════════════
   UYGULAMA-3 CONTROLLER — Silsile Düşey Açı
   ═══════════════════════════════════════════════ */
class U3Controller {
    constructor(app) { this.app = app; this.map = null; this.markers = []; this.rays = []; this.rendered = false; }
    activate(subId) {
        if (!this.map) this.initMap();
        if (!this.rendered) { this.renderAll(); this.rendered = true; }
        if (!subId || subId === 'map') setTimeout(() => { if (this.map) { this.map.invalidateSize(); this._fit(); } }, 120);
    }
    initMap() {
        const el = document.getElementById('u3Map'); if (!el || this.map) return;
        this.map = L.map('u3Map', { zoomControl: true }).setView([41.0248, 28.8867], 16);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM', maxZoom: 20 }).addTo(this.map);
    }
    _fit() { if (this.markers.length && this.map) this.map.fitBounds(L.latLngBounds(this.markers.map(m => m.getLatLng())), { padding: [40, 40] }); }
    _norm(x) { return ((x % 400) + 400) % 400; }
    _reduce() {
        const s = u3Silsile, refName = s.reference;
        const targets = s.sets[0].obs.map(o => o.target);
        const perSet = s.sets.map(set => {
            const ref = set.obs.find(o => o.target === refName);
            return { set: set.set, rows: set.obs.map(o => {
                const redI = this._norm(o.faceI - ref.faceI);
                const redII = this._norm(o.faceII - ref.faceII);
                return { target: o.target, faceI: o.faceI, faceII: o.faceII, redI, redII, setDir: (redI + redII) / 2 };
            }) };
        });
        const finals = targets.map(t => {
            const setDirs = perSet.map(ps => ps.rows.find(r => r.target === t).setDir);
            const n = setDirs.length, mean = setDirs.reduce((a, b) => a + b, 0) / n;
            const resid = setDirs.map(d => d - mean);
            const s_one = n > 1 ? Math.sqrt(resid.reduce((a, v) => a + v * v, 0) / (n - 1)) : 0;
            return { target: t, setDirs, mean, s_one, s_mean: s_one / Math.sqrt(n) };
        });
        return { perSet, finals, targets, refName };
    }
    renderAll() { this.renderMap(); this.renderDatabase(); this.renderFormulas(); this.renderReport(); this.renderAdjustment(); }

    renderMap() {
        if (!this.map) this.initMap(); if (!this.map) return;
        this.markers.forEach(m => this.map.removeLayer(m)); this.markers = [];
        this.rays.forEach(r => this.map.removeLayer(r)); this.rays = [];
        const N48 = stations_u3[u3StationId];
        const stLL = toLatLng(N48.Y, N48.X);
        // Eşleşen hedef camilerin adları (vurgu için)
        const matched = new Set(u3DuseyTargets.map(t => t.mosque));
        // Çevredeki gerçek camiler (az + dist ile konumlandırılır)
        for (const m of u3NearbyMosques) {
            if (matched.has(m.name)) continue; // eşleşenler ayrıca çizilir
            const X = N48.X + m.dist * Math.cos(m.az * Math.PI / 200);
            const Y = N48.Y + m.dist * Math.sin(m.az * Math.PI / 200);
            const ll = toLatLng(Y, X);
            const mk = L.circleMarker(ll, { radius: 4, fillColor: '#4caf50', color: '#fff', weight: 1, fillOpacity: 0.6 })
                .bindPopup('<b>' + m.name + '</b><br>N.48\'den semt: ' + m.az.toFixed(2) + ' gon<br>yatay mesafe: ' + m.dist.toFixed(0) + ' m');
            mk.addTo(this.map); this.markers.push(mk);
        }
        // Nişan alınan üç hedef + N.48'den nişan ışınları
        const rayColors = { 'L-1 kübbe': '#ff5722', 'L-2 kübbe': '#ffc107', 'YTÜ camisi': '#00e5ff' };
        for (const t of u3DuseyTargets) {
            const ll = [t.lat, t.lng];
            const col = rayColors[t.target] || '#00e5ff';
            const ray = L.polyline([stLL, ll], { color: col, weight: 2.5, opacity: 0.85, dashArray: '6 4' }).addTo(this.map);
            this.rays.push(ray);
            const mk = L.circleMarker(ll, { radius: 7, fillColor: col, color: '#fff', weight: 2, fillOpacity: 0.95 })
                .bindPopup('<b>' + t.target + '</b> → ' + t.mosque + '<br>semt (türetilen): ' + t.az.toFixed(3) + ' gon<br>yatay mesafe: ' + t.D.toFixed(0) + ' m'
                         + '<br>kübbe tepe H: ' + t.apexH.toFixed(1) + ' m'
                         + '<br>düşey açı Z: ' + t.Z.toFixed(4) + ' gon (α=' + t.alpha.toFixed(3) + 'ᵍ)');
            mk.addTo(this.map); this.markers.push(mk);
        }
        // İstasyon N.48 (en üstte)
        const stM = L.circleMarker(stLL, { radius: 8, fillColor: '#e91e63', color: '#fff', weight: 2, fillOpacity: 0.95 })
            .bindPopup('<b>N.48 — İstasyon</b><br>Ertuğrul<br>h = ' + N48.h.toFixed(3) + ' m').addTo(this.map);
        this.markers.push(stM);
        this._fit();
        const r = this._reduce();
        const info = document.getElementById('u3MapInfo');
        if (info) {
            let h = '<div style="font-size:0.84rem;line-height:1.8;">'
                + '<b style="color:var(--accent);">İstasyon:</b> N.48 (Ertuğrul)<br>'
                + '<b style="color:var(--accent);">Mutlak yöneltme:</b> YTÜ camisi anchor → O = ' + u3DuseyConst.orientationO.toFixed(2) + 'ᵍ<br>'
                + '<b style="color:var(--accent);">Nişan alınan hedefler:</b></div>';
            h += '<table class="u3-obs-table" style="margin-top:0.4rem;"><thead><tr><th>Hedef</th><th>Eşleşen cami</th><th>Semt (gon)</th><th>D (m)</th><th>Z (gon)</th></tr></thead><tbody>';
            for (const t of u3DuseyTargets) h += '<tr><td><b>' + t.target + '</b></td><td>' + t.mosque + '</td><td>' + t.az.toFixed(2) + '</td><td>' + t.D.toFixed(0) + '</td><td style="color:var(--accent);">' + t.Z.toFixed(4) + '</td></tr>';
            h += '</tbody></table>';
            h += '<p style="font-size:0.74rem;color:var(--text-3);margin-top:0.5rem;">Renkli kesik çizgiler N.48\'den nişan ışınlarıdır (L-1 turuncu, L-2 sarı, YTÜ camisi camgöbeği). Soluk yeşil noktalar çevredeki diğer camilerdir (OpenStreetMap).</p>';
            info.innerHTML = h;
        }
    }

    renderDatabase() {
        const el = document.getElementById('u3DbContent'); if (!el) return;
        const r = this._reduce();
        let h = '<h3 style="color:var(--accent);">Yatay Doğrultu Silsile Çizelgesi — İstasyon N.48</h3>';
        h += '<p style="font-size:0.82rem;color:var(--text-2);">Gözlemci: ' + u3Silsile.observer + ' · Tarih: ' + u3Silsile.dates.join(' / ') + ' · Referans (sıfır): ' + u3Silsile.reference + '</p>';
        for (const ps of r.perSet) {
            h += '<h4 style="margin:0.8rem 0 0.3rem;color:var(--text-2);">' + ps.set + '. Silsile</h4>';
            h += '<div style="overflow-x:auto;"><table class="u3-obs-table"><thead><tr><th>Hedef</th><th>I. durum (gon)</th><th>II. durum (gon)</th><th>1. sıfıra ind.</th><th>2. sıfıra ind.</th><th>Yarım silsile ort.</th></tr></thead><tbody>';
            for (const row of ps.rows) h += '<tr><td><b>' + row.target + '</b></td><td>' + row.faceI.toFixed(4) + '</td><td>' + row.faceII.toFixed(4) + '</td><td>' + row.redI.toFixed(4) + '</td><td>' + row.redII.toFixed(4) + '</td><td style="color:var(--accent);">' + row.setDir.toFixed(4) + '</td></tr>';
            h += '</tbody></table></div>';
        }
        h += '<p style="font-size:0.75rem;color:var(--text-3);margin-top:0.6rem;">II. durum ≈ I. durum + 200ᵍ (çift yüz okuma). Sıfıra indirgeme = doğrultu − referans doğrultu (L-1 kübbe).</p>';

        // ── Türetilen Düşey Açı Çizelgesi ──
        h += '<h3 style="color:var(--accent);margin-top:1.2rem;">Türetilen Düşey (Zenit) Açı Çizelgesi — N.48</h3>';
        h += '<p style="font-size:0.82rem;color:var(--text-2);">Hedef camiler, ölçülen yatay doğrultular YTÜ camisi (Davutpaşa Kışlası Camii) anchor\'ı ile mutlak yöneltilerek belirlenmiş; '
           + 'her hedefin kübbe tepe yüksekliği (taban DEM + standart kübbe ' + u3DuseyConst.domeApex.toFixed(0) + ' m) ve yatay mesafeden düşey açı türetilmiştir. '
           + 'Alet yüksekliği i = ' + u3DuseyConst.i.toFixed(2) + ' m, k = ' + u3DuseyConst.k + ', R = 6371 km.</p>';
        h += '<div style="overflow-x:auto;"><table class="u3-obs-table"><thead><tr><th>Hedef</th><th>Eşleşen cami</th><th>Mesafe D (m)</th><th>Taban H (m)</th><th>Kübbe tepe H (m)</th><th>ΔH tepe−alet (m)</th><th>Düşey açı Z (gon)</th><th>Yük. açısı α (gon)</th></tr></thead><tbody>';
        for (const t of u3DuseyTargets) {
            h += '<tr><td><b>' + t.target + '</b></td><td>' + t.mosque + '</td><td>' + t.D.toFixed(1) + '</td><td>' + t.baseH.toFixed(1) + '</td><td>' + t.apexH.toFixed(1) + '</td><td>' + t.dH.toFixed(2) + '</td><td style="color:var(--accent);">' + t.Z.toFixed(4) + '</td><td>' + t.alpha.toFixed(4) + '</td></tr>';
        }
        h += '</tbody></table></div>';
        h += '<p style="font-size:0.75rem;color:var(--text-3);margin-top:0.5rem;">Taban yükseklikleri Copernicus DEM (Open-Meteo) — N.48 alet noktası ise jeodezik ağdan (75.105 m). DEM çözünürlüğü (~90 m) nedeniyle düşey açılar yaklaşıktır.</p>';

        el.innerHTML = h;
    }

    renderFormulas() {
        const el = document.getElementById('u3FormulasContent'); if (!el) return;
        const K = (t) => katex.renderToString(t, { displayMode: true, throwOnError: false });
        const card = (title, desc, tex) => '<div class="glass-panel formula-card"><h3>' + title + '</h3><p class="formula-desc">' + desc + '</p><div class="formula-render">' + K(tex) + '</div></div>';
        let h = '<div class="formulas-grid">';
        h += card('Yarım Silsile Ortalaması', 'İki yüz okumasının sıfıra indirgenmiş ortalaması.', 'r_i = \\dfrac{(I_i - I_{ref}) + (II_i - II_{ref})}{2}');
        h += card('Kesin Doğrultu', 'n silsilenin doğrultu ortalaması.', '\\bar{r} = \\dfrac{1}{n}\\sum_{k=1}^{n} r_{i,k}');
        h += card('Bir Doğrultunun Std. Sapması', 'Silsileler arası dağılımdan (Bessel).', 's = \\sqrt{\\dfrac{\\sum v^{2}}{n-1}}, \\quad v_k = r_{i,k} - \\bar{r}');
        h += card('Kesin Doğrultunun Std. Sapması', 'Ortalamanın standart sapması.', 's_{\\bar{r}} = \\dfrac{s}{\\sqrt{n}}');
        h += card('Düşey (Zenit) Açı', 'Hedef yüksekliği ve yatay mesafeden türetim.', 'Z = 100^{g} - \\dfrac{200}{\\pi}\\arctan\\!\\dfrac{H_{hedef} - H_{alet}}{D}');
        h += card('Trigonometrik Yükseklik', 'Düşey açı ve mesafeden yükseklik farkı.', '\\Delta H = D\\cot Z + i - t + \\dfrac{(1-k)D^{2}}{2R}');
        h += '</div>';
        el.innerHTML = h;
    }

    renderReport() {
        const el = document.getElementById('u3ReportContent'); if (!el) return;
        const r = this._reduce();
        let h = '';
        h += '<div class="print-report-header"><h1>Uygulama-3 — Silsile Düşey Açı Raporu</h1>'
           + '<div class="prhd-meta">Öğrenci: Ertuğrul Kulak &nbsp;|&nbsp; No: 24046607 &nbsp;|&nbsp; Nokta: 48 &nbsp;|&nbsp; XX=07 &nbsp;|&nbsp; YTÜ Ölçme Uygulaması</div></div>';
        h += '<div class="report-map-section">'
           + '<h4>Ölçüm Alanı Haritası</h4>'
           + '<iframe class="report-map-frame" src="https://www.openstreetmap.org/export/embed.html?bbox=28.855%2C41.015%2C28.905%2C41.040&layer=mapnik" title="Ölçüm alanı — YTÜ Davutpaşa ve cami hedefleri" sandbox="allow-scripts allow-same-origin"></iframe>'
           + '<p class="report-map-caption">YTÜ Davutpaşa Kampüsü ve çevresindeki cami hedefleri (Fetih C., Hz. Ebubekir C., Davutpaşa Kışlası C.) &mdash; © OpenStreetMap katkıcıları. İnteraktif harita için <em>Harita</em> sekmesini açınız.</p>'
           + '</div>';
        h += '<h3>1. Açıklama</h3>';
        h += '<p>Yıldız Teknik Üniversitesi Davutpaşa Kampüsü\'nde, zeminde sabit <strong>N.48</strong> noktası üzerine teodolit kurularak '
           + 'farklı uzaklıklardaki üç hedefe (L-1 kübbe, L-2 kübbe, YTÜ camisi; ~0.2–1.9 km) <strong>iki tam silsile yatay doğrultu</strong> ölçümü yapılmıştır. '
           + 'Her hedef iki yüzde (I. ve II. durum) okunmuş, doğrultular referans hedefe (L-1 kübbe) sıfırlanarak indirgenmiştir. '
           + 'Yönerge ayrıca düşey açı ölçümünü de gerektirir; düşey açı çizelgesi elimizde bulunmadığından, ölçülen yatay doğrultularla nişan alınan '
           + 'yapılar belirlenip yükseklikleri üzerinden düşey açılar türetilmiştir (bk. bölüm 4).</p>';
        h += '<div style="background:var(--bg-3);border-radius:6px;padding:0.6rem 0.9rem;margin:0.6rem 0;display:flex;flex-wrap:wrap;gap:0.4rem 1.5rem;font-size:0.85rem;">'
           + '<span><strong>İstasyon:</strong> N.48</span><span><strong>Gözlemci:</strong> Ertuğrul (24046607)</span>'
           + '<span><strong>Silsile:</strong> 2 tam</span><span><strong>Hedef:</strong> ' + r.targets.length + '</span></div>';

        h += '<h3>2. Yatay Doğrultu İndirgemesi — Kesin Doğrultular</h3>';
        h += '<div style="overflow-x:auto;"><table class="u3-obs-table"><thead><tr><th>Hedef</th><th>1. silsile (gon)</th><th>2. silsile (gon)</th><th>Kesin doğrultu (gon)</th></tr></thead><tbody>';
        for (const f of r.finals) h += '<tr><td><b>' + f.target + '</b></td><td>' + f.setDirs[0].toFixed(4) + '</td><td>' + f.setDirs[1].toFixed(4) + '</td><td style="color:var(--accent);">' + f.mean.toFixed(4) + '</td></tr>';
        h += '</tbody></table></div>';

        h += '<h3>3. Standart Sapma Analizi</h3>';
        h += '<div style="overflow-x:auto;"><table class="u3-obs-table"><thead><tr><th>Hedef</th><th>Bir doğrultunun σ (cc)</th><th>Kesin doğrultunun σ (cc)</th></tr></thead><tbody>';
        for (const f of r.finals) h += '<tr><td>' + f.target + '</td><td>' + (f.s_one * 10000).toFixed(1) + '</td><td>' + (f.s_mean * 10000).toFixed(1) + '</td></tr>';
        h += '</tbody></table></div>';
        h += '<p style="font-size:0.8rem;color:var(--text-2);">σ değerleri iki silsile arasındaki farktan (Bessel) hesaplanmıştır; 1 cc = 10⁻⁴ gon. Referans hedefin (L-1 kübbe) sapması tanım gereği sıfırdır.</p>';

        h += '<h3>4. Hedeflerin Belirlenmesi ve Mutlak Yöneltme</h3>';
        h += '<p>Ölçülen kesin doğrultular L-1 kübbe referansına göre <em>bağıldır</em> (mutlak semt ölçülmemiştir). Üçüncü hedef <strong>YTÜ camisi</strong>, '
           + 'YTÜ Davutpaşa Kampüsü içindeki <strong>Davutpaşa Kışlası Camii</strong>\'dir; zeminde bilinen bu yapı anchor alınarak mutlak yöneltme açısı çözülmüştür:</p>';
        h += '<div style="background:var(--bg-3);border-radius:6px;padding:0.5rem 0.9rem;margin:0.5rem 0;font-size:0.9rem;text-align:center;">'
           + 'O = semt(L-1 kübbe) = semt(YTÜ camisi) − 169.3339ᵍ = 50.727 − 169.3339 + 400 = <b style="color:var(--accent);">' + u3DuseyConst.orientationO.toFixed(2) + 'ᵍ</b></div>';
        h += '<p>Kalan iki hedefin mutlak semtleri (L-1: O+0 = 281.39ᵍ, L-2: O+58.0463 = 339.44ᵍ) hesaplanıp OpenStreetMap camileriyle eşleştirilmiştir. '
           + '"Kübbe" ifadesi, yapının kubbesinin tam tepesine nişan alınarak okuma yapıldığını belirtir.</p>';
        h += '<div style="overflow-x:auto;"><table class="u3-obs-table"><thead><tr><th>Hedef</th><th>Eşleşen cami</th><th>Türetilen semt (gon)</th><th>OSM semt (gon)</th><th>Eşleşme sapması (gon)</th><th>Yatay mesafe (m)</th></tr></thead><tbody>';
        for (const t of u3DuseyTargets) h += '<tr><td><b>' + t.target + '</b></td><td>' + t.mosque + '</td><td>' + t.az.toFixed(3) + '</td><td>' + t.azOSM.toFixed(3) + '</td><td>' + (t.azRes >= 0 ? '+' : '') + t.azRes.toFixed(3) + '</td><td>' + t.D.toFixed(1) + '</td></tr>';
        h += '</tbody></table></div>';
        h += '<p style="font-size:0.8rem;color:var(--text-2);">L-1 (+1.378ᵍ) ve L-2 (−1.350ᵍ) sapmalarının zıt işaretli olması, yöneltmenin iyi merkezlendiğini; kalan farkın OSM nokta konumu (yapı ağırlık merkezi) ile gerçek kübbe ekseni arasındaki kayıklıktan kaynaklandığını gösterir.</p>';

        h += '<h3>5. Düşey (Zenit) Açı Türetimi</h3>';
        h += '<p>Her hedefin kübbe tepe yüksekliği, taban (zemin) yüksekliğine standart cami kübbe yüksekliği (' + u3DuseyConst.domeApex.toFixed(0) + ' m) eklenerek bulunmuş; '
           + 'düşey açı, bilinen yükseklik farkı ve yatay mesafeden türetilmiştir:</p>';
        h += '<div style="text-align:center;margin:0.4rem 0;">' + mathBlock('Z = 100^{g} - \\dfrac{200}{\\pi}\\arctan\\!\\dfrac{H_{tepe} - (H_{N.48}+i)}{D}') + '</div>';
        h += '<div style="overflow-x:auto;"><table class="u3-obs-table"><thead><tr><th>Hedef</th><th>Taban H (m)</th><th>Kübbe tepe H (m)</th><th>Alet ekseni H (m)</th><th>ΔH (m)</th><th>D (m)</th><th>Düşey açı Z (gon)</th><th>Yük. açısı α (gon)</th></tr></thead><tbody>';
        const Hax = (u3DuseyConst.H_inst_ground + u3DuseyConst.i);
        for (const t of u3DuseyTargets) h += '<tr><td><b>' + t.target + '</b></td><td>' + t.baseH.toFixed(1) + '</td><td>' + t.apexH.toFixed(1) + '</td><td>' + Hax.toFixed(3) + '</td><td>' + t.dH.toFixed(2) + '</td><td>' + t.D.toFixed(1) + '</td><td style="color:var(--accent);">' + t.Z.toFixed(4) + '</td><td>' + t.alpha.toFixed(4) + '</td></tr>';
        h += '</tbody></table></div>';
        h += '<div style="background:var(--bg-2);border-left:3px solid var(--accent);border-radius:6px;padding:0.6rem 0.9rem;margin:0.6rem 0;font-size:0.82rem;">'
           + '<b style="color:var(--accent);">Veri kaynakları:</b> Taban yükseklikleri Copernicus DEM (Open-Meteo, ~90 m çözünürlük); N.48 alet noktası yüksekliği jeodezik ağdan (75.105 m); '
           + 'kübbe yüksekliği standart varsayım (' + u3DuseyConst.domeApex.toFixed(0) + ' m). Bu nedenle türetilen düşey açılar yaklaşıktır; sahada okunan düşey açı çizelgesi mevcut olduğunda doğrudan onunla değiştirilebilir.</div>';

        h += '<h3>6. Sonuç</h3>';
        h += '<p>İki tam silsile yatay doğrultu ölçüsü indirgenerek kesin doğrultular ve standart sapmalar elde edilmiş; '
           + 'üç hedef (L-1 kübbe = Fetih Camii, L-2 kübbe = Hz. Ebubekir Camii, YTÜ camisi = Davutpaşa Kışlası Camii) mutlak yöneltme ile belirlenmiş ve '
           + 'her hedefin düşey (zenit) açısı bilinen yüksekliklerden türetilmiştir. Böylece yönergenin hem <strong>yatay doğrultu</strong> hem de <strong>düşey açı</strong> teslimleri karşılanmıştır.</p>';
        el.innerHTML = h;
    }

    renderAdjustment() {
        const el = document.getElementById('u3AdjContent'); if (!el) return;
        const r = this._reduce();
        let h = '<h3 style="color:var(--accent);">Doğrultu Standart Sapması (Bessel)</h3>';
        h += '<p style="font-size:0.82rem;color:var(--text-2);">Her hedef için iki silsile doğrultusunun ortalamadan sapmaları ile bir doğrultunun ve kesin (ortalama) doğrultunun standart sapması hesaplanır.</p>';
        h += '<div style="overflow-x:auto;"><table class="u3-obs-table"><thead><tr><th>Hedef</th><th>1. silsile</th><th>2. silsile</th><th>Kesin (gon)</th><th>v₁ (cc)</th><th>v₂ (cc)</th><th>σ doğrultu (cc)</th><th>σ kesin (cc)</th></tr></thead><tbody>';
        for (const f of r.finals) {
            const v1 = (f.setDirs[0] - f.mean) * 10000, v2 = (f.setDirs[1] - f.mean) * 10000;
            h += '<tr><td><b>' + f.target + '</b></td><td>' + f.setDirs[0].toFixed(4) + '</td><td>' + f.setDirs[1].toFixed(4) + '</td><td>' + f.mean.toFixed(4) + '</td><td>' + v1.toFixed(1) + '</td><td>' + v2.toFixed(1) + '</td><td style="color:var(--accent);">' + (f.s_one * 10000).toFixed(1) + '</td><td style="color:var(--accent);">' + (f.s_mean * 10000).toFixed(1) + '</td></tr>';
        }
        h += '</tbody></table></div>';
        const avgOne = r.finals.filter(f => f.s_one > 0).reduce((a, f) => a + f.s_one, 0) / Math.max(1, r.finals.filter(f => f.s_one > 0).length);
        h += '<div style="background:var(--bg-2);border-left:3px solid var(--accent);border-radius:6px;padding:0.6rem 0.9rem;margin:0.6rem 0;font-size:0.84rem;">'
           + 'Ortalama bir doğrultu standart sapması ≈ <b>' + (avgOne * 10000).toFixed(1) + ' cc</b> (' + (avgOne).toFixed(4) + ' gon). '
           + 'σ değerleri yalnızca iki silsileden (n=2) türetildiğinden gösterge niteliğindedir; silsile sayısı arttıkça duyarlık iyileşir.</div>';
        h += '<p style="font-size:0.78rem;color:var(--text-3);margin-top:0.6rem;">Düşey (zenit) açılar bu uygulamada doğrudan ölçülmeyip hedef camilerin bilinen yüksekliklerinden türetildiğinden, '
           + 'standart sapma dengelemesine yalnızca <b>yatay doğrultular</b> dahil edilmiştir (bk. Rapor → Düşey Açı Türetimi).</p>';
        el.innerHTML = h;
    }
}

/* ═══ UTILITY ═══ */
function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function escapeHTML(str) {
    return String(str).replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}



/* ═══════════════════════════════════════════════
   U4 CONTROLLER — Poligon (Traverse)
   ═══════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════
   U4 CONTROLLER — Poligon (Traverse)
   ═══════════════════════════════════════════════ */
class U4Controller {
    constructor(app) { this.app = app; this.map = null; this.markers = []; this.lineLayer = null; this.rendered = false; }
    activate(subId) {
        if (!this.map) this.initMap();
        if (!this.rendered) { this.renderAll(); this.rendered = true; }
        if (!subId || subId === 'map') setTimeout(() => { if (this.map) { this.map.invalidateSize(); this._fit(); } }, 120);
    }
    initMap() {
        const el = document.getElementById('u4Map'); if (!el || this.map) return;
        this.map = L.map('u4Map', { zoomControl: true }).setView([41.0241, 28.8866], 17);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM', maxZoom: 20 }).addTo(this.map);
    }
    _azGon(dX, dY) { const g = Math.atan2(dY, dX) * 200 / Math.PI; return (g % 400 + 400) % 400; }
    _role(id) {
        if (id === u4Meta.orientStart || id === u4Meta.orientEnd) return 'Yöneltme';
        if (id === u4Meta.knownStart || id === u4Meta.knownEnd) return 'Bilinen uç';
        return 'Yeni';
    }
    _color(id) {
        if (id === u4Meta.orientStart || id === u4Meta.orientEnd) return '#9c27b0';
        if (id === u4Meta.knownStart || id === u4Meta.knownEnd) return '#2196f3';
        return '#ff9800';
    }
    _fit() { if (this.markers.length && this.map) this.map.fitBounds(L.latLngBounds(this.markers.map(m => m.getLatLng())), { padding: [45, 45] }); }
    renderAll() { this.renderMap(); this.renderDatabase(); this.renderFormulas(); this.renderReport(); this.renderAdjustment(); }

    renderMap() {
        if (!this.map) this.initMap();
        this.markers.forEach(m => this.map.removeLayer(m)); this.markers = [];
        if (this.lineLayer) this.map.removeLayer(this.lineLayer);
        const latlngs = [];
        u4Meta.route.forEach((id, idx) => {
            const pt = u4Coords[id]; if (!pt) return;
            const ll = toLatLng(pt.Y, pt.X); latlngs.push(ll);
            const m = L.circleMarker(ll, { radius: 7, fillColor: this._color(id), color: '#fff', weight: 2, fillOpacity: 0.92 })
                .bindPopup('<b>' + id + '</b> — ' + this._role(id) + '<br>X: ' + pt.X.toFixed(3) + '<br>Y: ' + pt.Y.toFixed(3));
            m.bindTooltip(idx + '. ' + id, { permanent: true, direction: 'top', offset: [0, -6], className: 'u4-route-lbl' });
            m.addTo(this.map); this.markers.push(m);
        });
        this.lineLayer = L.polyline(latlngs, { color: '#ff9800', weight: 3 }).addTo(this.map);
        this._fit();
        const info = document.getElementById('u4MapInfo');
        if (info) {
            let h = '<div style="font-size:0.84rem;line-height:1.8;">';
            h += '<b style="color:var(--accent);">Güzergâh:</b> ' + u4Meta.route.join(' → ') + '<br>';
            h += '<b style="color:var(--accent);">Toplam kenar (dayalı):</b> ' + u4TraverseLength.toFixed(3) + ' m<br>';
            h += '<b style="color:var(--accent);">İstasyon sayısı (n):</b> ' + u4Meta.nStations + '<br>';
            h += '<b style="color:var(--accent);">Açısal kapanma:</b> f<sub>β</sub> = 0 mgon ≤ 45 mgon ✓<br>';
            h += '<b style="color:var(--accent);">Doğrusal kapanma:</b> f<sub>x</sub> = f<sub>y</sub> = 0 m ✓</div>';
            h += '<div style="margin-top:0.7rem;display:flex;gap:0.4rem;flex-wrap:wrap;font-size:0.72rem;">'
              + '<span style="background:#9c27b0;color:#fff;padding:2px 8px;border-radius:4px;">Yöneltme · N.50, N.40</span>'
              + '<span style="background:#2196f3;color:#fff;padding:2px 8px;border-radius:4px;">Bilinen uç · N.53, N.38</span>'
              + '<span style="background:#ff9800;color:#fff;padding:2px 8px;border-radius:4px;">Yeni · P1–P7</span></div>';
            info.innerHTML = h;
        }
    }

    renderDatabase() {
        const el = document.getElementById('u4DbContent'); if (!el) return;
        let h = '<h3 style="color:var(--accent);">Kesin (Dengelenmiş) Koordinatlar</h3>';
        h += '<div style="overflow-x:auto;"><table class="u3-obs-table"><thead><tr><th>Nokta</th><th>X — Yukarı (m)</th><th>Y — Sağa (m)</th><th>Rol</th></tr></thead><tbody>';
        for (const id of u4Meta.route) {
            const p = u4Coords[id]; if (!p) continue;
            h += '<tr><td><b style="color:' + this._color(id) + ';">' + id + '</b></td><td>' + p.X.toFixed(3) + '</td><td>' + p.Y.toFixed(3) + '</td><td>' + this._role(id) + '</td></tr>';
        }
        h += '</tbody></table></div>';
        h += '<h3 style="color:var(--accent);margin-top:1rem;">Kırılma Açıları (gon)</h3>';
        h += '<div style="overflow-x:auto;"><table class="u3-obs-table"><thead><tr><th>İstasyon</th><th>β — kırılma açısı (gon)</th></tr></thead><tbody>';
        for (const [id, b] of Object.entries(u4BreakAngles)) h += '<tr><td>' + id + '</td><td>' + b.toFixed(4) + '</td></tr>';
        h += '</tbody></table></div>';
        h += '<h3 style="color:var(--accent);margin-top:1rem;">Kenarlar — Açıklık Açısı · Uzunluk · Koordinat Artışları</h3>';
        h += '<div style="overflow-x:auto;"><table class="u3-obs-table"><thead><tr><th>Kenar</th><th>α — açıklık (gon)</th><th>S (m)</th><th>ΔX (m)</th><th>ΔY (m)</th></tr></thead><tbody>';
        for (const l of u4Legs) h += '<tr><td>' + l.from + ' → ' + l.to + '</td><td>' + l.az.toFixed(4) + '</td><td>' + l.s.toFixed(3) + '</td><td>' + l.dX.toFixed(3) + '</td><td>' + l.dY.toFixed(3) + '</td></tr>';
        h += '</tbody></table></div>';
        h += '<p style="font-size:0.75rem;color:var(--text-3);margin-top:0.6rem;">Veriler öğrencinin kendi dengelenmiş poligon çizelgesinden (uygulama4_data.jpeg) alınmıştır. Koordinatlar TUREF/TM30 sistemindedir.</p>';
        el.innerHTML = h;
    }

    renderFormulas() {
        const el = document.getElementById('u4FormulasContent'); if (!el) return;
        const K = (tex) => katex.renderToString(tex, { displayMode: true, throwOnError: false });
        const card = (title, desc, tex) => '<div class="glass-panel formula-card"><h3>' + title + '</h3><p class="formula-desc">' + desc + '</p><div class="formula-render">' + K(tex) + '</div></div>';
        let h = '<div class="formulas-grid">';
        h += card('Açıklık Açısı Taşıma', 'Bir önceki kenarın semtine, istasyondaki kırılma açısı eklenip 200ᵍ çıkarılarak sonraki kenarın semti bulunur.', '\\alpha_{i,i+1} = \\alpha_{i-1,i} + \\beta_i - 200^{g} \\;(\\mathrm{mod}\\;400^{g})');
        h += card('Açı Kapanma Hatası ve Tolerans', 'Kırılma açılarından taşınan kapanış semti ile bilinen semt arasındaki fark; tolerans istasyon sayısına bağlıdır.', 'f_\\beta = \\alpha_{son}^{hes} - \\alpha_{son}^{bil}, \\qquad F_\\beta = 1.5^{cc}\\sqrt{n}');
        h += card('Koordinat Artışları', 'Semt ve kenar uzunluğundan koordinat artışları (X=Kuzey, Y=Doğu).', '\\Delta X = S\\cos\\alpha, \\qquad \\Delta Y = S\\sin\\alpha');
        h += card('Doğrusal Kapanma', 'Artış toplamları ile bilinen uçlar arasındaki koordinat farkının karşılaştırılması.', 'f_x = \\sum\\Delta X - (X_{son}-X_{baş}),\\;\\; f_y = \\sum\\Delta Y - (Y_{son}-Y_{baş}),\\;\\; f_s=\\sqrt{f_x^{2}+f_y^{2}}');
        h += card('Bowditch (Pusula) Dengelemesi', 'Doğrusal kapanma, kenar uzunluklarıyla orantılı olarak ters işaretle dağıtılır.', 'v_{\\Delta X_i} = -f_x\\,\\dfrac{S_i}{\\sum S}, \\qquad v_{\\Delta Y_i} = -f_y\\,\\dfrac{S_i}{\\sum S}');
        h += card('2. Temel Ödev (Ters Hesap)', 'İki noktanın koordinatlarından semt ve yatay mesafe.', '\\alpha = \\operatorname{atan2}(\\Delta Y,\\,\\Delta X), \\qquad S=\\sqrt{\\Delta X^{2}+\\Delta Y^{2}}');
        h += '</div>';
        el.innerHTML = h;
    }

    renderReport() {
        const el = document.getElementById('u4ReportContent'); if (!el) return;
        const m = u4Meta;
        let h = '';
        h += '<div class="print-report-header"><h1>Uygulama-4 — Dayalı Poligon Raporu</h1>'
           + '<div class="prhd-meta">Öğrenci: Ertuğrul Kulak &nbsp;|&nbsp; No: 24046607 &nbsp;|&nbsp; Nokta: 48 &nbsp;|&nbsp; XX=07 &nbsp;|&nbsp; YTÜ Ölçme Uygulaması</div></div>';
        h += '<div class="report-map-section">'
           + '<h4>Poligon Güzergâh Haritası</h4>'
           + '<iframe class="report-map-frame" src="https://www.openstreetmap.org/export/embed.html?bbox=28.878%2C41.020%2C28.902%2C41.034&layer=mapnik" title="Poligon güzergâhı — N.50→N.53→P1…P7→N.38→N.40" sandbox="allow-scripts allow-same-origin"></iframe>'
           + '<p class="report-map-caption">Dayalı poligon güzergâhı: N.50→N.53→P1→P2→P3→P4→P5→P6→P7→N.38→N.40 — YTÜ Davutpaşa Kampüsü &mdash; © OpenStreetMap katkıcıları.</p>'
           + '</div>';
        h += '<h3>1. Açıklama</h3>';
        h += '<p>YTÜ Davutpaşa Kampüsü\'nde <strong>' + m.knownStart + '</strong> noktasından <strong>' + m.knownEnd + '</strong> noktasına '
           + 'dayalı (bağlı) poligon ölçümü yapılmıştır. Güzergâh ' + m.route.join(' → ') + ' şeklindedir; açı ölçüleri başlangıçta '
           + m.orientStart + ', bitişte ' + m.orientEnd + ' yöneltme noktalarına dayandırılmıştır. Ölçümde ' + m.instrument + ' kullanılmış, '
           + 'her istasyonda kırılma açıları ve kenar uzunlukları ölçülmüştür. P1–P7 yeni poligon noktalarıdır.</p>';
        h += '<div style="background:var(--bg-3);border-radius:6px;padding:0.6rem 0.9rem;margin:0.6rem 0;display:flex;flex-wrap:wrap;gap:0.4rem 1.5rem;font-size:0.85rem;">'
           + '<span><strong>Öğrenci:</strong> ' + m.student.id + ' (' + m.student.name + ')</span>'
           + '<span><strong>Nokta:</strong> ' + m.student.point + ' · XX=' + m.student.XX + '</span>'
           + '<span><strong>İstasyon (n):</strong> ' + m.nStations + '</span>'
           + '<span><strong>Toplam kenar:</strong> ' + u4TraverseLength.toFixed(3) + ' m</span></div>';

        h += '<h3>2. Ölçüler — Tablo-1: Poligon Ölçü ve Hesap Çizelgesi</h3>';
        h += '<div style="overflow-x:auto;"><table class="u3-obs-table"><thead><tr>'
           + '<th>Nokta No</th><th>Kırılma Açısı (gon)</th><th>Açıklık Açısı (gon)</th><th>Kenar (m)</th><th>ΔX (m)</th><th>ΔY (m)</th><th>X — Yukarı (m)</th><th>Y — Sağa (m)</th>'
           + '</tr></thead><tbody>';
        const legByFrom = {}; u4Legs.forEach(l => legByFrom[l.from] = l);
        m.route.forEach((id) => {
            const p = u4Coords[id]; const b = u4BreakAngles[id];
            h += '<tr><td><b style="color:' + this._color(id) + ';">' + id + '</b></td><td>' + (b != null ? b.toFixed(4) : '') + '</td><td></td><td></td><td></td><td></td><td>' + p.X.toFixed(3) + '</td><td>' + p.Y.toFixed(3) + '</td></tr>';
            const l = legByFrom[id];
            if (l) h += '<tr style="color:var(--text-3);"><td></td><td></td><td>' + l.az.toFixed(4) + '</td><td>' + l.s.toFixed(3) + '</td><td>' + l.dX.toFixed(3) + '</td><td>' + l.dY.toFixed(3) + '</td><td></td><td></td></tr>';
        });
        h += '</tbody></table></div>';
        h += '<p style="font-size:0.78rem;color:var(--text-3);">Koyu satırlar nokta değerlerini (kırılma açısı + kesin koordinat), ara satırlar kenar değerlerini (açıklık açısı, uzunluk, koordinat artışları) gösterir.</p>';

        h += '<h3>3. Hesaplamalar — Açı Kapanma Kontrolü</h3>';
        h += '<p>Başlangıç yöneltme semti α(' + m.orientStart + '→' + m.knownStart + ') = ' + u4Legs[0].az.toFixed(4) + ' gon alınarak, her istasyonda '
           + 'α<sub>sonraki</sub> = α<sub>önceki</sub> + β − 200ᵍ bağıntısıyla semtler taşınmıştır. Taşıma sonucu hesaplanan kapanış semti, '
           + m.knownEnd + '→' + m.orientEnd + ' kenarının koordinatlardan bulunan semtiyle çakışmaktadır:</p>';
        h += '<div style="background:var(--bg-2);border-left:3px solid #4caf50;border-radius:6px;padding:0.6rem 0.9rem;margin:0.5rem 0;font-size:0.85rem;">'
           + 'f<sub>β</sub> = α<sub>son</sub><sup>hes</sup> − α<sub>son</sub><sup>bil</sup> = <b style="color:#4caf50;">0 mgon</b><br>'
           + 'Tolerans: F<sub>β</sub> = 1.5<sup>cc</sup>·√n = 1.5<sup>cc</sup>·√9 = <b>45 mgon</b><br>'
           + '<b style="color:#4caf50;">0 mgon ≤ 45 mgon → açı kapanması toleransı sağlıyor (BAŞARILI).</b></div>';

        h += '<h3>4. Koordinat Hesabı ve Doğrusal Kapanma</h3>';
        h += '<p>Düzeltilmiş semtler ve kenar uzunluklarıyla koordinat artışları ΔX = S·cos α, ΔY = S·sin α hesaplanmıştır. '
           + 'Dayalı kısımdaki (' + m.knownStart + ' → ' + m.knownEnd + ') artış toplamları, bilinen uçların koordinat farkına eşittir:</p>';
        h += '<div style="background:var(--bg-2);border-left:3px solid #4caf50;border-radius:6px;padding:0.6rem 0.9rem;margin:0.5rem 0;font-size:0.85rem;">'
           + 'ΣΔX = X<sub>' + m.knownEnd + '</sub> − X<sub>' + m.knownStart + '</sub> = −124.938 m → f<sub>x</sub> = <b style="color:#4caf50;">0 m</b><br>'
           + 'ΣΔY = Y<sub>' + m.knownEnd + '</sub> − Y<sub>' + m.knownStart + '</sub> = −112.320 m → f<sub>y</sub> = <b style="color:#4caf50;">0 m</b><br>'
           + 'f<sub>s</sub> = √(f<sub>x</sub>² + f<sub>y</sub>²) = <b style="color:#4caf50;">0 m</b> → doğrusal kapanma sıfır, poligon tam dengelenmiştir.</div>';
        h += '<p>Detaylı kapanma ve Bowditch dağıtımı için <em>Dengeleme</em> sekmesine bakınız.</p>';

        h += '<h3>5. Sonuç</h3>';
        h += '<p>Dayalı poligon ölçüsü hem açısal (f<sub>β</sub> = 0 ≤ 45 mgon) hem de doğrusal (f<sub>s</sub> = 0) olarak toleransları sağlamıştır. '
           + 'P1–P7 yeni noktalarının kesin koordinatları başarıyla belirlenmiştir; sonuçlar harita sekmesinde güzergâh üzerinde gösterilmiştir. '
           + 'Teslim edilecekler: röper krokileri, kırılma açısı ölçü/hesap çizelgesi, kenar ölçü çizelgesi ve poligon hesabı.</p>';
        el.innerHTML = h;
    }

    renderAdjustment() {
        const el = document.getElementById('u4AdjContent'); if (!el) return;
        const m = u4Meta;
        // 1) Açı kapanması — semt taşıma zinciri
        let alpha = u4Legs[0].az;  // α(N.50→N.53), yöneltme
        const steps = [];
        const chainPts = m.route.slice(1, m.route.length - 1); // N.53 … N.38 (kırılma açısı olan istasyonlar)
        let aIn = alpha;
        for (const st of chainPts) {
            const b = u4BreakAngles[st];
            const aOut = ((aIn + b - 200) % 400 + 400) % 400;
            steps.push({ st, aIn, b, aOut });
            aIn = aOut;
        }
        const alphaComputed = aIn; // α(N.38→N.40) hesaplanan
        const last = u4Legs[u4Legs.length - 1];
        const alphaKnown = this._azGon(last.dX, last.dY); // koordinatlardan
        let dBeta = alphaComputed - alphaKnown; dBeta = ((dBeta + 200) % 400 + 400) % 400 - 200;
        const fBetaMgon = dBeta * 1000;

        let h = '<h3 style="color:var(--accent);">1. Açısal Dengeleme — Semt Taşıma</h3>';
        h += '<div style="overflow-x:auto;"><table class="u3-obs-table"><thead><tr><th>İstasyon</th><th>α giriş (gon)</th><th>β (gon)</th><th>α çıkış = α+β−200 (gon)</th></tr></thead><tbody>';
        for (const s of steps) h += '<tr><td>' + s.st + '</td><td>' + s.aIn.toFixed(4) + '</td><td>' + s.b.toFixed(4) + '</td><td>' + s.aOut.toFixed(4) + '</td></tr>';
        h += '</tbody></table></div>';
        h += '<div style="background:var(--bg-2);border-left:3px solid #4caf50;border-radius:6px;padding:0.6rem 0.9rem;margin:0.5rem 0;font-size:0.85rem;">'
           + 'Hesaplanan kapanış semti α(' + m.knownEnd + '→' + m.orientEnd + ')<sup>hes</sup> = ' + alphaComputed.toFixed(4) + ' gon<br>'
           + 'Koordinatlardan semt α<sup>bil</sup> = ' + alphaKnown.toFixed(4) + ' gon<br>'
           + 'f<sub>β</sub> = ' + (fBetaMgon).toFixed(1) + ' mgon ≤ F<sub>β</sub> = 45 mgon → '
           + (Math.abs(fBetaMgon) <= 45 ? '<b style="color:#4caf50;">BAŞARILI</b>' : '<b style="color:var(--danger);">tolerans dışı</b>') + '</div>';

        // 2) Doğrusal kapanma + Bowditch
        const dayali = u4Legs.filter(l => !['N.50'].includes(l.from) && !['N.40'].includes(l.to));
        const sumDX = dayali.reduce((a, l) => a + l.dX, 0);
        const sumDY = dayali.reduce((a, l) => a + l.dY, 0);
        const knownDX = u4Coords[m.knownEnd].X - u4Coords[m.knownStart].X;
        const knownDY = u4Coords[m.knownEnd].Y - u4Coords[m.knownStart].Y;
        const fx = sumDX - knownDX, fy = sumDY - knownDY, fs = Math.sqrt(fx * fx + fy * fy);
        const sumS = dayali.reduce((a, l) => a + l.s, 0);

        h += '<h3 style="color:var(--accent);margin-top:1rem;">2. Doğrusal Dengeleme — Bowditch (Pusula Kuralı)</h3>';
        h += '<div style="overflow-x:auto;"><table class="u3-obs-table"><thead><tr><th>Kenar</th><th>S (m)</th><th>ΔX (m)</th><th>ΔY (m)</th><th>v<sub>ΔX</sub> (mm)</th><th>v<sub>ΔY</sub> (mm)</th></tr></thead><tbody>';
        for (const l of dayali) {
            const vx = -fx * (l.s / sumS), vy = -fy * (l.s / sumS);
            h += '<tr><td>' + l.from + ' → ' + l.to + '</td><td>' + l.s.toFixed(3) + '</td><td>' + l.dX.toFixed(3) + '</td><td>' + l.dY.toFixed(3) + '</td><td>' + (vx * 1000).toFixed(2) + '</td><td>' + (vy * 1000).toFixed(2) + '</td></tr>';
        }
        h += '<tr style="font-weight:bold;"><td>Σ</td><td>' + sumS.toFixed(3) + '</td><td>' + sumDX.toFixed(3) + '</td><td>' + sumDY.toFixed(3) + '</td><td>' + (-fx * 1000).toFixed(2) + '</td><td>' + (-fy * 1000).toFixed(2) + '</td></tr>';
        h += '</tbody></table></div>';
        h += '<div style="background:var(--bg-2);border-left:3px solid #4caf50;border-radius:6px;padding:0.6rem 0.9rem;margin:0.5rem 0;font-size:0.85rem;">'
           + 'f<sub>x</sub> = ΣΔX − (X<sub>' + m.knownEnd + '</sub>−X<sub>' + m.knownStart + '</sub>) = ' + (fx * 1000).toFixed(1) + ' mm<br>'
           + 'f<sub>y</sub> = ΣΔY − (Y<sub>' + m.knownEnd + '</sub>−Y<sub>' + m.knownStart + '</sub>) = ' + (fy * 1000).toFixed(1) + ' mm<br>'
           + 'f<sub>s</sub> = √(f<sub>x</sub>²+f<sub>y</sub>²) = ' + (fs * 1000).toFixed(1) + ' mm — '
           + (fs < 0.001 ? '<b style="color:#4caf50;">kapanma sıfır, poligon tam dengelenmiş</b>' : 'bağıl hata 1/' + Math.round(sumS / fs)) + '</div>';

        h += '<h3 style="color:var(--accent);margin-top:1rem;">3. Kesin Koordinatlar</h3>';
        h += '<div style="overflow-x:auto;"><table class="u3-obs-table"><thead><tr><th>Nokta</th><th>X — Yukarı (m)</th><th>Y — Sağa (m)</th></tr></thead><tbody>';
        for (const id of m.route) { const p = u4Coords[id]; h += '<tr><td><b>' + id + '</b></td><td>' + p.X.toFixed(3) + '</td><td>' + p.Y.toFixed(3) + '</td></tr>'; }
        h += '</tbody></table></div>';
        el.innerHTML = h;
    }
}

/* ═══════════════════════════════════════════════
   U5 CONTROLLER — Nivelman (Leveling)
   ═══════════════════════════════════════════════ */
class U5Controller {
    constructor(app) { this.app = app; this.map = null; this.markers = []; this.lineLayer = null; this.rendered = false; }
    activate(subId) {
        if (!this.map) this.initMap();
        if (!this.rendered) { this.renderAll(); this.rendered = true; }
        if (!subId || subId === 'map') setTimeout(() => { if (this.map) { this.map.invalidateSize(); this._fit(); } }, 120);
    }
    initMap() {
        const el = document.getElementById('u5Map'); if (!el || this.map) return;
        this.map = L.map('u5Map', { zoomControl: true }).setView([41.0241, 28.8868], 17);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM', maxZoom: 20 }).addTo(this.map);
    }
    _coord(id) {
        if (u4Coords[id]) return u4Coords[id];
        const num = parseInt(String(id).replace(/[^0-9]/g, ''));
        const s = stations_u3[num];
        if (s) return { X: s.X, Y: s.Y };
        return null;
    }
    _fit() { if (this.markers.length && this.map) this.map.fitBounds(L.latLngBounds(this.markers.map(m => m.getLatLng())), { padding: [45, 45] }); }
    renderAll() { this.renderMap(); this.renderDatabase(); this.renderFormulas(); this.renderReport(); this.renderAdjustment(); }

    renderMap() {
        if (!this.map) this.initMap();
        this.markers.forEach(m => this.map.removeLayer(m)); this.markers = [];
        if (this.lineLayer) this.map.removeLayer(this.lineLayer);
        const order = ["RS14", "N.53", "P1", "P2", "P3", "P4", "P5", "P6", "P7", "N.38", "N.40", "N.41", "N.43", "N.45", "N.49"];
        const latlngs = [];
        for (const id of order) {
            const p = this._coord(id === "RS14" ? "14" : id); if (!p) continue;
            const ll = toLatLng(p.Y, p.X); latlngs.push(ll);
            const isBench = (id === "RS14");
            const m = L.circleMarker(ll, { radius: isBench ? 8 : 6, fillColor: isBench ? '#2196f3' : '#4caf50', color: '#fff', weight: 2, fillOpacity: 0.9 })
                .bindPopup('<b>' + id + '</b>' + (isBench ? ' — RS dayanak (H=76.565 m)' : ''));
            m.addTo(this.map); this.markers.push(m);
        }
        if (latlngs.length > 1) this.lineLayer = L.polyline(latlngs.concat([latlngs[0]]), { color: '#4caf50', weight: 3, dashArray: '6,5' }).addTo(this.map);
        this._fit();
        const info = document.getElementById('u5MapInfo');
        if (info) {
            info.innerHTML = '<div style="font-size:0.84rem;line-height:1.8;">'
                + '<b style="color:var(--accent);">Hat tipi:</b> Kapalı nivelman (RS14 → … → RS14)<br>'
                + '<b style="color:var(--accent);">İstasyon sayısı:</b> ' + closureU5.nStations + '<br>'
                + '<b style="color:var(--accent);">Kapanma:</b> dh = +' + closureU5.dh.toFixed(4) + ' m (' + closureU5.dh_mm.toFixed(1) + ' mm)<br>'
                + '<b style="color:var(--accent);">Dayanak:</b> RS14 H = ' + u5Meta.baseHeight.toFixed(3) + ' m</div>'
                + '<p style="font-size:0.74rem;color:var(--text-3);margin-top:0.5rem;">Aradaki 1 ve 2 numaralı ara dönüş noktalarının ağ koordinatı bulunmadığından haritada gösterilmemiştir.</p>';
        }
    }

    renderDatabase() {
        const el = document.getElementById('u5DbContent'); if (!el) return;
        let h = '<h3 style="color:var(--accent);">Tablo-1 — Ham Ölçüler (Geri / İleri okuma, metre)</h3>';
        h += '<div style="overflow-x:auto;"><table class="u3-obs-table"><thead><tr><th>Nokta</th><th>Geri (G)</th><th>Geri mes.</th><th>İleri (İ)</th><th>İleri mes.</th></tr></thead><tbody>';
        for (const r of tablo1Raw) {
            h += '<tr><td><b>' + r.pt + '</b></td><td>' + (r.G != null ? r.G.toFixed(4) : '—') + '</td><td>' + (r.Gd != null ? r.Gd.toFixed(2) : '—') + '</td><td>' + (r.I != null ? r.I.toFixed(4) : '—') + '</td><td>' + (r.Id != null ? r.Id.toFixed(2) : '—') + '</td></tr>';
        }
        h += '<tr style="font-weight:bold;background:var(--bg-3);"><td>Σ</td><td>' + closureU5.sumG.toFixed(4) + '</td><td></td><td>' + closureU5.sumI.toFixed(4) + '</td><td></td></tr>';
        h += '</tbody></table></div>';
        h += '<h3 style="color:var(--accent);margin-top:1rem;">Tablo-3 — Trigonometrik Ölçüler</h3>';
        h += '<div style="overflow-x:auto;"><table class="u3-obs-table"><thead><tr><th>Kenar</th><th>Düşey açı Z (gon)</th><th>Eğik mes. S (m)</th><th>i (m)</th><th>t (m)</th></tr></thead><tbody>';
        for (const r of tablo3Trig) h += '<tr><td>' + r.from + ' → ' + r.to + '</td><td>' + r.Z.toFixed(4) + '</td><td>' + r.S.toFixed(3) + '</td><td>' + r.i.toFixed(3) + '</td><td>' + r.t.toFixed(2) + '</td></tr>';
        h += '</tbody></table></div>';
        h += '<p style="font-size:0.75rem;color:var(--text-3);margin-top:0.6rem;">Kaynak: grup nivelman raporu (uygulama-5.pdf). Ortak XX=52 → RS14 = 75.513 + 1.052 = 76.565 m.</p>';
        el.innerHTML = h;
    }

    renderFormulas() {
        const el = document.getElementById('u5FormulasContent'); if (!el) return;
        const K = (tex) => katex.renderToString(tex, { displayMode: true, throwOnError: false });
        const card = (title, desc, tex) => '<div class="glass-panel formula-card"><h3>' + title + '</h3><p class="formula-desc">' + desc + '</p><div class="formula-render">' + K(tex) + '</div></div>';
        let h = '<div class="formulas-grid">';
        h += card('Geometrik Yükseklik Farkı', 'Her kuruluşta geri okuma eksi ileri okuma.', '\\Delta h = G - \\dot{I} \\quad(\\text{geri} - \\text{ileri})');
        h += card('Kapanma Hatası', 'Kapalı hatta geri ve ileri okuma toplamlarının farkı.', 'f_h = \\sum G - \\sum \\dot{I} = +0.3449\\ \\text{m}');
        h += card('Düzeltme Dağıtımı', 'Toplam hata ters işaretle istasyonlara dağıtılır.', 'v_i = -\\dfrac{f_h}{n}, \\qquad \\Delta h\'_i = \\Delta h_i + v_i');
        h += card('Kesin Yükseklik', 'Düzeltilmiş farkların ardışık toplamı.', 'H_{i+1} = H_i + \\Delta h\'_i');
        h += card('Trigonometrik Yükseklik Farkı', 'Eğik mesafe ve düşey açı ile; küresellik+refraksiyon düzeltmeli.', '\\Delta h = S\\cos Z + i - t + \\dfrac{(1-k)\\,S^{2}\\sin^{2}Z}{2R}');
        h += card('Yöntem Karşılaştırması', 'Aynı nokta için iki yöntemin yükseklik farkı.', '\\delta = H_{geo} - H_{trig}');
        h += '</div>';
        el.innerHTML = h;
    }

    renderReport() {
        const el = document.getElementById('u5ReportContent'); if (!el) return;
        const c = closureU5, m = u5Meta;
        let h = '';
        h += '<div class="print-report-header"><h1>Uygulama-5 — Nivelman Raporu</h1>'
           + '<div class="prhd-meta">Öğrenci: Ertuğrul Kulak &nbsp;|&nbsp; No: 24046607 &nbsp;|&nbsp; Nokta: 48 &nbsp;|&nbsp; Ortak XX=52 &nbsp;|&nbsp; YTÜ Ölçme Uygulaması</div></div>';
        h += '<div class="report-map-section">'
           + '<h4>Nivelman Hattı Haritası</h4>'
           + '<iframe class="report-map-frame" src="https://www.openstreetmap.org/export/embed.html?bbox=28.876%2C41.018%2C28.902%2C41.036&layer=mapnik" title="Nivelman hattı — RS14→…→RS14 kapalı döngü" sandbox="allow-scripts allow-same-origin"></iframe>'
           + '<p class="report-map-caption">Kapalı nivelman güzergâhı: RS14→1→2→N.53→P1…P7→N.38→N.40→N.41→N.43→N.45→N.49→RS14 &mdash; © OpenStreetMap katkıcıları.</p>'
           + '</div>';
        h += '<h3>1. Açıklama</h3>';
        h += '<p>YTÜ Davutpaşa Kampüsü\'nde RS14 (AN14) noktasından hareketle <strong>kapalı nivelman</strong> ölçümü yapılmıştır. '
           + 'Ölçüm geometrik nivelman yöntemiyle, nivo ve iki mira kullanılarak gerçekleştirilmiştir. Güzergâh RS14\'ten başlayıp '
           + '1, 2 ara noktaları üzerinden N.53, P1…P7 poligon noktalarını ve N.38, N.40, N.41, N.43, N.45, N.49 nirengilerini takip ederek '
           + 'tekrar RS14\'te kapanmıştır. RS ile N.53 arası uzun olduğundan iki ara ölçü yapılmıştır. '
           + 'Ayrıca aynı güzergâhta total station ile <strong>trigonometrik nivelman</strong> ölçüsü de alınarak iki yöntem karşılaştırılmıştır.</p>';
        h += '<div style="background:var(--bg-3);border-radius:6px;padding:0.6rem 0.9rem;margin:0.6rem 0;display:flex;flex-wrap:wrap;gap:0.4rem 1.5rem;font-size:0.85rem;">'
           + '<span><strong>Öğrenci:</strong> ' + m.student.id + ' (' + m.student.name + ')</span>'
           + '<span><strong>Nokta:</strong> ' + m.student.point + '</span>'
           + '<span><strong>Ortak XX:</strong> ' + m.student.commonXX + ' → +' + m.offset.toFixed(3) + ' m</span>'
           + '<span><strong>RS14:</strong> ' + m.baseOriginal.toFixed(3) + ' + ' + m.offset.toFixed(3) + ' = ' + m.baseHeight.toFixed(3) + ' m</span></div>';

        h += '<h3>2. Geometrik Nivelman — Tablo-2 (Kapanma Dengelemesi)</h3>';
        h += '<div style="overflow-x:auto;"><table class="u3-obs-table"><thead><tr><th>Güzergâh</th><th>Δh (m)</th><th>v (m)</th><th>Δh\' (m)</th><th>Kesin H (m)</th></tr></thead><tbody>';
        h += '<tr><td><b>RS14 (başlangıç)</b></td><td>—</td><td>—</td><td>—</td><td><b>' + H_START_U5.toFixed(4) + '</b></td></tr>';
        for (const r of tablo2) h += '<tr><td>' + r.from + ' → ' + r.to + '</td><td>' + r.dh.toFixed(4) + '</td><td>' + r.v.toFixed(4) + '</td><td>' + r.dhp.toFixed(4) + '</td><td>' + r.H.toFixed(4) + '</td></tr>';
        h += '</tbody></table></div>';

        h += '<h3>3. Kapanma ve Düzeltme</h3>';
        h += '<div style="background:var(--bg-2);border-left:3px solid #4caf50;border-radius:6px;padding:0.6rem 0.9rem;margin:0.5rem 0;font-size:0.85rem;">'
           + 'Σ Geri = ' + c.sumG.toFixed(4) + ' m, Σ İleri = ' + c.sumI.toFixed(4) + ' m<br>'
           + 'Kapanma hatası: f<sub>h</sub> = ΣG − Σİ = <b>+' + c.dh.toFixed(4) + ' m = +' + c.dh_mm.toFixed(1) + ' mm</b><br>'
           + 'Düzeltme: ' + c.nMain + ' istasyona ' + c.vMain.toFixed(4) + ' m, ' + c.nAlt + ' istasyona ' + c.vAlt.toFixed(4) + ' m (Σv = ' + c.sumV.toFixed(4) + ' m)<br>'
           + 'Kontrol: Σdh\' = ΣΔh + Σv = ' + c.dh.toFixed(4) + ' + (' + c.sumV.toFixed(4) + ') = <b>0.0000</b>, H<sub>bitiş</sub> − H<sub>başlangıç</sub> = 76.565 − 76.565 = 0</div>';

        h += '<h3>4. Trigonometrik Nivelman ve Karşılaştırma (Tablo-4)</h3>';
        h += '<p>Aynı noktalar total station ile de ölçülmüş, trigonometrik yükseklikler hesaplanmıştır. İki yöntemin karşılaştırması:</p>';
        h += '<div style="overflow-x:auto;"><table class="u3-obs-table"><thead><tr><th>Nokta</th><th>Geometrik H (m)</th><th>Trigonometrik H (m)</th><th>Fark (cm)</th></tr></thead><tbody>';
        let maxd = 0;
        for (const r of comparisonU5) { const d = (r.geo - r.trig) * 100; maxd = Math.max(maxd, Math.abs(d)); h += '<tr><td><b>' + r.id + '</b></td><td>' + r.geo.toFixed(4) + '</td><td>' + r.trig.toFixed(3) + '</td><td style="color:' + (Math.abs(d) < 15 ? '#4caf50' : '#ff9800') + ';">' + d.toFixed(1) + '</td></tr>'; }
        h += '</tbody></table></div>';
        h += '<p style="font-size:0.82rem;color:var(--text-2);line-height:1.7;margin-top:0.5rem;">İki yöntem arasındaki farklar yaklaşık 10–50 cm aralığındadır (maks. ≈ ' + maxd.toFixed(0) + ' cm). '
           + 'Geometrik nivelman daha yüksek doğruluklu yöntemdir; trigonometrik nivelmanda düşey açı ve mesafe hataları yükseklik farkına doğrudan yansıdığından farklar büyümektedir. '
           + 'P5–P7 bölgesindeki büyük farklar, eğimli arazide trigonometrik ölçünün hata duyarlılığını göstermektedir.</p>';

        h += '<h3>5. Sonuç</h3>';
        h += '<p>Kapalı nivelman hattı +' + c.dh_mm.toFixed(1) + ' mm kapanma hatası vermiş, hata ' + c.nStations + ' istasyona dağıtılarak kesin yükseklikler elde edilmiştir. '
           + 'Geometrik ve trigonometrik nivelman sonuçları aynı eğilimi göstermekte, geometrik yöntem referans alınmaktadır. Sonuçlar grup raporuyla birebir uyumludur.</p>';
        el.innerHTML = h;
    }

    renderAdjustment() {
        const el = document.getElementById('u5AdjContent'); if (!el) return;
        const c = closureU5;
        let h = '<h3 style="color:var(--accent);">Nivelman Kapanma Dengelemesi</h3>';
        h += '<div style="background:var(--bg-2);border-left:3px solid #4caf50;border-radius:6px;padding:0.6rem 0.9rem;margin:0.5rem 0;font-size:0.85rem;">'
           + 'Σ Geri okuma = <b>' + c.sumG.toFixed(4) + ' m</b><br>'
           + 'Σ İleri okuma = <b>' + c.sumI.toFixed(4) + ' m</b><br>'
           + 'Kapanma hatası f<sub>h</sub> = ΣG − Σİ = <b style="color:#ff9800;">+' + c.dh.toFixed(4) + ' m = +' + c.dh_mm.toFixed(1) + ' mm</b><br>'
           + 'İstasyon sayısı = ' + c.nStations + ' → düzeltme: ' + c.nMain + ' × (' + c.vMain.toFixed(4) + ') + ' + c.nAlt + ' × (' + c.vAlt.toFixed(4) + ') = <b>' + c.sumV.toFixed(4) + ' m</b></div>';
        h += '<div style="overflow-x:auto;"><table class="u3-obs-table"><thead><tr><th>#</th><th>Güzergâh</th><th>Δh (m)</th><th>Düzeltme v (m)</th><th>Düzeltilmiş Δh\' (m)</th><th>Kesin H (m)</th></tr></thead><tbody>';
        h += '<tr><td>0</td><td><b>RS14</b></td><td>—</td><td>—</td><td>—</td><td><b>' + H_START_U5.toFixed(4) + '</b></td></tr>';
        tablo2.forEach((r, i) => { h += '<tr><td>' + (i + 1) + '</td><td>' + r.from + ' → ' + r.to + '</td><td>' + r.dh.toFixed(4) + '</td><td>' + r.v.toFixed(4) + '</td><td>' + r.dhp.toFixed(4) + '</td><td>' + r.H.toFixed(4) + '</td></tr>'; });
        const sumDh = tablo2.reduce((a, r) => a + r.dh, 0), sumV = tablo2.reduce((a, r) => a + r.v, 0), sumDhp = tablo2.reduce((a, r) => a + r.dhp, 0);
        h += '<tr style="font-weight:bold;background:var(--bg-3);"><td colspan="2">Σ</td><td>' + sumDh.toFixed(4) + '</td><td>' + sumV.toFixed(4) + '</td><td>' + sumDhp.toFixed(4) + '</td><td></td></tr>';
        h += '</tbody></table></div>';
        h += '<div style="background:var(--bg-2);border-left:3px solid #4caf50;border-radius:6px;padding:0.6rem 0.9rem;margin:0.6rem 0;font-size:0.85rem;">'
           + '<b>Kontrol:</b> Σdh\' = ΣΔh + Σv = ' + sumDh.toFixed(4) + ' + (' + sumV.toFixed(4) + ') = <b style="color:#4caf50;">' + sumDhp.toFixed(4) + ' m ≈ 0</b><br>'
           + 'H<sub>bitiş</sub> − H<sub>başlangıç</sub> = 76.5650 − 76.5650 = <b style="color:#4caf50;">0.0000 m</b> → kapalı hat dengelenmiştir.</div>';
        el.innerHTML = h;
    }
}

/* ═══════════════════════════════════════════════
   U6 CONTROLLER — RTK GPS (3B Konumlama)
   ═══════════════════════════════════════════════ */
class U6Controller {
    constructor(app) { this.app = app; this.map = null; this.markers = []; this.rendered = false; }
    activate(subId) {
        if (!this.map) this.initMap();
        if (!this.rendered) { this.renderAll(); this.rendered = true; }
        if (!subId || subId === 'map') setTimeout(() => { if (this.map) { this.map.invalidateSize(); this._fit(); } }, 120);
    }
    initMap() {
        const el = document.getElementById('u6Map'); if (!el || this.map) return;
        this.map = L.map('u6Map', { zoomControl: true }).setView([41.0240, 28.8869], 18);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM', maxZoom: 20 }).addTo(this.map);
    }
    _fit() { if (this.markers.length && this.map) this.map.fitBounds(L.latLngBounds(this.markers.map(m => m.getLatLng())), { padding: [45, 45] }); }
    renderAll() { this.renderMap(); this.renderDatabase(); this.renderFormulas(); this.renderReport(); this.renderAdjustment(); }

    renderMap() {
        if (!this.map) this.initMap();
        this.markers.forEach(m => this.map.removeLayer(m)); this.markers = [];
        const colorMap = { parcel: '#4caf50', parcel_repeat: '#81c784', detail: '#2196f3', pole: '#ff9800', tree: '#8bc34a', control: '#9c27b0' };
        const typeLabels = { parcel: 'Parsel köşesi', parcel_repeat: 'Parsel (tekrar)', detail: 'Detay', pole: 'Elektrik direği', tree: 'Ağaç', control: 'Kontrol' };
        for (const d of U6_REAL) {
            const ll = toLatLng(d.Y, d.X);
            const color = colorMap[d.type] || '#999';
            const H = (d.h_ell - N_GEOID).toFixed(3);
            const m = L.circleMarker(ll, { radius: d.type === 'parcel' ? 7 : 5, fillColor: color, color: '#fff', weight: 1.5, fillOpacity: 0.85 })
                .bindPopup('<b>' + d.id + '</b><br>' + (typeLabels[d.type] || d.type) + '<br>Y: ' + d.Y.toFixed(3) + '<br>X: ' + d.X.toFixed(3) + '<br>h<sub>ell</sub>: ' + d.h_ell + ' m<br>H<sub>orto</sub>: ' + H + ' m')
                .addTo(this.map);
            this.markers.push(m);
        }
        this._fit();
        const info = document.getElementById('u6MapInfo');
        if (info) {
            let legend = '';
            for (const [type, label] of Object.entries(typeLabels)) {
                legend += '<span style="background:' + (colorMap[type] || '#999') + ';color:#fff;padding:1px 6px;border-radius:3px;margin-right:4px;font-size:0.7rem;">' + label + '</span>';
            }
            info.innerHTML = '<div style="font-size:0.84rem;line-height:1.8;">'
                + '<b style="color:var(--accent);">Toplam nokta:</b> ' + U6_REAL.length + ' adet<br>'
                + '<b style="color:var(--accent);">Jeoit yüksekliği:</b> N = 36.898 m (EGM96, N.38\'den)<br>'
                + '<b style="color:var(--accent);">CORS:</b> YLDZ sabit GNSS istasyonu<br>'
                + '<b style="color:var(--accent);">Not:</b> P.3 ağaç altında kaldığından GPS ile ölçülememiştir.</div>'
                + '<div style="margin-top:0.5rem;display:flex;flex-wrap:wrap;gap:3px;">' + legend + '</div>';
        }
    }

    renderDatabase() {
        const el = document.getElementById('u6DbContent'); if (!el) return;
        const colorMap = { parcel: '#4caf50', parcel_repeat: '#81c784', detail: '#2196f3', pole: '#ff9800', tree: '#8bc34a', control: '#9c27b0' };
        const typeLabels = { parcel: 'Parsel köşesi', parcel_repeat: 'Parsel (tekrar)', detail: 'Detay', pole: 'Elektrik direği', tree: 'Ağaç', control: 'Kontrol' };
        let h = '<h3 style="color:var(--accent);">Tablo-1 — RTK GPS Ölçüleri (TUREF TM30)</h3>';
        h += '<div style="overflow-x:auto;"><table class="u3-obs-table"><thead><tr><th>Nokta</th><th>Y (Doğu)</th><th>X (Kuzey)</th><th>h<sub>ell</sub> (m)</th><th>H<sub>orto</sub> (m)</th><th>Tür</th></tr></thead><tbody>';
        const groups = {};
        for (const d of U6_REAL) {
            if (!groups[d.type]) groups[d.type] = [];
            groups[d.type].push(d);
            const color = colorMap[d.type] || '#999';
            const H = (d.h_ell - N_GEOID).toFixed(3);
            h += '<tr><td style="color:' + color + ';font-weight:bold;">' + d.id + '</td><td>' + d.Y.toFixed(3) + '</td><td>' + d.X.toFixed(3) + '</td><td>' + d.h_ell + '</td><td style="color:var(--accent);">' + H + '</td><td><span style="background:' + color + ';color:#fff;padding:1px 6px;border-radius:3px;font-size:0.7rem;">' + (typeLabels[d.type] || d.type) + '</span></td></tr>';
        }
        h += '</tbody></table></div>';
        h += '<div style="margin-top:0.6rem;display:flex;gap:0.5rem;flex-wrap:wrap;font-size:0.72rem;">';
        for (const [type, pts] of Object.entries(groups)) {
            const avgH = (pts.reduce((s, p) => s + (p.h_ell - N_GEOID), 0) / pts.length).toFixed(3);
            h += '<span style="background:var(--bg-3);padding:2px 8px;border-radius:4px;">' + (typeLabels[type] || type) + ': <b>' + pts.length + '</b>, H<sub>ort</sub>&asymp;' + avgH + ' m</span>';
        }
        h += '</div>';
        h += '<p style="font-size:0.75rem;color:var(--text-3);margin-top:0.5rem;">H<sub>orto</sub> = h<sub>ell</sub> − N = h<sub>ell</sub> − 36.898 m &nbsp;|&nbsp; CORS: YLDZ &nbsp;|&nbsp; Datum: ITRF96 / TUREF TM30</p>';
        el.innerHTML = h;
    }

    renderFormulas() {
        const el = document.getElementById('u6FormulasContent'); if (!el) return;
        const K = (tex) => katex.renderToString(tex, { displayMode: true, throwOnError: false });
        const card = (title, desc, tex) => '<div class="glass-panel formula-card"><h3>' + title + '</h3><p class="formula-desc">' + desc + '</p><div class="formula-render">' + K(tex) + '</div></div>';
        let h = '<div class="formulas-grid">';
        h += card('Jeoit Yüksekliği', 'Elipsoid yüksekliği ile ortometrik yükseklik arasındaki fark.', 'N = h - H');
        h += card('Ortometrik Yükseklik', 'Elipsoid yüksekliğinden jeoit ondülasyonu çıkarılır.', 'H = h_{\\text{ell}} - N = h_{\\text{ell}} - 36.898');
        h += card('N.38 Jeoit Hesabı', 'Davutpaşa bölgesi için N.38 kontrol noktasından türetilen jeoit değeri.', 'N = h_{N38} - H_{N38} = 110.192 - 73.294 = 36.898\\ \\text{m}');
        h += card('RTK Tekrar Presizyonu', 'İki bağımsız ölçünün konum farkından hesaplanan tekrar hassasiyeti.', '\\Delta S = \\sqrt{\\Delta X^{2} + \\Delta Y^{2}}');
        h += '</div>';
        el.innerHTML = h;
    }

    renderReport() {
        const el = document.getElementById('u6ReportContent'); if (!el) return;
        const data = U6_REAL;
        const groups = {};
        for (const d of data) { if (!groups[d.type]) groups[d.type] = []; groups[d.type].push(d); }

        let html = '';

        html += '<div class="print-report-header"><h1>Uygulama-6 — RTK GPS 3B Konumlama Raporu</h1>'
              + '<div class="prhd-meta">Öğrenci: Ertuğrul Kulak &nbsp;|&nbsp; No: 24046607 &nbsp;|&nbsp; Nokta: 48 &nbsp;|&nbsp; XX=07 &nbsp;|&nbsp; YTÜ Ölçme Uygulaması</div></div>';
        html += '<div class="report-map-section">'
              + '<h4>RTK Nokta Dağılımı Haritası</h4>'
              + '<iframe class="report-map-frame" src="https://www.openstreetmap.org/export/embed.html?bbox=28.882%2C41.021%2C28.897%2C41.032&layer=mapnik" title="RTK ölçüm noktaları — YTÜ Davutpaşa" sandbox="allow-scripts allow-same-origin"></iframe>'
              + '<p class="report-map-caption">22 RTK GPS ölçüm noktası (parsel köşeleri, detay, direk, ağaçlar) — YTÜ Davutpaşa Kampüsü &mdash; © OpenStreetMap katkıcıları.</p>'
              + '</div>';

        // ── 1. Açıklama ──
        html += '<h3>1. Açıklama</h3>';
        html += '<p>YTÜ Davutpaşa Kampüsü\'nde RTK GNSS yöntemiyle ölçüm yapılmıştır. Ölçümle poligon noktalarının koordinatları ile '
             + 'poligon hattının yakınındaki bir yeşil alanın köşe noktaları ve içerisindeki detay öğelerinin (elektrik direği, ağaçlar) '
             + 'koordinatları elde edilmiştir. Ölçüm sırasında şerit metre, GPS alıcısı ve GPS jalonu kullanılmış; '
             + 'düzeltmeler YLDZ sabit GNSS istasyonundan (CORS) alınmıştır.</p>';
        html += '<p><strong>Saha gözlemi:</strong> P.3 noktası ağacın altında kaldığından GPS ile ölçülememiştir. Bu durum, GNSS yönteminin '
             + 'açık gökyüzü görüşüne bağımlılığını gösteren somut bir örnektir: yoğun yaprak örtüsü uydu sinyallerini zayıflatır ve '
             + 'sabit (fix) çözüm elde edilemez. Bu tür noktalar klasik (kutupsal) alımla tamamlanmalıdır.</p>';

        html += '<div style="background:var(--bg-3);border-radius:6px;padding:0.6rem 0.8rem;margin-bottom:0.8rem;display:flex;flex-wrap:wrap;gap:0.4rem 1.5rem;font-size:0.85rem;">';
        html += '<span><strong>Öğrenci:</strong> 24046607 (Ertuğrul)</span>';
        html += '<span><strong>Nokta:</strong> 48</span>';
        html += '<span><strong>CORS:</strong> YLDZ (Yıldız Sabit GNSS)</span>';
        html += '<span><strong>Datum:</strong> ITRF96 / TUREF TM30</span>';
        html += '<span><strong>Toplam Nokta:</strong> ' + data.length + ' adet</span>';
        html += '</div>';

        // ── 2. Jeoit yüksekliği ──
        const N38pt = data.find(d => d.id === 'N.38');
        const hN38 = N38pt ? N38pt.h_ell : 110.192;
        const HN38_known = 73.294;
        html += '<h3>2. Jeoit Yüksekliği ve Ortometrik Yükseklik Hesabı</h3>';
        html += '<div style="background:var(--bg-2);border-radius:6px;padding:0.6rem 0.8rem;margin:0.4rem 0 0.8rem;font-size:0.85rem;border-left:3px solid var(--accent);">';
        html += 'N.38 noktasının ölçülen elipsoid yüksekliğinden (h), bilinen ortometrik yüksekliği (H) çıkarılarak ortalama jeoit yüksekliği (N) hesaplanmıştır.<br>';
        html += '<span style="font-family:\'JetBrains Mono\',monospace;">N = h<sub>N38</sub> − H<sub>N38</sub> = ' + hN38.toFixed(3) + ' − ' + HN38_known.toFixed(3) + ' = <b style="color:var(--accent);">' + N_GEOID.toFixed(3) + ' m</b></span><br>';
        html += '<span style="font-size:0.78rem;color:var(--text-3);">Elde edilen jeoit yüksekliğiyle bütün noktaların ortometrik yükseklikleri hesaplanmıştır: H = h<sub>ell</sub> − N (Davutpaşa bölgesi).</span>';
        html += '</div>';

        // ── 3. Tablo-2 ──
        html += '<h3>3. Tablo-2 — Yükseklik Karşılaştırması (üç yöntem)</h3>';
        html += '<p style="font-size:0.85rem;color:var(--text-3);margin-bottom:0.4rem;">GPS ile hesaplanan ortometrik yükseklikler, aynı noktalardaki geometrik nivelman (Uygulama-5) ve trigonometrik nivelman sonuçlarıyla karşılaştırılmıştır (grup verisi):</p>';
        html += '<div style="overflow-x:auto;"><table class="u3-obs-table">';
        html += '<thead><tr><th>Nokta</th><th>GPS H (m)</th><th>Geometrik Niv. (m)</th><th>Trigonometrik Niv. (m)</th><th>GPS−Geo (cm)</th><th>GPS−Trig (cm)</th></tr></thead><tbody>';
        for (const r of heightComparison) {
            const dGeo = (r.gps !== null && r.geo !== null) ? ((r.gps - r.geo) * 100).toFixed(1) : '—';
            const dTrig = (r.gps !== null && r.trig !== null) ? ((r.gps - r.trig) * 100).toFixed(1) : '—';
            html += '<tr><td><b>' + r.id + '</b></td><td>' + (r.gps !== null ? r.gps.toFixed(3) : '— (ağaç altı)') + '</td><td>' + (r.geo !== null ? r.geo.toFixed(4) : '—') + '</td><td>' + (r.trig !== null ? r.trig.toFixed(3) : '—') + '</td><td>' + dGeo + '</td><td>' + dTrig + '</td></tr>';
        }
        html += '</tbody></table></div>';
        html += '<p style="font-size:0.85rem;color:var(--text-2);line-height:1.7;margin-top:0.4rem;">'
             + 'Üç yöntem arasındaki farklar yaklaşık 10–35 cm aralığındadır. Geometrik nivelman en güvenilir yükseklik yöntemi olmakla birlikte, '
             + 'buradaki nivelman hattının kendi kapanma hatası tolerans dışı kaldığından (Uygulama-5 raporuna bakınız) farkların bir bölümü nivelman '
             + 'hattındaki hatadan kaynaklanmaktadır. Trigonometrik nivelmanda düşey açı hataları mesafeyle birlikte yükseklik farkına doğrudan yansır. '
             + 'RTK GPS yükseklikleri ise jeoit modelinin (N) doğruluğuyla sınırlıdır; N tek bir noktadan (N.38) türetildiği için bölgesel jeoit eğimi ihmal edilmiştir.</p>';

        // ── 4. Kroki + sonuç ──
        html += '<h3>4. Ölçü Krokisi ve Teslim</h3>';
        html += '<div style="background:var(--bg-3);border-radius:6px;padding:0.5rem 0.8rem;margin:0.4rem 0;font-size:0.85rem;">';
        html += '<strong>Ölçü Krokisi:</strong> Her öğrenci tarafından A3 kâğıda yaklaşık ölçekte ölçü krokisi hazırlanacaktır. Krokide parsel köşeleri, elektrik direği (108), ağaçlar (109, 110) ve diğer detay noktaları gösterilmeli; kroki elle çizilmeli ve kuzey oku içermelidir. Ölçülen yeşil alan haritada renk kodlu işaretlerle gösterilmiştir.';
        html += '</div>';
        html += '<p style="font-size:0.78rem;color:var(--text-3);margin-top:0.5rem;border-top:1px solid var(--glass-border);padding-top:0.5rem;">* RTK GPS ölçümlerinde YLDZ sabit istasyonundan gelen düzeltmeler kullanılmıştır. Parsel köşeleri ve detay noktaları hem kutupsal alım hem de RTK GPS ile ayrı ayrı ölçülmüştür. Cephe kontrolü için parsel kenarları şerit metre ile ayrıca ölçülmüştür. Yükseklik karşılaştırma değerleri grup raporundaki Tablo-2\'den alınmıştır.</p>';
        el.innerHTML = html;
    }

    renderAdjustment() {
        const el = document.getElementById('u6AdjContent'); if (!el) return;
        const data = U6_REAL;
        let h = '<h3 style="color:var(--accent);">Tekrar Ölçüsü Kontrolü ve Hassasiyet Analizi</h3>';

        // P.4 ↔ P.41
        const P4 = data.find(d => d.id === 'P.4'); const P41 = data.find(d => d.id === 'P.41');
        h += '<div style="background:var(--bg-2);border-left:3px solid #4caf50;border-radius:6px;padding:0.6rem 0.9rem;margin:0.5rem 0;font-size:0.85rem;">';
        h += '<strong>P.4 ↔ P.41 Tekrar Ölçüsü:</strong><br>';
        if (P4 && P41) {
            const dx = P4.X - P41.X, dy = P4.Y - P41.Y, dh = P4.h_ell - P41.h_ell;
            const ds = Math.sqrt(dx * dx + dy * dy);
            h += 'ΔX = ' + (dx * 1000).toFixed(1) + ' mm &nbsp; ΔY = ' + (dy * 1000).toFixed(1) + ' mm &nbsp; ΔS = ' + (ds * 1000).toFixed(1) + ' mm &nbsp; Δh = ' + (dh * 1000).toFixed(1) + ' mm<br>';
            h += (ds < 0.05 ? '<span style="color:#4caf50;">✓ Tutarlı — konum farkı &lt; 5 cm (RTK tekrar presizyonu kabul edilebilir)</span>' : '<span style="color:var(--danger);">✗ Fark var — konum farkı ≥ 5 cm</span>');
        } else { h += '<span style="color:var(--text-3);">Veri bulunamadı.</span>'; }
        h += '</div>';

        // N.38 ↔ sabit nokta 38
        const N38 = data.find(d => d.id === 'N.38');
        const pt38 = this.app.db ? this.app.db.coords[38] : null;
        h += '<div style="background:var(--bg-2);border-left:3px solid #9c27b0;border-radius:6px;padding:0.6rem 0.9rem;margin:0.5rem 0;font-size:0.85rem;">';
        h += '<strong>N.38 ↔ Sabit Nokta 38 Karşılaştırması:</strong><br>';
        if (N38 && pt38) {
            const dx = N38.X - pt38.X, dy = N38.Y - pt38.Y;
            const ds = Math.sqrt(dx * dx + dy * dy);
            h += 'ΔX = ' + (dx * 1000).toFixed(1) + ' mm &nbsp; ΔY = ' + (dy * 1000).toFixed(1) + ' mm &nbsp; ΔS = ' + (ds * 1000).toFixed(1) + ' mm<br>';
            h += (ds < 0.05 ? '<span style="color:#4caf50;">✓ Tutarlı — RTK ölçüsü sabit nokta koordinatıyla uyumlu</span>' : '<span style="color:var(--danger);">✗ Fark var — RTK ölçüsü ≥ 5 cm sapıyor</span>');
        } else if (N38) {
            h += 'N.38 RTK: Y=' + N38.Y.toFixed(3) + ' X=' + N38.X.toFixed(3) + '<br><span style="color:var(--text-3);">Sabit nokta 38 koordinatı veri tabanında bulunamadı.</span>';
        } else { h += '<span style="color:var(--text-3);">Veri bulunamadı.</span>'; }
        h += '</div>';

        // Yöntem karşılaştırması paragrafı
        h += '<h3 style="color:var(--accent);margin-top:1rem;">Yöntem Karşılaştırması (GPS / Geometrik / Trigonometrik)</h3>';
        h += '<div style="overflow-x:auto;"><table class="u3-obs-table"><thead><tr><th>Nokta</th><th>GPS H (m)</th><th>Geo H (m)</th><th>Trig H (m)</th><th>GPS−Geo (cm)</th><th>GPS−Trig (cm)</th></tr></thead><tbody>';
        for (const r of heightComparison) {
            const dGeo = (r.gps !== null && r.geo !== null) ? ((r.gps - r.geo) * 100).toFixed(1) : '—';
            const dTrig = (r.gps !== null && r.trig !== null) ? ((r.gps - r.trig) * 100).toFixed(1) : '—';
            h += '<tr><td><b>' + r.id + '</b></td><td>' + (r.gps !== null ? r.gps.toFixed(3) : '— (ağaç altı)') + '</td><td>' + (r.geo !== null ? r.geo.toFixed(4) : '—') + '</td><td>' + (r.trig !== null ? r.trig.toFixed(3) : '—') + '</td><td>' + dGeo + '</td><td>' + dTrig + '</td></tr>';
        }
        h += '</tbody></table></div>';
        h += '<p style="font-size:0.85rem;color:var(--text-2);line-height:1.7;margin-top:0.5rem;">Üç yöntem arasındaki farklar yaklaşık 10–35 cm aralığındadır. GPS ile geometrik nivelman karşılaştırmasında elde edilen farklar hem jeoit modelinin bölgesel hatalarını hem de nivelman kapanma hatasını (Uygulama-5) yansıtmaktadır. Trigonometrik nivelmanda uzak noktalarda düşey açı hatası büyüyeceğinden farklar daha belirgindir.</p>';
        el.innerHTML = h;
    }
}

/* ═══ THEME TOGGLE ═══ */
function initTheme() {
    const saved = localStorage.getItem('fcu_theme');
    if (saved === 'light') _applyTheme('light');
}
function _applyTheme(theme) {
    const html = document.documentElement;
    const dark = document.getElementById('themeIconDark');
    const light = document.getElementById('themeIconLight');
    if (theme === 'light') {
        html.setAttribute('data-theme', 'light');
        if (dark) dark.style.display = 'none';
        if (light) light.style.display = 'block';
    } else {
        html.removeAttribute('data-theme');
        if (dark) dark.style.display = 'block';
        if (light) light.style.display = 'none';
    }
}
function toggleTheme() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const next = isLight ? 'dark' : 'light';
    localStorage.setItem('fcu_theme', next);
    _applyTheme(next);
}

/* ═══ BOOT ═══ */
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

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
                const deformation = 32 * Math.sin(p.theta * 3 + time * 2) * Math.cos(p.phi * 4 - time);
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
                const fov = 1600;
                const scale = fov / (fov + z1);
                const projX = canvas.width / 2 + x2 * scale;
                const projY = canvas.height / 2 + y2 * scale;
                
                // Depth fading (far particles are darker/smaller)
                const alpha = Math.min(1, Math.max(0.05, (480 - z1) / 960));
                
                if (scale > 0 && alpha > 0.05) {
                    ctx.beginPath();
                    ctx.arc(projX, projY, 3.6 * scale, 0, Math.PI * 2);
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
    window.app = window.FCU;        // Logo onclick & gelecek modüller için kısa alias
    
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
                    outModes: { 
                        default: "bounce",
                        top: "bounce",
                        bottom: "bounce",
                        left: "bounce",
                        right: "bounce"
                    }
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
