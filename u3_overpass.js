/* ═══════════════════════════════════════════════
   OVERPASS API CLIENT — Cami / Minare Sorgu
   10 km halka içindeki Müslüman ibadet yerleri.
   Cache: localStorage ('fcu_u3_mosques_<lat>_<lng>_<r>')
   ═══════════════════════════════════════════════ */
import { buildingHeightFromTags } from './u3_elevation.js';

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.fr/api/interpreter'
];

/**
 * Belirtilen merkez etrafında camileri çek.
 * @param {number} lat
 * @param {number} lng
 * @param {number} radiusM  - metre
 * @returns {Promise<Array<{id, name, lat, lng, height, source}>>}
 */
export async function fetchMosques(lat, lng, radiusM = 10000) {
  const cacheKey = `fcu_u3_mosques_${lat.toFixed(4)}_${lng.toFixed(4)}_${Math.round(radiusM)}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const obj = JSON.parse(cached);
      // 24 saat cache TTL
      if (Date.now() - obj.t < 24 * 3600 * 1000) {
        return obj.data;
      }
    } catch (_) { /* fallthrough */ }
  }

  // Müslüman ibadet yerleri + ayrı tag'lenmiş minareler
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusM},${lat},${lng});
      way["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusM},${lat},${lng});
      node["man_made"="minaret"](around:${radiusM},${lat},${lng});
    );
    out center tags;
  `.trim();

  let lastError = null;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(query)
      });
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status} from ${endpoint}`);
        continue;
      }
      const json = await res.json();
      const mosques = parseOverpassResponse(json);
      // Yakınlığa göre sırala
      mosques.forEach(m => {
        m.distance = haversine(lat, lng, m.lat, m.lng);
      });
      mosques.sort((a, b) => a.distance - b.distance);

      localStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), data: mosques }));
      return mosques;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error('Tüm Overpass uçları başarısız.');
}

function parseOverpassResponse(json) {
  if (!json || !Array.isArray(json.elements)) return [];

  const out = [];
  const seen = new Set();

  for (const el of json.elements) {
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat == null || lng == null) continue;

    const tags = el.tags || {};
    const name = tags.name || tags['name:tr'] || tags['alt_name'] || '(İsimsiz Cami)';
    const isMinaret = tags.man_made === 'minaret';

    // Yakın duplicate ele (≤ 25 m'de aynı isim)
    const key = `${name}|${lat.toFixed(4)}|${lng.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const heightInfo = buildingHeightFromTags(tags);
    out.push({
      id: `${el.type}_${el.id}`,
      name,
      lat,
      lng,
      height: heightInfo ? heightInfo.h : null,    // null ise UI default minare h kullanır
      heightSource: heightInfo ? heightInfo.src : null,
      isMinaret,
      tags                                          // ham tag'ler ileri kullanım için
    });
  }
  return out;
}

/* Haversine — küresel mesafe (m) */
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
          + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
