# FCU GEO-CORE — Jeodezik Hesaplama Sistemi

Yıldız Teknik Üniversitesi Ölçme Uygulamaları dersi kapsamında geliştirilen, tarayıcı tabanlı nirengi hesaplama ve görselleştirme aracı.

## Canlı Demo

**https://ertugrul9134.github.io/fundamentals_surveying/**

## Özellikler

- **Leaflet Harita** — TUREF/TM30 koordinatları WGS84'e dönüştürülerek OSM, Google Uydu ve Google Hibrit katmanlarında gösterilir
- **Nokta Seçimi** — Harita üzerinden 3 nokta seçilerek üçgen oluşturulur
- **Hesaplama Motoru** — Açı kapanma hatası dağıtımı, Sinüs Teoremi, 1., 2. ve 3. Temel Ödev hesapları
- **KaTeX Formüller** — Tüm formüller profesyonel matematik dizgisiyle render edilir
- **Veritabanı Yönetimi** — JSON düzenleyici ile koordinat ve ölçüm verileri düzenlenir, localStorage'a kaydedilir
- **Rapor** — Uygulama-2 kapsamında yapılan saha çalışmasının detaylı Türkçe raporu
- **Mocha Mousse Tema** — Glassmorphic koyu kahve/krem renk paleti

## Koordinat Referans Sistemi

Noktalar TUREF/TM30 (Transverse Mercator, Merkez Meridyen 30°E) sistemindedir.

```
proj4 tanımı: +proj=tmerc +lat_0=0 +lon_0=30 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs
```

## Teknoloji

| Katman | Teknoloji |
|:---|:---|
| Harita | Leaflet.js + Proj4js |
| Formüller | KaTeX |
| Tema | Vanilla CSS (Glassmorphism) |
| Veri | localStorage + ES Modules |
| Deploy | GitHub Pages |

## Dosya Yapısı

```
survey_app/
├── index.html      # DOM yapısı, 4 sayfa (Harita, Veritabanı, Formüller, Rapor)
├── style.css       # Mocha Mousse glassmorphic tema
├── app.js          # Hesaplama motoru, harita, navigasyon
├── data.js         # Varsayılan koordinat ve ölçüm veritabanı
└── README.md
```

## Yerel Çalıştırma

```bash
cd survey_app
python -m http.server 8080
# http://localhost:8080
```

## Deploy

```bash
git add . && git commit -m "update" && git push origin gh-pages
```
