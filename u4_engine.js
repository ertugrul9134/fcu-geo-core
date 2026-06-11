/* =============================================================
   U4 ENGINE — Dayali Poligon Hesabi (Traverse)
   Pure functions. All angles in GON (grad).
   Student ID 24046607 → XX = 07.
   ============================================================= */

const GON_TO_RAD = Math.PI / 200.0;
const RAD_TO_GON = 200.0 / Math.PI;

export function normalizeGon(a) {
  return ((a % 400) + 400) % 400;
}

/* ─── Compute azimuth from coordinates ────────── */
export function computeAzimuth(ya, xa, yb, xb) {
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
export function atmosphericCorrection(slopeDist, XX) {
  return slopeDist * (1 + XX / 10000);
}

/* ─── Slope → horizontal reduction ────────────── */
/**
 * S_horiz = S_slope × sin(Z)  where Z = zenith angle (gon)
 * Z=0gon = zenith, Z=100gon = horizon
 */
export function slopeToHorizontal(slopeDist, zenithGon) {
  return slopeDist * Math.sin(zenithGon * GON_TO_RAD);
}

/* ─── Projection plane reduction ──────────────── */
/**
 * S_proj = S_horiz × R / (R + H_mean)
 * R = 6371000 m
 */
export function projectToPlane(horizontalDist, meanHeight, R = 6371000) {
  return horizontalDist * R / (R + meanHeight);
}

/* ─── Break angle from half-silsile ───────────── */
/**
 * Face I → Face II (teodolit 180° cevrildi = +200 gon)
 * 2 half-silsile → averaged direction → break angle
 */
export function computeBreakAngle(halfSilsileler) {
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
export function dependentTraverse(start, end, azStart, azEnd, breakAngles, distances) {
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
export function computeU4(coords, traversePath, rawEdges, rawStations, XX = 7) {
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
export function formatEdgeTable(reducedEdges) {
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
export function compareCoordinates(trueCoords, computedCoords, path) {
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
