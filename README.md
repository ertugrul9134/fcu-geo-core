# FCU GEO-CORE — Jeodezik Hesaplama Sistemi

Yıldız Teknik Üniversitesi Ölçme Uygulamaları dersi kapsamında geliştirilen, tarayıcı tabanlı nirengi hesaplama ve görselleştirme aracı.

## Canlı Demo

**https://fundamentals-surveying.surge.sh**

---

## Proje Yürütücüsü (Project Overview Editor) Bilgileri
**⚠️ DİKKAT: Bu bölüm proje yöneticisi/yürütücüsü içindir.**

Uygulamanın yayında olduğu özel alan adı (Surge) herhangi bir abonelik veya ücretli plan gerektirmeyen, bağımsız ve ücretsiz bir altyapı üzerine kurulmuştur. İlerleyen süreçte bu altyapıyı yönetmek, projeyi yayından kaldırmak veya güncellemek isterseniz aşağıdaki yönetici (login) bilgilerini kullanabilirsiniz:

- **Platform:** [Surge.sh](https://surge.sh/)
- **Yönetici E-Posta:** `ertugrul_fcu@1secmail.com`
- **Şifre:** `Geocore2026!`

*(Uygulamayı yerelde terminalden güncelledikten sonra tekrar aynı adrese deploy etmek isterseniz terminalde `npx surge ./ fundamentals-surveying.surge.sh` komutunu çalıştırmanız ve istendiğinde bu bilgileri girmeniz yeterlidir.)*

---

## Özellikler

- **Leaflet Harita** — TUREF/TM30 koordinatları WGS84'e dönüştürülerek OSM, Google Uydu ve Google Hibrit katmanlarında gösterilir
- **Nokta Seçimi** — Harita üzerinden 3 nokta seçilerek üçgen oluşturulur
- **Hesaplama Motoru** — Açı kapanma hatası dağıtımı, Sinüs Teoremi, 1., 2. ve 3. Temel Ödev hesapları
- **Dengeleme (İstatistiksel Analiz)** — Seçilen üçgen ağındaki ölçülerle koordinattan gelen kesin değerleri karşılaştırır, En Küçük Kareler parametreleri (RMS, Standart Sapma, $\chi^2$) türetir ve hataları ısı haritası ile görselleştirir.
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
