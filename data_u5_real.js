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
export const levelingData = [
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
export const rsBenchmarks = {
  // N38, N40, N41, N43, N45, N49 are from the known point network
  "N38": { h_base: 73.294 },   // Point 38
  "N40": { h_base: 73.957 },   // Point 40
  "N41": { h_base: 74.653 },   // Point 41
  "N43": { h_base: 75.285 },   // Point 43
  "N45": { h_base: 75.399 },   // Point 45
  "N49": { h_base: 75.310 },   // Point 49
};

export const studentInfo = {
  studentId: 24046607,
  name: "Ertugrul",
  pointId: 48,
  date: "2026-06-10",
  instrument: "Nivo (automatic level)",
  weather: "Clear",
};
