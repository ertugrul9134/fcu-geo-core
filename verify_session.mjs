// Session verification: U1 removed, U6 109-AGAC2, U4/U6 deep reports
// Run: node verify_session.mjs [baseUrl]
import { chromium } from 'playwright';

const base = process.argv[2] || 'http://localhost:8123';
const V = Date.now() % 100000; // cache-bust
const url = `${base}/?v=${V}`;
const errors = [];
const results = [];
const ok = (name, pass, detail = '') => { results.push({ name, pass, detail }); };

// Use system Edge (msedge channel): avoids the chromium download entirely.
const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage();
page.on('console', m => { if (m.type() === 'error') errors.push(m.text() + ' @' + (m.location()?.url || '?')); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('response', r => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`); });

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(2600); // splash screen is 2s

// 1. Nav: no Uygulama-1, starts at Uygulama-2
const navLabels = await page.$$eval('#outerNav .nav-btn', els => els.map(e => e.textContent.trim()));
ok('nav has no Uygulama-1', !navLabels.some(l => l.includes('Uygulama-1')), navLabels.join(' | '));
ok('nav has Uygulama-2..6', ['Uygulama-2','Uygulama-3','Uygulama-4','Uygulama-5','Uygulama-6'].every(x => navLabels.some(l => l.includes(x))));

// 2. U6: tree labels + report content
await page.click('#outerNav .nav-btn:has-text("Uygulama-6")');
await page.waitForTimeout(1600);
const u6Table = await page.textContent('#u6RtkTable').catch(() => '');
ok('U6 table has 109-AGAC2', u6Table.includes('109-AGAC2'));
ok('U6 table has 110-AGAC (not AGAC2)', /110-AGAC(?!2)/.test(u6Table));
// U6 Rapor subpage
const u6Sub = await page.$('#innerNav button:has-text("Rapor"), .inner-nav-bar button:has-text("Rapor")');
if (u6Sub) { await u6Sub.click(); await page.waitForTimeout(800); }
const u6Rep = await page.textContent('#u6ReportContent').catch(() => '');
ok('U6 report: Tablo-2 comparison', u6Rep.includes('Tablo-2') && u6Rep.includes('Trigonometrik'), `${u6Rep.length} chars`);
ok('U6 report: P.3 tree note', u6Rep.includes('P.3') && u6Rep.includes('ağac'));
ok('U6 report: geoid 36.898', u6Rep.includes('36.898'));

// 3. U4: deep report
await page.click('#outerNav .nav-btn:has-text("Uygulama-4")');
await page.waitForTimeout(1600);
const u4Sub = await page.$('#innerNav button:has-text("Rapor"), .inner-nav-bar button:has-text("Rapor")');
if (u4Sub) { await u4Sub.click(); await page.waitForTimeout(800); }
const u4Rep = await page.textContent('#u4ReportContent').catch(() => '');
ok('U4 report: real route N.53→N.38', u4Rep.includes('N.53') && u4Rep.includes('N.38'), `${u4Rep.length} chars`);
ok('U4 report: fβ=1.8934 error analysis', u4Rep.includes('1.8934') && u4Rep.includes('0.045'));
ok('U4 report: Tablo-1 observations', u4Rep.includes('36 doğrultu') || u4Rep.includes('doğrultu okuması'));
ok('U4 report: Bowditch demo present', u4Rep.includes('Bowditch'));
const u4Rows = await page.$$eval('#u4ReportContent table tbody tr', trs => trs.length).catch(() => 0);
ok('U4 report: obs table has 36 rows', u4Rows >= 36, `${u4Rows} rows`);

// 4. U5 sanity (untouched, must still work)
await page.click('#outerNav .nav-btn:has-text("Uygulama-5")');
await page.waitForTimeout(1600);
const u5T = await page.textContent('#u5GeoTable').catch(() => '');
ok('U5 still renders leveling', u5T.includes('N38') || u5T.includes('N.38') || u5T.length > 200, `${u5T.length} chars`);

// 5. Console errors (ignore map tile noise)
const realErrors = errors.filter(e => !e.includes('tile.openstreetmap') && !e.includes('net::ERR') && !e.includes('favicon'));
ok('console clean', realErrors.length === 0, realErrors.slice(0, 3).join(' || '));

await page.screenshot({ path: 'verify_u4_report.png', fullPage: false });
await browser.close();

let pass = 0, fail = 0;
for (const r of results) { console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? '  [' + r.detail + ']' : ''}`); r.pass ? pass++ : fail++; }
console.log(`\n${pass}/${results.length} passed (url: ${url})`);
process.exit(fail ? 1 : 0);
