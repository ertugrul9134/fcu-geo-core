/* =============================================================
   UYGULAMA-4 GERÇEK SAHA VERİSİ — Dayalı Poligon (Total Station)
   Kaynak: uygulama4_data.jpeg (öğrencinin kendi dengelenmiş poligonu)
   Öğrenci: Ertuğrul 24046607 — Nokta 48 (XX=07)
   -------------------------------------------------------------
   Güzergah: N.50 → N.53 → P1 → P2 → P3 → P4 → P5 → P6 → P7 → N.38 → N.40
   N.50, N.40 : yöneltme (orientation) noktaları
   N.53, N.38 : bilinen (dayalı) uç noktalar
   P1..P7     : yeni belirlenen poligon noktaları
   X = Yukarı (Northing, TUREF/TM30, m)   Y = Sağa (Easting, m)
   Açılar gon; mesafeler metre.
   Açısal kapanma  fβ = 0 mgon  ≤  Fβ = 1.5ᶜ·√9 = 45 mgon   → BAŞARILI
   Doğrusal kapanma fx = fy = 0 m (poligon tam dengelenmiş)
   ============================================================= */

export const u4Meta = {
  title: "Dayalı Poligon Hesabı — Total Station",
  student: { id: 24046607, name: "Ertuğrul", point: 48, XX: 7 },
  route: ["N.50", "N.53", "P1", "P2", "P3", "P4", "P5", "P6", "P7", "N.38", "N.40"],
  orientStart: "N.50",
  knownStart: "N.53",
  knownEnd: "N.38",
  orientEnd: "N.40",
  newPoints: ["P1", "P2", "P3", "P4", "P5", "P6", "P7"],
  nStations: 9,            // kırılma açısı ölçülen istasyon sayısı (N.53 … N.38)
  fB_mgon: 0,              // ölçülen açısal kapanma hatası
  FB_mgon: 45,             // tolerans  1.5ᶜ · √9
  FB_formula: "F_\\beta = 1.5^{cc}\\,\\sqrt{n} = 1.5^{cc}\\sqrt{9} = 45\\ \\text{mgon}",
  fx_m: 0,                 // doğrusal kapanma (X)
  fy_m: 0,                 // doğrusal kapanma (Y)
  instrument: "Total Station",
  date: "2026",
};

/* Kesin (dengelenmiş) koordinatlar — X=Yukarı/Northing, Y=Sağa/Easting [m] */
export const u4Coords = {
  "N.50": { X: 4543937.417, Y: 406370.920 },
  "N.53": { X: 4543888.637, Y: 406451.509 },
  "P1":   { X: 4543867.789, Y: 406425.585 },
  "P2":   { X: 4543853.702, Y: 406411.964 },
  "P3":   { X: 4543878.415, Y: 406385.170 },
  "P4":   { X: 4543847.656, Y: 406359.519 },
  "P5":   { X: 4543809.275, Y: 406377.952 },
  "P6":   { X: 4543784.635, Y: 406384.385 },
  "P7":   { X: 4543761.806, Y: 406356.405 },
  "N.38": { X: 4543763.699, Y: 406339.189 },
  "N.40": { X: 4543817.164, Y: 406348.868 },
};

/* Kırılma açıları (gon) — poligon istasyonlarında ölçülen sağ (saat yönü) açılar.
   Bağıntı:  α_(sonraki) = α_(önceki) + β − 200  (mod 400) */
export const u4BreakAngles = {
  "N.53": 322.2294,
  "P1":   192.0478,
  "P2":   298.5000,
  "P3":   96.8222,
  "P4":   127.2448,
  "P5":   212.2456,
  "P6":   272.6908,
  "P7":   250.5400,
  "N.38": 304.4294,
};

/* Kenar bazında hesap değerleri:
   az = açıklık açısı (semt, gon, X=Kuzey'den saat yönü)
   s  = kenar uzunluğu (m)
   dX = s·cos(az),  dY = s·sin(az)  (koordinat artışları, m) */
export const u4Legs = [
  { from: "N.50", to: "N.53", az: 134.6515, s: 94.202, dX: -48.780, dY: 80.589 },
  { from: "N.53", to: "P1",   az: 256.8809, s: 33.267, dX: -20.848, dY: -25.924 },
  { from: "P1",   to: "P2",   az: 248.9287, s: 19.595, dX: -14.087, dY: -13.621 },
  { from: "P2",   to: "P3",   az: 347.4287, s: 36.451, dX: 24.713,  dY: -26.794 },
  { from: "P3",   to: "P4",   az: 244.2509, s: 40.051, dX: -30.759, dY: -25.651 },
  { from: "P4",   to: "P5",   az: 171.4957, s: 42.578, dX: -38.381, dY: 18.433 },
  { from: "P5",   to: "P6",   az: 183.7413, s: 25.466, dX: -24.640, dY: 6.433 },
  { from: "P6",   to: "P7",   az: 256.4321, s: 36.111, dX: -22.829, dY: -27.980 },
  { from: "P7",   to: "N.38", az: 306.9721, s: 17.320, dX: 1.893,   dY: -17.216 },
  { from: "N.38", to: "N.40", az: 11.4015,  s: 54.334, dX: 53.465,  dY: 9.679 },
];

/* Dayalı poligon hattının toplam kenar uzunluğu (N.53 → N.38, yöneltme kenarları hariç) */
const _dayaliPts = new Set(["N.53", "P1", "P2", "P3", "P4", "P5", "P6", "P7", "N.38"]);
export const u4TraverseLength = u4Legs
  .filter(l => _dayaliPts.has(l.from) && _dayaliPts.has(l.to))
  .reduce((a, l) => a + l.s, 0);
