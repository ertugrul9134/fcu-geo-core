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
   - 109-AGAC2: Tree #2 (user-confirmed label; raw txt had it unlabeled)
   - 110-AGAC: Tree #1 (raw txt label "110-AGAC2" was a field-book slip)
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
  { id: "109-AGAC2", X: 4543837.666, Y: 406359.366, h_ell: 110.949, type: "tree" },
  { id: "110-AGAC",  X: 4543829.713, Y: 406356.162, h_ell: 110.803, type: "tree" },
];

/**
 * Davutpaşa bölgesi jeoit yüksekliği (ortalama undülasyon).
 * N = h_N38 − H_N38 = 110.192 − 73.294 = 36.898 m
 * Ortometrik yükseklik:  H = h_elipsoidal − N
 */
export const N_GEOID = 36.898;

export const studentInfo = {
  studentId: 24046607,
  name: "Ertugrul",
  pointId: 48,
  instrument: "RTK GPS (YLDZ CORS)",
  date: "2026-06",
};

/* Tablo-2 (Uygulama-6 raporu): üç yöntemle yükseklik karşılaştırması
   gps  = RTK ortometrik (H = h − N)
   geo  = geometrik nivelman (Uygulama-5)
   trig = trigonometrik nivelman (Uygulama-5 Tablo-3)
   P.3 ağacın altında kaldığından GPS ile ölçülememiştir (gps: null). */
export const heightComparison = [
  { id: "P.1",  gps: 75.401, geo: 75.2968, trig: 75.392 },
  { id: "P.2",  gps: 75.418, geo: 75.2915, trig: 75.362 },
  { id: "P.3",  gps: null,   geo: 75.0422, trig: 74.932 },
  { id: "P.4",  gps: 74.668, geo: 74.5789, trig: 74.414 },
  { id: "P.5",  gps: 72.735, geo: 73.0256, trig: 73.224 },
  { id: "P.6",  gps: 72.578, geo: 72.8763, trig: 73.078 },
  { id: "P.7",  gps: 72.901, geo: 73.0500, trig: 73.571 },
  { id: "N.38", gps: 73.294, geo: 73.4247, trig: 73.866 },
];
