import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
const base = process.argv[2] || 'http://localhost:8123';
const url = `${base}/?v=${Date.now() % 100000}`;
mkdirSync('_snapshots', { recursive: true });
const errors = [];
const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
page.on('console', m => { if (m.type() === 'error') errors.push(m.text() + ' @' + (m.location()?.url || '?')); });
page.on('response', r => { if (r.status() >= 400 && !/tile|openstreetmap/.test(r.url())) errors.push('HTTP ' + r.status() + ' ' + r.url()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(2600);
const results = []; const ok = (n, p, d = '') => results.push({ n, p, d });
async function clickInner(label) {
  const btns = await page.$$('.inner-nav-bar .nav-btn, #innerNav .nav-btn, .inner-nav-inner .nav-btn');
  for (const b of btns) { if ((await b.textContent()).trim().includes(label)) { await b.click(); return true; } }
  return false;
}
await page.click('#outerNav .nav-btn:has-text("Uygulama-5")');
await page.waitForTimeout(1400);
const labels = await page.$$eval('.inner-nav-bar .nav-btn, #innerNav .nav-btn, .inner-nav-inner .nav-btn', els => els.map(e => e.textContent.trim()));
ok('U5 inner-nav 5 screens', ['Harita','Veritabanı','Formüller','Rapor','Dengeleme'].every(x => labels.some(l => l.includes(x))), labels.join(' | '));

await clickInner('Harita'); await page.waitForTimeout(1200);
const mi = await page.textContent('#u5MapInfo').catch(() => '');
ok('U5 Harita info', mi.includes('Kapalı') && mi.includes('344.9'), `${mi.length}c`);
ok('U5 map tiles', (await page.$$eval('#u5Map img.leaflet-tile', e => e.length).catch(() => 0)) > 0);
await page.screenshot({ path: '_snapshots/u5_harita.png' });

await clickInner('Veritabanı'); await page.waitForTimeout(500);
const db = await page.textContent('#u5DbContent').catch(() => '');
ok('U5 Veritabanı tables', db.includes('24.2869') && db.includes('Trigonometrik') && db.includes('101.0384'), `${db.length}c`);
await page.screenshot({ path: '_snapshots/u5_veritabani.png' });

await clickInner('Formüller'); await page.waitForTimeout(500);
ok('U5 Formüller KaTeX', (await page.$$eval('#u5FormulasContent .katex', e => e.length).catch(() => 0)) >= 5);
await page.screenshot({ path: '_snapshots/u5_formuller.png' });

await clickInner('Rapor'); await page.waitForTimeout(500);
const rep = await page.textContent('#u5ReportContent').catch(() => '');
ok('U5 Rapor content', rep.includes('Tablo-2') && rep.includes('76.5650') && rep.includes('+0.3449') && rep.includes('Trigonometrik'), `${rep.length}c`);
const repRows = await page.$$eval('#u5ReportContent table tbody tr', t => t.length).catch(() => 0);
ok('U5 Rapor tables rows', repRows >= 18, `${repRows} rows`);
await page.screenshot({ path: '_snapshots/u5_rapor.png' });

await clickInner('Dengeleme'); await page.waitForTimeout(500);
const adj = await page.textContent('#u5AdjContent').catch(() => '');
ok('U5 Dengeleme closure', adj.includes('344.9') && adj.includes('Kontrol') && adj.includes('0.0000'), `${adj.length}c`);
await page.screenshot({ path: '_snapshots/u5_dengeleme.png' });

const real = errors.filter(e => !e.includes('tile') && !e.includes('favicon') && !e.includes('net::ERR'));
ok('console clean', real.length === 0, real.slice(0, 3).join(' || '));
await browser.close();
let pass = 0, fail = 0;
for (const r of results) { console.log(`${r.p ? 'PASS' : 'FAIL'}  ${r.n}${r.d ? '  [' + r.d + ']' : ''}`); r.p ? pass++ : fail++; }
console.log(`\n${pass}/${results.length} passed (${url})`);
process.exit(fail ? 1 : 0);
