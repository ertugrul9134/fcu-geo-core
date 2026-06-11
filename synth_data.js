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
export function gauss(mean = 0, sigma = 1) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function normalizeGon(a) {
  return ((a % 400) + 400) % 400;
}

/* ─── True geometrics from known coordinates ──── */
export function trueAzimuthDist(ya, xa, yb, xb) {
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
export function studentModifiers(studentId) {
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
export function synthU2(coords, edges, studentId = 24046607) {
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
export function synthU3(coords, stationId, targetIds, studentId = 24046607) {
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
export function synthU4(coords, traversePath, studentId = 24046607) {
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
export function synthU5(coords, traversePath, rsPointIds, studentId = 24046607) {
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
export function setWgs84Data(data) { _wgs84Cache = data; }
export function getWgs84(pid) {
  if (_wgs84Cache && _wgs84Cache[pid]) return _wgs84Cache[pid];
  return null;
}
export function synthU6(coords, pointIds, studentId = 24046607) {
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
