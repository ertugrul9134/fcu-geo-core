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
export function ellipsoidalToOrthometric(hEllipsoidal, NGeoid) {
  return hEllipsoidal - NGeoid;
}

/* ─── Orthometric → ellipsoidal ────────────────── */
export function orthometricToEllipsoidal(H, NGeoid) {
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
export function egm96Simple(lat, lon) {
  return 36.5 + (lat - 41.0) * 2.0 + (lon - 28.9) * 1.5;
}

/* ─── TUREF/TM30 → approximate WGS84 ──────────── */
/**
 * For the Davutpasa campus area.
 * Reference: point 41 ≈ (28.8866°E, 41.0241°N)
 */
export function tm30ToWGS84Approx(Y, X) {
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
export function compare3DMethods(trueCoord, rtk, totalStation, levelingHeight) {
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
export function buildKrokiData(detailPoints, measuredEdges = []) {
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
export function rtkToTM30(synthResult, coordsDB) {
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
export function buildComparisonTable(trueCoords, rtkResults, tsResults, levelHeights, pointIds) {
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
