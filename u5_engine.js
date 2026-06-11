/* =============================================================
   U5 ENGINE — Geometric & Trigonometric Leveling
   Pure functions. All distances in meters.
   k = 0.13 (refraction), R = 6371000 m
   ============================================================= */

/* ─── Geometric leveling (mira readings) ──────── */
/**
 * Δh = backsight − foresight
 */
export function geometricDH(BS, FS) {
  return BS - FS;
}

/**
 * Process a geometric leveling leg with N setups.
 * @param {Array<{BS:number, FS:number}>} setups
 * @returns {{dh_leg: number, setups: Array}}
 */
export function processGeometricLeg(setups) {
  const dh_total = setups.reduce((sum, s) => sum + geometricDH(s.BS, s.FS), 0);
  return { dh_leg: +dh_total.toFixed(3), setups: setups.map(s => ({ ...s, dh: +(s.BS - s.FS).toFixed(3) })) };
}

/* ─── Trigonometric leveling ──────────────────── */
/**
 * Δh = S₁ × cot(Z) + i − t + (1−k)·S₁² / (2R)
 * where S₁ = slope distance, Z = zenith angle (gon)
 * i = instrument height, t = target height
 *
 * Actually: Δh = S·cos(Z) + i − t + (1−k)·S_horiz²/(2R)
 * where Z in gon, cos(Z in radians)
 */
export function trigonometricDH(slopeDist, zenithGon, i = 1.55, t = 1.60, k = 0.13, R = 6371000) {
  const GON_TO_RAD = Math.PI / 200.0;
  const sHoriz = slopeDist * Math.sin(zenithGon * GON_TO_RAD);
  const curvatureRefraction = ((1 - k) / (2 * R)) * sHoriz * sHoriz;
  const dh = slopeDist * Math.cos(zenithGon * GON_TO_RAD) + i - t + curvatureRefraction;
  return { dh, sHoriz, curvatureRefraction };
}

/* ─── Dependent leveling ──────────────────────── */
/**
 * Compute heights along a leveling chain connected to known RS points.
 * Distributes closure error proportional to distance.
 *
 * @param {{[id]: number}} rsHeights — known RS benchmark heights
 * @param {Array<{from:number, to:number, dh_geo:number, setups:Array}>} legs
 * @returns {{heights: object, closure: number, adjusted: object}}
 */
export function dependentLeveling(rsHeights, legs) {
  // Build height chain
  const heights = {};
  let currentH = rsHeights[legs[0].from];
  if (currentH === undefined) throw new Error(`No RS height for start point ${legs[0].from}`);
  heights[legs[0].from] = currentH;

  for (const leg of legs) {
    currentH += leg.dh_geo;
    heights[leg.to] = +currentH.toFixed(3);
  }

  // Closure: compare end to known RS
  const endId = legs[legs.length - 1].to;
  const knownEnd = rsHeights[endId];
  const computedEnd = heights[endId];
  const closure = knownEnd !== undefined ? +(computedEnd - knownEnd).toFixed(3) : 0;

  // Distribute closure
  const totalDist = legs.reduce((s, l) => s + (l.distance || 1), 0);
  const adjusted = {};
  let cumDist = 0;
  adjusted[legs[0].from] = rsHeights[legs[0].from];

  for (const leg of legs) {
    cumDist += (leg.distance || 1);
    const corr = knownEnd !== undefined ? -(closure * cumDist / totalDist) : 0;
    adjusted[leg.to] = +(adjustObjectHeight(adjusted, leg) + corr).toFixed(3);
  }

  return { heights, closure, adjusted };
}

function adjustObjectHeight(adjusted, leg) {
  // Helper: get the running height for the endpoint
  const prev = adjusted[leg.from];
  return prev + leg.dh_geo;
}

/* ─── Compare geometric vs trigonometric ──────── */
/**
 * @param {Array<{from, to, dh_geo, dh_true}>} geoLegs
 * @param {Array<{from, to, dh_trig, dh_true}>} trigLegs
 * @returns {Array<{from, to, dh_geo, dh_trig, dh_true, d_geo, d_trig, geo_vs_trig}>}
 */
export function compareGeoVsTrig(geoLegs, trigLegs) {
  const n = Math.min(geoLegs.length, trigLegs.length);
  const rows = [];
  for (let i = 0; i < n; i++) {
    const g = geoLegs[i], t = trigLegs[i];
    rows.push({
      from: g.from, to: g.to,
      dh_geo: g.dh_geo,
      dh_trig: t.dh_trig,
      dh_true: g.dh_true,
      d_geo: +(g.dh_geo - g.dh_true).toFixed(3),
      d_trig: +(t.dh_trig - t.dh_true).toFixed(3),
      geo_vs_trig: +(g.dh_geo - t.dh_trig).toFixed(3),
    });
  }
  return rows;
}

/* ─── Curvature & refraction calculator ────────── */
/**
 * Calculate curvature + refraction correction for a given distance.
 * c = (1−k)·S² / (2R)
 */
export function curvatureRefractionCorrection(horizontalDist, k = 0.13, R = 6371000) {
  return ((1 - k) / (2 * R)) * horizontalDist * horizontalDist;
}

/* ─── Leveling loop closure ───────────────────── */
/**
 * For a closed leveling loop: sum of Δh should be 0.
 * Returns closure error and per-leg correction.
 */
export function levelingLoopClosure(legs) {
  const closure = legs.reduce((s, l) => s + l.dh_geo, 0);
  const n = legs.length;
  const correction = -closure / n;
  const adjusted = legs.map(l => ({
    ...l,
    dh_adjusted: +(l.dh_geo + correction).toFixed(3),
  }));
  return { closure: +closure.toFixed(3), correction: +correction.toFixed(3), adjusted };
}
