/* =============================================================
   UYGULAMA-5 GERÇEK SAHA VERİSİ — Geometrik & Trigonometrik Nivelman
   Kaynak: uygulama-5.pdf (grup raporu — Emir Keskin 22046037)
   Kapalı nivelman güzergâhı: RS14(AN14) → 1 → 2 → N.53 → P1…P7 →
                              N.38 → N.40 → N.41 → N.43 → N.45 → N.49 → RS14
   -------------------------------------------------------------
   Ortak XX = 52  →  RS14 başlangıç yüksekliği = 75.513 + 1.052 = 76.565 m
   (Ders ortak yapıldığından bireysel XX yerine ortak 52 kullanılmıştır;
    sonuçlar grup raporuyla birebir aynıdır.)
   Kapanma:  Σ Geri = 24.2869 m,  Σ İleri = 23.9420 m
             dh = ΣG − Σİ = +0.3449 m = +344.9 mm
             17 istasyona düzeltme: 15 × (−0.0203) + 2 × (−0.0202) = −0.3449 m
             Σdh' = 0,  H_bitiş − H_başlangıç = 76.565 − 76.565 = 0
   ============================================================= */

export const u5Meta = {
  title: "Geometrik & Trigonometrik Nivelman",
  student: { id: 24046607, name: "Ertuğrul", point: 48, XX: 7, commonXX: 52 },
  instrument: "Nivo + 2 mira (geometrik), Total Station (trigonometrik)",
  date: "2026",
  baseStart: "RS14",
  baseHeight: 76.565,        // 75.513 + 1.052 (ortak XX=52)
  baseOriginal: 75.513,
  offset: 1.052,
  nStations: 17,
};

/* Tablo-1 — Ham okumalar (Geri/İleri okuma + mesafe, metre).
   G = geri okuma (back sight), İ = ileri okuma (fore sight). */
export const tablo1Raw = [
  { pt: "RS14", G: 1.247,  Gd: 15.60, I: null,   Id: null },
  { pt: "1",    G: 1.745,  Gd: 14.20, I: null,   Id: null },
  { pt: "2",    G: 1.305,  Gd: 14.00, I: 1.659,  Id: 20.00 },
  { pt: "N.53", G: 1.496,  Gd: 14.60, I: 1.387,  Id: 18.20 },
  { pt: "P1",   G: 1.623,  Gd: 9.60,  I: 1.292,  Id: 13.20 },
  { pt: "P2",   G: 1.295,  Gd: 18.60, I: 1.596,  Id: 21.00 },
  { pt: "P3",   G: 1.100,  Gd: 20.00, I: 1.608,  Id: 9.70 },
  { pt: "P4",   G: 0.622,  Gd: 21.00, I: 1.524,  Id: 18.60 },
  { pt: "P5",   G: 1.298,  Gd: 11.20, I: 1.543,  Id: 20.50 },
  { pt: "P6",   G: 1.394,  Gd: 17.90, I: 2.515,  Id: 22.50 },
  { pt: "P7",   G: 1.457,  Gd: 9.40,  I: 1.427,  Id: 14.00 },
  { pt: "N.38", G: 1.8820, Gd: 31.86, I: 1.200,  Id: 14.50 },
  { pt: "N.40", G: 1.8881, Gd: 14.68, I: 1.062,  Id: 7.70 },
  { pt: "N.41", G: 1.9222, Gd: 17.05, I: 1.2285, Id: 22.34 },
  { pt: "N.43", G: 1.5990, Gd: 12.92, I: 1.1796, Id: 12.45 },
  { pt: "N.45", G: 1.2817, Gd: 12.57, I: 1.3398, Id: 12.48 },
  { pt: "N.49", G: 1.1319, Gd: 19.32, I: 1.4573, Id: 13.85 },
  { pt: "RS14", G: null,   Gd: null,  I: 1.4136, Id: 23.76 },
  { pt: "(kapanış)", G: null, Gd: null, I: 0.8762, Id: 19.89 },
];

/* Tablo-2 — Geometrik nivelman hesabı (kapanma dengelemesi ile).
   dh = ölçülen yükseklik farkı, v = düzeltme, dhp = düzeltilmiş Δh, H = kesin yükseklik.
   (Grup raporu Tablo-2 ile birebir; her H, U6 raporu ortometrik değeriyle +1.052 farkıyla tutarlıdır.) */
export const H_START_U5 = 76.5650;   // RS14 başlangıç
export const tablo2 = [
  { from: "RS14", to: "1",    dh: -0.4120, v: -0.0203, dhp: -0.4323, H: 76.1327 },
  { from: "1",    to: "2",    dh:  0.3640, v: -0.0203, dhp:  0.3437, H: 76.4764 },
  { from: "2",    to: "N.53", dh:  0.0130, v: -0.0203, dhp: -0.0073, H: 76.4691 },
  { from: "N.53", to: "P1",   dh: -0.1000, v: -0.0203, dhp: -0.1203, H: 76.3488 },
  { from: "P1",   to: "P2",   dh:  0.0150, v: -0.0203, dhp: -0.0053, H: 76.3435 },
  { from: "P2",   to: "P3",   dh: -0.2290, v: -0.0203, dhp: -0.2493, H: 76.0942 },
  { from: "P3",   to: "P4",   dh: -0.4430, v: -0.0203, dhp: -0.4633, H: 75.6309 },
  { from: "P4",   to: "P5",   dh: -1.5330, v: -0.0203, dhp: -1.5533, H: 74.0776 },
  { from: "P5",   to: "P6",   dh: -0.1290, v: -0.0203, dhp: -0.1493, H: 73.9283 },
  { from: "P6",   to: "P7",   dh:  0.1940, v: -0.0203, dhp:  0.1737, H: 74.1020 },
  { from: "P7",   to: "N.38", dh:  0.3950, v: -0.0203, dhp:  0.3747, H: 74.4767 },
  { from: "N.38", to: "N.40", dh:  0.6535, v: -0.0203, dhp:  0.6332, H: 75.1099 },
  { from: "N.40", to: "N.41", dh:  0.7085, v: -0.0203, dhp:  0.6882, H: 75.7981 },
  { from: "N.41", to: "N.43", dh:  0.5824, v: -0.0203, dhp:  0.5621, H: 76.3602 },
  { from: "N.43", to: "N.45", dh:  0.1417, v: -0.0203, dhp:  0.1214, H: 76.4816 },
  { from: "N.45", to: "N.49", dh: -0.1319, v: -0.0202, dhp: -0.1521, H: 76.3295 },
  { from: "N.49", to: "RS14", dh:  0.2557, v: -0.0202, dhp:  0.2355, H: 76.5650 },
];

export const closureU5 = {
  sumG: 24.2869,
  sumI: 23.9420,
  dh: 0.3449,            // ΣG − Σİ  (m)
  dh_mm: 344.9,
  nStations: 17,
  vMain: -0.0203, nMain: 15,
  vAlt: -0.0202, nAlt: 2,
  sumV: -0.3449,
  control: 0.0000,
};

/* Tablo-3 — Trigonometrik nivelman ölçüleri (ileri bakışlar).
   Z = düşey (zenit) açı (gon), S = eğik mesafe (m), i = alet yüks., t = hedef (reflektör) yüks. */
export const tablo3Trig = [
  { from: "N.53", to: "P1",   Z: 101.0384, S: 33.265, i: 1.571, t: 1.60 },
  { from: "P1",   to: "P2",   Z: 99.9292,  S: 19.586, i: 1.540, t: 1.60 },
  { from: "P2",   to: "P3",   Z: 100.3074, S: 36.418, i: 1.625, t: 1.60 },
  { from: "P3",   to: "P4",   Z: 99.1190,  S: 40.076, i: 1.576, t: 1.60 },
  { from: "P4",   to: "P5",   Z: 99.2264,  S: 40.106, i: 1.518, t: 1.60 },
  { from: "P5",   to: "P6",   Z: 100.1654, S: 25.462, i: 1.549, t: 1.60 },
  { from: "P6",   to: "P7",   Z: 99.4208,  S: 36.157, i: 1.509, t: 1.60 },
  { from: "P7",   to: "N.38", Z: 100.3074, S: 17.350, i: 1.495, t: 1.60 },
];

/* Tablo-4 — Geometrik ↔ Trigonometrik yükseklik karşılaştırması (76.565 bazında).
   trig = grup raporu trigonometrik kesin yüksekliği (= U6 ortometrik trig + 1.052). */
export const comparisonU5 = [
  { id: "P1",   geo: 76.3488, trig: 76.444 },
  { id: "P2",   geo: 76.3435, trig: 76.414 },
  { id: "P3",   geo: 76.0942, trig: 75.984 },
  { id: "P4",   geo: 75.6309, trig: 75.466 },
  { id: "P5",   geo: 74.0776, trig: 74.276 },
  { id: "P6",   geo: 73.9283, trig: 74.130 },
  { id: "P7",   geo: 74.1020, trig: 74.623 },
  { id: "N.38", geo: 74.4767, trig: 74.918 },
];

/* Geriye dönük uyum: eski isimler */
export const levelingData = tablo1Raw;
export const rsBenchmarks = { RS14: { h_base: 75.513, h: 76.565 } };
