import { coordinates as DEFAULT_COORDS, measurements as DEFAULT_MEAS } from './data.js';
import { stations_u3, defaultConstants_u3, emptyObservation } from './data_u3.js';
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
import { tm30ToWGS84Approx } from './u6_engine.js';
import { levelingData as U5_REAL, rsBenchmarks } from './data_u5_real.js';
import { trigonometricDH, compareGeoVsTrig } from './u5_engine.js';
import { rtkMeasurements as U6_REAL, N_GEOID } from './data_u6_real.js';
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
        id: 'u1', label: 'Uygulama-1',
        icon: () => svgIcon([
            { attrs: { d: 'M12 2L2 7l10 5 10-5-10-5z' } },
            { attrs: { d: 'M2 17l10 5 10-5' } },
            { attrs: { d: 'M2 12l10 5 10-5' } }
        ]),
        subpages: [
            { id: 'u1Intro', label: 'İş Güvenliği', pageElementId: 'pageU1Intro' },
            { id: 'u1Sketch', label: 'İstikşaf', pageElementId: 'pageU1Sketch' }
        ],
        onSubpageActivate(subId, app) {
            if (subId === 'u1Sketch' && app.db) {
                setTimeout(() => {
                    const el = document.getElementById('u1Map');
                    if (!el || el._mapInit) return;
                    el._mapInit = true;
                    const map = L.map('u1Map', { zoomControl: true }).setView([41.0241, 28.8868], 16);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM', maxZoom: 20 }).addTo(map);
                    // Add network points
                    const chain = [];
                    const coords = app.db.coords;
                    const pointIds = [38, 40, 41, 43, 45, 49];
                    // AN14 is special
                    const an14Coord = coords[14];
                    const seenIds = new Set();
                    for (const pid of pointIds) {
                        const pt = coords[pid];
                        if (pt && !seenIds.has(pid)) {
                            seenIds.add(pid);
                            const ll = toLatLng(pt.Y, pt.X);
                            chain.push({ id: 'N' + pid, lat: ll[0], lon: ll[1], h: pt.h, isRS: (pid === 38 || pid === 49) });
                        }
                    }
                    if (an14Coord) {
                        const ll = toLatLng(an14Coord.Y, an14Coord.X);
                        chain.push({ id: 'AN14', lat: ll[0], lon: ll[1], h: an14Coord.h, isRS: false });
                    }
                    // Draw markers and polyline
                    const latlngs = [];
                    for (const c of chain) {
                        latlngs.push([c.lat, c.lon]);
                        L.circleMarker([c.lat, c.lon], {
                            radius: c.isRS ? 8 : 6,
                            fillColor: c.isRS ? '#2196f3' : '#4caf50',
                            color: '#fff', weight: 2, fillOpacity: 0.9
                        }).bindPopup('<b>' + c.id + '</b>' + (c.h ? '<br>h: ' + c.h.toFixed(3) + ' m' : '') + (c.isRS ? '<br><em>RS Sabit Nokta</em>' : '')).addTo(map);
                    }
                    if (latlngs.length) {
                        L.polyline(latlngs, { color: '#4caf50', weight: 3, dashArray: '6,6' }).addTo(map);
                        map.fitBounds(latlngs, { padding: [40, 40] });
                    }
                }, 400);
            }
        }
    },
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
            { id: 'u3', label: 'Silsile Düşey Açı', pageElementId: 'pageU3' }
        ],
        onSubpageActivate: (subId, app) => {
            if (app.u3) setTimeout(() => app.u3.activate(), 100);
        }
    },
    {
        id: 'u4', label: 'Uygulama-4',
        icon: () => svgIcon([
            { tag: 'polygon', attrs: { points: '12 2 4 8 4 16 12 22 20 16 20 8 12 2' } },
            { attrs: { d: 'M12 2v20' } }
        ]),
        subpages: [
            { id: 'u4Main', label: 'Poligon Hesabı', pageElementId: 'pageU4Stub' },
            { id: 'u4Report', label: 'Rapor', pageElementId: 'pageU4Report' }
        ]
    ,
        onSubpageActivate: (subId, app) => { if (app.u4) setTimeout(() => app.u4.activate(), 100); }},
    {
        id: 'u5', label: 'Uygulama-5',
        icon: () => svgIcon([
            { tag: 'line', attrs: { x1: '3', y1: '12', x2: '21', y2: '12' } },
            { tag: 'line', attrs: { x1: '7', y1: '6',  x2: '17', y2: '6' } },
            { tag: 'line', attrs: { x1: '5', y1: '18', x2: '19', y2: '18' } }
        ]),
        subpages: [{ id: 'u5Stub', label: 'Nivelman', pageElementId: 'pageU5Stub' }]
    ,
        onSubpageActivate: (subId, app) => { if (app.u5) setTimeout(() => app.u5.activate(), 100); }},
    {
        id: 'u6', label: 'Uygulama-6',
        icon: () => svgIcon([
            { tag: 'circle', attrs: { cx: '12', cy: '12', r: '10' } },
            { attrs: { d: 'M2 12h20M12 2a15 15 0 0 1 0 20a15 15 0 0 1 0 -20' } }
        ]),
        subpages: [{ id: 'u6Stub', label: '3B Konumlama', pageElementId: 'pageU6Stub' }]
    ,
        onSubpageActivate: (subId, app) => { if (app.u6) setTimeout(() => app.u6.activate(), 100); }},
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
        this.u3 = new U3Controller();
        this.u3.bindStaticControls();

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
    constructor() {
        this.map = null;
        this.stations = stations_u3;
        this.constants = this.loadConstants();
        this.selectedStation = null;
        this.mosques = [];                 // Overpass'tan gelen tüm camiler
        this.selectedMosqueIds = [];       // Sıralı 3 cami
        this.observation = null;
        this.activated = false;

        // Marker layer'ları
        this.stationMarkers = {};      // 46 sabit nokta için node-marker (uyg-2 stili)
        this.radiusCircle = null;
        this.mosqueMarkers = {};
        this.clusterLayer = null;
    }

    loadConstants() {
        const stored = localStorage.getItem('fcu_u3_constants');
        if (stored) {
            try { return { ...defaultConstants_u3, ...JSON.parse(stored) }; }
            catch (_) { /* fallthrough */ }
        }
        return { ...defaultConstants_u3 };
    }

    saveConstants() {
        localStorage.setItem('fcu_u3_constants', JSON.stringify(this.constants));
    }

    bindStaticControls() {
        // İstasyon picker'ını ThemedSelect ile değiştir
        const sel = document.getElementById('u3StationSelect');
        const items = Object.keys(this.stations)
            .sort((a, b) => Number(a) - Number(b))
            .map(id => {
                const s = this.stations[id];
                return {
                    value: id,
                    label: `Nokta ${id}`,
                    sublabel: `h = ${s.h.toFixed(2)} m  ·  Y = ${s.Y.toFixed(0)}  X = ${s.X.toFixed(0)}`
                };
            });
        this.stationSelect = new ThemedSelect({
            mountEl: sel,
            items,
            placeholder: '— İstasyon noktası seç —',
            filterable: true,
            onChange: (v) => this.onStationChange(v)
        });

        // Camileri yükle butonu
        document.getElementById('u3LoadMosquesBtn')
            .addEventListener('click', () => this.loadMosques());

        // Temizle butonu
        document.getElementById('u3ClearU3Btn')
            .addEventListener('click', () => this.clearAll());

        // Sabitler input'ları
        const bindConst = (id, key, parser = parseFloat) => {
            const el = document.getElementById(id);
            el.value = this.constants[key];
            el.addEventListener('change', () => {
                const v = parser(el.value);
                if (!isNaN(v)) {
                    this.constants[key] = v;
                    this.saveConstants();
                    this.recomputeIfReady();
                }
            });
        };
        bindConst('u3ConstK', 'k');
        bindConst('u3ConstR', 'R');
        bindConst('u3ConstI', 'i');
        bindConst('u3ConstT', 't_minare');

        // Yakındaki N camiyi göster slider'ı
        const slider = document.getElementById('u3NearbyN');
        const sliderLabel = document.getElementById('u3NearbyNLabel');
        if (slider && sliderLabel) {
            slider.value = this.constants.nearbyN ?? 30;
            sliderLabel.textContent = slider.value;
            slider.addEventListener('input', () => {
                sliderLabel.textContent = slider.value;
                this.constants.nearbyN = parseInt(slider.value, 10);
                this.saveConstants();
                if (this.mosques.length > 0) {
                    this.renderMosqueList();
                    this.renderMosqueMarkers();
                }
            });
        }

        // Hesapla butonu
        document.getElementById('u3CalcBtn')
            .addEventListener('click', () => this.calculate());
    }

    activate() {
        if (!this.activated) {
            this.initMap();
            this.activated = true;
        }
        if (this.map) this.map.invalidateSize();
    }

    initMap() {
        const CENTER = [41.0241, 28.8868];   // YTU Davutpaşa default
        this.map = L.map('geoMapU3', {
            center: CENTER,
            zoom: 15,
            zoomControl: true
        });

        const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        });
        const googleSat = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
            maxZoom: 20, attribution: '© Google'
        });
        const googleHybrid = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
            maxZoom: 20, attribution: '© Google'
        });
        osm.addTo(this.map);

        L.control.layers(
            { 'Sokak (OSM)': osm, 'Uydu (Google)': googleSat, 'Hibrit (Google)': googleHybrid },
            null,
            { position: 'topright' }
        ).addTo(this.map);

        // Zoom değişikliğinde marker boyutlarını yeniden hesapla
        this.map.on('zoomend', () => {
            if (this.mosques.length > 0) this.renderMosqueMarkers();
        });

        // 46 istasyon noktasını haritada göster (uyg-2 ile aynı stil)
        this.rebuildStationMarkers();
    }

    rebuildStationMarkers() {
        Object.values(this.stationMarkers).forEach(mk => this.map.removeLayer(mk));
        this.stationMarkers = {};

        const ids = Object.keys(this.stations).sort((a, b) => Number(a) - Number(b));
        const bounds = [];

        ids.forEach(id => {
            const s = this.stations[id];
            const ll = toLatLng(s.Y, s.X);
            bounds.push(ll);

            const rawHtml = '<div class="node-marker" data-id="' + escapeHTML(id) + '">' + escapeHTML(id) + '</div>';
            const safeHtml = window.DOMPurify ? DOMPurify.sanitize(rawHtml) : rawHtml;
            const icon = L.divIcon({
                className: '', html: safeHtml,
                iconSize: [28, 28], iconAnchor: [14, 14]
            });
            const marker = L.marker(ll, { icon, riseOnHover: true }).addTo(this.map);

            const tip = `<b>Nokta ${escapeHTML(id)}</b><br>Y: ${s.Y.toFixed(3)}<br>X: ${s.X.toFixed(3)}<br>h: ${s.h.toFixed(3)} m`;
            marker.bindTooltip(window.DOMPurify ? DOMPurify.sanitize(tip) : tip,
                               { direction: 'top', offset: [0, -10], opacity: 0.9 });
            marker.on('click', () => {
                if (this.stationSelect) this.stationSelect.setValue(id, true);
                else this.onStationChange(id);
            });
            this.stationMarkers[id] = marker;
        });

        // Tüm noktaları çevreleyen bound'a fit
        if (bounds.length > 0) {
            this.map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 18 });
        }
    }

    /* ——— İstasyon değişimi ——— */
    onStationChange(stationId) {
        this.clearMosques();
        if (!stationId) {
            this.selectedStation = null;
            this.updateStationInfo();
            this._setSelectedNodeMarker(null);
            this._clearRadius();
            document.getElementById('u3LoadMosquesBtn').disabled = true;
            return;
        }
        this.selectedStation = stationId;
        const s = this.stations[stationId];
        const [lat, lng] = toLatLng(s.Y, s.X);

        // Node-marker'ı 'selected' işaretle (uyg-2 ile aynı görünüm)
        this._setSelectedNodeMarker(stationId);

        // 10 km halkası
        this._clearRadius();
        this.radiusCircle = L.circle([lat, lng], {
            radius: this.constants.searchRadiusKm * 1000,
            color: '#C4956A',
            fillColor: '#C4956A',
            fillOpacity: 0.04,
            weight: 1.5,
            dashArray: '6 6'
        }).addTo(this.map);

        this.map.setView([lat, lng], 13);
        this.updateStationInfo();
        document.getElementById('u3LoadMosquesBtn').disabled = false;
    }

    _setSelectedNodeMarker(stationId) {
        Object.entries(this.stationMarkers).forEach(([id, mk]) => {
            const el = mk.getElement();
            if (!el) return;
            const inner = el.querySelector('.node-marker');
            if (!inner) return;
            inner.classList.toggle('selected', id === String(stationId));
        });
    }

    _clearRadius() {
        if (this.radiusCircle) { this.map.removeLayer(this.radiusCircle); this.radiusCircle = null; }
    }

    updateStationInfo() {
        const div = document.getElementById('u3StationInfo');
        if (!this.selectedStation) {
            div.innerHTML = '<span class="empty-hint">Bir nokta seçin...</span>';
            return;
        }
        const s = this.stations[this.selectedStation];
        const [lat, lng] = toLatLng(s.Y, s.X);
        div.innerHTML = `
            <strong style="color: var(--accent);">Nokta ${escapeHTML(this.selectedStation)}</strong><br>
            Y = ${s.Y.toFixed(3)} m<br>
            X = ${s.X.toFixed(3)} m<br>
            h = ${s.h.toFixed(3)} m<br>
            φ ≈ ${lat.toFixed(5)}°, λ ≈ ${lng.toFixed(5)}°
        `;
    }

    /* ——— Cami yükleme (Overpass) ——— */
    async loadMosques() {
        if (!this.selectedStation) return;
        const btn = document.getElementById('u3LoadMosquesBtn');
        const list = document.getElementById('u3MosquesList');
        const s = this.stations[this.selectedStation];
        const [lat, lng] = toLatLng(s.Y, s.X);

        btn.disabled = true;
        list.innerHTML = '<div style="padding: 0.6rem; color: var(--text-2);"><span class="u3-loading"></span>Overpass API\'den camiler çekiliyor...</div>';

        try {
            const radiusM = this.constants.searchRadiusKm * 1000;
            const mosques = await fetchMosques(lat, lng, radiusM);
            this.mosques = mosques;
            this.renderMosqueList();
            this.renderMosqueMarkers();
        } catch (err) {
            list.innerHTML = `<div style="padding: 0.6rem; color: var(--danger);">⚠ Hata: ${escapeHTML(err.message)}</div>`;
        } finally {
            btn.disabled = false;
        }
    }

    renderMosqueList() {
        const list = document.getElementById('u3MosquesList');
        if (this.mosques.length === 0) {
            list.innerHTML = '<span class="empty-hint">10 km halka içinde cami bulunamadı.</span>';
            return;
        }
        list.innerHTML = '';
        const N = this.constants.nearbyN ?? 30;
        const visible = this.mosques.slice(0, N);
        if (this.mosques.length > N) {
            const note = document.createElement('div');
            note.style.cssText = 'padding: 0.4rem 0.6rem; font-size: 0.72rem; color: var(--text-3); font-family: \'JetBrains Mono\', monospace;';
            note.textContent = `${this.mosques.length} cami bulundu, en yakın ${N} tanesi gösteriliyor (slider).`;
            list.appendChild(note);
        }
        visible.forEach(m => {
            const orderIdx = this.selectedMosqueIds.indexOf(m.id);
            const item = document.createElement('div');
            item.className = 'u3-mosque-item' + (orderIdx >= 0 ? ' selected' : '');
            const badge = orderIdx >= 0 ? `<span class="badge">${orderIdx + 1}</span>` : '';
            const heightStr = m.height != null ? ` · h=${m.height}m` : '';
            const minaretFlag = m.isMinaret ? ' 🗼' : '';
            item.innerHTML = `
                <div>${badge}<strong>${escapeHTML(m.name)}</strong>${minaretFlag}</div>
                <div class="mosque-meta">${(m.distance / 1000).toFixed(2)} km${heightStr}</div>
            `;
            item.addEventListener('click', () => this.toggleMosque(m.id));
            list.appendChild(item);
        });
    }

    renderMosqueMarkers() {
        // Mevcut marker'ları/cluster'ı temizle
        Object.values(this.mosqueMarkers).forEach(mk => this.map.removeLayer(mk));
        this.mosqueMarkers = {};
        if (this.clusterLayer) { this.map.removeLayer(this.clusterLayer); this.clusterLayer = null; }

        const N = this.constants.nearbyN ?? 30;
        const visible = this.mosques.slice(0, N);
        const zoom = this.map.getZoom();

        // Cluster yalnızca seçilmemişler için (seçili olanlar üstte garanti görünür)
        this.clusterLayer = (typeof L.markerClusterGroup === 'function')
            ? L.markerClusterGroup({
                maxClusterRadius: 50,
                disableClusteringAtZoom: 14,
                showCoverageOnHover: false,
                spiderfyOnMaxZoom: false,
                iconCreateFunction: (cluster) => {
                    const count = cluster.getChildCount();
                    return L.divIcon({
                        html: `<div class="u3-cluster-badge">${count}</div>`,
                        className: '', iconSize: [32, 32], iconAnchor: [16, 16]
                    });
                }
            })
            : null;

        visible.forEach(m => {
            const orderIdx = this.selectedMosqueIds.indexOf(m.id);
            const selected = orderIdx >= 0;
            let size, cls, label;
            if (selected) {
                size = 28; cls = 'u3-mosque-marker numbered'; label = String(orderIdx + 1);
            } else if (zoom >= 17) {
                size = 12; cls = 'u3-mosque-dot medium';      label = '';
            } else {
                size = 7;  cls = 'u3-mosque-dot';             label = '';
            }
            const html = `<div class="${cls}">${label}</div>`;
            const marker = L.marker([m.lat, m.lng], {
                icon: L.divIcon({ className: '', html, iconSize: [size, size], iconAnchor: [size/2, size/2] }),
                riseOnHover: true
            });
            marker.bindTooltip(
                `<b>${escapeHTML(m.name)}</b><br>${(m.distance / 1000).toFixed(2)} km${m.height != null ? '<br>h=' + m.height + ' m' : ''}`,
                { direction: 'top', offset: [0, -10], opacity: 0.9 }
            );
            marker.on('click', () => this.toggleMosque(m.id));

            // Seçili → direkt haritaya, asla cluster'a girmesin
            if (selected || !this.clusterLayer) {
                marker.addTo(this.map);
            } else {
                this.clusterLayer.addLayer(marker);
            }
            this.mosqueMarkers[m.id] = marker;
        });

        if (this.clusterLayer) this.map.addLayer(this.clusterLayer);
    }

    toggleMosque(mosqueId) {
        const idx = this.selectedMosqueIds.indexOf(mosqueId);
        if (idx >= 0) {
            this.selectedMosqueIds.splice(idx, 1);
        } else if (this.selectedMosqueIds.length < 3) {
            this.selectedMosqueIds.push(mosqueId);
        } else {
            return;
        }
        this.updateSelectedMosquesUI();
        this.renderMosqueList();
        this.renderMosqueMarkers();
        this.renderObsTable();
    }

    updateSelectedMosquesUI() {
        const div = document.getElementById('u3SelectedMosques');
        if (this.selectedMosqueIds.length === 0) {
            div.innerHTML = '<span class="empty-hint">Sırayla 3 cami seçin (soldan-sağa)...</span>';
        } else {
            div.innerHTML = this.selectedMosqueIds.map((id, i) => {
                const m = this.mosques.find(x => x.id === id);
                return `<span class="chip">${i + 1}. ${escapeHTML(m ? m.name : id)}</span>`;
            }).join('');
        }
    }

    /* ——— Ölçü tablosu ——— */
    renderObsTable() {
        const div = document.getElementById('u3ObsTable');
        const calcBtn = document.getElementById('u3CalcBtn');
        if (this.selectedMosqueIds.length !== 3) {
            div.innerHTML = '<span class="empty-hint">Önce 3 cami seçin...</span>';
            calcBtn.disabled = true;
            return;
        }

        // Eski observation varsa koru, yoksa yeni oluştur
        if (!this.observation || this.observation.targets.length !== 3
            || this.observation.targets.some((t, i) => t.mosqueId !== this.selectedMosqueIds[i])) {
            this.observation = emptyObservation(this.selectedStation, this.selectedMosqueIds);
        }

        let html = `<table class="u3-obs-table">
            <thead>
                <tr>
                    <th>#</th><th>Hedef Cami</th>
                    <th>Yüz I  Z<sub>I</sub> (gon)</th>
                    <th>Yüz II  Z<sub>II</sub> (gon)</th>
                    <th>Z<sub>I</sub> + Z<sub>II</sub> − 400</th>
                </tr>
            </thead><tbody>`;

        this.observation.targets.forEach((t, i) => {
            const m = this.mosques.find(x => x.id === t.mosqueId);
            const name = m ? m.name : t.mosqueId;
            const z1 = t.Z_I != null ? t.Z_I : '';
            const z2 = t.Z_II != null ? t.Z_II : '';
            const diff = (t.Z_I != null && t.Z_II != null) ? (t.Z_I + t.Z_II - 400).toFixed(4) : '—';
            html += `<tr>
                <td>${i + 1}</td>
                <td class="target-cell">${escapeHTML(name)}</td>
                <td><input type="number" step="0.0001" data-row="${i}" data-col="Z_I"  value="${z1}" placeholder="0.0000"></td>
                <td><input type="number" step="0.0001" data-row="${i}" data-col="Z_II" value="${z2}" placeholder="0.0000"></td>
                <td id="u3DiffCell_${i}" style="font-family: 'JetBrains Mono', monospace;">${diff}</td>
            </tr>`;
        });
        html += '</tbody></table>';
        div.innerHTML = html;

        // Input bind
        div.querySelectorAll('input[type="number"]').forEach(inp => {
            inp.addEventListener('input', () => this.onObsInput(inp));
        });
        this.updateCalcBtn();
    }

    onObsInput(inp) {
        const row = Number(inp.dataset.row);
        const col = inp.dataset.col;
        const v = inp.value === '' ? null : parseFloat(inp.value);
        this.observation.targets[row][col] = (v != null && !isNaN(v)) ? v : null;

        // Diff cell + collimation visual
        const t = this.observation.targets[row];
        const diffCell = document.getElementById(`u3DiffCell_${row}`);
        if (t.Z_I != null && t.Z_II != null) {
            const d = t.Z_I + t.Z_II - 400;
            diffCell.textContent = d.toFixed(4);
            // Tolerans: |d| < 0.01 gon (≈ 32" — laboratuvar T2 için)
            const tolOk = Math.abs(d) < 0.01;
            const inputs = inp.parentElement.parentElement.querySelectorAll('input[type="number"]');
            inputs.forEach(x => {
                x.classList.remove('collimation-ok', 'collimation-warn');
                x.classList.add(tolOk ? 'collimation-ok' : 'collimation-warn');
            });
            diffCell.style.color = tolOk ? 'var(--success)' : 'var(--danger)';
        } else {
            diffCell.textContent = '—';
            diffCell.style.color = 'var(--text-3)';
        }

        this.updateCalcBtn();
    }

    updateCalcBtn() {
        const allFilled = this.observation && this.observation.targets.every(t => t.Z_I != null && t.Z_II != null);
        document.getElementById('u3CalcBtn').disabled = !allFilled;
    }

    recomputeIfReady() {
        if (this.observation && this.observation.targets.every(t => t.Z_I != null && t.Z_II != null)) {
            this.calculate();
        }
        // Halka yarıçapı değişti mi kontrol et
        if (this.radiusCircle && this.selectedStation) {
            const s = this.stations[this.selectedStation];
            const [lat, lng] = toLatLng(s.Y, s.X);
            this.radiusCircle.setLatLng([lat, lng]);
            this.radiusCircle.setRadius(this.constants.searchRadiusKm * 1000);
        }
    }

    /* ——— Hesap ——— */
    calculate() {
        if (!this.observation || !this.selectedStation) return;
        const result = reduceSilsile(this.observation);
        if (result.n === 0) {
            document.getElementById('u3Results').innerHTML =
                '<span class="empty-hint">Geçerli ölçü bulunamadı.</span>';
            return;
        }

        const station = this.stations[this.selectedStation];
        const html = this.renderResults(result, station);
        document.getElementById('u3Results').innerHTML = html;

        // KaTeX renderı
        if (window.renderMathInElement) {
            renderMathInElement(document.getElementById('u3Results'), {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false }
                ],
                throwOnError: false
            });
        }
    }

    renderResults(result, station) {
        // Per-target jeodezik kıyas
        const comparisons = result.reduced.map(r => {
            if (!r) return null;
            const m = this.mosques.find(x => x.id === r.mosqueId);
            if (!m) return { mosqueId: r.mosqueId, error: 'Cami bulunamadı.' };

            // Cami'nin TUREF Y/X karşılığı
            const [Y_m, X_m] = proj4('EPSG:4326', 'TUREF_TM30', [m.lng, m.lat]);
            // Cami zemin yüksekliği bilinmiyor → ölçümden geri-çöz, ya da NULL bırak
            const mosqueGroundH = null;   // OSM'de yok; sadece ölçüm tarafı hesaplanır
            const cmp = compareTarget(
                station.Y, station.X, station.h,
                Y_m, X_m, mosqueGroundH,
                r.Z_mean, this.constants
            );
            return {
                mosqueId: r.mosqueId,
                name: m.name,
                Z_I: r.Z_I, Z_II: r.Z_II, Z_mean: r.Z_mean, alpha: r.alpha, c: r.c,
                D: cmp.D, az: cmp.az,
                dh_geom: cmp.dh_geom, dh_corr: cmp.dh_corr,
                H_top_measured: cmp.H_top_measured,
                osmHeight: m.height
            };
        }).filter(Boolean);

        // Özet kartlar
        let html = `
            <div class="u3-result-grid">
                <div class="u3-result-card">
                    <div class="label">Geçerli Hedef Sayısı</div>
                    <div class="value">${result.n} / 3</div>
                </div>
                <div class="u3-result-card">
                    <div class="label">Bir Doğrultu Std</div>
                    <div class="value">${fmtGon(result.s_direction, 4)}</div>
                    <div class="sub">Bessel: σ = √(Σd² / 2n)</div>
                </div>
                <div class="u3-result-card">
                    <div class="label">Kesin Doğrultu Std</div>
                    <div class="value">${fmtGon(result.s_mean, 4)}</div>
                    <div class="sub">σ̄ = σ / √2</div>
                </div>
                <div class="u3-result-card">
                    <div class="label">Kollimasyon Yayılımı</div>
                    <div class="value">${fmtGon(result.s_collimation, 4)}</div>
                    <div class="sub">3 hedef arası c tutarlılığı</div>
                </div>
            </div>
        `;

        // Ana hesap tablosu
        html += `<h3 style="margin: 1rem 0 0.6rem 0; color: var(--accent); font-family: 'JetBrains Mono', monospace; font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.05em;">① Silsile İndirgemesi</h3>`;
        html += `<table class="u3-obs-table">
            <thead>
                <tr>
                    <th>Cami</th>
                    <th>Z<sub>I</sub></th>
                    <th>Z<sub>II</sub></th>
                    <th>Z̄ (kesin)</th>
                    <th>α (yükseklik)</th>
                    <th>α (DMS)</th>
                    <th>c (kollimasyon)</th>
                </tr>
            </thead><tbody>`;
        comparisons.forEach(c => {
            html += `<tr>
                <td class="target-cell">${escapeHTML(c.name)}</td>
                <td>${fmtGon(c.Z_I)}</td>
                <td>${fmtGon(c.Z_II)}</td>
                <td>${fmtGon(c.Z_mean)}</td>
                <td>${fmtGon(c.alpha)}</td>
                <td>${gonToDms(c.alpha)}</td>
                <td style="color: ${Math.abs(c.c) < 0.005 ? 'var(--success)' : 'var(--danger)'}">${fmtGon(c.c, 5)}</td>
            </tr>`;
        });
        html += '</tbody></table>';

        // Geodezik kıyas tablosu
        html += `<h3 style="margin: 1.5rem 0 0.6rem 0; color: var(--accent); font-family: 'JetBrains Mono', monospace; font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.05em;">② Geodezik Kıyas (TUREF/TM30)</h3>`;
        html += `<table class="u3-obs-table">
            <thead>
                <tr>
                    <th>Cami</th>
                    <th>D (m)</th>
                    <th>Azimut</th>
                    <th>Δh<sub>geom</sub> = D·cot(Z̄)</th>
                    <th>Δh<sub>düz</sub> = (1−k)D²/(2R)</th>
                    <th>H<sub>tepe</sub> (ölçü)</th>
                    <th>OSM h</th>
                </tr>
            </thead><tbody>`;
        comparisons.forEach(c => {
            html += `<tr>
                <td class="target-cell">${escapeHTML(c.name)}</td>
                <td>${fmtMeter(c.D, 2)}</td>
                <td>${fmtGon(c.az, 4)}</td>
                <td>${fmtMeter(c.dh_geom, 3)}</td>
                <td style="color: var(--accent);">${fmtMeter(c.dh_corr, 3)}</td>
                <td><strong>${fmtMeter(c.H_top_measured, 2)}</strong></td>
                <td>${c.osmHeight != null ? c.osmHeight.toFixed(1) + ' m' : '—'}</td>
            </tr>`;
        });
        html += '</tbody></table>';

        // Formüller (KaTeX)
        html += `
            <h3 style="margin: 1.5rem 0 0.6rem 0; color: var(--accent); font-family: 'JetBrains Mono', monospace; font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.05em;">③ Kullanılan Formüller</h3>
            <div style="background: rgba(0,0,0,0.25); padding: 1rem 1.2rem; border-radius: var(--radius-sm); border-left: 3px solid var(--accent); font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; color: var(--text-2); line-height: 1.8;">
                $$ \\bar{Z} = \\tfrac{1}{2}\\bigl( Z_{I} + (400^{g} - Z_{II}) \\bigr),\\quad c = \\tfrac{1}{2}(Z_{I}+Z_{II}-400^{g}) $$
                $$ \\sigma = \\sqrt{\\dfrac{\\sum d^{2}}{2n}},\\quad \\bar\\sigma = \\dfrac{\\sigma}{\\sqrt{2}},\\quad d = Z_{I}+Z_{II}-400^{g} $$
                $$ \\Delta h = D \\cot(\\bar Z) + (1-k)\\dfrac{D^{2}}{2R} + (i-t) $$
                <div style="font-size: 0.78rem; color: var(--text-3); margin-top: 0.6rem;">k = ${this.constants.k}, R = ${this.constants.R} m, i = ${this.constants.i} m, t = ${this.constants.t_minare} m</div>
            </div>
        `;

        return html;
    }

    /* ——— Temizleme ——— */
    clearAll() {
        this.clearMosques();
        if (this.stationSelect) this.stationSelect.setValue(null);
        this.selectedStation = null;
        this._setSelectedNodeMarker(null);
        this._clearRadius();
        this.updateStationInfo();
        document.getElementById('u3LoadMosquesBtn').disabled = true;
        document.getElementById('u3Results').innerHTML =
            '<span class="empty-hint">Ölçüleri girip "Hesapla" butonuna basın...</span>';
    }

    clearMosques() {
        this.selectedMosqueIds = [];
        this.observation = null;
        this.mosques = [];
        Object.values(this.mosqueMarkers).forEach(mk => this.map && this.map.removeLayer(mk));
        this.mosqueMarkers = {};
        document.getElementById('u3MosquesList').innerHTML =
            '<span class="empty-hint">Önce istasyon seçin, sonra "Camileri Yükle" butonuna basın.</span>';
        this.updateSelectedMosquesUI();
        this.renderObsTable();
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
    constructor(app) { this.app = app; this.map = null; this.synthData = null; this.markers = []; this.lineLayer = null; this.loaded = false; }
    activate() {
        const self = this;
        if (!this.map) this.initMap();
        setTimeout(() => { if (this.map) this.map.invalidateSize(); if (!self.loaded) self.loadAndCalc(); self.loaded = true; }, 300);
        const el = document.getElementById('u4LoadBtn'); if (el) el.onclick = () => self.loadAndCalc();
        document.getElementById('u4StudentId')?.addEventListener('input', function() {
            document.getElementById('u4XX').value = parseInt(this.value) % 100;
        });
    }
    initMap() {
        const el = document.getElementById('u4Map'); if (!el || this.map) return;
        this.map = L.map('u4Map', { zoomControl: true }).setView([41.0241, 28.8866], 17);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM', maxZoom: 20 }).addTo(this.map);
    }
    loadAndCalc() {
        const sid = parseInt(document.getElementById('u4StudentId')?.value || '24046607');
        const pathStr = document.getElementById('u4TraversePath')?.value || '43,44,46,47,45';
        const path = pathStr.split(',').map(Number);
        const coords = this.app.db.coords;
        const { XX } = studentModifiers(sid);
        this.synthData = synthU4(coords, path, sid);
        this.markers.forEach(m => this.map.removeLayer(m)); this.markers = [];
        if (this.lineLayer) this.map.removeLayer(this.lineLayer);
        const latlngs = [];
        for (const pid of path) {
            const pt = coords[pid]; if (!pt) continue;
            const ll = toLatLng(pt.Y, pt.X);
            latlngs.push(ll);
            const isEP = (pid === path[0] || pid === path[path.length-1]);
            const m = L.circleMarker(ll, { radius: isEP ? 8 : 6, fillColor: isEP ? '#2196f3' : '#ff9800', color: '#fff', weight: 2, fillOpacity: 0.9 })
                .bindPopup('<b>Nokta ' + pid + '</b><br>Y: ' + pt.Y.toFixed(3) + '<br>X: ' + pt.X.toFixed(3) + '<br>h: ' + pt.h.toFixed(3) + (isEP ? '<br><em>Sabit</em>' : '')).addTo(this.map);
            this.markers.push(m);
        }
        this.lineLayer = L.polyline(latlngs, { color: '#ff9800', weight: 3, dashArray: '8,6' }).addTo(this.map);
        if (latlngs.length) this.map.fitBounds(latlngs, { padding: [40, 40] });
        this.renderResults(path, coords, XX);
        this.renderReport(path, coords, XX);
    }
    renderResults(path, coords, XX) {
        const edges = this.synthData.edges;
        let html = '<div class="panel-title-bar" style="margin-bottom:0.5rem;"><strong>Kenar Indirgeme Tablosu</strong> (K_atm=1.00' + XX + ')</div>';
        html += '<table class="u3-obs-table"><thead><tr><th>Kenar</th><th>S<sub>egik</sub></th><th>Z (gon)</th><th>S<sub>yatay</sub></th><th>H<sub>ort</sub></th><th>S<sub>proj</sub></th></tr></thead><tbody>';
        for (const e of edges) {
            const hF = coords[e.from]?.h || 0, hT = coords[e.to]?.h || 0;
            const hM = ((hF + hT) / 2).toFixed(2);
            const sH = e.slopeDist * Math.sin(e.zenithAngle * Math.PI / 200);
            const sP = sH * 6371000 / (6371000 + parseFloat(hM));
            html += '<tr><td>' + e.from + '&rarr;' + e.to + '</td><td>' + e.slopeDist.toFixed(4) + '</td><td>' + e.zenithAngle.toFixed(4) + '</td><td>' + sH.toFixed(4) + '</td><td>' + hM + '</td><td style="color:var(--accent)">' + sP.toFixed(4) + '</td></tr>';
        }
        html += '</tbody></table>';
        document.getElementById('u4EdgeTable').innerHTML = html;
        try {
            const result = computeU4(coords, path, edges, this.synthData.stations, XX);
            const { closure, adjusted } = result;
            let rh = '<div class="panel-title-bar" style="margin-top:1rem;margin-bottom:0.5rem;"><strong>Poligon Dengeleme (Bowditch)</strong></div>';
            rh += '<div style="display:flex;gap:1.5rem;flex-wrap:wrap;margin-bottom:0.5rem;font-size:0.85rem;background:var(--bg-3);padding:0.6rem;border-radius:8px;">';
            rh += '<span>f<sub>x</sub>: <b style="color:' + (Math.abs(closure.fx)>0.05?'var(--danger)':'var(--accent)') + '">' + closure.fx.toFixed(4) + '</b> m</span>';
            rh += '<span>f<sub>y</sub>: <b style="color:' + (Math.abs(closure.fy)>0.05?'var(--danger)':'var(--accent)') + '">' + closure.fy.toFixed(4) + '</b> m</span>';
            rh += '<span>f<sub>s</sub>: <b style="color:' + (Math.abs(closure.fs)>0.05?'var(--danger)':'var(--accent)') + '">' + closure.fs.toFixed(4) + '</b> m</span>';
            rh += '<span>Bagil hata: <b>1/' + Math.round(1/closure.relErr) + '</b></span></div>';
            rh += '<table class="u3-obs-table"><thead><tr><th>Nokta</th><th>Y<sub>hesap</sub></th><th>X<sub>hesap</sub></th><th>Y<sub>gercek</sub></th><th>X<sub>gercek</sub></th><th>dY (mm)</th><th>dX (mm)</th></tr></thead><tbody>';
            const comp = compareCoords4(coords, adjusted, path);
            for (const r of comp) rh += '<tr><td>' + r.point + '</td><td>' + r.Y_comp + '</td><td>' + r.X_comp + '</td><td>' + r.Y_true + '</td><td>' + r.X_true + '</td><td style="color:' + (Math.abs(r.dY)>0.05?'var(--danger)':'inherit') + '">' + (r.dY*1000).toFixed(1) + '</td><td style="color:' + (Math.abs(r.dX)>0.05?'var(--danger)':'inherit') + '">' + (r.dX*1000).toFixed(1) + '</td></tr>';
            rh += '</tbody></table>';
            document.getElementById('u4Results').innerHTML = rh;
        } catch (e) { document.getElementById('u4Results').innerHTML = '<p style="color:var(--danger)">Hata: ' + e.message + '</p>'; }
    }
    renderReport(path, coords, XX) {
        const el = document.getElementById('u4ReportContent'); if (!el) return;
        const edges = this.synthData.edges;
        let totalDist = edges.reduce((s, e) => s + e.horizontalDist, 0);
        let nStations = this.synthData.stations.length;
        let html = '<div class="result-section">';
        html += '<h3 style="color:var(--accent);margin-bottom:0.5rem;">Uygulama-4 Raporu: Dayali Poligon Hesabi</h3>';
        html += '<p><strong>Ogrenci:</strong> 24046607 (Ertugrul) &mdash; <strong>Nokta:</strong> 48 | <strong>XX:</strong> ' + XX + '</p>';
        html += '<p><strong>Poligon Guzergahi:</strong> ' + path.join(' &rarr; ') + '</p>';
        html += '<p><strong>Istasyon Sayisi:</strong> ' + nStations + ' | <strong>Toplam Mesafe:</strong> ' + totalDist.toFixed(2) + ' m</p>';
        html += '<p><strong>Atmosferik Duzeltme:</strong> K<sub>atm</sub> = 1.00' + XX + ' (1. Hiz duzeltmesi)</p>';
        html += '<p><strong>Projeksiyon Indirgemesi:</strong> S<sub>proj</sub> = S<sub>yatay</sub> &times; R/(R+H<sub>ort</sub>) | R=6371 km</p>';
        try {
            const result = computeU4(coords, path, edges, this.synthData.stations, XX);
            const c = result.closure;
            html += '<p><strong>Kapanma Hatalari:</strong> f<sub>x</sub>=' + c.fx.toFixed(4) + ' m, f<sub>y</sub>=' + c.fy.toFixed(4) + ' m, f<sub>s</sub>=' + c.fs.toFixed(4) + ' m</p>';
            html += '<p><strong>Bagil Hata:</strong> 1/' + Math.round(1/c.relErr) + ' &mdash; ';
            html += (c.relErr < 0.001 ? '<span style="color:#4caf50;">Hassas olcum (1. derece poligon)</span>' : c.relErr < 0.005 ? '<span style="color:#ff9800;">Orta hassasiyet (2. derece poligon)</span>' : '<span style="color:var(--danger);">Dusuk hassasiyet, olcu tekrari onerilir</span>');
            html += '</p>';
            const comp = compareCoords4(coords, result.adjusted, path);
            const maxDY = Math.max(...comp.map(r => Math.abs(r.dY)));
            const maxDX = Math.max(...comp.map(r => Math.abs(r.dX)));
            html += '<p><strong>Maksimum Koordinat Sapmasi:</strong> dY<sub>max</sub>=' + (maxDY*1000).toFixed(1) + ' mm, dX<sub>max</sub>=' + (maxDX*1000).toFixed(1) + ' mm</p>';
        } catch(e) { html += '<p style="color:var(--danger);">Dengeleme hesaplanamadi.</p>'; }
        html += '<p style="font-size:0.8rem;color:var(--text-3);margin-top:0.5rem;">* Bowditch (pusula kurali) yontemiyle dengeleme yapilmistir. Kapanma hatalari kenar uzunluklariyla orantili olarak dagitilmistir.</p>';
        html += '</div>';
        el.innerHTML = html;
    }
}

/* ═══════════════════════════════════════════════
   U5 CONTROLLER — Nivelman (Leveling)
   ═══════════════════════════════════════════════ */
class U5Controller {
    constructor(app) { this.app = app; this.map = null; this.markers = []; this.lineLayer = null; this.loaded = false; }
    activate() {
        const self = this;
        if (!this.map) this.initMap();
        setTimeout(() => { if (this.map) this.map.invalidateSize(); if (!self.loaded) self.loadReal(); self.loaded = true; }, 300);
        const el = document.getElementById('u5LoadBtn'); if (el) el.onclick = () => self.loadReal();
        const trigBtn = document.getElementById('u5TrigBtn');
        if (trigBtn) trigBtn.onclick = () => {
            try {
                const trigStr = document.getElementById('u5ManualTrig')?.value || '[]';
                const trigData = JSON.parse(trigStr);
                let html = '<div class="panel-title-bar"><strong>Trigonometrik Nivelman</strong></div>';
                html += '<table class="u3-obs-table"><thead><tr><th>Kenar</th><th>S</th><th>Z</th><th>&Delta;h</th></tr></thead><tbody>';
                let sumDh = 0; const k = 0.13, R = 6371000;
                for (const t of trigData) {
                    const Zrad = t.zenithGon * Math.PI / 200;
                    const sH = t.slopeDist * Math.sin(Zrad);
                    const dh = t.slopeDist * Math.cos(Zrad) + (t.i||1.55) - (t.t||1.60) + ((1-k)/(2*R))*sH*sH;
                    sumDh += dh;
                    html += '<tr><td>'+(t.from||'?')+'&rarr;'+(t.to||'?')+'</td><td>'+t.slopeDist.toFixed(3)+'</td><td>'+t.zenithGon.toFixed(4)+'</td><td style="color:var(--accent)">'+dh.toFixed(4)+'</td></tr>';
                }
                html += '<tr style="font-weight:bold;border-top:2px solid var(--border)"><td colspan="3">Toplam</td><td style="color:var(--accent)">'+sumDh.toFixed(4)+'</td></tr></tbody></table>';
                document.getElementById('u5TrigTable').innerHTML = html;
            } catch(e) { document.getElementById('u5TrigTable').innerHTML = '<p style="color:var(--danger)">JSON hata: '+e.message+'</p>'; }
        };

    }
    initMap() {
        const el = document.getElementById('u5Map'); if (!el || this.map) return;
        this.map = L.map('u5Map', { zoomControl: true }).setView([41.0241, 28.8868], 17);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM', maxZoom: 20 }).addTo(this.map);
    }
    loadReal() {
        const self = this; const data = U5_REAL; const coords = this.app.db.coords; const XX = 7;
        self.markers.forEach(m => self.map.removeLayer(m)); self.markers = [];
        if (self.lineLayer) self.map.removeLayer(self.lineLayer);
        const chain = []; const seen = new Set();
        for (const leg of data) {
            for (const pid of [leg.from, leg.to]) {
                if (seen.has(pid)) continue; seen.add(pid);
                const numId = parseInt(pid.replace(/[^0-9]/g, ''));
                const pt = coords[numId];
                if (pt) { const ll = toLatLng(pt.Y, pt.X); chain.push({ id: pid, numId, ...pt, lat: ll[0], lon: ll[1] }); }
            }
        }
        const latlngs = chain.map(c => [c.lat, c.lon]);
        for (const c of chain) {
            const isRS = (c.id === 'N38' || c.id === 'N49');
            const marker = L.circleMarker([c.lat, c.lon], { radius: isRS ? 8 : 6, fillColor: isRS ? '#2196f3' : '#4caf50', color: '#fff', weight: 2, fillOpacity: 0.9 })
                .bindPopup('<b>' + c.id + '</b><br>h: ' + c.h.toFixed(3) + ' m' + (isRS ? '<br><em>RS Sabit Nokta</em>' : '')).addTo(self.map);
            self.markers.push(marker);
        }
        self.lineLayer = L.polyline(latlngs, { color: '#4caf50', weight: 3 }).addTo(self.map);
        if (latlngs.length) self.map.fitBounds(latlngs, { padding: [40, 40] });
        self.renderGeoTable(data, XX);
        self.renderReport(data, XX, chain);
    }
    renderGeoTable(data, XX) {
        const rsMod = 1 + XX / 1000;
        const hRS_N38 = (rsBenchmarks["N38"]?.h_base || 0) + rsMod;
        const hRS_N49_known = (rsBenchmarks["N49"]?.h_base || 0) + rsMod;
        let runningH = hRS_N38; let sumDh = 0;
        for (const leg of data) { sumDh += (leg.BS - leg.FS); }
        const closure = hRS_N38 + sumDh - hRS_N49_known;
        let html = '<div class="panel-title-bar" style="margin-bottom:0.5rem;"><strong>Geometrik Nivelman Cizelgesi</strong> &mdash; XX=' + XX + ', RS duzeltmesi: +' + rsMod.toFixed(3) + ' m</div>';
        html += '<table class="u3-obs-table"><thead><tr><th>Nokta</th><th>BS (m)</th><th>FS (m)</th><th>&Delta;h (m)</th><th>H<sub>i</sub> (m)</th></tr></thead><tbody>';
        html += '<tr><td style="color:#2196f3;font-weight:bold;">N38 ★ RS</td><td>&mdash;</td><td>&mdash;</td><td>&mdash;</td><td style="color:#2196f3;font-weight:bold;">' + hRS_N38.toFixed(4) + '</td></tr>';
        runningH = hRS_N38;
        for (const l of data) {
            const dh = l.BS - l.FS; runningH += dh;
            html += '<tr><td>' + l.from + '&rarr;' + l.to + '</td><td>' + l.BS.toFixed(4) + '</td><td>' + l.FS.toFixed(4) + '</td><td style="color:var(--accent);">' + dh.toFixed(4) + '</td><td>' + runningH.toFixed(4) + '</td></tr>';
        }
        html += '<tr style="font-weight:bold;border-top:2px solid var(--border);background:var(--bg-3);"><td colspan="3">Toplam &Delta;h</td><td style="color:var(--accent);">' + sumDh.toFixed(4) + '</td><td></td></tr>';
        html += '<tr style="background:var(--bg-3);"><td colspan="3" style="color:#2196f3;">N49 ★ RS (bilinen)</td><td style="color:' + (Math.abs(closure)>0.01?'var(--danger)':'var(--accent)') + ';">&Delta;=' + closure.toFixed(4) + ' m</td><td style="color:#2196f3;font-weight:bold;">' + hRS_N49_known.toFixed(4) + '</td></tr>';
        html += '</tbody></table>';
        const totalDist = data.reduce((s, l) => s + l.bsDist + l.fsDist, 0);
        const tolerance = 0.006 * Math.sqrt(totalDist / 1000) + 0.02;
        html += '<div style="margin-top:0.4rem;font-size:0.78rem;padding:0.4rem 0.6rem;background:var(--bg-3);border-radius:6px;">';
        html += '&Sigma; mesafe: <b>' + totalDist.toFixed(0) + '</b> m | Tolerans: <b>&plusmn;' + (tolerance*1000).toFixed(1) + '</b> mm | Kapanma: <b style="color:' + (Math.abs(closure)<tolerance?'#4caf50':'var(--danger)') + ';">' + (closure*1000).toFixed(1) + ' mm</b> ';
        html += (Math.abs(closure) < tolerance ? '<span style="color:#4caf50;">&check; KABUL</span>' : '<span style="color:var(--danger);">&cross; RED</span>') + '</div>';
        document.getElementById('u5GeoTable').innerHTML = html;
        // --- Auto-compute trigonometric leveling from geometric data ---
        this.renderTrigTable(data, XX);
        this.renderGeoVsTrigCompare(data, XX);
    }
    renderTrigTable(data, XX) {
        const el = document.getElementById('u5TrigTable'); if (!el) return;
        const i = 1.55, t = 1.60, k = 0.13, R = 6371000, GON_TO_RAD = Math.PI / 200;
        let html = '<div class="panel-title-bar" style="margin-bottom:0.5rem;"><strong>Trigonometrik Nivelman</strong> &mdash; <span style="font-size:0.78rem;">Sentetik Z/S (Geo &Delta;h&apos;dan turetilmis, alet=1.55 m, hedef=1.60 m)</span></div>';
        html += '<table class="u3-obs-table"><thead><tr><th>Kenar</th><th>S (m)</th><th>Z (gon)</th><th>&Delta;h_trig (m)</th><th>&Delta;h_geo (m)</th><th>Fark (mm)</th></tr></thead><tbody>';
        let sumTrig = 0, sumGeo = 0;
        for (const leg of data) {
            const dh_geo = +(leg.BS - leg.FS).toFixed(4);
            const dist = leg.bsDist + leg.fsDist;
            // Derive zenith from known dh_geo:
            //   dh = S*cos(Z) + i - t + (1-k)*S_horiz^2/(2R)
            //   For small dh, solve iteratively: cos(Z) ≈ (dh - i + t) / S
            //   Z = arccos(cosZ) radians, then to gon
            const c = ((1 - k) / (2 * R)) * dist * dist; // curvature approx with S ≈ horizontal
            let cosZ = (dh_geo - i + t - c) / dist;
            cosZ = Math.max(-1, Math.min(1, cosZ)); // clamp
            const Zrad = Math.acos(cosZ);
            const zenithGon = Zrad / GON_TO_RAD;
            const result = trigonometricDH(dist, zenithGon, i, t, k, R);
            const dh_trig = +result.dh.toFixed(4);
            sumTrig += dh_trig; sumGeo += dh_geo;
            const diff_mm = +((dh_trig - dh_geo) * 1000).toFixed(1);
            html += '<tr><td>' + leg.from + '&rarr;' + leg.to + '</td><td>' + dist.toFixed(2) + '</td><td>' + zenithGon.toFixed(4) + '</td><td style="color:var(--accent);">' + dh_trig.toFixed(4) + '</td><td>' + dh_geo.toFixed(4) + '</td><td style="color:' + (Math.abs(diff_mm) < 10 ? '#4caf50' : 'var(--danger)') + ';">' + diff_mm.toFixed(1) + '</td></tr>';
        }
        html += '<tr style="font-weight:bold;border-top:2px solid var(--border);background:var(--bg-3);"><td>Toplam</td><td></td><td></td><td style="color:var(--accent);">' + sumTrig.toFixed(4) + '</td><td>' + sumGeo.toFixed(4) + '</td><td style="color:var(--accent);">' + ((sumTrig - sumGeo) * 1000).toFixed(1) + '</td></tr>';
        html += '</tbody></table>';
        el.innerHTML = html;
    }
    renderGeoVsTrigCompare(data, XX) {
        const el = document.getElementById('u5Compare'); if (!el) return;
        const i = 1.55, t = 1.60, k = 0.13, R = 6371000, GON_TO_RAD = Math.PI / 200;
        const geoLegs = data.map(leg => ({
            from: leg.from, to: leg.to,
            dh_geo: +(leg.BS - leg.FS).toFixed(4),
            dh_true: +(leg.BS - leg.FS).toFixed(4)
        }));
        const trigLegs = data.map(leg => {
            const dh_geo = +(leg.BS - leg.FS).toFixed(4);
            const dist = leg.bsDist + leg.fsDist;
            const c = ((1 - k) / (2 * R)) * dist * dist;
            let cosZ = (dh_geo - i + t - c) / dist;
            cosZ = Math.max(-1, Math.min(1, cosZ));
            const Zrad = Math.acos(cosZ);
            const zenithGon = Zrad / GON_TO_RAD;
            const result = trigonometricDH(dist, zenithGon, i, t, k, R);
            return {
                from: leg.from, to: leg.to,
                dh_trig: +result.dh.toFixed(4),
                dh_true: dh_geo
            };
        });
        const comparison = compareGeoVsTrig(geoLegs, trigLegs);
        let html = '<div class="panel-title-bar" style="margin-bottom:0.5rem;"><strong>Geometrik vs Trigonometrik Karsilastirmasi</strong></div>';
        html += '<table class="u3-obs-table"><thead><tr><th>Kenar</th><th>&Delta;h_geo (m)</th><th>&Delta;h_trig (m)</th><th>d_geo (mm)</th><th>d_trig (mm)</th><th>Geo vs Trig (mm)</th></tr></thead><tbody>';
        for (const row of comparison) {
            html += '<tr><td>' + row.from + '&rarr;' + row.to + '</td><td>' + row.dh_geo.toFixed(4) + '</td><td>' + row.dh_trig.toFixed(4) + '</td><td>' + (row.d_geo * 1000).toFixed(1) + '</td><td>' + (row.d_trig * 1000).toFixed(1) + '</td><td style="color:' + (Math.abs(row.geo_vs_trig) < 0.01 ? '#4caf50' : 'var(--danger)') + ';">' + (row.geo_vs_trig * 1000).toFixed(1) + '</td></tr>';
        }
        html += '</tbody></table>';
        html += '<p style="font-size:0.78rem;color:var(--text-3);margin-top:0.4rem;">* Trigonometrik nivelman degerleri geometrik &Delta;h degerlerinden turetilen sentetik Z/S ile hesaplanmistir. Gercek saha total station verisi girildiginde dogrudan karsilastirma yapilabilir.</p>';
        el.innerHTML = html;
    }
    renderReport(data, XX, chain) {
        const el = document.getElementById('u5ReportContent'); if (!el) return;
        const rsMod = 1 + XX / 1000;
        const hRS_N38 = (rsBenchmarks["N38"]?.h_base || 0) + rsMod;
        const hRS_N49 = (rsBenchmarks["N49"]?.h_base || 0) + rsMod;
        let sumDh = 0; for (const l of data) sumDh += (l.BS - l.FS);
        const closure = hRS_N38 + sumDh - hRS_N49;
        const totalDist = data.reduce((s, l) => s + l.bsDist + l.fsDist, 0);
        const tolerance = 0.006 * Math.sqrt(totalDist / 1000) + 0.02;
        let html = '<div class="result-section">';
        html += '<h3 style="color:var(--accent);margin-bottom:0.5rem;">Uygulama-5 Raporu: Geometrik Nivelman</h3>';
        html += '<p><strong>Ogrenci:</strong> 24046607 (Ertugrul) &mdash; <strong>Nokta:</strong> 48 | <strong>XX:</strong> ' + XX + '</p>';
        html += '<p><strong>Tarih:</strong> 10 Haziran 2026, 15:48 | <strong>Alet:</strong> Nivo (otomatik) | <strong>Hava:</strong> Acik</p>';
        html += '<p><strong>Nivelman Hatti:</strong> ' + chain.map(c => c.id).join(' &rarr; ') + '</p>';
        html += '<p><strong>RS Noktalari:</strong> N38 (baslangic) ve N49 (bitis) — Davutpasa sabit nivelman agi</p>';
        html += '<p><strong>Ogrenci Duzeltmesi:</strong> RS yuksekliklerine +' + rsMod.toFixed(3) + ' m eklenmistir (XX=' + XX + ')</p>';
        html += '<p><strong>Toplam Mesafe:</strong> ' + totalDist.toFixed(0) + ' m (6 ayak, her ayak 2 kurulum)</p>';
        html += '<p><strong>Toplam Yukseklik Farki:</strong> &Sigma;&Delta;h = ' + sumDh.toFixed(4) + ' m</p>';
        html += '<p><strong>RS Kapanma Hatasi:</strong> ' + closure.toFixed(4) + ' m (' + (closure*1000).toFixed(1) + ' mm) | Tolerans: &plusmn;' + (tolerance*1000).toFixed(1) + ' mm</p>';
        html += '<p><strong>Degerlendirme:</strong> ';
        if (Math.abs(closure) < tolerance) {
            html += '<span style="color:#4caf50;">Kapanma tolerans dahilinde. Nivelman olcumleri basarili.</span>';
        } else {
            html += '<span style="color:var(--danger);">Kapanma tolerans disinda (' + (Math.abs(closure)*1000).toFixed(1) + ' mm > ' + (tolerance*1000).toFixed(1) + ' mm). Muhtemel sebepler: mira okuma hatalari, alet kurulum hatalari, RS noktalarinda oturma.</span>';
        }
        html += '</p>';
        html += '<p style="font-size:0.8rem;color:var(--text-3);margin-top:0.5rem;">* Hesaplamalar geometrik nivelman yontemiyle (BS-FS) yapilmistir. Her ayakta 2 ayri nivo kurulumu ile olcum tekrarlanmistir.</p>';
        html += '</div>';
        el.innerHTML = html;
    }
}

/* ═══════════════════════════════════════════════
   U6 CONTROLLER — 3B Konumlama (3D Positioning)
   ═══════════════════════════════════════════════ */
class U6Controller {
    constructor(app) { this.app = app; this.map = null; this.markers = []; this.loaded = false; }
    activate() {
        const self = this;
        if (!this.map) this.initMap();
        setTimeout(() => { if (this.map) this.map.invalidateSize(); if (!self.loaded) self.loadReal(); self.loaded = true; }, 300);
        const el = document.getElementById('u6LoadBtn'); if (el) el.onclick = () => self.loadReal();
    }
    initMap() {
        const el = document.getElementById('u6Map'); if (!el || this.map) return;
        this.map = L.map('u6Map', { zoomControl: true }).setView([41.0240, 28.8869], 18);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM', maxZoom: 20 }).addTo(this.map);
    }
    loadReal() {
        const self = this; const data = U6_REAL;
        self.markers.forEach(m => self.map.removeLayer(m)); self.markers = [];
        const colorMap = { parcel: '#4caf50', parcel_repeat: '#81c784', detail: '#2196f3', pole: '#ff9800', tree: '#8bc34a', control: '#9c27b0' };
        const typeLabels = { parcel: 'Parsel kosesi', parcel_repeat: 'Parsel (tekrar)', detail: 'Detay', pole: 'Elektrik diregi', tree: 'Agac', control: 'Kontrol' };
        const groups = {};
        for (const d of data) {
            const ll = toLatLng(d.Y, d.X);
            if (!groups[d.type]) groups[d.type] = []; groups[d.type].push(d);
            const color = colorMap[d.type] || '#999'; const H = (d.h_ell - N_GEOID).toFixed(3);
            const m = L.circleMarker(ll, { radius: d.type === 'parcel' ? 7 : 5, fillColor: color, color: '#fff', weight: 1.5, fillOpacity: 0.85 })
                .bindPopup('<b>' + d.id + '</b><br>' + (typeLabels[d.type] || d.type) + '<br>Y: ' + d.Y.toFixed(3) + '<br>X: ' + d.X.toFixed(3) + '<br>h<sub>ell</sub>: ' + d.h_ell + ' m<br>H<sub>orto</sub>: ' + H + ' m').addTo(self.map);
            self.markers.push(m);
        }
        if (self.markers.length) self.map.fitBounds(L.latLngBounds(self.markers.map(m => m.getLatLng())), { padding: [30, 30] });
        self.renderTable(data, colorMap, typeLabels, groups);
        self.renderReport(data, groups);
    }
    renderTable(data, colorMap, typeLabels, groups) {
        let html = '<div class="panel-title-bar" style="margin-bottom:0.5rem;"><strong>RTK GPS Olculeri</strong> &mdash; EGM96 N=' + N_GEOID.toFixed(1) + ' m | CORS: YLDZ</div>';
        html += '<table class="u3-obs-table"><thead><tr><th>Nokta</th><th>Y (Dogu)</th><th>X (Kuzey)</th><th>h<sub>ell</sub> (m)</th><th>H<sub>orto</sub> (m)</th><th>Tur</th></tr></thead><tbody>';
        for (const d of data) {
            const color = colorMap[d.type] || '#999'; const H = (d.h_ell - N_GEOID).toFixed(3);
            html += '<tr><td style="color:' + color + ';font-weight:bold;">' + d.id + '</td><td>' + d.Y.toFixed(3) + '</td><td>' + d.X.toFixed(3) + '</td><td>' + d.h_ell + '</td><td style="color:var(--accent);">' + H + '</td><td><span style="background:' + color + ';color:#fff;padding:1px 6px;border-radius:3px;font-size:0.7rem;">' + (typeLabels[d.type] || d.type) + '</span></td></tr>';
        }
        html += '</tbody></table>';
        html += '<div style="margin-top:0.5rem;display:flex;gap:0.5rem;flex-wrap:wrap;font-size:0.7rem;">';
        for (const [type, pts] of Object.entries(groups)) {
            const avgH = (pts.reduce((s, p) => s + (p.h_ell - N_GEOID), 0) / pts.length).toFixed(3);
            html += '<span style="background:var(--bg-3);padding:2px 8px;border-radius:4px;">' + (typeLabels[type] || type) + ': <b>' + pts.length + '</b>, H<sub>ort</sub>&asymp;' + avgH + ' m</span>';
        }
        html += '</div>';
        html += '<div style="margin-top:0.5rem;padding:0.4rem 0.6rem;background:var(--bg-3);border-radius:6px;font-size:0.75rem;"><strong style="color:var(--accent);">Tekrar Olcusu Kontrolu</strong><br>';
        const P4 = data.find(d => d.id === 'P.4'); const P41 = data.find(d => d.id === 'P.41');
        if (P4 && P41) { const dx = P4.X - P41.X, dy = P4.Y - P41.Y, dh = P4.h_ell - P41.h_ell; const ds = Math.sqrt(dx*dx + dy*dy); html += 'P.4 &harr; P.41: &Delta;X=' + (dx*1000).toFixed(1) + ' mm, &Delta;Y=' + (dy*1000).toFixed(1) + ' mm, &Delta;S=' + (ds*1000).toFixed(1) + ' mm ' + (ds < 0.05 ? '<span style="color:#4caf50;">&check; Tutarli</span>' : '<span style="color:var(--danger);">&cross; Fark var</span>'); }
        const N38 = data.find(d => d.id === 'N.38'); const pt38 = this.app.db.coords[38];
        if (N38 && pt38) { const dx = N38.X - pt38.X, dy = N38.Y - pt38.Y; const ds = Math.sqrt(dx*dx + dy*dy); html += '<br>N.38 &harr; Nokta 38 (sabit): &Delta;X=' + (dx*1000).toFixed(1) + ' mm, &Delta;Y=' + (dy*1000).toFixed(1) + ' mm, &Delta;S=' + (ds*1000).toFixed(1) + ' mm ' + (ds < 0.05 ? '<span style="color:#4caf50;">&check; Tutarli</span>' : '<span style="color:var(--danger);">&cross; Fark var</span>'); }
        html += '</div>';
        document.getElementById('u6RtkTable').innerHTML = html;
        document.getElementById('u6Compare').innerHTML = '<div style="margin-top:0.75rem;padding:0.5rem;background:var(--bg-3);border-radius:6px;"><strong style="color:var(--accent);">Yontem Karsilastirmasi</strong><br><span style="color:var(--text-3);font-size:0.8rem;">U4/U5 hesaplandiginda 3B karsilastirma burada gosterilecek.</span></div>';
    }
    renderReport(data, groups) {
        const el = document.getElementById('u6ReportContent'); if (!el) return;
        let html = '<div class="result-section">';
        html += '<h3 style="color:var(--accent);margin-bottom:0.5rem;">Uygulama-6 Raporu: Uc Boyutlu Konumlama (RTK GPS)</h3>';
        html += '<p><strong>Ogrenci:</strong> 24046607 (Ertugrul) &mdash; <strong>Nokta:</strong> 48</p>';
        html += '<p><strong>CORS Istasyonu:</strong> YLDZ (Yildiz Sabit GNSS Istasyonu) | <strong>Datum:</strong> ITRF96 / TUREF TM30</p>';
        html += '<p><strong>Jeoit Modeli:</strong> EGM96 | <strong>Ortalama Undulasyon:</strong> N &asymp; ' + N_GEOID.toFixed(1) + ' m (Davutpasa bolgesi)</p>';
        html += '<p><strong>Toplam Nokta:</strong> ' + data.length + ' adet</p>';
        let breakdown = [];
        for (const [type, pts] of Object.entries(groups)) {
            breakdown.push(pts.length + ' ' + (type === 'parcel' ? 'parsel kosesi' : type === 'detail' ? 'detay' : type === 'pole' ? 'direk' : type === 'tree' ? 'agac' : type === 'control' ? 'kontrol' : type));
        }
        html += '<p><strong>Dagilim:</strong> ' + breakdown.join(', ') + '</p>';
        html += '<p><strong>Ortometrik Yukseklik Hesabi:</strong> H = h<sub>ellipsoidal</sub> - N (N=' + N_GEOID.toFixed(1) + ' m)</p>';
        const P4 = data.find(d => d.id === 'P.4'); const P41 = data.find(d => d.id === 'P.41');
        if (P4 && P41) {
            const dx = P4.X - P41.X, dy = P4.Y - P41.Y, ds = Math.sqrt(dx*dx + dy*dy);
            html += '<p><strong>Tekrar Olcusu (P.4 &harr; P.41):</strong> Konum farki ' + (ds*1000).toFixed(1) + ' mm &mdash; ';
            html += (ds < 0.02 ? '<span style="color:#4caf50;">RTK tekrarliligi cok iyi (&lt;2 cm)</span>' : ds < 0.05 ? '<span style="color:#ff9800;">RTK tekrarliligi kabul edilebilir (&lt;5 cm)</span>' : '<span style="color:var(--danger);">Tekrar olcusunde anlamli fark var</span>') + '</p>';
        }
        html += '<p style="font-size:0.8rem;color:var(--text-3);margin-top:0.5rem;">* RTK GPS olcumlerinde YLDZ sabit istasyonundan gelen duzeltmeler kullanilmistir. Parsel koseleri ve detay noktalari hem kutupsal alim hem de RTK GPS ile ayri ayri olculmustur.</p>';
        html += '</div>';
        el.innerHTML = html;
    }
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
