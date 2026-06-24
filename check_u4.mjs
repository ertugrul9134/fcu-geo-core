// Focused U4 verification — 5 sub-tabs render, console clean, screenshots.
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const base = process.argv[2] || 'http://localhost:8123';
const V = Date.now() % 100000;
const url = `${base}/?v=${V}`;
mkdirSync('_snapshots', { recursive: true });
const errors = [];
const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
page.on('console', m => { if (m.type() === 'error') errors.push(m.text() + ' @' + (m.location()?.url || '?')); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(2600);

const results = [];
const ok = (n, p, d = '') => results.push({ n, p, d });

async function clickInner(label) {
  const btns = await page.$$('.inner-nav-bar .nav-btn, #innerNav .nav-btn, .inner-nav-inner .nav-btn');
  for (const b of btns) { const t = (await b.textContent()).trim(); if (t.includes(label)) { await b.click(); return true; } }
  return false;
}

// Go to Uygulama-4
await page.click('#outerNav .nav-btn:has-text("Uygulama-4")');
await page.waitForTimeout(1400);

// inner nav labels
const innerLabels = await page.$$eval('.inner-nav-bar .nav-btn, #innerNav .nav-btn, .inner-nav-inner .nav-btn', els => els.map(e => e.textContent.trim()));
ok('U4 inner-nav has 5 screens', ['Harita','Veritabanı','Formüller','Rapor','Dengeleme'].every(x => innerLabels.some(l => l.includes(x))), innerLabels.join(' | '));

// Harita
await clickInner('Harita'); await page.waitForTimeout(1200);
const mapInfo = await page.textContent('#u4MapInfo').catch(() => '');
ok('U4 Harita: route info', mapInfo.includes('N.50') && mapInfo.includes('N.40'), `${mapInfo.length} chars`);
const tiles = await page.$$eval('#u4Map img.leaflet-tile', e => e.length).catch(() => 0);
ok('U4 Harita: leaflet tiles', tiles > 0, `${tiles} tiles`);
await page.screenshot({ path: '_snapshots/u4_harita.png' });

// Veritabanı
await clickInner('Veritabanı'); await page.waitForTimeout(600);
const db = await page.textContent('#u4DbContent').catch(() => '');
const dbRows = await page.$$eval('#u4DbContent table tbody tr', t => t.length).catch(() => 0);
ok('U4 Veritabanı: tables render', db.includes('P1') && db.includes('Kırılma') && dbRows > 20, `${dbRows} rows`);
await page.screenshot({ path: '_snapshots/u4_veritabani.png' });

// Formüller
await clickInner('Formüller'); await page.waitForTimeout(600);
const katexN = await page.$$eval('#u4FormulasContent .katex', e => e.length).catch(() => 0);
ok('U4 Formüller: KaTeX renders', katexN >= 5, `${katexN} katex blocks`);
await page.screenshot({ path: '_snapshots/u4_formuller.png' });

// Rapor
await clickInner('Rapor'); await page.waitForTimeout(600);
const rep = await page.textContent('#u4ReportContent').catch(() => '');
ok('U4 Rapor: content', rep.includes('Tablo-1') && rep.includes('BAŞARILI') && rep.includes('45 mgon'), `${rep.length} chars`);
await page.screenshot({ path: '_snapshots/u4_rapor.png' });

// Dengeleme
await clickInner('Dengeleme'); await page.waitForTimeout(600);
const adj = await page.textContent('#u4AdjContent').catch(() => '');
ok('U4 Dengeleme: closure', adj.includes('Semt Taşıma') && adj.includes('Bowditch'), `${adj.length} chars`);
const fbeta = adj.match(/f.{0,6}β[\s\S]{0,40}?(-?\d+\.\d+)\s*mgon/);
ok('U4 Dengeleme: fβ ≈ 0', /(^|[^\d])0\.0\s*mgon/.test(adj) || adj.includes('0.0 mgon'), fbeta ? fbeta[0] : 'no fβ string');
await page.screenshot({ path: '_snapshots/u4_dengeleme.png' });

const real = errors.filter(e => !e.includes('tile') && !e.includes('favicon') && !e.includes('net::ERR'));
ok('console clean', real.length === 0, real.slice(0, 3).join(' || '));

await browser.close();
let pass = 0, fail = 0;
for (const r of results) { console.log(`${r.p ? 'PASS' : 'FAIL'}  ${r.n}${r.d ? '  [' + r.d + ']' : ''}`); r.p ? pass++ : fail++; }
console.log(`\n${pass}/${results.length} passed (${url})`);
process.exit(fail ? 1 : 0);
