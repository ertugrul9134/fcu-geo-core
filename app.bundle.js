/* FCU Jeodezik Cekirdek — Bundled (offline-ready) */

// ══ data.js ══
const coordinates = {
   1: { Y: 406441.947, X: 4543909.806, h: 75.487 },
   2: { Y: 406451.502, X: 4543888.637, h: 75.935 },
   4: { Y: 406507.273, X: 4543855.893, h: 76.974 },
   6: { Y: 406541.769, X: 4543815.599, h: 76.659 },
   7: { Y: 406553.248, X: 4543820.737, h: 76.634 },
   8: { Y: 406592.305, X: 4543856.467, h: 76.958 },
   9: { Y: 406626.943, X: 4543896.068, h: 76.947 },
  10: { Y: 406657.426, X: 4543934.277, h: 76.990 },
  11: { Y: 406701.549, X: 4543985.043, h: 77.378 },
  13: { Y: 406576.234, X: 4543794.959, h: 76.200 },
  14: { Y: 406586.165, X: 4543772.053, h: 75.819 },
  15: { Y: 406618.482, X: 4543759.235, h: 74.899 },
  16: { Y: 406658.003, X: 4543729.279, h: 73.279 },
  17: { Y: 406686.137, X: 4543689.751, h: 71.856 },
  19: { Y: 406755.742, X: 4543650.138, h: 68.292 },
  20: { Y: 406788.797, X: 4543647.825, h: 67.771 },
  21: { Y: 406786.877, X: 4543630.170, h: 67.669 },
  22: { Y: 406663.003, X: 4543702.729, h: 72.770 },
  23: { Y: 406611.292, X: 4543740.439, h: 75.198 },
  24: { Y: 406585.473, X: 4543728.156, h: 76.093 },
  25: { Y: 406538.552, X: 4543664.137, h: 76.541 },
  26: { Y: 406528.597, X: 4543630.585, h: 76.665 },
  27: { Y: 406506.705, X: 4543625.697, h: 76.642 },
  28: { Y: 406455.960, X: 4543560.048, h: 75.513 },
  29: { Y: 406377.100, X: 4543583.416, h: 73.974 },
  30: { Y: 406364.213, X: 4543621.386, h: 73.826 },
  31: { Y: 406329.943, X: 4543634.799, h: 73.278 },
  32: { Y: 406335.009, X: 4543653.787, h: 72.849 },
  33: { Y: 406353.840, X: 4543679.960, h: 75.048 },
  34: { Y: 406323.456, X: 4543689.523, h: 71.956 },
  35: { Y: 406305.830, X: 4543693.359, h: 70.976 },
  36: { Y: 406313.770, X: 4543730.480, h: 71.884 },
  37: { Y: 406371.122, X: 4543736.251, h: 72.663 },
  38: { Y: 406337.935, X: 4543765.139, h: 73.294 },
  40: { Y: 406348.927, X: 4543817.120, h: 73.957 },
  41: { Y: 406355.577, X: 4543843.637, h: 74.653 },
  43: { Y: 406364.499, X: 4543872.444, h: 75.285 },
  44: { Y: 406345.047, X: 4543872.284, h: 75.149 },
  45: { Y: 406373.150, X: 4543897.785, h: 75.399 },
  46: { Y: 406352.121, X: 4543892.607, h: 75.178 },
  47: { Y: 406359.404, X: 4543910.873, h: 75.166 },
  48: { Y: 406364.110, X: 4543921.629, h: 75.105 },
  49: { Y: 406387.985, X: 4543930.944, h: 75.310 },
  50: { Y: 406370.920, X: 4543937.417, h: 74.822 },
  51: { Y: 406381.983, X: 4543875.779, h: 75.120 },
  52: { Y: 406415.664, X: 4543860.774, h: 75.437 }
};

const measurements = [
  { dn: 50, bn: 49, dir: 238.2462, dist: 18.233 },
  { dn: 50, bn: 45, dir: 311.6375, dist: 39.707 },
  { dn: 50, bn: 48, dir: 339.7300, dist: 28.947 },

  { dn: 49, bn: 45, dir: 0.4443, dist: null },
  { dn: 49, bn: 50, dir: 96.6697, dist: 18.283 },

  { dn: 40, bn: 41, dir: 0.0, dist: 27.336 },
  { dn: 40, bn: 44, dir: 379.9454, dist: 55.322 },

  { dn: 44, bn: 46, dir: 0.0002, dist: 21.536 },
  { dn: 44, bn: 41, dir: 156.2100, dist: 30.543 },
  { dn: 44, bn: 43, dir: 78.1708, dist: 19.491 },

  { dn: 47, bn: 48, dir: 397.7121, dist: 11.755 },
  { dn: 47, bn: 45, dir: 119.7639, dist: null },
  { dn: 47, bn: 46, dir: 195.4156, dist: null },

  { dn: 48, bn: 50, dir: 34.0989, dist: null },
  { dn: 48, bn: 49, dir: 84.4346, dist: null },
  { dn: 48, bn: 45, dir: 184.9462, dist: null },
  { dn: 48, bn: 47, dir: 234.3949, dist: null },

  { dn: 45, bn: 49, dir: 3.5519, dist: null },
  { dn: 45, bn: 50, dir: 373.6579, dist: null },
  { dn: 45, bn: 48, dir: 354.1096, dist: null },
  { dn: 45, bn: 47, dir: 325.6086, dist: null },
  { dn: 45, bn: 46, dir: 262.4766, dist: null },
  { dn: 45, bn: 43, dir: 198.7309, dist: null },

  { dn: 46, bn: 47, dir: 388.5951, dist: 19.665 },
  { dn: 46, bn: 45, dir: 49.2056, dist: null },
  { dn: 46, bn: 43, dir: 129.4745, dist: null },
  { dn: 46, bn: 41, dir: 185.8785, dist: null },

  { dn: 43, bn: 44, dir: 80.3514, dist: 19.483 },
  { dn: 43, bn: 46, dir: 65.3898, dist: 23.690 }
];


// ══ synth_data.js ══
/* =============================================================
   SYNTHETIC DATA GENERATOR — Olcme Uygulamasi
   Generates realistic field measurements for all uygulamalar.
   Uses known coordinates as ground truth, adds instrument-grade
   Gaussian noise. Personalized per student ID (last 2 digits = XX).

   Student: 24046607 → XX = 07
     mod_100XX = 1.0007  (U4 distance multiplier)
     mod_001XX = 0.0007  (U4/U3 direction additive, gon)
     mod_10XX  = 1.007   (U5 RS height additive, m)

   Instruments: T2 theodolite (~3" angle), EDM (3mm+2ppm)
   ============================================================= */

const GON_TO_RAD = Math.PI / 200.0;
const RAD_TO_GON = 200.0 / Math.PI;

/* ─── Gaussian noise (Box-Muller) ────────────── */
function gauss(mean = 0, sigma = 1) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function normalizeGon(a) {
  return ((a % 400) + 400) % 400;
}

/* ─── True geometrics from known coordinates ──── */
function trueAzimuthDist(ya, xa, yb, xb) {
  const dy = yb - ya;
  const dx = xb - xa;
  const dist = Math.sqrt(dy * dy + dx * dx);
  if (dist < 1e-9) return { az: 0, dist: 0 };
  const base = dx !== 0
    ? Math.abs(Math.atan(Math.abs(dy / dx))) * RAD_TO_GON
    : 100;
  let az;
  if (dy >= 0 && dx >= 0) az = base;
  else if (dy >= 0 && dx < 0) az = 200 - base;
  else if (dy < 0 && dx < 0) az = 200 + base;
  else az = 400 - base;
  return { az: normalizeGon(az), dist };
}

/* ─── Student modifiers ───────────────────────── */
/**
 * @param {number} studentId — full student number
 * @returns {{XX: number, mod_100XX: number, mod_001XX: number, mod_10XX: number}}
 */
function studentModifiers(studentId) {
  const XX = studentId % 100;
  return {
    XX,
    mod_100XX: 1.0 + XX / 10000,
    mod_001XX: 0.0 + XX / 10000,
    mod_10XX: 1.0 + XX / 1000,
  };
}

/* ═══════════════════════════════════════════════
   U2 — Triangle measurements
   For a triangle (A,B,C), generate measurements as if
   from a theodolite at each station.
   σ_angle = 3" ≈ 0.0009 gon (T2 grade)
   σ_dist  = 3mm + 2ppm
   ═══════════════════════════════════════════════ */
/**
 * @param {object} coords — known coordinates DB
 * @param {Array<[number,number]>} edges — [[fromNode, toNode], ...]
 * @param {number} studentId
 * @returns {Array<{dn, bn, dir, dist}>}
 */
function synthU2(coords, edges, studentId = 24046607) {
  const { mod_001XX } = studentModifiers(studentId);
  const ANGLE_NOISE_GON = 0.0009;
  const results = [];
  for (const [dn, bn] of edges) {
    const a = coords[dn], b = coords[bn];
    if (!a || !b) continue;
    const { az, dist } = trueAzimuthDist(a.Y, a.X, b.Y, b.X);
    const noisyDist = dist + gauss(0, 0.003 + 2e-6 * dist);
    const noisyDir = normalizeGon(az + gauss(0, ANGLE_NOISE_GON));
    results.push({ dn, bn, dir: +noisyDir.toFixed(4), dist: dist != null ? +noisyDist.toFixed(3) : null });
  }
  return results;
}

/* ═══════════════════════════════════════════════
   U3 — Silsile zenith observations
   Station observes N targets → 2 full silsile of
   face-I / face-II zenith angle pairs.
   Collimation error model: c ~ 0.0010 gon ± 0.0002
   Reading noise: σ_zenith = 0.0003 gon (~1")
   ═══════════════════════════════════════════════ */
/**
 * @param {object} coords
 * @param {number} stationId
 * @param {number[]} targetIds
 * @param {number} studentId
 * @returns {{silsileler: Array, collimation_c: number, sigma_zenith: number}}
 */
function synthU3(coords, stationId, targetIds, studentId = 24046607) {
  const { XX } = studentModifiers(studentId);
  const COLLIM_C = 0.0010 + gauss(0, 0.0002);
  const ZENITH_NOISE = 0.0003;
  const station = coords[stationId];
  if (!station) return null;

  const silsileler = [];
  for (let round = 0; round < 2; round++) {
    const targets = targetIds.map(tid => {
      const t = coords[tid];
      if (!t) return null;
      const { dist } = trueAzimuthDist(station.Y, station.X, t.Y, t.X);
      const dh = t.h - station.h;
      const Z_true = 100 - Math.atan2(dh, dist) * RAD_TO_GON;
      const Z_I = normalizeGon(Z_true + COLLIM_C + gauss(0, ZENITH_NOISE));
      const Z_II = normalizeGon((400 - Z_true) + COLLIM_C + gauss(0, ZENITH_NOISE));
      return {
        mosqueId: tid,
        Z_I: +Z_I.toFixed(4),
        Z_II: +Z_II.toFixed(4),
        Z_true: +Z_true.toFixed(4),
        dist: +dist.toFixed(3),
        dh: +dh.toFixed(3),
      };
    }).filter(Boolean);
    silsileler.push({ stationId, targets, round: round + 1 });
  }
  return { silsileler, collimation_c: +COLLIM_C.toFixed(5), sigma_zenith: ZENITH_NOISE };
}

/* ═══════════════════════════════════════════════
   U4 — Traverse field measurements
   Traverse path: [n1, n2, ..., nk] through known
   start/end points. Each interior station gets
   2 half-silsile horizontal direction observations.
   Each edge: slope distance + zenith angle.
   ═══════════════════════════════════════════════ */
/**
 * @param {object} coords
 * @param {number[]} traversePath
 * @param {number} studentId
 * @returns {{stations: Array, edges: Array, XX: number}}
 */
function synthU4(coords, traversePath, studentId = 24046607) {
  const { mod_100XX, mod_001XX, XX } = studentModifiers(studentId);
  const ANGLE_NOISE = 0.0009;
  const DIST_NOISE_BASE = 0.003;
  const DIST_NOISE_PPM = 2e-6;

  const stations = [];
  const edges = [];

  // Break angles at interior stations
  for (let i = 1; i < traversePath.length - 1; i++) {
    const prev = traversePath[i - 1], curr = traversePath[i], next = traversePath[i + 1];
    const a = coords[prev], b = coords[curr], c = coords[next];
    if (!a || !b || !c) continue;

    const azBA = trueAzimuthDist(b.Y, b.X, a.Y, a.X).az;
    const azBC = trueAzimuthDist(b.Y, b.X, c.Y, c.X).az;
    const betaTrue = normalizeGon(azBC - azBA + 400);

    // 2 half-silsile (face I → face II)
    const faceI_1 = normalizeGon(betaTrue + mod_001XX * 100 + gauss(0, ANGLE_NOISE));
    const faceII_1 = normalizeGon(faceI_1 + 200 + gauss(0, ANGLE_NOISE * 0.5));
    const faceI_2 = normalizeGon(faceI_1 + gauss(0, ANGLE_NOISE));
    const faceII_2 = normalizeGon(faceI_2 + 200 + gauss(0, ANGLE_NOISE * 0.5));

    stations.push({
      stationId: curr,
      prevId: prev,
      nextId: next,
      breakAngleTrue: +betaTrue.toFixed(4),
      halfSilsile1: { I: +faceI_1.toFixed(4), II: +faceII_1.toFixed(4) },
      halfSilsile2: { I: +faceI_2.toFixed(4), II: +faceII_2.toFixed(4) },
      breakAngleObserved: +normalizeGon((faceI_1 + normalizeGon(faceII_1 - 200)) / 2).toFixed(4),
    });
  }

  // Edge distances
  for (let i = 0; i < traversePath.length - 1; i++) {
    const a = coords[traversePath[i]], b = coords[traversePath[i + 1]];
    if (!a || !b) continue;
    const { dist: horizDist } = trueAzimuthDist(a.Y, a.X, b.Y, b.X);
    const dh = b.h - a.h;
    const slopeDist = Math.sqrt(horizDist * horizDist + dh * dh);
    const Z_true = 100 - Math.atan2(dh, horizDist) * RAD_TO_GON;
    const noisySlope = slopeDist * mod_100XX + gauss(0, DIST_NOISE_BASE + DIST_NOISE_PPM * slopeDist);
    const noisyZ = Z_true + gauss(0, 0.0005);
    edges.push({
      from: traversePath[i],
      to: traversePath[i + 1],
      slopeDist: +noisySlope.toFixed(4),
      zenithAngle: +noisyZ.toFixed(4),
      horizontalDist: +(noisySlope * Math.sin(noisyZ * GON_TO_RAD)).toFixed(4),
      dh_true: +dh.toFixed(3),
    });
  }

  return { stations, edges, XX };
}

/* ═══════════════════════════════════════════════
   U5 — Leveling measurements
   Geometric (mira readings) + trigonometric
   (zenith + slope distance) along traverse.
   RS benchmark heights: +1.0XX per student ID.
   Each leg: 2 setups for geometric leveling.
   ═══════════════════════════════════════════════ */
/**
 * @param {object} coords
 * @param {number[]} traversePath
 * @param {number[]} rsPointIds — RS benchmark point IDs
 * @param {number} studentId
 * @returns {{rsHeights: object, levelingLegs: Array, trigLegs: Array, XX: number}}
 */
function synthU5(coords, traversePath, rsPointIds, studentId = 24046607) {
  const { mod_10XX, XX } = studentModifiers(studentId);
  const MIRO_NOISE = 0.001;

  // Known RS heights with student modifier
  const rsHeights = {};
  for (const rsId of rsPointIds) {
    if (coords[rsId]) rsHeights[rsId] = +(coords[rsId].h + mod_10XX).toFixed(3);
  }

  const levelingLegs = [];
  const trigLegs = [];

  for (let i = 0; i < traversePath.length - 1; i++) {
    const a = coords[traversePath[i]], b = coords[traversePath[i + 1]];
    if (!a || !b) continue;
    const dh_true = b.h - a.h;

    // Geometric: 2 setups per leg
    const setups = [];
    for (let s = 0; s < 2; s++) {
      const dh_part = dh_true / 2;
      const BS = 1.5 + (s * 0.5) + gauss(0, MIRO_NOISE);
      const FS = BS - dh_part + gauss(0, MIRO_NOISE);
      setups.push({ BS: +BS.toFixed(3), FS: +FS.toFixed(3), dh_observed: +(BS - FS).toFixed(3) });
    }
    const dh_geo = setups.reduce((sum, x) => sum + x.dh_observed, 0);

    // Trigonometric
    const { dist: horizDist } = trueAzimuthDist(a.Y, a.X, b.Y, b.X);
    const slopeDist = Math.sqrt(horizDist * horizDist + dh_true * dh_true);
    const Z_true = 100 - Math.atan2(dh_true, horizDist) * RAD_TO_GON;
    const i = 1.55;
    const t = 1.60;
    const k = 0.13;
    const R = 6371000;
    const dh_trig = Math.atan2(
      slopeDist * Math.cos(Z_true * GON_TO_RAD) - i + t - ((1 - k) / (2 * R)) * horizDist * horizDist,
      1
    ) * 0 + slopeDist * Math.cos(Z_true * GON_TO_RAD) + i - t + ((1 - k) / (2 * R)) * horizDist * horizDist;
    // ^ fixes for trig: Δh = S·cos(Z) + i - t + (1-k)/(2R)·S²  (zenith angle Z measured from zenith)
    const dh_trig_clean = slopeDist * Math.cos(Z_true * GON_TO_RAD) + i - t + ((1 - k) / (2 * R)) * horizDist * horizDist;

    levelingLegs.push({
      from: traversePath[i], to: traversePath[i + 1],
      setups, dh_geo: +dh_geo.toFixed(3), dh_true: +dh_true.toFixed(3),
      dh_diff: +(dh_geo - dh_true).toFixed(3),
    });

    trigLegs.push({
      from: traversePath[i], to: traversePath[i + 1],
      slopeDist: +(slopeDist + gauss(0, 0.005)).toFixed(4),
      zenithAngle: +(Z_true + gauss(0, 0.0003)).toFixed(4),
      i, t, k, R,
      dh_trig: +dh_trig_clean.toFixed(3), dh_true: +dh_true.toFixed(3),
      dh_diff: +(dh_trig_clean - dh_true).toFixed(3),
    });
  }

  return { rsHeights, levelingLegs, trigLegs, XX };
}

/* ═══════════════════════════════════════════════
   U6 — RTK GPS simulated measurements
   cm-level horizontal, 2.5cm vertical noise.
   EGM96 undulation applied for ellipsoidal→orthometric.
   ═══════════════════════════════════════════════ */
/**
 * @param {object} coords
 * @param {number[]} pointIds
 * @param {number} studentId
 * @returns {{results: object, XX: number}}
 */

/* ─── Real WGS84 lookup (from KML Google Earth) ── */
/**
 * Use authoritative WGS84 coordinates from data_wgs84.js
 * when available, otherwise fall back to approximation.
 */
let _wgs84Cache = null;
function setWgs84Data(data) { _wgs84Cache = data; }
function getWgs84(pid) {
  if (_wgs84Cache && _wgs84Cache[pid]) return _wgs84Cache[pid];
  return null;
}
function synthU6(coords, pointIds, studentId = 24046607) {
  const { XX } = studentModifiers(studentId);
  const GPS_NOISE_HRZ = 0.015;
  const GPS_NOISE_VRT = 0.025;

  const results = {};
  for (const pid of pointIds) {
    const pt = coords[pid];
    if (!pt) continue;

    // Approximate WGS84 for Davutpasa area
    const dY = pt.Y - 406500;
    const dX = pt.X - 4543700;
    const lat_approx = 41.0241 + dX / 111320.0;
    const lon_approx = 28.8866 + dY / (111320.0 * Math.cos(41.0241 * Math.PI / 180));

    // EGM96 undulation (~36.5 m for this area)
    const N = 36.5 + (lat_approx - 41.0) * 2.0 + (lon_approx - 28.9) * 1.5;
    const h_ell = pt.h + N + gauss(0, GPS_NOISE_VRT);
    const H_rtk = h_ell - N;

    results[pid] = {
      lat: +(lat_approx + gauss(0, GPS_NOISE_HRZ / 111320.0)).toFixed(8),
      lon: +(lon_approx + gauss(0, GPS_NOISE_HRZ / (111320.0 * Math.cos(lat_approx * Math.PI / 180)))).toFixed(8),
      h_ellipsoidal: +h_ell.toFixed(3),
      N_geoid: +N.toFixed(3),
      H_orthometric_rtk: +H_rtk.toFixed(3),
      H_true: pt.h,
      H_diff: +(H_rtk - pt.h).toFixed(3),
    };
  }
  return { results, XX };
}


// ══ u4_engine.js ══
/* =============================================================
   U4 ENGINE — Dayali Poligon Hesabi (Traverse)
   Pure functions. All angles in GON (grad).
   Student ID 24046607 → XX = 07.
   ============================================================= */

const GON_TO_RAD = Math.PI / 200.0;
const RAD_TO_GON = 200.0 / Math.PI;

function normalizeGon(a) {
  return ((a % 400) + 400) % 400;
}

/* ─── Compute azimuth from coordinates ────────── */
function computeAzimuth(ya, xa, yb, xb) {
  const dy = yb - ya;
  const dx = xb - xa;
  const dist = Math.sqrt(dy * dy + dx * dx);
  if (dist < 1e-9) return 0;
  const base = dx !== 0
    ? Math.abs(Math.atan(Math.abs(dy / dx))) * RAD_TO_GON
    : 100;
  if (dy >= 0 && dx >= 0) return base;
  else if (dy >= 0 && dx < 0) return 200 - base;
  else if (dy < 0 && dx < 0) return 200 + base;
  else return 400 - base;
}

/* ─── Atmospheric correction (1st velocity) ──── */
/**
 * Multiply slope distance by K_atm = 1.00XX
 * n0 = 1.000290, lambda_M = 0.850 um, alpha = 0.003661
 * Simplified: K_atm = 1 + XX/10000
 */
function atmosphericCorrection(slopeDist, XX) {
  return slopeDist * (1 + XX / 10000);
}

/* ─── Slope → horizontal reduction ────────────── */
/**
 * S_horiz = S_slope × sin(Z)  where Z = zenith angle (gon)
 * Z=0gon = zenith, Z=100gon = horizon
 */
function slopeToHorizontal(slopeDist, zenithGon) {
  return slopeDist * Math.sin(zenithGon * GON_TO_RAD);
}

/* ─── Projection plane reduction ──────────────── */
/**
 * S_proj = S_horiz × R / (R + H_mean)
 * R = 6371000 m
 */
function projectToPlane(horizontalDist, meanHeight, R = 6371000) {
  return horizontalDist * R / (R + meanHeight);
}

/* ─── Break angle from half-silsile ───────────── */
/**
 * Face I → Face II (teodolit 180° cevrildi = +200 gon)
 * 2 half-silsile → averaged direction → break angle
 */
function computeBreakAngle(halfSilsileler) {
  const dirs = halfSilsileler.map(hs => {
    const fi = normalizeGon(hs.I);
    const fii = normalizeGon(hs.II - 200);
    return (fi + fii) / 2;
  });
  const avg = dirs.reduce((a, b) => a + b, 0) / dirs.length;
  return { breakAngle: normalizeGon(avg), directions: dirs.map(d => +d.toFixed(4)) };
}

/* ─── Dependent traverse (dayali poligon) ──────── */
/**
 * Compute traverse coordinates from break angles and distances.
 * Bowditch (compass) rule for closure adjustment.
 *
 * @param {{Y:number,X:number}} start — known start point
 * @param {{Y:number,X:number}} end   — known end point
 * @param {number} azStart — initial azimuth start→first (gon)
 * @param {number} azEnd   — closing azimuth last→end (gon)
 * @param {number[]} breakAngles — β at each interior station (gon)
 * @param {number[]} distances — reduced horizontal distances (m)
 * @returns {{coords:Array, closure:{fx,fy,fs,relErr}, adjusted:Array, azimuths:Array}}
 */
function dependentTraverse(start, end, azStart, azEnd, breakAngles, distances) {
  const n = distances.length;

  // Forward azimuth propagation: α_i+1 = α_i + β_i + 200 [mod 400]
  const azimuths = [azStart];
  for (let i = 0; i < n - 1; i++) {
    azimuths.push(normalizeGon(azimuths[i] + breakAngles[i] + 200));
  }

  // Unclosed coordinates
  const coords = [{ Y: start.Y, X: start.X }];
  for (let i = 0; i < n; i++) {
    const prev = coords[i];
    const dy = distances[i] * Math.sin(azimuths[i] * GON_TO_RAD);
    const dx = distances[i] * Math.cos(azimuths[i] * GON_TO_RAD);
    coords.push({ Y: prev.Y + dy, X: prev.X + dx });
  }

  // Closure error
  const lastComp = coords[coords.length - 1];
  const fx = lastComp.Y - end.Y;
  const fy = lastComp.X - end.X;
  const fs = Math.sqrt(fx * fx + fy * fy);
  const totalDist = distances.reduce((a, b) => a + b, 0);
  const relErr = fs / totalDist;

  // Bowditch adjustment
  const adjusted = [{ Y: start.Y, X: start.X }];
  let cumDist = 0;
  for (let i = 0; i < n; i++) {
    cumDist += distances[i];
    const prev = adjusted[i];
    const dy = distances[i] * Math.sin(azimuths[i] * GON_TO_RAD);
    const dx = distances[i] * Math.cos(azimuths[i] * GON_TO_RAD);
    adjusted.push({
      Y: +(prev.Y + dy - fx * cumDist / totalDist).toFixed(4),
      X: +(prev.X + dx - fy * cumDist / totalDist).toFixed(4),
    });
  }

  return {
    coords: coords.map(c => ({ Y: +c.Y.toFixed(4), X: +c.X.toFixed(4) })),
    closure: { fx: +fx.toFixed(4), fy: +fy.toFixed(4), fs: +fs.toFixed(4), relErr: +relErr.toFixed(8) },
    adjusted: adjusted.map(c => ({ Y: +c.Y.toFixed(4), X: +c.X.toFixed(4) })),
    azimuths: azimuths.map(a => +a.toFixed(4)),
  };
}

/* ─── Full U4 pipeline ────────────────────────── */
/**
 * Complete U4: raw field → reduced edges → traverse → adjusted coords
 *
 * @param {object} coords — all known points {id: {Y,X,h}}
 * @param {number[]} traversePath — [startKnown, ...interiorStations, endKnown]
 * @param {Array<{from,to,slopeDist,zenithAngle}>} rawEdges
 * @param {Array<{breakAngleObserved}>} rawStations
 * @param {number} XX — student ID last 2 digits
 */
function computeU4(coords, traversePath, rawEdges, rawStations, XX = 7) {
  const startPt = coords[traversePath[0]];
  const endPt = coords[traversePath[traversePath.length - 1]];
  const nInterior = traversePath.length - 2;

  // Reduce edges
  const reducedEdges = [];
  for (const edge of rawEdges) {
    const sCorr = atmosphericCorrection(edge.slopeDist, XX);
    const sHoriz = slopeToHorizontal(sCorr, edge.zenithAngle);
    const hFrom = coords[edge.from]?.h ?? 0;
    const hTo = coords[edge.to]?.h ?? 0;
    const hMean = (hFrom + hTo) / 2;
    const sProj = projectToPlane(sHoriz, hMean);
    reducedEdges.push({
      ...edge,
      sAtmCorr: +sCorr.toFixed(4),
      sHoriz: +sHoriz.toFixed(4),
      sProj: +sProj.toFixed(4),
      hMean: +hMean.toFixed(2),
    });
  }

  // Starting azimuth: traversePath[0] → traversePath[1]
  const az0 = computeAzimuth(
    coords[traversePath[0]].Y, coords[traversePath[0]].X,
    coords[traversePath[1]].Y, coords[traversePath[1]].X
  );

  // Closing azimuth: traversePath[n-2] → traversePath[n-1] (last known)
  const lastIdx = traversePath.length - 1;
  const azN = computeAzimuth(
    coords[traversePath[lastIdx - 1]].Y, coords[traversePath[lastIdx - 1]].X,
    coords[traversePath[lastIdx]].Y, coords[traversePath[lastIdx]].X
  );

  if (rawStations.length !== nInterior) {
    throw new Error(`Expected ${nInterior} break angles, got ${rawStations.length}`);
  }

  const breakAngles = rawStations.map(s => s.breakAngleObserved);
  const distances = reducedEdges.map(e => e.sProj);

  const result = dependentTraverse(startPt, endPt, az0, azN, breakAngles, distances);

  return {
    reducedEdges,
    azStart: +az0.toFixed(4),
    azEnd: +azN.toFixed(4),
    ...result,
  };
}

/* ─── Edge table formatter ────────────────────── */
function formatEdgeTable(reducedEdges) {
  return reducedEdges.map((e, i) => ({
    edge: `${e.from} → ${e.to}`,
    slopeDist: e.slopeDist,
    zenithGon: e.zenithAngle,
    sAtmCorr: e.sAtmCorr,
    sHoriz: e.sHoriz,
    hMean: e.hMean,
    sProj: e.sProj,
  }));
}

/* ─── Coordinate comparison table ─────────────── */
function compareCoordinates(trueCoords, computedCoords, path) {
  return computedCoords.map((c, i) => {
    const truePt = trueCoords[path[i]];
    if (!truePt) return null;
    return {
      point: path[i],
      Y_true: truePt.Y,
      X_true: truePt.X,
      Y_comp: c.Y,
      X_comp: c.X,
      dY: +(c.Y - truePt.Y).toFixed(4),
      dX: +(c.X - truePt.X).toFixed(4),
      dS: +Math.sqrt((c.Y - truePt.Y) ** 2 + (c.X - truePt.X) ** 2).toFixed(4),
    };
  }).filter(Boolean);
}


// ══ u6_engine.js ══
/* =============================================================
   U6 ENGINE — 3D Positioning (Uc Boyutlu Konumlama)
   RTK GPS → geoid → orthometric height conversion.
   Multi-method comparison (RTK vs Total Station vs Leveling).
   Measurement sketch (kroki) data generation.
   EGM96 undulation for Davutpasa area: N ≈ 36.5 m
   ============================================================= */

/* ─── Ellipsoidal → orthometric conversion ────── */
/**
 * H = h − N
 * where h = ellipsoidal height (GPS), N = geoid undulation (EGM96)
 */
function ellipsoidalToOrthometric(hEllipsoidal, NGeoid) {
  return hEllipsoidal - NGeoid;
}

/* ─── Orthometric → ellipsoidal ────────────────── */
function orthometricToEllipsoidal(H, NGeoid) {
  return H + NGeoid;
}

/* ─── EGM96 undulation (simplified for Davutpasa) ── */
/**
 * Bilinear interpolation on 10° EGM96 grid (embedded in u3_elevation.js).
 * For U6, we use a simplified model: N ≈ 36.5 + gradients
 * @param {number} lat — WGS84 latitude (degrees)
 * @param {number} lon — WGS84 longitude (degrees)
 * @returns {number} geoid undulation (m)
 */
function egm96Simple(lat, lon) {
  return 36.5 + (lat - 41.0) * 2.0 + (lon - 28.9) * 1.5;
}

/* ─── TUREF/TM30 → approximate WGS84 ──────────── */
/**
 * For the Davutpasa campus area.
 * Reference: point 41 ≈ (28.8866°E, 41.0241°N)
 */
function tm30ToWGS84Approx(Y, X) {
  const dY = Y - 406500;
  const dX = X - 4543700;
  const lat = 41.0241 + dX / 111320.0;
  const lon = 28.8866 + dY / (111320.0 * Math.cos(41.0241 * Math.PI / 180));
  return { lat, lon };
}

/* ─── Compare 3D coordinates ──────────────────── */
/**
 * Compare coordinates from multiple measurement methods.
 * @param {{Y,X,h}} trueCoord — known/true 3D coordinate
 * @param {{Y,X,h}|null} rtk — RTK GPS measurement
 * @param {{Y,X,h}|null} totalStation — total station measurement
 * @param {number|null} levelingHeight — geometric/trigonometric leveling result
 * @returns {{dY_rtk, dX_rtk, dH_rtk, dY_ts, dX_ts, dH_ts, dH_lev, ...}}
 */
function compare3DMethods(trueCoord, rtk, totalStation, levelingHeight) {
  const result = { point: trueCoord.pointId || '?' };

  if (rtk) {
    result.dY_rtk = +(rtk.Y - trueCoord.Y).toFixed(4);
    result.dX_rtk = +(rtk.X - trueCoord.X).toFixed(4);
    result.dS_rtk = +Math.sqrt(result.dY_rtk ** 2 + result.dX_rtk ** 2).toFixed(4);
    result.dH_rtk = +(rtk.h - trueCoord.h).toFixed(3);
  }

  if (totalStation) {
    result.dY_ts = +(totalStation.Y - trueCoord.Y).toFixed(4);
    result.dX_ts = +(totalStation.X - trueCoord.X).toFixed(4);
    result.dS_ts = +Math.sqrt(result.dY_ts ** 2 + result.dX_ts ** 2).toFixed(4);
    result.dH_ts = +(totalStation.h - trueCoord.h).toFixed(3);
  }

  if (levelingHeight !== null && levelingHeight !== undefined) {
    result.dH_leveling = +(levelingHeight - trueCoord.h).toFixed(3);
  }

  // Cross-method comparison
  if (rtk && totalStation) {
    result.rtk_vs_ts_dS = +Math.sqrt((rtk.Y - totalStation.Y) ** 2 + (rtk.X - totalStation.X) ** 2).toFixed(4);
    result.rtk_vs_ts_dH = +(rtk.h - totalStation.h).toFixed(3);
  }

  return result;
}

/* ─── Kroki data builder ──────────────────────── */
/**
 * Build structured data for A3 measurement sketch.
 * @param {Array<{id, Y, X, h, type}>} detailPoints — parcel corners, poles, trees, etc.
 * @param {Array<{from, to, distance}>} measuredEdges — tape-measured edges
 * @returns {{points: Array, edges: Array, bounds: {minY, maxY, minX, maxX}}}
 */
function buildKrokiData(detailPoints, measuredEdges = []) {
  if (!detailPoints.length) return { points: [], edges: [], bounds: null };

  const points = detailPoints.map(p => ({
    id: p.id,
    Y: p.Y,
    X: p.X,
    h: p.h,
    type: p.type || 'detail',
    label: p.label || `N${p.id}`,
  }));

  const edges = measuredEdges.map(e => ({
    from: e.from,
    to: e.to,
    distance: e.distance,
  }));

  const bounds = {
    minY: Math.min(...points.map(p => p.Y)),
    maxY: Math.max(...points.map(p => p.Y)),
    minX: Math.min(...points.map(p => p.X)),
    maxX: Math.max(...points.map(p => p.X)),
  };

  return { points, edges, bounds };
}

/* ─── RTK coordinate from synth data ──────────── */
/**
 * Convert synthU6 results into TUREF/TM30 coordinates for comparison.
 * @param {object} synthResult — from synthU6()
 * @param {object} coordsDB — known coordinates
 * @returns {Array<{id, Y, X, h}>}
 */
function rtkToTM30(synthResult, coordsDB) {
  const results = [];
  for (const [pid, data] of Object.entries(synthResult.results)) {
    const pt = coordsDB[pid];
    if (!pt) continue;
    // Convert WGS84 lat/lon back to approximate TUREF/TM30
    const dX = (data.lat - 41.0241) * 111320.0;
    const dY = (data.lon - 28.8866) * (111320.0 * Math.cos(41.0241 * Math.PI / 180));
    results.push({
      id: parseInt(pid),
      Y: +(406500 + dY).toFixed(4),
      X: +(4543700 + dX).toFixed(4),
      h: data.H_orthometric_rtk,
    });
  }
  return results;
}

/* ─── Multi-method comparison table ───────────── */
/**
 * Build full comparison table: true vs RTK vs Total Station vs Leveling
 * @param {object} trueCoords — known {id: {Y,X,h}}
 * @param {object} rtkResults — from synthU6 or real RTK
 * @param {object} tsResults — from U4 traverse adjusted coords
 * @param {object} levelHeights — from U5 dependent leveling
 * @param {number[]} pointIds — which points to compare
 * @returns {Array}
 */
function buildComparisonTable(trueCoords, rtkResults, tsResults, levelHeights, pointIds) {
  return pointIds.map(pid => {
    const truePt = trueCoords[pid];
    if (!truePt) return null;

    const rtk = rtkResults ? (rtkResults.results ? rtkResults.results[pid] : rtkResults[pid]) : null;
    const ts = tsResults ? tsResults[pid] : null;
    const levH = levelHeights ? levelHeights[pid] : null;

    return {
      pointId: pid,
      Y_true: truePt.Y, X_true: truePt.X, h_true: truePt.h,
      Y_rtk: rtk ? rtk.Y : null,
      X_rtk: rtk ? rtk.X : null,
      h_rtk: rtk ? (rtk.H_orthometric_rtk || rtk.h) : null,
      Y_ts: ts ? ts.Y : null,
      X_ts: ts ? ts.X : null,
      h_ts: ts ? ts.h : null,
      h_leveling: levH,
      dS_rtk: rtk ? +Math.sqrt((rtk.Y - truePt.Y) ** 2 + (rtk.X - truePt.X) ** 2).toFixed(4) : null,
      dS_ts: ts ? +Math.sqrt((ts.Y - truePt.Y) ** 2 + (ts.X - truePt.X) ** 2).toFixed(4) : null,
      dH_rtk: rtk ? +((rtk.H_orthometric_rtk || rtk.h) - truePt.h).toFixed(3) : null,
      dH_ts: ts ? +(ts.h - truePt.h).toFixed(3) : null,
      dH_leveling: levH ? +(levH - truePt.h).toFixed(3) : null,
    };
  }).filter(Boolean);
}


// ══ data_u5_real.js ══
/* =============================================================
   UYGULAMA-5 REAL FIELD DATA — Geometric Leveling
   Source: "uygulama-5 veriler.jpeg" (10 Haziran 2026)
   Nivo readings: BS + FS (mira, meters)
   Distance: horizontal distance between instrument and staff (m)
   ============================================================= */

/**
 * Each leg: { from, to, backsight_m, bs_dist_m, foresight_m, fs_dist_m }
 * BS = Geri okuma (back sight), FS = Ileri okuma (fore sight)
 * Delta_H = BS - FS
 * 
 * Based on OCR of field book page dated 10 June 2026, 15:48.
 * Student ID: 24046607 (Ertugrul - point 48)
 */
const levelingData = [
  { from: "N38",  to: "N40",  BS: 1.8820, bsDist: 31.86,  FS: 1.2285, fsDist: 22.34 },
  { from: "N40",  to: "N41",  BS: 1.8881, bsDist: 14.68,  FS: 1.1796, fsDist: 12.45 },
  { from: "N41",  to: "N43",  BS: 1.9222, bsDist: 17.05,  FS: 1.3398, fsDist: 12.48 },
  { from: "N43",  to: "N45",  BS: 1.5990, bsDist: 12.92,  FS: 1.4573, fsDist: 13.85 },
  { from: "N45",  to: "N49",  BS: 1.2817, bsDist: 12.57,  FS: 1.4136, fsDist: 23.76 },
  { from: "N49",  to: "AN14", BS: 1.1319, bsDist: 19.32,  FS: 0.8762, fsDist: 19.89 },
];

/**
 * RS (Nivelman) benchmark known heights for the leveling chain.
 * Student modifier: +1.007 (for XX=07, student 24046607)
 * Base heights from the fixed point coordinate table.
 */
const rsBenchmarks = {
  // N38, N40, N41, N43, N45, N49 are from the known point network
  "N38": { h_base: 73.294 },   // Point 38
  "N40": { h_base: 73.957 },   // Point 40
  "N41": { h_base: 74.653 },   // Point 41
  "N43": { h_base: 75.285 },   // Point 43
  "N45": { h_base: 75.399 },   // Point 45
  "N49": { h_base: 75.310 },   // Point 49
};

const studentInfo = {
  studentId: 24046607,
  name: "Ertugrul",
  pointId: 48,
  date: "2026-06-10",
  instrument: "Nivo (automatic level)",
  weather: "Clear",
};


// ══ data_u6_real.js ══
/* =============================================================
   UYGULAMA-6 REAL FIELD DATA — RTK GPS Measurements
   Source: "Uygulama-6 veriler.txt"
   Format: PointID, X (Northing, TUREF/TM30, m), Y (Easting, m), h (ellipsoidal, m)
   
   Points:
   - P.1-P.8: Parcel corner points
   - P.41: Repeat observation of P.4
   - N.38: Repeat observation of point 38
   - 100-110: Detail points (trees, poles, etc.)
   - 108-DIREK: Utility pole
   - 110-AGAC2: Tree #2
   ============================================================= */

const rtkMeasurements = [
  { id: "P1-1",   X: 4543867.769, Y: 406425.582, h_ell: 112.319, type: "parcel" },
  { id: "P.1",    X: 4543867.769, Y: 406425.590, h_ell: 112.319, type: "parcel" },
  { id: "P.12",   X: 4543867.776, Y: 406425.583, h_ell: 112.299, type: "parcel" },
  { id: "P.2",    X: 4543853.707, Y: 406411.949, h_ell: 112.316, type: "parcel" },
  { id: "P.4",    X: 4543847.580, Y: 406359.497, h_ell: 111.574, type: "parcel" },
  { id: "P.41",   X: 4543847.585, Y: 406359.496, h_ell: 111.566, type: "parcel_repeat" },
  { id: "P.5",    X: 4543809.224, Y: 406377.985, h_ell: 109.633, type: "parcel" },
  { id: "P.6",    X: 4543784.569, Y: 406384.339, h_ell: 109.476, type: "parcel" },
  { id: "P.7",    X: 4543761.763, Y: 406356.336, h_ell: 109.799, type: "parcel" },
  { id: "P.8",    X: 4543763.657, Y: 406339.134, h_ell: 110.184, type: "parcel" },
  { id: "N.38",   X: 4543763.683, Y: 406339.125, h_ell: 110.192, type: "control" },
  { id: "100",    X: 4543827.662, Y: 406352.243, h_ell: 110.765, type: "detail" },
  { id: "101",    X: 4543838.897, Y: 406355.467, h_ell: 111.071, type: "detail" },
  { id: "102",    X: 4543845.954, Y: 406361.058, h_ell: 111.561, type: "detail" },
  { id: "103",    X: 4543840.109, Y: 406367.959, h_ell: 110.773, type: "detail" },
  { id: "104",    X: 4543826.186, Y: 406356.707, h_ell: 110.761, type: "detail" },
  { id: "105",    X: 4543826.073, Y: 406355.463, h_ell: 110.769, type: "detail" },
  { id: "106",    X: 4543828.921, Y: 406350.525, h_ell: 110.920, type: "detail" },
  { id: "107",    X: 4543849.254, Y: 406356.407, h_ell: 111.471, type: "detail" },
  { id: "108-DIREK",  X: 4543847.853, Y: 406357.599, h_ell: 111.722, type: "pole" },
  { id: "109",    X: 4543837.666, Y: 406359.366, h_ell: 110.949, type: "detail" },
  { id: "110-AGAC2",  X: 4543829.713, Y: 406356.162, h_ell: 110.803, type: "tree" },
];

/**
 * EGM96 geoid undulation for Davutpasa area.
 * N ≈ 36.5 m (from embedded EGM96 grid in u3_elevation.js)
 * Orthometric height H = h_ellipsoidal - N
 */
const N_GEOID = 36.5;

const studentInfo = {
  studentId: 24046607,
  name: "Ertugrul",
  pointId: 48,
  instrument: "RTK GPS (YLDZ CORS)",
  date: "2026-06",
};


// ══ app.js ══
// [bundled import]/* ═══════════════════════════════════════════════
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
// [bundled import]// [bundled import]// [bundled import]// [bundled import]// [bundled import]this.u4 = new U4Controller(this);
        this.u5 = new U5Controller(this);
        this.u6 = new U6Controller(this)
/* ═══════════════════════════════════════════════
   U4 CONTROLLER — Poligon (Traverse)
   ═══════════════════════════════════════════════ */
class U4Controller {
    constructor(app) { this.app = app; this.map = null; this.synthData = null; this.markers = []; this.lineLayer = null; }
    activate() { const self = this; const el = document.getElementById('u4LoadBtn'); if (el) el.onclick = () => self.loadAndCalc(); if (!this.map) this.initMap(); setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 200); }
    initMap() { const el = document.getElementById('u4Map'); if (!el || this.map) return; this.map = L.map('u4Map', { zoomControl: true }).setView([41.0241, 28.8866], 17); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM', maxZoom: 20 }).addTo(this.map); }
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
        for (const pid of path) { const pt = coords[pid]; if (!pt) continue; const wgs = tm30ToWGS84Approx(pt.X, pt.Y); latlngs.push([wgs.lat, wgs.lon]); const isEP = (pid === path[0] || pid === path[path.length-1]); const m = L.circleMarker([wgs.lat, wgs.lon], { radius: isEP ? 8 : 6, fillColor: isEP ? '#2196f3' : '#ff9800', color: '#fff', weight: 2, fillOpacity: 0.9 }).bindPopup('<b>Nokta ' + pid + '</b><br>Y: ' + pt.Y.toFixed(3) + '<br>X: ' + pt.X.toFixed(3) + '<br>h: ' + pt.h.toFixed(3) + ' m' + (isEP ? '<br><em>Sabit nokta</em>' : '<br><em>Poligon noktası</em>')).addTo(this.map); this.markers.push(m); }
        this.lineLayer = L.polyline(latlngs, { color: '#ff9800', weight: 3, dashArray: '8,6' }).addTo(this.map);
        if (latlngs.length) this.map.fitBounds(latlngs, { padding: [40, 40] });
        const edges = this.synthData.edges;
        let html = '<div style="margin-bottom:0.5rem;font-size:0.75rem;color:var(--accent);"><strong>Kenar İndirgeme Tablosu</strong> (XX=' + XX + ', K_atm=1.00' + XX + ')</div><table style="width:100%;border-collapse:collapse;font-size:0.7rem;"><thead><tr style="color:var(--text-3);"><th>Kenar</th><th>S_eğik</th><th>Z (gon)</th><th>S_yatay</th><th>H_ort</th><th>S_proj</th></tr></thead><tbody>';
        for (const e of edges) { const hF = coords[e.from]?.h || 0, hT = coords[e.to]?.h || 0; const hM = ((hF + hT) / 2).toFixed(2); const sH = e.slopeDist * Math.sin(e.zenithAngle * Math.PI / 200); const sP = sH * 6371000 / (6371000 + parseFloat(hM)); html += '<tr><td>' + e.from + '→' + e.to + '</td><td>' + e.slopeDist.toFixed(4) + '</td><td>' + e.zenithAngle.toFixed(4) + '</td><td>' + sH.toFixed(4) + '</td><td>' + hM + '</td><td>' + sP.toFixed(4) + '</td></tr>'; }
        html += '</tbody></table>'; document.getElementById('u4EdgeTable').innerHTML = html;
        try { const result = computeU4(coords, path, edges, this.synthData.stations, XX); const { closure, adjusted } = result; let rh = '<div style="margin-bottom:0.5rem;font-size:0.75rem;color:var(--accent);"><strong>Poligon Dengeleme Sonuçları</strong></div><div style="display:flex;gap:1.5rem;flex-wrap:wrap;margin-bottom:0.5rem;font-size:0.78rem;background:var(--bg-3);padding:0.5rem;border-radius:6px;"><span>fx: <b style="color:' + (Math.abs(closure.fx)>0.05?'var(--danger)':'var(--accent)') + '">' + closure.fx.toFixed(4) + '</b> m</span><span>fy: <b style="color:' + (Math.abs(closure.fy)>0.05?'var(--danger)':'var(--accent)') + '">' + closure.fy.toFixed(4) + '</b> m</span><span>fs: <b style="color:' + (Math.abs(closure.fs)>0.05?'var(--danger)':'var(--accent)') + '">' + closure.fs.toFixed(4) + '</b> m</span><span>Bağıl: <b>1/' + Math.round(1/closure.relErr) + '</b></span></div><table style="width:100%;border-collapse:collapse;font-size:0.72rem;"><thead><tr style="color:var(--text-3);"><th>Nokta</th><th>Y_hesap</th><th>X_hesap</th><th>Y_gerçek</th><th>X_gerçek</th><th>dY (mm)</th><th>dX (mm)</th></tr></thead><tbody>';
        const comp = compareCoords4(coords, adjusted, path);
        for (const r of comp) rh += '<tr><td>' + r.point + '</td><td>' + r.Y_comp + '</td><td>' + r.X_comp + '</td><td>' + r.Y_true + '</td><td>' + r.X_true + '</td><td style="color:' + (Math.abs(r.dY)>0.05?'var(--danger)':'inherit') + '">' + (r.dY*1000).toFixed(1) + '</td><td style="color:' + (Math.abs(r.dX)>0.05?'var(--danger)':'inherit') + '">' + (r.dX*1000).toFixed(1) + '</td></tr>';
        rh += '</tbody></table><p style="font-size:0.68rem;color:var(--text-3);margin-top:0.25rem;">* Bowditch (pusula) kuralı ile dengelenmiştir. dY/dX mm cinsindendir.</p>'; document.getElementById('u4Results').innerHTML = rh; } catch (e) { document.getElementById('u4Results').innerHTML = '<p style="color:var(--danger)">Hata: ' + e.message + '</p>'; }
    }
}

/* ═══════════════════════════════════════════════
   U5 CONTROLLER — Nivelman (Leveling)
   ═══════════════════════════════════════════════ */
class U5Controller {
    constructor(app) { this.app = app; this.map = null; this.markers = []; this.lineLayer = null; }
    activate() { const self = this; const el = document.getElementById('u5LoadBtn'); if (el) el.onclick = () => self.loadReal(); if (!this.map) this.initMap(); setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 200); }
    initMap() { const el = document.getElementById('u5Map'); if (!el || this.map) return; this.map = L.map('u5Map', { zoomControl: true }).setView([41.0241, 28.8868], 17); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM', maxZoom: 20 }).addTo(this.map); }
    loadReal() {
        const self = this; const data = U5_REAL; const coords = this.app.db.coords; const XX = 7;
        self.markers.forEach(m => self.map.removeLayer(m)); self.markers = [];
        if (self.lineLayer) self.map.removeLayer(self.lineLayer);
        const chain = []; const seen = new Set();
        for (const leg of data) { for (const pid of [leg.from, leg.to]) { if (seen.has(pid)) continue; seen.add(pid); const numId = parseInt(pid.replace(/[^0-9]/g, '')); const pt = coords[numId]; if (pt) { const wgs = tm30ToWGS84Approx(pt.X, pt.Y); chain.push({ id: pid, numId, ...pt, lat: wgs.lat, lon: wgs.lon }); } } }
        const latlngs = chain.map(c => [c.lat, c.lon]);
        for (const c of chain) { const isRS = (c.id === 'N38' || c.id === 'N49'); const m = L.circleMarker([c.lat, c.lon], { radius: isRS ? 8 : 6, fillColor: isRS ? '#2196f3' : '#4caf50', color: '#fff', weight: 2, fillOpacity: 0.9 }).bindPopup('<b>' + c.id + '</b><br>h: ' + c.h.toFixed(3) + ' m' + (isRS ? '<br><em>RS Sabit Nokta</em>' : '')).addTo(self.map); self.markers.push(m); }
        self.lineLayer = L.polyline(latlngs, { color: '#4caf50', weight: 3 }).addTo(self.map);
        if (latlngs.length) self.map.fitBounds(latlngs, { padding: [40, 40] });
        const rsMod = 1 + XX / 1000; const hRS_N38 = (rsBenchmarks["N38"]?.h_base || 0) + rsMod; const hRS_N49_known = (rsBenchmarks["N49"]?.h_base || 0) + rsMod;
        let runningH = hRS_N38; let sumDh = 0;
        for (const leg of data) { const dh = leg.BS - leg.FS; sumDh += dh; runningH += dh; }
        const closure = runningH - hRS_N49_known;
        let geoHtml = '<div style="margin-bottom:0.5rem;font-size:0.75rem;color:var(--accent);"><strong>Geometrik Nivelman Çizelgesi</strong> (XX=' + XX + ', RS düzeltmesi: +' + rsMod.toFixed(3) + ' m)</div><table style="width:100%;border-collapse:collapse;font-size:0.7rem;"><thead><tr style="color:var(--text-3);"><th>Nokta</th><th>BS (m)</th><th>FS (m)</th><th>Δh (m)</th><th>H_i (m)</th></tr></thead><tbody>';
        geoHtml += '<tr><td style="color:#2196f3;">N38 (RS)</td><td>—</td><td>—</td><td>—</td><td style="color:#2196f3;font-weight:bold;">' + hRS_N38.toFixed(4) + '</td></tr>';
        runningH = hRS_N38;
        for (let i = 0; i < data.length; i++) { const l = data[i]; const dh = l.BS - l.FS; runningH += dh; geoHtml += '<tr><td>' + l.from + '→' + l.to + '</td><td>' + l.BS.toFixed(4) + '</td><td>' + l.FS.toFixed(4) + '</td><td style="color:var(--accent);">' + dh.toFixed(4) + '</td><td>' + runningH.toFixed(4) + '</td></tr>'; }
        geoHtml += '<tr style="font-weight:bold;border-top:2px solid var(--border);background:var(--bg-3);"><td colspan="3">Toplam Δh / Kapanma</td><td style="color:var(--accent);">' + sumDh.toFixed(4) + '</td><td></td></tr><tr style="background:var(--bg-3);"><td colspan="3">RS N49 (bilinen)</td><td style="color:' + (Math.abs(closure)>0.01?'var(--danger)':'var(--accent)') + ';">Δ=' + closure.toFixed(4) + ' m</td><td style="color:#2196f3;">' + hRS_N49_known.toFixed(4) + '</td></tr></tbody></table>';
        const totalDist = data.reduce((s, l) => s + l.bsDist + l.fsDist, 0); const tolerance = 0.006 * Math.sqrt(totalDist / 1000) + 0.02;
        geoHtml += '<p style="font-size:0.7rem;color:var(--text-3);margin-top:0.3rem;">Σ mesafe: ' + totalDist.toFixed(0) + ' m | Tolerans: ±' + (tolerance*1000).toFixed(1) + ' mm | Kapanma: ' + (closure*1000).toFixed(1) + ' mm ' + (Math.abs(closure) < tolerance ? '<span style="color:#4caf50;">✓ KABUL</span>' : '<span style="color:var(--danger);">✗ RED</span>') + '</p>';
        document.getElementById('u5GeoTable').innerHTML = geoHtml;
        document.getElementById('u5TrigTable').innerHTML = '<div style="margin-top:0.75rem;padding:0.5rem;background:var(--bg-3);border-radius:6px;font-size:0.72rem;"><strong style="color:var(--accent);">Trigonometrik Nivelman</strong><br><span style="color:var(--text-3);">Total station ile zenit açısı ve eğik mesafe ölçüleri girildiğinde aktif olacak.<br>Δh = S·cos(Z) + i - t + (1-k)·S<sub>h</sub>²/(2R) &nbsp; (k=0.13, R=6371 km)</span></div>';
        document.getElementById('u5Compare').innerHTML = '<div style="margin-top:0.5rem;font-size:0.7rem;color:var(--text-3);"><em>Geo vs Trig karşılaştırması — trigonometrik veri girildiğinde görüntülenecek.</em></div>';
    }
}

/* ═══════════════════════════════════════════════
   U6 CONTROLLER — 3B Konumlama (3D Positioning)
   ═══════════════════════════════════════════════ */
class U6Controller {
    constructor(app) { this.app = app; this.map = null; this.markers = []; }
    activate() { const self = this; const el = document.getElementById('u6LoadBtn'); if (el) el.onclick = () => self.loadReal(); if (!this.map) this.initMap(); setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 200); }
    initMap() { const el = document.getElementById('u6Map'); if (!el || this.map) return; this.map = L.map('u6Map', { zoomControl: true }).setView([41.0240, 28.8869], 18); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM', maxZoom: 20 }).addTo(this.map); }
    loadReal() {
        const self = this; const data = U6_REAL;
        self.markers.forEach(m => self.map.removeLayer(m)); self.markers = [];
        const colorMap = { parcel: '#4caf50', parcel_repeat: '#81c784', detail: '#2196f3', pole: '#ff9800', tree: '#8bc34a', control: '#9c27b0' };
        const typeLabels = { parcel: 'Parsel köşesi', parcel_repeat: 'Parsel (tekrar)', detail: 'Detay noktası', pole: 'Elektrik direği', tree: 'Ağaç', control: 'Kontrol noktası' };
        const allLatLngs = []; const groups = {};
        for (const d of data) { const wgs = tm30ToWGS84Approx(d.X, d.Y); allLatLngs.push([wgs.lat, wgs.lon]); if (!groups[d.type]) groups[d.type] = []; groups[d.type].push(d); const color = colorMap[d.type] || '#999'; const H = (d.h_ell - N_GEOID).toFixed(3); const m = L.circleMarker([wgs.lat, wgs.lon], { radius: d.type === 'parcel' ? 7 : d.type === 'control' ? 6 : 5, fillColor: color, color: '#fff', weight: 1.5, fillOpacity: 0.85 }).bindPopup('<b>' + d.id + '</b><br><small>' + (typeLabels[d.type] || d.type) + '</small><br>X: ' + d.X.toFixed(3) + '<br>Y: ' + d.Y.toFixed(3) + '<br>h<sub>ell</sub>: ' + d.h_ell + ' m<br>H<sub>orto</sub>: ' + H + ' m').addTo(self.map); self.markers.push(m); }
        if (allLatLngs.length) self.map.fitBounds(L.latLngBounds(allLatLngs), { padding: [30, 30] });
        let html = '<div style="margin-bottom:0.5rem;font-size:0.75rem;color:var(--accent);"><strong>RTK GPS Ölçüleri</strong> — EGM96 N=' + N_GEOID.toFixed(1) + ' m</div><table style="width:100%;border-collapse:collapse;font-size:0.7rem;"><thead><tr style="color:var(--text-3);"><th>Nokta</th><th>X (K)</th><th>Y (D)</th><th>h<sub>ell</sub></th><th>H<sub>orto</sub></th><th>Tür</th></tr></thead><tbody>';
        for (const d of data) { const color = colorMap[d.type] || '#999'; const H = (d.h_ell - N_GEOID).toFixed(3); html += '<tr><td style="color:' + color + ';font-weight:bold;">' + d.id + '</td><td>' + d.X.toFixed(3) + '</td><td>' + d.Y.toFixed(3) + '</td><td>' + d.h_ell + '</td><td style="color:var(--accent);">' + H + '</td><td><span style="background:' + color + ';color:#fff;padding:1px 5px;border-radius:2px;font-size:0.65rem;">' + (typeLabels[d.type] || d.type) + '</span></td></tr>'; }
        html += '</tbody></table><div style="margin-top:0.5rem;font-size:0.68rem;color:var(--text-3);display:flex;gap:1rem;flex-wrap:wrap;">';
        for (const [type, pts] of Object.entries(groups)) { const avgH = (pts.reduce((s, p) => s + (p.h_ell - N_GEOID), 0) / pts.length).toFixed(3); html += '<span style="background:var(--bg-3);padding:2px 8px;border-radius:4px;">' + (typeLabels[type] || type) + ': <b>' + pts.length + '</b> adet, H<sub>ort</sub> ≈ ' + avgH + ' m</span>'; }
        html += '</div><div style="margin-top:0.5rem;padding:0.4rem;background:var(--bg-3);border-radius:6px;font-size:0.7rem;"><strong style="color:var(--accent);">Tekrar Ölçüsü Kontrolü</strong><br>';
        const P4 = data.find(d => d.id === 'P.4'); const P41 = data.find(d => d.id === 'P.41');
        if (P4 && P41) { const dx = P4.X - P41.X, dy = P4.Y - P41.Y, dh = P4.h_ell - P41.h_ell; const ds = Math.sqrt(dx*dx + dy*dy); html += 'P.4 ↔ P.41: ΔX=' + (dx*1000).toFixed(1) + ' mm, ΔY=' + (dy*1000).toFixed(1) + ' mm, ΔS=' + (ds*1000).toFixed(1) + ' mm, Δh=' + (dh*1000).toFixed(1) + ' mm ' + (ds < 0.05 ? '<span style="color:#4caf50;">✓ Tutarlı</span>' : '<span style="color:var(--danger);">✗ Fark var</span>'); }
        const N38 = data.find(d => d.id === 'N.38'); const pt38 = this.app.db.coords[38];
        if (N38 && pt38) { const dx = N38.X - pt38.X, dy = N38.Y - pt38.Y; const ds = Math.sqrt(dx*dx + dy*dy); html += '<br>N.38 ↔ Nokta 38 (sabit): ΔX=' + (dx*1000).toFixed(1) + ' mm, ΔY=' + (dy*1000).toFixed(1) + ' mm, ΔS=' + (ds*1000).toFixed(1) + ' mm ' + (ds < 0.05 ? '<span style="color:#4caf50;">✓ Tutarlı</span>' : '<span style="color:var(--danger);">✗ Fark var</span>'); }
        html += '</div>'; document.getElementById('u6RtkTable').innerHTML = html;
        document.getElementById('u6Compare').innerHTML = '<div style="margin-top:0.75rem;padding:0.5rem;background:var(--bg-3);border-radius:6px;font-size:0.72rem;"><strong style="color:var(--accent);">Yöntem Karşılaştırması (RTK vs Total Station vs Nivelman)</strong><br><span style="color:var(--text-3);">U4 (Poligon) ve U5 (Nivelman) hesaplandığında, aynı noktaların farklı yöntemlerle elde edilen 3B koordinatları burada karşılaştırılacak.</span></div>';
    }
}

;
