/* ═══════════════════════════════════════════════
   UYGULAMA-3 DATA  —  Silsile Düşey Açı Ölçümü
   YTU Davutpaşa sabit nokta ağı (PDF, 2017)
   Y = Sağa (Easting, TUREF/TM30, m)
   X = Yukarı (Northing, m)
   h = Ortometrik yükseklik (m)
   ═══════════════════════════════════════════════ */

export const stations_u3 = {
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

/* Default sabitler (UI'da düzenlenebilir, localStorage'a kaydedilir) */
export const defaultConstants_u3 = {
  k: 0.13,            // Refraksiyon katsayısı (atmosferik, ~0.13 ortalama)
  R: 6371000,         // Yer yarıçapı (m, küresel yaklaşım)
  i: 1.55,            // Alet (teodolit) yüksekliği — ölçüm sırasındaki standart (m)
  t_minare: 25,       // Hedef minare ucu yüksekliği (cami zemininden, m) — fallback varsayım
  searchRadiusKm: 10, // Cami arama yarıçapı (km)
  nearbyN: 30         // Haritada gösterilecek en yakın N cami (slider)
};

/* Boş ölçü şablonu — 1 silsile × 3 hedef × 2 yüz = 6 düşey okuma
   Zenith açıları gon cinsinden girilir (0ᵍ = zenith, 100ᵍ = ufuk). */
export function emptyObservation(stationId, targetIds) {
  return {
    stationId: stationId,
    targets: targetIds.map(tid => ({
      mosqueId: tid,
      Z_I:  null,   // Yüz I (durbin sol) zenith okuması (gon)
      Z_II: null    // Yüz II (durbin sağ, teodolit 180° çevrildi) zenith okuması (gon)
    })),
    timestamp: null,
    notes: ''
  };
}

/* ═══════════════════════════════════════════════
   GERÇEK SAHA VERİSİ — Silsile ile Yatay Doğrultu Ölçümü
   İstasyon N.48 (Ertuğrul) · 2 tam silsile · 3 hedef
   Kaynak: UYGULAMA3.jpeg (el yazısı çizelge, 24 & 10 Nisan 2026)
   Referans (sıfır) doğrultu: L-1 kübbe
   I.durum = Yüz I yatay doğrultu, II.durum = Yüz II (≈ I + 200ᵍ)
   ═══════════════════════════════════════════════ */
export const u3StationId = 48;   // N.48 — stations_u3[48]

export const u3Silsile = {
  station: "N.48",
  observer: "Ertuğrul",
  dates: ["24 Nisan 2026", "10 Nisan 2026"],
  reference: "L-1 kübbe",
  sets: [
    { set: 1, obs: [
      { target: "L-1 kübbe", faceI: 0.5940,    faceII: 200.59245 },
      { target: "L-2 kübbe", faceI: 58.6333,   faceII: 258.6415 },
      { target: "YTÜ cami",  faceI: 169.9224,  faceII: 369.9224 },
    ]},
    { set: 2, obs: [
      { target: "L-1 kübbe", faceI: 100.79145, faceII: 300.78975 },
      { target: "L-2 kübbe", faceI: 158.8384,  faceII: 358.8395 },
      { target: "YTÜ cami",  faceI: 270.12645, faceII: 70.1319 },
    ]},
  ],
};

/* N.48 çevresindeki gerçek camiler (OpenStreetMap/Overpass'tan alınmış,
   N.48'den hesaplanmış grid semt açısı [gon] ve yatay mesafe [m]).
   Düşey açı türetiminde ve haritada hedef adaylarını göstermek için kullanılır. */
export const u3NearbyMosques = [
  { name: "Sultan Abdülhamid Yıldız Camii", az: 17.034,  dist: 481.6 },
  { name: "Davutpaşa Kışlası Mescidi",      az: 50.727,  dist: 224.1 },
  { name: "Namık Kemal Camii",              az: 60.062,  dist: 981.1 },
  { name: "Çifte Havuzlar Camii",           az: 79.515,  dist: 801.4 },
  { name: "Konyalı H. Veyiszade Camii",     az: 102.254, dist: 1291.5, height: 10 },
  { name: "Çinili Camii",                   az: 123.224, dist: 1763.9 },
  { name: "Sosyal Meskenler Camii",         az: 164.872, dist: 1001.1 },
  { name: "Sancaktepe Camii",               az: 203.117, dist: 461.0 },
  { name: "Söğütlüyayla Camii",             az: 240.714, dist: 958.1 },
  { name: "Sultan Kılıçaslan Camii",        az: 278.171, dist: 629.8 },
  { name: "Osman Nuri Özbek Camii",         az: 294.911, dist: 874.4 },
  { name: "Nur Ahmet Camii",                az: 357.706, dist: 533.8 },
];
