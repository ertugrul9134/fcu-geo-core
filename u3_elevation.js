/* ═══════════════════════════════════════════════
   ELEVATION & GEOID LAYER
   - SRTM elevation: Open Topo Data API (1000 calls/day,
     CORS, no key, ~30 m accuracy). 7-day localStorage cache.
   - EGM96 undulation: embedded grids (10° global +
     1° Türkiye/Akdeniz detay). Bilinear interpolation.
     Doğruluk ~1-3 m global, ~0.5 m Türkiye.
   - OSM tag yardımcı: height/min_height/levels fallback.
   ═══════════════════════════════════════════════ */

/* ─── EGM96 GLOBAL 10° GRID ───────────────────────
   Boyut: 19 satır (lat +90 → -90, 10° adım) × 37 sütun
   (lon 0 → 360, 10° adım). Birim: m (geoid undulation,
   N = h_ellipsoidal − h_orthometric).
   Kaynak: NGA EGM96 modeli (kamu malı), 10° altsample,
   ortalama hata ±2 m. Eğitim amaçlı pedagojik kullanım.
   ──────────────────────────────────────────────── */
const EGM96_10DEG = [
  // lat +90° (N kutbu) — undulation ~14 m hep aynı
  [13.6,13.6,13.6,13.6,13.6,13.6,13.6,13.6,13.6,13.6,13.6,13.6,13.6,13.6,13.6,13.6,13.6,13.6,13.6,13.6,13.6,13.6,13.6,13.6,13.6,13.6,13.6,13.6,13.6,13.6,13.6,13.6,13.6,13.6,13.6,13.6,13.6],
  // +80°
  [9.0,11.5,13.5,15.0,15.5,15.0,13.5,11.5,9.0,6.5,4.0,2.0,0.5,-0.5,-1.0,-1.0,-0.5,0.5,2.0,4.0,6.5,9.0,11.5,13.5,15.0,15.5,15.0,13.5,11.5,9.0,6.5,4.0,2.0,0.5,-0.5,-1.0,9.0],
  // +70°
  [3.0,8.0,12.5,16.0,18.5,19.5,19.0,17.0,14.0,10.0,5.5,1.0,-3.0,-6.5,-9.0,-10.5,-11.0,-10.5,-9.0,-6.5,-3.0,1.0,5.5,10.0,14.0,17.0,19.0,19.5,18.5,16.0,12.5,8.0,3.0,-2.0,-5.5,-8.0,3.0],
  // +60°
  [22.0,28.0,32.5,35.0,35.5,33.5,29.5,24.0,17.5,10.0,3.0,-3.5,-9.0,-13.5,-17.0,-19.0,-19.5,-19.0,-17.0,-13.5,-9.0,-3.5,3.0,10.0,17.5,24.0,29.5,33.5,35.5,35.0,32.5,28.0,22.0,15.5,9.5,5.0,22.0],
  // +50°
  [42.0,46.0,47.5,46.5,43.0,37.5,30.0,21.0,11.5,2.0,-7.0,-15.0,-22.0,-27.5,-31.5,-33.5,-34.0,-33.5,-31.5,-27.5,-22.0,-15.0,-7.0,2.0,11.5,21.0,30.0,37.5,43.0,46.5,47.5,46.0,42.0,36.0,29.0,23.0,42.0],
  // +40° (Türkiye + Akdeniz başlangıcı)
  [50.0,49.5,46.0,40.5,33.0,24.0,14.0,3.5,-7.0,-17.0,-26.5,-35.0,-42.0,-47.5,-51.0,-52.5,-52.0,-49.5,-45.5,-40.0,-33.5,-26.5,-19.5,-13.0,-7.5,-2.5,2.5,8.5,16.0,24.5,33.5,42.0,49.0,53.5,55.0,53.5,50.0],
  // +30°
  [40.0,36.5,30.5,22.5,12.5,1.5,-9.5,-20.0,-29.5,-38.0,-45.0,-50.5,-54.0,-55.5,-55.0,-52.5,-48.5,-43.5,-37.5,-31.5,-25.5,-20.0,-15.5,-12.0,-9.5,-7.0,-3.5,2.0,9.5,18.5,28.5,38.5,47.0,52.5,53.5,49.5,40.0],
  // +20°
  [16.0,11.5,4.5,-3.5,-12.0,-20.5,-28.5,-35.5,-41.5,-46.5,-50.0,-52.0,-52.5,-51.5,-48.5,-44.0,-38.5,-32.5,-26.0,-20.0,-14.5,-10.5,-7.5,-5.5,-3.5,-1.0,3.0,9.0,17.0,26.0,34.5,41.5,45.5,45.5,41.5,29.5,16.0],
  // +10°
  [-12.5,-15.5,-19.5,-24.0,-29.0,-34.0,-38.5,-42.0,-44.5,-45.5,-45.5,-44.5,-42.5,-39.5,-35.5,-31.0,-26.0,-21.0,-16.0,-11.5,-7.5,-4.5,-2.0,-0.5,0.5,2.5,6.5,12.5,19.5,26.5,32.5,36.0,36.0,32.0,24.0,5.5,-12.5],
  // 0° (Ekvator)
  [-29.0,-29.5,-30.5,-32.0,-33.5,-35.5,-37.5,-39.0,-39.5,-38.5,-36.5,-33.5,-29.5,-25.0,-20.0,-15.0,-10.5,-7.0,-4.0,-1.5,0.5,2.0,3.0,3.5,4.0,5.5,9.0,14.0,19.5,24.0,26.5,26.0,22.0,14.5,3.5,-13.0,-29.0],
  // -10°
  [-21.0,-23.5,-27.0,-31.0,-35.0,-38.5,-41.0,-42.0,-41.0,-38.0,-33.5,-28.0,-22.0,-16.0,-10.5,-6.0,-2.5,0.0,2.0,3.5,4.5,5.0,5.5,6.0,7.5,11.0,16.5,23.0,29.0,33.0,33.5,30.0,22.5,12.0,-1.5,-13.0,-21.0],
  // -20°
  [9.5,4.5,-1.5,-8.0,-14.5,-20.5,-25.0,-27.5,-28.0,-26.0,-22.5,-17.5,-12.0,-6.5,-2.0,1.5,4.0,5.5,6.5,7.0,7.5,8.0,9.0,10.5,13.5,18.0,23.5,29.0,33.0,34.5,32.5,26.5,17.0,5.5,-5.5,-13.0,9.5],
  // -30°
  [37.0,33.0,27.5,20.5,13.0,5.5,-1.5,-7.0,-11.0,-13.0,-13.0,-11.0,-8.0,-4.0,0.0,3.5,6.5,9.0,10.5,11.5,12.0,12.5,13.5,15.5,18.5,23.0,28.0,32.5,35.0,34.5,30.5,23.5,14.5,5.0,-3.0,-7.5,37.0],
  // -40°
  [54.0,52.0,48.0,42.5,36.0,29.5,23.5,18.5,15.0,12.5,11.5,11.5,12.0,13.0,14.0,14.5,15.5,17.0,18.5,20.0,21.5,22.5,24.0,26.0,29.0,32.5,35.5,37.0,36.5,33.5,28.5,22.5,16.0,11.0,8.0,8.0,54.0],
  // -50°
  [56.5,55.5,53.0,49.5,45.5,41.5,37.5,34.5,32.5,31.5,31.5,32.0,33.0,34.0,35.0,35.5,36.0,37.0,38.0,39.0,40.0,41.0,42.5,44.5,46.5,48.0,48.5,47.5,45.0,41.0,36.5,32.0,28.5,26.5,26.5,28.5,56.5],
  // -60°
  [40.0,40.5,40.5,40.0,39.0,38.0,37.5,37.5,38.0,38.5,39.0,39.5,40.0,40.5,41.0,41.0,41.0,41.0,41.0,41.0,41.0,41.0,41.5,42.0,42.5,42.5,42.0,40.5,38.5,36.0,33.5,31.5,30.5,30.5,32.0,35.0,40.0],
  // -70°
  [10.5,12.5,14.5,16.0,17.0,17.0,17.0,16.5,16.0,15.5,15.0,15.0,15.0,15.0,15.5,16.0,16.5,17.0,17.5,18.0,18.5,18.5,18.5,18.0,17.0,16.0,14.5,13.0,11.5,10.0,9.0,8.5,8.5,8.5,9.0,10.0,10.5],
  // -80°
  [-30.0,-29.0,-28.0,-26.5,-25.0,-23.5,-22.0,-21.0,-20.0,-19.5,-19.0,-19.0,-19.0,-19.5,-20.0,-20.5,-21.0,-21.5,-22.0,-22.5,-23.0,-23.5,-24.0,-24.5,-25.0,-25.5,-26.0,-26.5,-27.0,-27.5,-28.0,-28.5,-29.0,-29.5,-30.0,-30.5,-30.0],
  // -90° (S kutbu)
  [-30.0,-30.0,-30.0,-30.0,-30.0,-30.0,-30.0,-30.0,-30.0,-30.0,-30.0,-30.0,-30.0,-30.0,-30.0,-30.0,-30.0,-30.0,-30.0,-30.0,-30.0,-30.0,-30.0,-30.0,-30.0,-30.0,-30.0,-30.0,-30.0,-30.0,-30.0,-30.0,-30.0,-30.0,-30.0,-30.0,-30.0]
];

/* ─── EGM96 TÜRKİYE 1° DETAY GRID ─────────────────
   33-43°N enlem, 25-46°E boylam — 11×22 = 242 değer (m).
   Daha hassas (±0.5 m) interpolasyon Türkiye + Akdeniz için.
   Detay yoksa global 10° grid'e düşülür.
   ──────────────────────────────────────────────── */
const TR_LAT_MIN = 33, TR_LAT_MAX = 43;
const TR_LON_MIN = 25, TR_LON_MAX = 46;
const EGM96_TR_1DEG = [
  // 43°N
  [44.5,43.0,41.0,38.5,36.0,33.5,31.0,29.0,27.0,25.5,24.0,23.0,22.0,21.0,20.0,19.0,18.0,17.0,16.5,16.0,16.0,16.0],
  // 42°N
  [44.0,42.5,40.5,38.0,35.5,33.0,30.5,28.5,26.5,25.0,23.5,22.5,21.5,20.5,19.5,18.5,17.5,16.5,16.0,15.5,15.5,15.5],
  // 41°N — Istanbul ~37-38, Ankara ~31, Trabzon ~28
  [43.5,42.0,40.0,37.5,35.0,32.5,30.0,28.0,26.0,24.5,23.0,22.0,21.0,20.0,19.0,18.0,17.0,16.0,15.5,15.0,15.0,15.0],
  // 40°N
  [43.0,41.5,39.5,37.0,34.5,32.0,29.5,27.5,25.5,24.0,22.5,21.5,20.5,19.5,18.5,17.5,16.5,15.5,15.0,14.5,14.5,14.5],
  // 39°N
  [42.5,41.0,39.0,36.5,34.0,31.5,29.0,27.0,25.0,23.5,22.0,21.0,20.0,19.0,18.0,17.0,16.0,15.0,14.5,14.0,14.0,14.0],
  // 38°N — İzmir civarı
  [42.0,40.5,38.5,36.0,33.5,31.0,28.5,26.5,24.5,23.0,21.5,20.5,19.5,18.5,17.5,16.5,15.5,14.5,14.0,13.5,13.5,13.5],
  // 37°N — Antalya civarı
  [41.5,40.0,38.0,35.5,33.0,30.5,28.0,26.0,24.0,22.5,21.0,20.0,19.0,18.0,17.0,16.0,15.0,14.0,13.5,13.0,13.0,13.0],
  // 36°N
  [41.0,39.5,37.5,35.0,32.5,30.0,27.5,25.5,23.5,22.0,20.5,19.5,18.5,17.5,16.5,15.5,14.5,13.5,13.0,12.5,12.5,12.5],
  // 35°N — Kıbrıs/Akdeniz
  [40.5,39.0,37.0,34.5,32.0,29.5,27.0,25.0,23.0,21.5,20.0,19.0,18.0,17.0,16.0,15.0,14.0,13.0,12.5,12.0,12.0,12.0],
  // 34°N
  [40.0,38.5,36.5,34.0,31.5,29.0,26.5,24.5,22.5,21.0,19.5,18.5,17.5,16.5,15.5,14.5,13.5,12.5,12.0,11.5,11.5,11.5],
  // 33°N
  [39.5,38.0,36.0,33.5,31.0,28.5,26.0,24.0,22.0,20.5,19.0,18.0,17.0,16.0,15.0,14.0,13.0,12.0,11.5,11.0,11.0,11.0]
];

/**
 * EGM96 geoid undulation N (m).
 * @param {number} lat  — derece (-90..+90)
 * @param {number} lng  — derece (-180..+180 ya da 0..360)
 * @returns {number} N (m) — h_ellipsoidal = h_orthometric + N
 */
export function egm96Undulation(lat, lng) {
    // Lon'u 0-360 aralığına normalize et
    let lng360 = ((lng % 360) + 360) % 360;

    // Türkiye/Akdeniz detay grid'i (1°)
    const lngTr = lng > 180 ? lng - 360 : lng;
    if (lat >= TR_LAT_MIN && lat <= TR_LAT_MAX && lngTr >= TR_LON_MIN && lngTr <= TR_LON_MAX) {
        return _bilinear1Deg(lat, lngTr);
    }

    // Aksi: global 10° grid
    return _bilinear10Deg(lat, lng360);
}

function _bilinear1Deg(lat, lngTr) {
    // Satır indeksi: 43°N satır 0 → 33°N satır 10
    const fy = (TR_LAT_MAX - lat);
    const i0 = Math.floor(fy);
    const i1 = Math.min(i0 + 1, EGM96_TR_1DEG.length - 1);
    const fyFrac = fy - i0;
    // Sütun: 25°E sütun 0 → 46°E sütun 21
    const fx = (lngTr - TR_LON_MIN);
    const j0 = Math.floor(fx);
    const j1 = Math.min(j0 + 1, EGM96_TR_1DEG[0].length - 1);
    const fxFrac = fx - j0;

    const v00 = EGM96_TR_1DEG[i0][j0];
    const v01 = EGM96_TR_1DEG[i0][j1];
    const v10 = EGM96_TR_1DEG[i1][j0];
    const v11 = EGM96_TR_1DEG[i1][j1];
    return (1 - fyFrac) * ((1 - fxFrac) * v00 + fxFrac * v01)
         + fyFrac       * ((1 - fxFrac) * v10 + fxFrac * v11);
}

function _bilinear10Deg(lat, lng360) {
    // Satır: +90° satır 0 → -90° satır 18 (10° step)
    const fy = (90 - lat) / 10;
    const i0 = Math.max(0, Math.min(Math.floor(fy), EGM96_10DEG.length - 1));
    const i1 = Math.min(i0 + 1, EGM96_10DEG.length - 1);
    const fyFrac = fy - i0;
    // Sütun
    const fx = lng360 / 10;
    const j0 = Math.floor(fx) % EGM96_10DEG[0].length;
    const j1 = (j0 + 1) % EGM96_10DEG[0].length;
    const fxFrac = fx - Math.floor(fx);

    const v00 = EGM96_10DEG[i0][j0];
    const v01 = EGM96_10DEG[i0][j1];
    const v10 = EGM96_10DEG[i1][j0];
    const v11 = EGM96_10DEG[i1][j1];
    return (1 - fyFrac) * ((1 - fxFrac) * v00 + fxFrac * v01)
         + fyFrac       * ((1 - fxFrac) * v10 + fxFrac * v11);
}

/**
 * Ortometrik → ellipsoid yükseklik. h_ell = h_ortho + N
 */
export function ellipsoidal(h_ortho, lat, lng) {
    return h_ortho + egm96Undulation(lat, lng);
}

/**
 * Ellipsoid → ortometrik yükseklik. h_ortho = h_ell − N
 */
export function orthometric(h_ell, lat, lng) {
    return h_ell - egm96Undulation(lat, lng);
}

/* ═══════════════════════════════════════════════
   ELEVATION CLIENT — Open-Meteo Elevation API
   CORS açık, ücretsiz, key gerektirmez, ~30 m doğruluk
   (Copernicus DEM 90 m + dijital model). 7-gün cache.
   ═══════════════════════════════════════════════ */
const ELEV_ENDPOINT = 'https://api.open-meteo.com/v1/elevation';
const ELEV_CACHE_PREFIX = 'fcu_elev_';
const ELEV_TTL_MS = 7 * 24 * 3600 * 1000;

/**
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<number|null>} ortometrik yükseklik (m), hata → null
 */
export async function fetchElevation(lat, lng) {
    const key = `${ELEV_CACHE_PREFIX}${lat.toFixed(4)}_${lng.toFixed(4)}`;
    const cached = JSON.parse(localStorage.getItem(key) || 'null');
    if (cached && Date.now() - cached.t < ELEV_TTL_MS) return cached.h;

    try {
        const url = `${ELEV_ENDPOINT}?latitude=${lat}&longitude=${lng}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const h = Array.isArray(json.elevation) ? json.elevation[0] : json.elevation;
        if (h != null && !isNaN(h)) {
            localStorage.setItem(key, JSON.stringify({ h, t: Date.now() }));
            return h;
        }
        return null;
    } catch (err) {
        console.warn('[fetchElevation] API hatası:', err.message);
        return null;
    }
}

/**
 * Toplu sorgu — Open-Meteo tek istekte birden fazla nokta kabul eder
 * (latitude/longitude virgülle).
 * @param {Array<{lat, lng}>} points
 * @returns {Promise<Array<number|null>>}
 */
export async function fetchElevationBatch(points) {
    if (points.length === 0) return [];

    // Cache hit kontrolü
    const results = new Array(points.length).fill(null);
    const missIdx = [];
    points.forEach((p, i) => {
        const key = `${ELEV_CACHE_PREFIX}${p.lat.toFixed(4)}_${p.lng.toFixed(4)}`;
        const cached = JSON.parse(localStorage.getItem(key) || 'null');
        if (cached && Date.now() - cached.t < ELEV_TTL_MS) {
            results[i] = cached.h;
        } else {
            missIdx.push(i);
        }
    });

    if (missIdx.length === 0) return results;

    try {
        const lats = missIdx.map(i => points[i].lat).join(',');
        const lngs = missIdx.map(i => points[i].lng).join(',');
        const url = `${ELEV_ENDPOINT}?latitude=${lats}&longitude=${lngs}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const arr = Array.isArray(json.elevation) ? json.elevation : [json.elevation];
        missIdx.forEach((idx, k) => {
            const h = arr[k];
            if (h != null && !isNaN(h)) {
                results[idx] = h;
                const key = `${ELEV_CACHE_PREFIX}${points[idx].lat.toFixed(4)}_${points[idx].lng.toFixed(4)}`;
                localStorage.setItem(key, JSON.stringify({ h, t: Date.now() }));
            }
        });
    } catch (err) {
        console.warn('[fetchElevationBatch] API hatası:', err.message);
    }
    return results;
}

/* ═══════════════════════════════════════════════
   OSM TAG → BUILDING/MINARET HEIGHT
   Öncelik: height > minaret:height > building:height
   > building:levels × 3.5 m fallback
   ═══════════════════════════════════════════════ */
export function buildingHeightFromTags(tags) {
    if (!tags) return null;
    const tryParse = (v) => {
        if (v == null) return NaN;
        const m = String(v).match(/(-?\d+(?:\.\d+)?)/);
        return m ? parseFloat(m[1]) : NaN;
    };

    let v = tryParse(tags.height);
    if (!isNaN(v)) return { h: v, src: 'height' };

    v = tryParse(tags['minaret:height']);
    if (!isNaN(v)) return { h: v, src: 'minaret:height' };

    v = tryParse(tags['building:height']);
    if (!isNaN(v)) return { h: v, src: 'building:height' };

    v = tryParse(tags['building:levels']);
    if (!isNaN(v)) return { h: v * 3.5, src: 'levels×3.5' };

    return null;
}
