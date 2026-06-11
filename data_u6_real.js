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

export const rtkMeasurements = [
  { id: "P1-1",   X: 4543867.769, Y: 406425.582, h_ell: 112.319, type: "parcel" },
  { id: "P.1",    X: 4543867.776, Y: 406425.583, h_ell: 112.299, type: "parcel" },
  { id: "P.12",   X: 4543867.776, Y: 406425.583, h_ell: 112.299, type: "parcel" },
  { id: "P.2",    X: 4543853.707, Y: 406411.949, h_ell: 112.316, type: "parcel" },
  { id: "P.4",    X: 4543847.585, Y: 406359.496, h_ell: 111.566, type: "parcel" },
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
  { id: "106",    X: 4543828.921, Y: 406350.525, h_ell: 110.92, type: "detail" },
  { id: "107",    X: 4543849.254, Y: 406356.407, h_ell: 111.471, type: "detail" },
  { id: "108-DIREK",  X: 4543847.853, Y: 406357.599, h_ell: 111.722, type: "pole" },
  { id: "109-AGAC", X: 4543837.666, Y: 406359.366, h_ell: 110.949, type: "tree" },
  { id: "110-AGAC2",  X: 4543829.713, Y: 406356.162, h_ell: 110.803, type: "tree" },
];

/**
 * EGM96 geoid undulation for Davutpasa area.
 * N ≈ 36.5 m (from embedded EGM96 grid in u3_elevation.js)
 * Orthometric height H = h_ellipsoidal - N
 */
export const N_GEOID = 36.898;  // N = h_N38 - H_N38 = 110.192 - 73.294

export const studentInfo = {
  studentId: 24046607,
  name: "Ertugrul",
  pointId: 48,
  instrument: "RTK GPS (YLDZ CORS)",
  date: "2026-06",
};
