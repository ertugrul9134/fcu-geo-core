/**
 * _gen_raporlar.mjs  — generates standalone light-theme print-ready HTML report
 * files for each uygulama's Rapor tab, with an embedded map screenshot.
 *
 * Usage:  node _gen_raporlar.mjs [http://localhost:8124]
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const base  = process.argv[2] || 'http://localhost:8124';

mkdirSync(path.join(__dir, 'raporlar'), { recursive: true });

const uyglamalar = [
    {
        id: 'u3', nav: 'Uygulama-3',
        title: 'Silsile Düşey Açı',
        subtitle: 'Uygulama-3 — Yatay Doğrultu Silsilesi ve Düşey Açı Türetimi',
        mapId: 'u3Map',
        reportId: 'u3ReportContent',
    },
    {
        id: 'u4', nav: 'Uygulama-4',
        title: 'Dayalı Poligon',
        subtitle: 'Uygulama-4 — Total Station ile Dayalı Poligon Ölçümü',
        mapId: 'u4Map',
        reportId: 'u4ReportContent',
    },
    {
        id: 'u5', nav: 'Uygulama-5',
        title: 'Nivelman',
        subtitle: 'Uygulama-5 — Geometrik ve Trigonometrik Nivelman',
        mapId: 'u5Map',
        reportId: 'u5ReportContent',
    },
    {
        id: 'u6', nav: 'Uygulama-6',
        title: 'RTK GPS',
        subtitle: 'Uygulama-6 — RTK GNSS ile 3B Konumlama',
        mapId: 'u6Map',
        reportId: 'u6ReportContent',
    },
];

// Shared CSS for standalone files (light theme, print-ready)
const SHARED_CSS = `
  *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
  :root {
    --accent: #7d4a24;
    --accent-light: #9a6133;
    --accent-glow: transparent;
    --glass-border: #ddd;
    --text-1: #1a1412;
    --text-2: #3e3432;
    --text-3: #7b6359;
    --bg-2: #ede8e3;
    --bg-3: #f5f0ed;
    --success: #27ae60;
    --danger: #c0392b;
    --mocha-900: #f0ebe6;
    --radius-sm: 6px;
  }
  body {
    font-family: 'Inter', -apple-system, sans-serif;
    background: #f8f4f0;
    color: #1a1412;
    padding: 2.5rem 3rem;
    font-size: 10pt;
    line-height: 1.75;
  }
  .rapor-header {
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #7d4a24;
  }
  .rapor-header h1 {
    font-family: 'Inter', sans-serif;
    font-size: 17pt;
    color: #7d4a24;
    margin: 0;
    font-weight: 700;
  }
  .rapor-header .rapor-meta {
    font-family: 'JetBrains Mono', monospace;
    font-size: 8.5pt;
    color: #7b6359;
    margin-top: 0.35rem;
  }
  .map-section {
    margin-bottom: 1.8rem;
  }
  .map-section h2 {
    font-family: 'Inter', sans-serif;
    font-size: 10pt;
    font-weight: 700;
    color: #7d4a24;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 0.4rem;
    border-bottom: 1px solid #ddd;
    padding-bottom: 3px;
  }
  .map-section img {
    width: 100%;
    max-height: 360px;
    object-fit: cover;
    border: 1px solid #ccc;
    border-radius: 6px;
    display: block;
  }
  .map-caption {
    font-size: 8pt;
    color: #7b6359;
    margin-top: 0.3rem;
    font-style: italic;
  }
  h3 {
    font-family: 'Inter', sans-serif;
    font-size: 12pt;
    font-weight: 700;
    color: #7d4a24;
    margin-top: 2rem;
    margin-bottom: 0.6rem;
    padding-bottom: 5px;
    border-bottom: 1px solid #ddd;
  }
  h3:first-child { margin-top: 0; }
  h4 {
    font-family: 'Inter', sans-serif;
    font-size: 10pt;
    font-weight: 600;
    color: #1a1412;
    margin: 1.2rem 0 0.4rem;
  }
  p {
    margin-bottom: 0.75rem;
    text-align: justify;
    hyphens: auto;
    color: #3e3432;
  }
  p strong { color: #1a1412; }
  .overflow-wrap { overflow-x: auto; margin: 0.6rem 0; }
  table {
    width: 100%;
    border-collapse: collapse;
    font-family: 'JetBrains Mono', monospace;
    font-size: 8.5pt;
    margin: 0.4rem 0;
  }
  th {
    background: #e8ddd7;
    color: #7d4a24;
    border: 1px solid #bbb;
    padding: 6px 8px;
    text-align: left;
    font-weight: 600;
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    white-space: nowrap;
  }
  td {
    border: 1px solid #ccc;
    padding: 5px 8px;
    color: #1a1412;
    white-space: nowrap;
  }
  tr:nth-child(even) td { background: #f8f4f0; }
  .formula-render {
    background: #f0ebe6;
    border-left: 3px solid #7d4a24;
    border-radius: 4px;
    padding: 10px 14px;
    margin: 8px 0;
    overflow-x: auto;
  }
  .katex { color: #1a1412; }
  .glass-panel { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
  .formula-card { padding: 1rem; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 1rem; }
  .formula-card h3 { font-size: 10pt; margin-top: 0; }
  .formula-desc { font-size: 9pt; color: #7b6359; margin-bottom: 0.6rem; }
  sub, sup { font-size: 0.78em; }
  b { font-weight: 700; }
  @page {
    size: A4 portrait;
    margin: 1.5cm 1.8cm 1.5cm 1.8cm;
  }
  @media print {
    body { background: #fff; padding: 0; font-size: 9.5pt; }
    h3 { page-break-after: avoid; }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; }
    img { page-break-inside: avoid; max-height: 320px; }
    .rapor-header { page-break-after: avoid; }
  }
`;

async function clickInner(page, label) {
    const btns = await page.$$('.inner-nav-inner .nav-btn, #innerNav .nav-btn');
    for (const b of btns) {
        if ((await b.textContent()).trim().includes(label)) { await b.click(); return true; }
    }
    return false;
}

const browser = await chromium.launch({ channel: 'msedge' });

for (const u of uyglamalar) {
    console.log(`\n▶ Generating: rapor_${u.id}.html`);
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const url = `${base}/?v=${Date.now() % 100000}`;

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2200);

    // Apply light theme
    await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('fcu_theme', 'light');
    });

    // Click uygulama outer-nav button
    const navBtns = await page.$$('.outer-nav .nav-btn');
    for (const btn of navBtns) {
        if ((await btn.textContent()).trim().includes(u.nav)) { await btn.click(); break; }
    }
    await page.waitForTimeout(1600);

    // Click Harita tab → wait for tiles
    await clickInner(page, 'Harita');
    await page.waitForTimeout(3200);

    // Screenshot the map element
    let mapScreenshot = null;
    try {
        const mapEl = await page.$('#' + u.mapId);
        if (mapEl) {
            const buf = await mapEl.screenshot({ type: 'png' });
            mapScreenshot = 'data:image/png;base64,' + buf.toString('base64');
            console.log(`  ✓ Map screenshot captured (${Math.round(buf.length / 1024)} KB)`);
        }
    } catch (e) { console.log('  ⚠ Map screenshot failed:', e.message); }

    // Click Rapor tab
    await clickInner(page, 'Rapor');
    await page.waitForTimeout(1200);

    // Extract rendered report HTML
    const reportInnerHTML = await page.$eval('#' + u.reportId, el => el.innerHTML).catch(() => '');
    if (!reportInnerHTML) { console.log('  ⚠ No report HTML found'); await page.close(); continue; }
    console.log(`  ✓ Report HTML extracted (${Math.round(reportInnerHTML.length / 1024)} KB)`);

    // Build map section
    const mapSection = mapScreenshot
        ? `<div class="map-section">
             <h2>Ölçüm Alanı Haritası</h2>
             <img src="${mapScreenshot}" alt="Harita görünümü — ${u.title}"/>
             <p class="map-caption">YTÜ Davutpaşa Kampüsü ölçüm alanı — © OpenStreetMap katkıcıları &amp; Playwright/Leaflet</p>
           </div>`
        : '<p style="color:#7b6359;font-style:italic;">Harita görüntüsü yüklenemedi.</p>';

    // Build complete standalone HTML
    const dateStr = new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });
    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${u.subtitle} | Ertuğrul Kulak 24046607</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <style>${SHARED_CSS}</style>
</head>
<body>
  <div class="rapor-header">
    <h1>${u.subtitle}</h1>
    <div class="rapor-meta">
      Öğrenci: Ertuğrul Kulak &nbsp;|&nbsp; Öğrenci No: 24046607 &nbsp;|&nbsp;
      Nokta: 48 &nbsp;|&nbsp; XX=07 &nbsp;|&nbsp;
      YTÜ Ölçme Uygulaması &nbsp;|&nbsp; ${dateStr}
    </div>
  </div>

  ${mapSection}

  <div id="reportContent">
    ${reportInnerHTML}
  </div>
</body>
</html>`;

    const outPath = path.join(__dir, 'raporlar', `rapor_${u.id}.html`);
    writeFileSync(outPath, html, 'utf8');
    console.log(`  ✓ Saved: ${outPath}`);

    await page.close();
}

await browser.close();
console.log('\n✅ Tüm raporlar raporlar/ klasörüne kaydedildi.');
