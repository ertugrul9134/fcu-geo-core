import { coordinates as defaultCoords, measurements as defaultMeasurements } from './data.js';

// --- GEODETIC ENGINE ---
class SurveyEngine {
    static GON_TO_RAD = Math.PI / 200.0;
    static RAD_TO_GON = 200.0 / Math.PI;

    static normalizeGon(angle) {
        while (angle < 0) angle += 400.0;
        while (angle >= 400.0) angle -= 400.0;
        return angle;
    }

    static firstFundamental(ya, xa, azimuth, distance) {
        const azRad = azimuth * this.GON_TO_RAD;
        const dy = distance * Math.sin(azRad);
        const dx = distance * Math.cos(azRad);
        return { y: ya + dy, x: xa + dx, dy, dx };
    }

    static secondFundamental(ya, xa, yb, xb) {
        const dy = yb - ya;
        const dx = xb - xa;
        const distance = Math.sqrt(dy ** 2 + dx ** 2);
        
        if (distance === 0) return { azimuth: 0, distance: 0, dy, dx };
        
        const alpha = dx !== 0 ? Math.abs(Math.atan(Math.abs(dy / dx)) * this.RAD_TO_GON) : 100.0;
        
        let azimuth = 0;
        if (dy >= 0 && dx >= 0) azimuth = alpha;           // Q1
        else if (dy >= 0 && dx < 0) azimuth = 200.0 - alpha; // Q2
        else if (dy < 0 && dx < 0) azimuth = 200.0 + alpha;  // Q3
        else if (dy < 0 && dx >= 0) azimuth = 400.0 - alpha; // Q4
        
        return { azimuth: this.normalizeGon(azimuth), distance, dy, dx };
    }
}

// --- DATABASE MANAGER ---
class Database {
    constructor() {
        this.load();
    }

    load() {
        const storedCoords = localStorage.getItem('geo_coords');
        const storedMeas = localStorage.getItem('geo_meas');
        
        try {
            this.coords = storedCoords ? JSON.parse(storedCoords) : defaultCoords;
        } catch (e) {
            console.error("Coordinate parse error", e);
            this.coords = defaultCoords;
        }

        try {
            this.meas = storedMeas ? JSON.parse(storedMeas) : defaultMeasurements;
        } catch (e) {
            console.error("Measurement parse error", e);
            this.meas = defaultMeasurements;
        }
    }

    save(coordsObj, measArr) {
        this.coords = coordsObj;
        this.meas = measArr;
        localStorage.setItem('geo_coords', JSON.stringify(this.coords));
        localStorage.setItem('geo_meas', JSON.stringify(this.meas));
    }

    reset() {
        localStorage.removeItem('geo_coords');
        localStorage.removeItem('geo_meas');
        this.load();
    }

    getMeasuredDirection(fromNode, toNode) {
        const m = this.meas.find(m => m.dn == fromNode && m.bn == toNode);
        return m ? m.dir : null;
    }

    getMeasuredDistance(fromNode, toNode) {
        const m = this.meas.find(m => m.dn == fromNode && m.bn == toNode);
        return m ? m.dist : null;
    }
}

// --- MAIN APPLICATION ---
class App {
    constructor() {
        this.db = new Database();
        
        // Define UTM Zone 35N Projection (Turkey/Istanbul)
        proj4.defs("EPSG:32635","+proj=utm +zone=35 +datum=WGS84 +units=m +no_defs");
        
        this.selectedNodes = [];
        this.markers = {};
        this.highlightLayer = null;

        this.initUI();
        this.initMap();
    }

    initUI() {
        this.calculateBtn = document.getElementById('calculateBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.selectedNodesList = document.getElementById('selectedNodesList');
        this.resultsContent = document.getElementById('resultsContent');
        
        this.calculateBtn.addEventListener('click', () => this.executeProtocol());
        this.clearBtn.addEventListener('click', () => this.clearSelection());

        // Modal Logic
        this.modal = document.getElementById('dbModal');
        document.getElementById('openDbBtn').addEventListener('click', () => this.openModal());
        document.getElementById('closeDbBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('saveDbBtn').addEventListener('click', () => this.saveModal());
        document.getElementById('resetDbBtn').addEventListener('click', () => this.resetModal());
    }

    openModal() {
        document.getElementById('coordsInput').value = JSON.stringify(this.db.coords, null, 2);
        document.getElementById('measurementsInput').value = JSON.stringify(this.db.meas, null, 2);
        this.modal.classList.remove('hidden');
    }

    closeModal() {
        this.modal.classList.add('hidden');
    }

    saveModal() {
        try {
            const c = JSON.parse(document.getElementById('coordsInput').value);
            const m = JSON.parse(document.getElementById('measurementsInput').value);
            this.db.save(c, m);
            this.closeModal();
            this.clearSelection();
            this.initMap(); // Reload map points
        } catch (e) {
            alert("Geçersiz JSON formatı! Lütfen kontrol edin.\n" + e.message);
        }
    }

    resetModal() {
        if(confirm("Tüm veritabanı varsayılan değerlere sıfırlanacak. Onaylıyor musunuz?")) {
            this.db.reset();
            this.closeModal();
            this.clearSelection();
            this.initMap();
        }
    }

    initMap() {
        if (this.map) {
            this.map.remove();
        }

        // Initialize map centered roughly on the first point
        let firstNode = Object.keys(this.db.coords)[0];
        let center = [41.0, 28.9]; // Default Istanbul
        
        if (firstNode && this.db.coords[firstNode]) {
            const c = this.db.coords[firstNode];
            const latlon = proj4("EPSG:32635", "EPSG:4326", [c.Y, c.X]);
            center = [latlon[1], latlon[0]];
        }

        this.map = L.map('geoMap').setView(center, 18);

        // Add OpenStreetMap layer (Free)
        const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 22,
            attribution: '© OpenStreetMap'
        }).addTo(this.map);

        // Satellite layer (Esri)
        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 22,
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        });

        // Add Layer Control
        L.control.layers({
            "Uydu (Esri)": satelliteLayer,
            "Sokak (OSM)": osmLayer
        }).addTo(this.map);

        this.drawNodes();
    }

    drawNodes() {
        this.markers = {};
        
        const nodes = Object.keys(this.db.coords);
        let bounds = L.latLngBounds();

        nodes.forEach(id => {
            const c = this.db.coords[id];
            const latlon = proj4("EPSG:32635", "EPSG:4326", [c.Y, c.X]);
            const latLng = [latlon[1], latlon[0]];
            
            bounds.extend(latLng);

            const icon = L.divIcon({
                className: 'node-icon',
                html: id,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });

            const marker = L.marker(latLng, { icon, zIndexOffset: 0 }).addTo(this.map);
            
            marker.bindTooltip(`Nokta ${id}<br>Y: ${c.Y.toFixed(3)}<br>X: ${c.X.toFixed(3)}`, {
                direction: 'top',
                offset: [0, -10]
            });

            marker.on('click', () => this.handleNodeClick(id));
            
            this.markers[id] = marker;
        });

        if (nodes.length > 0) {
            this.map.fitBounds(bounds, { padding: [50, 50] });
        }
    }

    handleNodeClick(id) {
        id = Number(id);
        const index = this.selectedNodes.indexOf(id);
        
        if (index > -1) {
            this.selectedNodes.splice(index, 1);
        } else if (this.selectedNodes.length < 3) {
            this.selectedNodes.push(id);
        }

        this.updateUI();
    }

    clearSelection() {
        this.selectedNodes = [];
        this.updateUI();
        this.resultsContent.innerHTML = '<span class="empty-state">Yürütme bekleniyor...</span>';
    }

    updateUI() {
        // Update Marker Styles
        Object.keys(this.markers).forEach(id => {
            const el = this.markers[id].getElement();
            if (el) {
                if (this.selectedNodes.includes(Number(id))) {
                    el.classList.add('selected');
                    this.markers[id].setZIndexOffset(1000);
                } else {
                    el.classList.remove('selected');
                    this.markers[id].setZIndexOffset(0);
                }
            }
        });

        // Update Polygon Highlight
        if (this.highlightLayer) {
            this.map.removeLayer(this.highlightLayer);
        }

        if (this.selectedNodes.length > 1) {
            const latlngs = this.selectedNodes.map(id => {
                const c = this.db.coords[id];
                const latlon = proj4("EPSG:32635", "EPSG:4326", [c.Y, c.X]);
                return [latlon[1], latlon[0]];
            });
            
            this.highlightLayer = L.polygon(latlngs, {
                color: '#AD8B73',
                weight: 3,
                fillColor: '#AD8B73',
                fillOpacity: 0.2
            }).addTo(this.map);
        }

        // Update List
        if (this.selectedNodes.length === 0) {
            this.selectedNodesList.innerHTML = '<span class="empty-state">Seçim bekleniyor...</span>';
        } else {
            this.selectedNodesList.innerHTML = this.selectedNodes.map(id => `<span class="node-badge">${id}</span>`).join('');
        }
        
        this.calculateBtn.disabled = this.selectedNodes.length !== 3;
    }

    executeProtocol() {
        if (this.selectedNodes.length !== 3) return;

        const [p1, p2, p3] = this.selectedNodes;
        let html = '';

        // Helper to format math
        const math = (str) => `<div class="formula-box">$$ ${str} $$</div>`;
        const inline = (str) => `\\( ${str} \\)`;

        // 1. Angular Extraction & Distribution
        html += `<div class="result-block"><strong>[1] Açı Çıkarımı ve Kapanma Hatası Dağıtımı</strong><br>`;
        
        let angles = {};
        const getAbsAngle = (center, n1, n2) => {
            const d1 = this.db.getMeasuredDirection(center, n1);
            const d2 = this.db.getMeasuredDirection(center, n2);
            if (d1 === null || d2 === null) return null;
            let diff = Math.abs(d1 - d2);
            if (diff > 200) diff = 400 - diff;
            return diff;
        };

        angles[p1] = getAbsAngle(p1, p2, p3);
        angles[p2] = getAbsAngle(p2, p1, p3);
        angles[p3] = getAbsAngle(p3, p1, p2);

        if (angles[p1] === null || angles[p2] === null || angles[p3] === null) {
            html += `<span class="error-text">HATA: ${p1}-${p2}-${p3} üçgeni için yeterli doğrultu ölçümü bulunamadı.</span></div>`;
            this.resultsContent.innerHTML = html;
            return;
        }

        html += `Ölçülen İç Açılar:<br>`;
        html += `&beta;<sub>${p1}</sub> = ${angles[p1].toFixed(4)}<sup>g</sup><br>`;
        html += `&beta;<sub>${p2}</sub> = ${angles[p2].toFixed(4)}<sup>g</sup><br>`;
        html += `&beta;<sub>${p3}</sub> = ${angles[p3].toFixed(4)}<sup>g</sup><br>`;

        const sum = angles[p1] + angles[p2] + angles[p3];
        const error = 200.0 - sum;
        
        html += math(`w = 200^g - (\\beta_1 + \\beta_2 + \\beta_3) = 200^g - ${sum.toFixed(4)}^g = ${error.toFixed(4)}^g`);
        
        const correction = error / 3;
        angles[p1] += correction;
        angles[p2] += correction;
        angles[p3] += correction;

        html += `<br>Kesin Açılar (Hata Dağıtılmış):<br>`;
        html += `&beta;<sub>${p1}</sub> = <span class="highlight">${angles[p1].toFixed(4)}<sup>g</sup></span><br>`;
        html += `&beta;<sub>${p2}</sub> = <span class="highlight">${angles[p2].toFixed(4)}<sup>g</sup></span><br>`;
        html += `&beta;<sub>${p3}</sub> = <span class="highlight">${angles[p3].toFixed(4)}<sup>g</sup></span><br></div>`;

        // 2. Sine Theorem
        html += `<div class="result-block"><strong>[2] Sinüs Teoremi ile Kenar Hesabı</strong><br>`;
        
        let dist12 = this.db.getMeasuredDistance(p1, p2) || this.db.getMeasuredDistance(p2, p1);
        let dist23 = this.db.getMeasuredDistance(p2, p3) || this.db.getMeasuredDistance(p3, p2);
        let dist31 = this.db.getMeasuredDistance(p3, p1) || this.db.getMeasuredDistance(p1, p3);

        let knownDist, knownOppositeAngle, pStart, pEnd, pOpposite;
        if (dist12) { knownDist = dist12; knownOppositeAngle = angles[p3]; pStart=p1; pEnd=p2; pOpposite=p3; }
        else if (dist23) { knownDist = dist23; knownOppositeAngle = angles[p1]; pStart=p2; pEnd=p3; pOpposite=p1;}
        else if (dist31) { knownDist = dist31; knownOppositeAngle = angles[p2]; pStart=p3; pEnd=p1; pOpposite=p2;}

        if (!knownDist) {
            html += `<span class="error-text">HATA: Bu üçgen için ölçülmüş baz kenar mesafesi bulunamadı.</span></div>`;
        } else {
            html += `Baz Kenar S<sub>${pStart}-${pEnd}</sub> = ${knownDist.toFixed(3)}m<br>`;
            
            html += math(`\\frac{S_{${pStart}-${pEnd}}}{\\sin(\\beta_{${pOpposite}})} = \\frac{S_{bilinmeyen}}{\\sin(\\beta_{karsi})}`);
            
            const sineRatio = knownDist / Math.sin(knownOppositeAngle * SurveyEngine.GON_TO_RAD);
            
            const calcDist23 = pStart===p2 && pEnd===p3 ? dist23 : sineRatio * Math.sin(angles[p1] * SurveyEngine.GON_TO_RAD);
            const calcDist31 = pStart===p3 && pEnd===p1 ? dist31 : sineRatio * Math.sin(angles[p2] * SurveyEngine.GON_TO_RAD);
            const calcDist12 = pStart===p1 && pEnd===p2 ? dist12 : sineRatio * Math.sin(angles[p3] * SurveyEngine.GON_TO_RAD);

            html += `Hesaplanan Kenarlar:<br>`;
            html += `S<sub>${p1}-${p2}</sub> = <span class="highlight">${calcDist12.toFixed(3)}m</span><br>`;
            html += `S<sub>${p2}-${p3}</sub> = <span class="highlight">${calcDist23.toFixed(3)}m</span><br>`;
            html += `S<sub>${p3}-${p1}</sub> = <span class="highlight">${calcDist31.toFixed(3)}m</span><br></div>`;

            // 3. Geodetic Fundamental Problems
            html += `<div class="result-block"><strong>[3] 1. ve 2. Temel Ödev Koordinat Hesabı</strong><br>`;
            
            const c1 = this.db.coords[p1];
            const c2 = this.db.coords[p2];
            const c3_true = this.db.coords[p3];
            
            // 2. Temel Ödev
            const res2 = SurveyEngine.secondFundamental(c1.Y, c1.X, c2.Y, c2.X);
            html += `Nokta ${p1}'den Nokta ${p2}'ye (2. Temel Ödev):<br>`;
            html += math(`\\Delta Y = Y_{${p2}} - Y_{${p1}} = ${res2.dy.toFixed(3)}`);
            html += math(`\\Delta X = X_{${p2}} - X_{${p1}} = ${res2.dx.toFixed(3)}`);
            html += math(`( ${p1} ${p2} ) = \\arctan\\left(\\frac{|\\Delta Y|}{|\\Delta X|}\\right) = ${res2.azimuth.toFixed(4)}^g`);
            
            const baseAzimuth = res2.azimuth;
            
            // 3. Temel Ödev (Açı Nakli)
            const az13_true = SurveyEngine.secondFundamental(c1.Y, c1.X, c3_true.Y, c3_true.X).azimuth;
            let az13 = baseAzimuth + angles[p1];
            if (Math.abs(az13_true - az13) > 100) az13 = baseAzimuth - angles[p1];
            az13 = SurveyEngine.normalizeGon(az13);
            
            html += `Açı Nakli (3. Temel Ödev Yaklaşımı):<br>`;
            html += math(`(${p1}${p3}) = (${p1}${p2}) \\pm \\beta_{${p1}} = ${az13.toFixed(4)}^g`);

            // 1. Temel Ödev
            const p3_calc1 = SurveyEngine.firstFundamental(c1.Y, c1.X, az13, calcDist31);
            
            html += `Nokta ${p3} Projeksiyonu (1. Temel Ödev):<br>`;
            html += math(`Y_{${p3}} = Y_{${p1}} + S_{${p1}-${p3}} \\cdot \\sin((${p1}${p3})) = ${p3_calc1.y.toFixed(3)}`);
            html += math(`X_{${p3}} = X_{${p1}} + S_{${p1}-${p3}} \\cdot \\cos((${p1}${p3})) = ${p3_calc1.x.toFixed(3)}`);
            
            const diffY = Math.abs(p3_calc1.y - c3_true.Y);
            const diffX = Math.abs(p3_calc1.x - c3_true.X);
            html += `Veritabanı Gerçek Değeri: Y=${c3_true.Y.toFixed(3)}, X=${c3_true.X.toFixed(3)}<br>`;
            html += `Sapma: &Delta;Y = <span class="${diffY > 0.05 ? 'error-text':'highlight'}">${diffY.toFixed(3)}m</span>, &Delta;X = <span class="${diffX > 0.05 ? 'error-text':'highlight'}">${diffX.toFixed(3)}m</span></div>`;
        }

        this.resultsContent.innerHTML = html;
        
        // Render KaTeX math
        renderMathInElement(this.resultsContent, {
            delimiters: [
                {left: "$$", right: "$$", display: true},
                {left: "\\(", right: "\\)", display: false}
            ]
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.appInstance = new App();
});
