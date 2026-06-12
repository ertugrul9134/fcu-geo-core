/* =============================================================
   UYGULAMA-4 REAL FIELD DATA — Total Station Traverse
   Source: "Uygulama-4.pdf" (grup raporu, Tablo-1) — dayalı poligon
   N.53 → P1 → P2 → P3 → P4 → P5 → P6 → P7 → N.38
   Bağlantı doğrultuları: başlangıç N.50, bitiş N.40
   Her istasyonda iki yarım silsile (2. seri okumaları farklı origin ile)
   hz: yatay doğrultu (gon), v: düşey doğrultu (gon),
   sd: eğik mesafe (m), hd: yatay mesafe (m)
   ============================================================= */

export const u4Meta = {
  route: ["N.53", "P1", "P2", "P3", "P4", "P5", "P6", "P7", "N.38"],
  orientStart: "N.50",
  orientEnd: "N.40",
  tempC: 22.4,
  pressureHPa: 1007,
  reflectorH: 1.60,
  equipment: "Nikon Total Station, 2 adet reflektör, 2 adet reflektör jalonu, 2 adet reflektör sehpası, 1 adet şerit metre",
};

export const u4Observations = [
  { st: "N.53", i: 1.571, set: 1, bn: "N.50", hz: 0.0002,   v: 100.7860, sd: 94.209, hd: 94.202 },
  { st: "N.53", i: 1.571, set: 1, bn: "P1",   hz: 322.2296, v: 101.0384, sd: 33.265, hd: 33.261 },
  { st: "N.53", i: 1.571, set: 2, bn: "N.50", hz: 150.0000, v: 100.7820, sd: 94.210, hd: 94.203 },
  { st: "N.53", i: 1.571, set: 2, bn: "P1",   hz: 72.2390,  v: 101.0390, sd: 33.264, hd: 33.260 },
  { st: "P1", i: 1.587, set: 1, bn: "N.53", hz: 0.0000,   v: 98.9630,  sd: 33.271, hd: 33.267 },
  { st: "P1", i: 1.587, set: 1, bn: "P2",   hz: 192.0478, v: 99.9292,  sd: 19.586, hd: 19.586 },
  { st: "P1", i: 1.587, set: 2, bn: "N.53", hz: 130.0020, v: 98.8976,  sd: 33.271, hd: 33.266 },
  { st: "P1", i: 1.587, set: 2, bn: "P2",   hz: 322.0010, v: 99.9920,  sd: 19.587, hd: 19.587 },
  { st: "P2", i: 1.540, set: 1, bn: "P1", hz: 0.0004,   v: 99.9702,  sd: 19.595, hd: 19.595 },
  { st: "P2", i: 1.540, set: 1, bn: "P3", hz: 298.5004, v: 100.3164, sd: 36.418, hd: 36.418 },
  { st: "P2", i: 1.540, set: 2, bn: "P1", hz: 140.0000, v: 99.9726,  sd: 19.594, hd: 19.594 },
  { st: "P2", i: 1.540, set: 2, bn: "P3", hz: 140.0020, v: 100.2950, sd: 36.417, hd: 36.417, flag: "2. yarım silsilede P3 okuması 1. seriyle uyumsuz (muhtemel kaba hata)" },
  { st: "P3", i: 1.540, set: 1, bn: "P2", hz: 394.7334, v: 99.6516,  sd: 36.437, hd: 36.436 },
  { st: "P3", i: 1.540, set: 1, bn: "P4", hz: 91.5556,  v: 100.8078, sd: 40.076, hd: 40.073 },
  { st: "P3", i: 1.540, set: 2, bn: "P2", hz: 150.0002, v: 99.6946,  sd: 36.475, hd: 36.475 },
  { st: "P3", i: 1.540, set: 2, bn: "P4", hz: 246.8330, v: 100.8702, sd: 40.078, hd: 40.074 },
  { st: "P4", i: 1.625, set: 1, bn: "P3", hz: 0.0002,   v: 99.2360,  sd: 40.080, hd: 40.000, flag: "Yatay mesafe 40.000 m, eğik 40.080 m ile tutarsız (beklenen ≈40.073)" },
  { st: "P4", i: 1.625, set: 1, bn: "P5", hz: 127.2450, v: 102.8988, sd: 42.583, hd: 42.583 },
  { st: "P4", i: 1.625, set: 2, bn: "P3", hz: 169.9998, v: 99.2264,  sd: 40.106, hd: 40.103 },
  { st: "P4", i: 1.625, set: 2, bn: "P5", hz: 297.2436, v: 102.8860, sd: 42.627, hd: 42.583 },
  { st: "P5", i: 1.518, set: 1, bn: "P4", hz: 0.0302,   v: 97.0140,  sd: 42.625, hd: 42.578 },
  { st: "P5", i: 1.518, set: 1, bn: "P6", hz: 212.2458, v: 100.1654, sd: 25.462, hd: 25.462 },
  { st: "P5", i: 1.518, set: 2, bn: "P4", hz: 180.0002, v: 97.0136,  sd: 42.624, hd: 42.577 },
  { st: "P5", i: 1.518, set: 2, bn: "P6", hz: 392.2434, v: 100.1682, sd: 25.461, hd: 25.461 },
  { st: "P6", i: 1.549, set: 1, bn: "P5", hz: 356.7380, v: 99.5114,  sd: 25.467, hd: 25.466 },
  { st: "P6", i: 1.549, set: 1, bn: "P7", hz: 229.4288, v: 99.4208,  sd: 36.157, hd: 36.156 },
  { st: "P6", i: 1.549, set: 2, bn: "P5", hz: 100.0000, v: 99.5102,  sd: 25.467, hd: 25.466 },
  { st: "P6", i: 1.549, set: 2, bn: "P7", hz: 372.6690, v: 99.3950,  sd: 36.157, hd: 36.155 },
  { st: "P7", i: 1.509, set: 1, bn: "P6",   hz: 72.5262,  v: 98.5918,  sd: 36.120, hd: 36.111 },
  { st: "P7", i: 1.509, set: 1, bn: "N.38", hz: 323.0662, v: 100.3074, sd: 17.350, hd: 17.350 },
  { st: "P7", i: 1.509, set: 2, bn: "P6",   hz: 100.0000, v: 98.5886,  sd: 36.120, hd: 36.111 },
  { st: "P7", i: 1.509, set: 2, bn: "N.38", hz: 350.5260, v: 100.3182, sd: 17.349, hd: 17.349 },
  { st: "N.38", i: 1.495, set: 1, bn: "P7",   hz: 40.8660,  v: 101.1382, sd: 17.289, hd: 17.286 },
  { st: "N.38", i: 1.495, set: 1, bn: "N.40", hz: 345.2954, v: 99.1190,  sd: 54.367, hd: 54.362 },
  { st: "N.38", i: 1.495, set: 2, bn: "P7",   hz: 300.0000, v: 101.1210, sd: 17.289, hd: 17.286 },
  { st: "N.38", i: 1.495, set: 2, bn: "N.40", hz: 204.4852, v: 99.1274, sd: 54.366, hd: 54.361 },
];

/* Şekil-2'deki el yazısı hata hesabından: açı kapanması toleransı aşıyor */
export const u4ErrorAnalysis = {
  alpha0: 134.6538,    // başlangıç açıklık açısı (gon)
  alphaEnd: 13.2667,   // kapanış açıklık açısı (gon)
  nStations: 9,
  fBetaGon: 1.8934,    // gerçekleşen açı kapanma hatası (gon)
  FBetaGon: 0.045,     // tolerans: 1.5^c × √n = 1.5 × √9 = 4.5^c = 0.045 gon
};

/* Tablo-2 (Uygulama-6 raporundan): yükseklik karşılaştırması — grup verisi
   GPS = RTK ortometrik (H = h − N), geo = geometrik nivelman, trig = trigonometrik nivelman */
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
