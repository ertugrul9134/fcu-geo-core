/* ═══════════════════════════════════════════════
   UYGULAMA-3 ENGINE — Silsile Düşey Açı Hesabı
   Saf fonksiyonlar (test edilebilir, side-effect yok)
   ═══════════════════════════════════════════════ */

const GON_TO_RAD = Math.PI / 200.0;

/* Gon normalizasyonu [0, 400) */
export function normalizeGon(a) {
  a = a % 400;
  return a < 0 ? a + 400 : a;
}

/* Yüz II → Yüz I uzayına çevir.
   Teodolit 180° çevrildiğinde zenith okuması Z_II,
   düzeltilmiş karşılığı: Z_II_düz = 400 − Z_II.
   Kollimasyon hatası c = ½·(Z_I + Z_II − 400). */
export function reduceFacePair(Z_I, Z_II) {
  if (Z_I == null || Z_II == null) return null;
  const Z_II_corr = 400 - Z_II;
  const Z_mean = 0.5 * (Z_I + Z_II_corr);
  const c = 0.5 * (Z_I + Z_II - 400);   // kollimasyon (gon)
  return {
    Z_mean: normalizeGon(Z_mean),
    alpha:  100 - normalizeGon(Z_mean), // yükseklik açısı (gon, +yukarı)
    c:      c
  };
}

/* Bir silsile (1 round) için tüm hedefleri indir + std hesapla.
   obs: { targets: [{ Z_I, Z_II }, ...] }
   Dönen: per-target reduced + global std (n−1 ile). */
export function reduceSilsile(obs) {
  const reduced = obs.targets.map(t => {
    const r = reduceFacePair(t.Z_I, t.Z_II);
    return r ? { ...r, mosqueId: t.mosqueId, Z_I: t.Z_I, Z_II: t.Z_II } : null;
  });

  const valid = reduced.filter(r => r !== null);
  if (valid.length === 0) {
    return { reduced, s_collimation: null, s_direction: null, n: 0 };
  }

  // Kollimasyon dağılımı std (1 silsilede c değerlerinin tutarlılığı)
  const cMean = valid.reduce((acc, r) => acc + r.c, 0) / valid.length;
  const cVarSum = valid.reduce((acc, r) => acc + (r.c - cMean) ** 2, 0);
  const s_collimation = valid.length > 1 ? Math.sqrt(cVarSum / (valid.length - 1)) : 0;

  // Bir doğrultunun (yarı silsile) std'si — yüz I/II farkından (Bessel formülü):
  // Bir gözlemin std'si σ ≈ √(Σ d² / 2n), d = Z_I + Z_II − 400 = 2c
  const dSqSum = valid.reduce((acc, r) => acc + (2 * r.c) ** 2, 0);
  const s_direction = Math.sqrt(dSqSum / (2 * valid.length));   // bir gözlem (yüz I veya II)
  const s_mean = s_direction / Math.sqrt(2);                     // çift-yüz ortalaması (kesin)

  return {
    reduced,             // [{ mosqueId, Z_I, Z_II, Z_mean, alpha, c }, ...]
    n: valid.length,
    s_collimation,       // gon
    s_direction,         // gon (bir yüz)
    s_mean               // gon (kesin = yüz I+II ortalaması)
  };
}

/* TUREF/TM30 düzleminde Öklid mesafesi (10 km için yeterli).
   Y/X metre cinsinden. */
export function planarDistance(Y1, X1, Y2, X2) {
  const dy = Y2 - Y1;
  const dx = X2 - X1;
  return Math.sqrt(dy * dy + dx * dx);
}

/* Azimut (gon) — 2. temel ödev, kuadran düzeltmeli */
export function planarAzimuth(Y1, X1, Y2, X2) {
  const dy = Y2 - Y1;
  const dx = X2 - X1;
  if (Math.abs(dy) < 1e-9 && Math.abs(dx) < 1e-9) return 0;

  const RAD_TO_GON = 200.0 / Math.PI;
  const base = dx !== 0
    ? Math.abs(Math.atan(Math.abs(dy / dx))) * RAD_TO_GON
    : 100.0;

  let az;
  if      (dy >= 0 && dx >= 0) az = base;
  else if (dy >= 0 && dx <  0) az = 200 - base;
  else if (dy <  0 && dx <  0) az = 200 + base;
  else                         az = 400 - base;
  return normalizeGon(az);
}

/* Düşey açıdan yükseklik farkı.
   Δh = D · cot(Z̄) + (1−k) · D² / (2R) + (i − t)
   - D : yatay mesafe (m)
   - Z̄ : ortalama zenith (gon)
   - k : refraksiyon katsayısı
   - R : yer yarıçapı (m)
   - i : alet yüksekliği (m)  [istasyon zemininden teodolit ekseni]
   - t : hedef yüksekliği (m) [cami zemininden minare ucu, varsayım]
   Dönen Δh: hedef − istasyon (m) */
export function trigDeltaH(D, Z_mean_gon, k, R, i, t) {
  const Zr = Z_mean_gon * GON_TO_RAD;
  const cotZ = Math.cos(Zr) / Math.sin(Zr);
  const dh_geom = D * cotZ;
  const dh_corr = (1 - k) * D * D / (2 * R);  // earth-curvature & refraksiyon
  return dh_geom + dh_corr + (i - t);
}

/* Verilen ölçüm + hedef (lat/lng) için teorik zenith açısını hesapla.
   Hedef yüksekliği H_target_top (cami zemini + minare h) ve
   istasyon h_station + i biliniyorsa ters yönde Z_teorik. */
export function theoreticalZenith(D, H_top, h_station, i, k, R) {
  // Δh = H_top − (h_station + i)
  // Δh = D · cot(Z) + (1−k)·D²/(2R)
  // → cot(Z) = (Δh − (1−k)·D²/(2R)) / D
  const dh_eff = (H_top - (h_station + i)) - (1 - k) * D * D / (2 * R);
  const cotZ = dh_eff / D;
  const Z_rad = Math.atan2(1, cotZ);   // (0, π) aralığında
  return Z_rad * (200.0 / Math.PI);    // gon
}

/* Tek hedef için tam jeodezik kıyas paketi.
   Girdi:
     stationY, stationX, stationH : istasyon koordinat + yükseklik
     mosqueY, mosqueX, mosqueH    : cami zemini koordinat + yükseklik (Overpass'tan veya manuel)
     Z_mean                       : ölçülmüş ortalama zenith (gon)
     constants                    : { k, R, i, t_minare }
   Çıktı:
     D, az, dh_olcum, H_top_olcum, H_top_assumed, residual, Z_theoretical */
export function compareTarget(stationY, stationX, stationH, mosqueY, mosqueX, mosqueH, Z_mean, constants) {
  const { k, R, i, t_minare } = constants;
  const D = planarDistance(stationY, stationX, mosqueY, mosqueX);
  const az = planarAzimuth(stationY, stationX, mosqueY, mosqueX);

  // Ölçümden hedef üstü yüksekliği (minare ucu) tahmini:
  // alet ekseni → hedef üstü, sonra hedef üstü = stationH + i + dh_geom + dh_corr
  const Zr = Z_mean * GON_TO_RAD;
  const cotZ = Math.cos(Zr) / Math.sin(Zr);
  const dh_geom = D * cotZ;
  const dh_corr = (1 - k) * D * D / (2 * R);
  const H_top_measured = stationH + i + dh_geom + dh_corr;

  // Varsayım/teorik: cami zemini + minare yüksekliği
  const H_top_assumed = (mosqueH != null ? mosqueH : stationH) + t_minare;
  const Z_theoretical = (mosqueH != null)
    ? theoreticalZenith(D, H_top_assumed, stationH, i, k, R)
    : null;

  return {
    D,
    az,
    dh_geom,
    dh_corr,
    H_top_measured,
    H_top_assumed,
    Z_theoretical,
    residual_Z: Z_theoretical != null ? (Z_mean - Z_theoretical) : null,  // gon
    residual_H: H_top_measured - H_top_assumed                            // m
  };
}

/* Gon → "G.cccc" → derece-dakika-saniye string'i (UI gösterimi)
   1 gon = 0.9° = 54' */
export function gonToDms(gon) {
  if (gon == null || isNaN(gon)) return '—';
  const deg = gon * 0.9;
  const d = Math.floor(deg);
  const minF = (deg - d) * 60;
  const m = Math.floor(minF);
  const s = (minF - m) * 60;
  return `${d}° ${m.toString().padStart(2, '0')}' ${s.toFixed(1).padStart(4, '0')}"`;
}

/* Format gon — sabit ondalık */
export function fmtGon(g, dp = 4) {
  return (g == null || isNaN(g)) ? '—' : g.toFixed(dp) + 'ᵍ';
}

export function fmtMeter(m, dp = 3) {
  return (m == null || isNaN(m)) ? '—' : m.toFixed(dp) + ' m';
}
