/* ═══════════════════════════════════════════════
   CALCULATORS HUB — 13 self-contained kart
   Her kart: glass-panel calc-card + KaTeX formül +
   live input → live output. Saf DOM, side-effect yok.
   ═══════════════════════════════════════════════ */

import { 
    atmosphericCorrection, slopeToHorizontal, projectToPlane, 
    computeBreakAngle, dependentTraverse, computeAzimuth as u4ComputeAzimuth 
} from './u4_engine.js';
import { 
    geometricDH, trigonometricDH, curvatureRefractionCorrection, levelingLoopClosure 
} from './u5_engine.js';
import { ellipsoidalToOrthometric, orthometricToEllipsoidal, egm96Simple, compare3DMethods } from './u6_engine.js';
import {
    firstFundamental, secondFundamental, thirdFundamental,
    forwardIntersection, resection,
    slopeReduction, triangleClosure, trigLevelling, curvatureRefraction,
    sineTheorem, levellingLoopClosure,
    GON_TO_RAD, normalizeGon, gonToDms, fmtGon, fmtMeter
} from './geo_math.js';
import {
    egm96Undulation, ellipsoidal, orthometric, fetchElevation
} from './u3_elevation.js';

/* ─── Yardımcı: kart şablonu ──────────────────── */
function calcCard({ id, title, formulaTeX, inputs, compute, async = false, info = null }) {
    const card = document.createElement('div');
    card.className = 'glass-panel calc-card';
    card.dataset.calcId = id;

    const inputsHtml = inputs.map(inp => {
        const w = inp.full ? ' class="full"' : '';
        if (inp.kind === 'textarea') {
            return `<label${w}><span>${inp.label}${inp.unit ? ' (' + inp.unit + ')' : ''}</span><textarea data-key="${inp.key}" placeholder="${inp.placeholder || ''}"></textarea></label>`;
        }
        if (inp.kind === 'select') {
            const opts = inp.options.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
            return `<label${w}><span>${inp.label}</span><select data-key="${inp.key}">${opts}</select></label>`;
        }
        return `<label${w}><span>${inp.label}${inp.unit ? ' (' + inp.unit + ')' : ''}</span><input type="number" step="any" data-key="${inp.key}" value="${inp.default ?? ''}" placeholder="${inp.placeholder || ''}"></label>`;
    }).join('');

    card.innerHTML = `
        <h3>${title}</h3>
        <div class="calc-formula"></div>
        ${info ? `<div class="empty-hint" style="font-size: 0.78rem; margin-bottom: 0.4rem;">${info}</div>` : ''}
        <div class="calc-inputs">${inputsHtml}</div>
        <div class="calc-results"></div>
    `;

    // KaTeX render
    if (formulaTeX && window.katex) {
        try {
            card.querySelector('.calc-formula').innerHTML =
                window.katex.renderToString(formulaTeX, { displayMode: true, throwOnError: false });
        } catch (_) { /* swallow */ }
    }

    const resultsEl = card.querySelector('.calc-results');
    const collect = () => {
        const vals = {};
        card.querySelectorAll('[data-key]').forEach(el => {
            const k = el.dataset.key;
            if (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') vals[k] = el.value;
            else {
                const n = parseFloat(el.value);
                vals[k] = isNaN(n) ? null : n;
            }
        });
        return vals;
    };

    const renderResults = (out) => {
        if (!out) {
            resultsEl.innerHTML = '<span class="empty-hint">Tüm girişleri doldurun…</span>';
            return;
        }
        if (out.error) {
            resultsEl.innerHTML = `<div class="calc-warn">⚠ ${escapeHtml(out.error)}</div>`;
            return;
        }
        const lines = Object.entries(out)
            .filter(([k]) => k !== 'error')
            .map(([k, v]) => `<div><span class="res-key">${escapeHtml(k)}</span> = <span class="res-val">${formatVal(v)}</span></div>`);
        resultsEl.innerHTML = lines.join('');
    };

    const trigger = async () => {
        const vals = collect();
        try {
            const out = async ? await compute(vals) : compute(vals);
            renderResults(out);
        } catch (err) {
            renderResults({ error: err.message });
        }
    };

    card.querySelectorAll('input, textarea, select').forEach(el => {
        el.addEventListener('input', trigger);
        el.addEventListener('change', trigger);
    });
    // İlk render
    trigger();

    return card;
}

function escapeHtml(s) {
    return String(s).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function formatVal(v) {
    if (v == null) return '—';
    if (typeof v === 'number') {
        if (Math.abs(v) < 1e-6 || Math.abs(v) > 1e9) return v.toExponential(4);
        return v.toFixed(4);
    }
    if (Array.isArray(v)) return '[' + v.map(formatVal).join(', ') + ']';
    if (typeof v === 'object') {
        return '{ ' + Object.entries(v).map(([k, x]) => `${k}: ${formatVal(x)}`).join(', ') + ' }';
    }
    return String(v);
}

/* ═══════════════════════════════════════════════
   13 CALCULATOR FACTORIES
   ═══════════════════════════════════════════════ */
export const Calculators = [
    {
        id: 'temel1', title: '1. Temel Ödev — Düz Hesap',
        build: () => calcCard({
            id: 'temel1',
            title: '1. Temel Ödev (Düz Hesap)',
            formulaTeX: 'Y_B = Y_A + S \\sin(\\alpha),\\quad X_B = X_A + S \\cos(\\alpha)',
            inputs: [
                { key: 'YA', label: 'Y_A', unit: 'm', default: 0 },
                { key: 'XA', label: 'X_A', unit: 'm', default: 0 },
                { key: 'az', label: 'α', unit: 'gon', default: 100 },
                { key: 'S',  label: 'S',  unit: 'm',  default: 100 }
            ],
            compute: ({ YA, XA, az, S }) => {
                if ([YA, XA, az, S].some(v => v == null)) return null;
                const r = firstFundamental(YA, XA, az, S);
                return { Y_B: r.y, X_B: r.x, dY: r.dy, dX: r.dx };
            }
        })
    },
    {
        id: 'temel2', title: '2. Temel Ödev — Ters Hesap',
        build: () => calcCard({
            id: 'temel2',
            title: '2. Temel Ödev (Ters Hesap)',
            formulaTeX: 'S = \\sqrt{\\Delta Y^2 + \\Delta X^2},\\quad \\alpha = \\arctan(\\Delta Y / \\Delta X)',
            inputs: [
                { key: 'YA', label: 'Y_A', unit: 'm' },
                { key: 'XA', label: 'X_A', unit: 'm' },
                { key: 'YB', label: 'Y_B', unit: 'm' },
                { key: 'XB', label: 'X_B', unit: 'm' }
            ],
            compute: ({ YA, XA, YB, XB }) => {
                if ([YA, XA, YB, XB].some(v => v == null)) return null;
                const r = secondFundamental(YA, XA, YB, XB);
                return { S: r.distance, 'α (gon)': r.azimuth, 'α (DMS)': gonToDms(r.azimuth), dY: r.dy, dX: r.dx };
            }
        })
    },
    {
        id: 'temel3', title: '3. Temel Ödev — Açı Nakli',
        build: () => calcCard({
            id: 'temel3',
            title: '3. Temel Ödev (Açı Nakli)',
            formulaTeX: '\\alpha_{BC} = \\alpha_{AB} + 200^g + \\beta',
            inputs: [
                { key: 'azAB', label: 'α_AB', unit: 'gon' },
                { key: 'beta', label: 'β (kırılma)', unit: 'gon' }
            ],
            compute: ({ azAB, beta }) => {
                if (azAB == null || beta == null) return null;
                const az = thirdFundamental(azAB, beta);
                return { 'α_BC (gon)': az, 'α_BC (DMS)': gonToDms(az) };
            }
        })
    },
    {
        id: 'trigLev', title: 'Trigonometrik Nivelman',
        build: () => calcCard({
            id: 'trigLev',
            title: 'Trigonometrik Nivelman',
            formulaTeX: '\\Delta h = D\\cot(\\bar Z) + (1-k)\\dfrac{D^2}{2R} + (i - t)',
            inputs: [
                { key: 'D', label: 'D (yatay)', unit: 'm', default: 100 },
                { key: 'Z', label: 'Z̄ (zenith)', unit: 'gon', default: 95 },
                { key: 'i', label: 'i (alet)', unit: 'm', default: 1.55 },
                { key: 't', label: 't (hedef)', unit: 'm', default: 1.55 },
                { key: 'k', label: 'k (refraksiyon)', default: 0.13 },
                { key: 'R', label: 'R (yer yarıçapı)', unit: 'm', default: 6371000 }
            ],
            compute: ({ D, Z, i, t, k, R }) => {
                if ([D, Z, i, t, k, R].some(v => v == null)) return null;
                const r = trigLevelling(D, Z, i, t, k, R);
                return { 'Δh': r.dh, 'Δh_geom': r.dh_geom, 'Δh_düz': r.dh_corr };
            }
        })
    },
    {
        id: 'curvRef', title: 'Eğrilik + Refraksiyon',
        build: () => calcCard({
            id: 'curvRef',
            title: 'Eğrilik + Refraksiyon Düzeltmesi',
            formulaTeX: '\\Delta = (1-k)\\dfrac{D^2}{2R}',
            inputs: [
                { key: 'D', label: 'D', unit: 'm', default: 1000 },
                { key: 'k', label: 'k', default: 0.13 },
                { key: 'R', label: 'R', unit: 'm', default: 6371000 }
            ],
            compute: ({ D, k, R }) => {
                if ([D, k, R].some(v => v == null)) return null;
                return { 'Δ': curvatureRefraction(D, k, R) };
            }
        })
    },
    {
        id: 'slopeRed', title: 'Eğik → Yatay Mesafe',
        build: () => calcCard({
            id: 'slopeRed',
            title: 'Eğik Mesafe → Yatay Mesafe',
            formulaTeX: 's_h = s \\sin(Z)',
            inputs: [
                { key: 's', label: 's (eğik)', unit: 'm', default: 100 },
                { key: 'Z', label: 'Z (zenith)', unit: 'gon', default: 100 }
            ],
            compute: ({ s, Z }) => {
                if (s == null || Z == null) return null;
                return { 's_yatay': slopeReduction(s, Z) };
            }
        })
    },
    {
        id: 'heightConv', title: 'h_ortometrik ↔ h_ellipsoid',
        build: () => calcCard({
            id: 'heightConv',
            title: 'Yükseklik Dönüşümü (EGM96)',
            formulaTeX: 'h_{ell} = h_{ortho} + N,\\quad h_{ortho} = h_{ell} - N',
            info: 'Türkiye + Akdeniz için ±0.5 m doğruluk; dünya geneli için ±2 m yaklaşıklık.',
            inputs: [
                { key: 'h',    label: 'h', unit: 'm', default: 50 },
                { key: 'lat',  label: 'Enlem (φ)', unit: '°', default: 41.024 },
                { key: 'lng',  label: 'Boylam (λ)', unit: '°', default: 28.886 },
                { key: 'mode', label: 'Mod', kind: 'select', full: true, options: [
                    { value: 'ortho2ell', label: 'Ortometrik → Ellipsoid' },
                    { value: 'ell2ortho', label: 'Ellipsoid → Ortometrik' }
                ]}
            ],
            compute: ({ h, lat, lng, mode }) => {
                if ([h, lat, lng].some(v => v == null)) return null;
                const N = egm96Undulation(lat, lng);
                if (mode === 'ell2ortho') {
                    return { 'N (geoid)': N, 'h_ortometrik': h - N };
                }
                return { 'N (geoid)': N, 'h_ellipsoid': h + N };
            }
        })
    },
    {
        id: 'sineThm', title: 'Sinüs Teoremi',
        build: () => calcCard({
            id: 'sineThm',
            title: 'Sinüs Teoremi (Üçgen Çözümü)',
            formulaTeX: '\\dfrac{a}{\\sin A} = \\dfrac{b}{\\sin B} = \\dfrac{c}{\\sin C}',
            info: 'Bir kenar a + üç açı (gon, toplam 200) → diğer kenarlar.',
            inputs: [
                { key: 'a', label: 'a (kenar)', unit: 'm', default: 100 },
                { key: 'A', label: 'A (a karşısı)', unit: 'gon', default: 70 },
                { key: 'B', label: 'B', unit: 'gon', default: 60 },
                { key: 'C', label: 'C', unit: 'gon', default: 70 }
            ],
            compute: ({ a, A, B, C }) => {
                if ([a, A, B, C].some(v => v == null)) return null;
                return sineTheorem(a, A, B, C);
            }
        })
    },
    {
        id: 'triClose', title: 'Üçgen Açı Kapama',
        build: () => calcCard({
            id: 'triClose',
            title: 'Üçgen Açı Kapama Hatası',
            formulaTeX: 'w = (\\beta_1 + \\beta_2 + \\beta_3) - 200^g,\\quad v = -w/3',
            inputs: [
                { key: 'b1', label: 'β₁', unit: 'gon', default: 66.6667 },
                { key: 'b2', label: 'β₂', unit: 'gon', default: 66.6666 },
                { key: 'b3', label: 'β₃', unit: 'gon', default: 66.6668 }
            ],
            compute: ({ b1, b2, b3 }) => {
                if ([b1, b2, b3].some(v => v == null)) return null;
                const r = triangleClosure(b1, b2, b3);
                return { 'Σβ': r.sum, 'w': r.w, 'v (her açı)': r.correction, 'düzeltilmiş': r.adjusted };
            }
        })
    },
    {
        id: 'fwdInter', title: 'İleri Kesim',
        build: () => calcCard({
            id: 'fwdInter',
            title: 'İleri Kesim (Forward Intersection)',
            formulaTeX: 'P = A + S_{AP} \\cdot \\hat{u}(\\alpha_{AP})',
            info: 'A, B noktalarından ölçülen α_AP, α_BP doğrultularıyla P koordinatları.',
            inputs: [
                { key: 'YA', label: 'Y_A', unit: 'm' },
                { key: 'XA', label: 'X_A', unit: 'm' },
                { key: 'YB', label: 'Y_B', unit: 'm' },
                { key: 'XB', label: 'X_B', unit: 'm' },
                { key: 'azAP', label: 'α_AP', unit: 'gon' },
                { key: 'azBP', label: 'α_BP', unit: 'gon' }
            ],
            compute: ({ YA, XA, YB, XB, azAP, azBP }) => {
                if ([YA, XA, YB, XB, azAP, azBP].some(v => v == null)) return null;
                const r = forwardIntersection(YA, XA, YB, XB, azAP, azBP);
                if (r.error) return r;
                return { 'Y_P': r.y, 'X_P': r.x, 'S_AP': r.sAP, 'S_BP': r.sBP };
            }
        })
    },
    {
        id: 'resect', title: 'Geri Kesim',
        build: () => calcCard({
            id: 'resect',
            title: 'Geri Kesim (Resection)',
            formulaTeX: '\\text{Tienstra: } P = \\dfrac{\\sum w_i \\cdot V_i}{\\sum w_i}',
            info: 'P\'den A, B, C\'ye ölçülen iç açılarla istasyon koordinatı.',
            inputs: [
                { key: 'YA', label: 'Y_A', unit: 'm' },
                { key: 'XA', label: 'X_A', unit: 'm' },
                { key: 'YB', label: 'Y_B', unit: 'm' },
                { key: 'XB', label: 'X_B', unit: 'm' },
                { key: 'YC', label: 'Y_C', unit: 'm' },
                { key: 'XC', label: 'X_C', unit: 'm' },
                { key: 'aAPB', label: 'açı APB', unit: 'gon' },
                { key: 'aBPC', label: 'açı BPC', unit: 'gon' }
            ],
            compute: ({ YA, XA, YB, XB, YC, XC, aAPB, aBPC }) => {
                if ([YA, XA, YB, XB, YC, XC, aAPB, aBPC].some(v => v == null)) return null;
                const r = resection(YA, XA, YB, XB, YC, XC, aAPB, aBPC);
                if (r.error) return r;
                return { 'Y_P': r.y, 'X_P': r.x };
            }
        })
    },
    {
        id: 'levLoop', title: 'Nivelman Halka Kapama',
        build: () => calcCard({
            id: 'levLoop',
            title: 'Nivelman Halka Kapama',
            formulaTeX: 'w = \\sum \\Delta h,\\quad v = -w/n',
            info: 'Δh listesini virgül veya yeni satırla ayırın.',
            inputs: [
                { key: 'list', kind: 'textarea', full: true,
                  label: 'Δh listesi', unit: 'm',
                  placeholder: 'Örn: 1.234, -0.567, 0.892, -1.559' }
            ],
            compute: ({ list }) => {
                if (!list || !list.trim()) return null;
                const arr = list.split(/[\s,;]+/).map(s => parseFloat(s)).filter(x => !isNaN(x));
                if (arr.length === 0) return { error: 'Geçerli sayı bulunamadı.' };
                const r = levellingLoopClosure(arr);
                return { n: r.n, 'Σ Δh': r.sum, 'w (kapama)': r.w, 'v (her ölçü)': r.correction, 'düzeltilmiş': r.adjusted };
            }
        })
    },
    {
        id: 'demLookup', title: 'DEM Yükseklik Sorgusu',
        build: () => calcCard({
            id: 'demLookup',
            title: 'DEM Yükseklik (Open-Meteo SRTM)',
            formulaTeX: 'h_{ortho} = \\text{SRTM}(\\varphi, \\lambda)',
            info: '~30 m doğruluk · 7 gün cache · Open-Meteo Elevation API.',
            async: true,
            inputs: [
                { key: 'lat', label: 'Enlem (φ)', unit: '°', default: 41.024 },
                { key: 'lng', label: 'Boylam (λ)', unit: '°', default: 28.886 }
            ],
            compute: async ({ lat, lng }) => {
                if (lat == null || lng == null) return null;
                const h = await fetchElevation(lat, lng);
                if (h == null) return { error: 'API yanıt vermedi veya cache yok.' };
                const N = egm96Undulation(lat, lng);
                return { 'h_ortometrik': h, 'N (EGM96)': N, 'h_ellipsoid (≈)': h + N };
            }
        })
    },

        // ─── U4: Atmospheric correction ──────────────────
    {
        id: 'atmCorr', title: 'Atmosferik Düzeltme',
        build: () => calcCard({
            id: 'atmCorr',
            title: 'Atmosferik Düzeltme (I. Hız)',
            formulaTeX: `S_{atm}} = S \\cdot K_{atm}, \\quad K_{atm} = 1 + \\frac{XX}{10000}`,
            inputs: [
                { label: 'Eğik Mesafe', unit: 'm', key: 'slopeDist', default: '100' },
                { label: 'XX (Öğr.No son 2)', unit: '', key: 'xx', default: '7' }
            ],
            compute: vals => {
                const sCorr = atmosphericCorrection(parseFloat(vals.slopeDist), parseInt(vals.xx));
                return [`Düzeltilmiş mesafe: ${sCorr.toFixed(4)} m`];
            }
        })
    },
    // ─── U4: Slope to horizontal ──────────────────
    {
        id: 'slopeToHoriz', title: 'Eğik → Yatay Mesafe',
        build: () => calcCard({
            id: 'slopeToHoriz',
            title: 'Eğik → Yatay Mesafe',
            formulaTeX: `S_{yatay}} = S \\cdot \\sin(Z)`,
            inputs: [
                { label: 'Eğik Mesafe', unit: 'm', key: 'slopeDist', default: '100' },
                { label: 'Zenit Açısı', unit: 'gon', key: 'zenith', default: '99' }
            ],
            compute: vals => {
                const sHoriz = slopeToHorizontal(parseFloat(vals.slopeDist), parseFloat(vals.zenith));
                return [`S_yatay = ${sHoriz.toFixed(4)} m`];
            }
        })
    },
    // ─── U4: Projection reduction ──────────────────
    {
        id: 'projReduction', title: 'Projeksiyon İndirgemesi',
        build: () => calcCard({
            id: 'projReduction',
            title: 'Projeksiyon İndirgemesi',
            formulaTeX: `S_{proj}} = S_{yatay} \\cdot \\frac{R}{R + H_{ort}}`,
            inputs: [
                { label: 'Yatay Mesafe', unit: 'm', key: 'sHoriz', default: '100' },
                { label: 'Ort. Yükseklik', unit: 'm', key: 'hMean', default: '75' }
            ],
            compute: vals => {
                const sProj = projectToPlane(parseFloat(vals.sHoriz), parseFloat(vals.hMean));
                return [`S_proj = ${sProj.toFixed(4)} m`, `Fark = ${(parseFloat(vals.sHoriz) - sProj).toFixed(4)} m`];
            }
        })
    },
    // ─── U4: Traverse closure ───────────────────────
    {
        id: 'traverseClosure', title: 'Poligon Kapanma Hatası',
        build: () => calcCard({
            id: 'traverseClosure',
            title: 'Poligon Kapanma Hatası',
            formulaTeX: `f_s = \\sqrt{f_x^2 + f_y^2}}, \\quad \\text{bağıl} = \\frac{f_s}{\\sum S}`,
            inputs: [
                { label: 'fx', unit: 'm', key: 'fx', default: '0.05' },
                { label: 'fy', unit: 'm', key: 'fy', default: '-0.03' },
                { label: 'Toplam Mesafe', unit: 'm', key: 'totalDist', default: '500' }
            ],
            compute: vals => {
                const fs = Math.sqrt(parseFloat(vals.fx)**2 + parseFloat(vals.fy)**2);
                const rel = fs / parseFloat(vals.totalDist);
                return [`fs = ${fs.toFixed(4)} m`, `Bağıl hata = 1 / ${Math.round(1/rel)}`];
            }
        })
    },
    // ─── U5: Geometric leveling ─────────────────────
    {
        id: 'geoLeveling', title: 'Geometrik Nivelman',
        build: () => calcCard({
            id: 'geoLeveling',
            title: 'Geometrik Nivelman',
            formulaTeX: `\\Delta h = BS - FS`,
            inputs: [
                { label: 'Geri Okuma (BS)', unit: 'm', key: 'bs', default: '1.523' },
                { label: 'İleri Okuma (FS)', unit: 'm', key: 'fs', default: '0.847' }
            ],
            compute: vals => {
                const dh = geometricDH(parseFloat(vals.bs), parseFloat(vals.fs));
                return [`Δh = ${dh.toFixed(3)} m`];
            }
        })
    },
    // ─── U5: Trigonometric leveling ────────────────
    {
        id: 'trigLevelingU5', title: 'Trigonometrik Nivelman',
        build: () => calcCard({
            id: 'trigLevelingU5',
            title: 'Trigonometrik Nivelman',
            formulaTeX: `\\Delta h = S \\cdot \\cos(Z) + i - t + \\frac{1-k}}{2R} \\cdot S_h^2`,
            inputs: [
                { label: 'Eğik Mesafe', unit: 'm', key: 'slopeDist', default: '100' },
                { label: 'Zenit Açısı', unit: 'gon', key: 'zenith', default: '99' },
                { label: 'Alet Yük. (i)', unit: 'm', key: 'i', default: '1.55' },
                { label: 'İşaret Yük. (t)', unit: 'm', key: 't', default: '1.60' },
                { label: 'k (refraksiyon)', unit: '', key: 'k', default: '0.13' }
            ],
            compute: vals => {
                const result = trigonometricDH(parseFloat(vals.slopeDist), parseFloat(vals.zenith), parseFloat(vals.i), parseFloat(vals.t), parseFloat(vals.k));
                return [`Δh = ${result.dh.toFixed(3)} m`, `S_yatay = ${result.sHoriz.toFixed(3)} m`, `Eğrilik = ${result.curvatureRefraction.toFixed(4)} m`];
            }
        })
    },
    // ─── U5: Curvature & refraction ─────────────────
    {
        id: 'curvatureCorr', title: 'Eğrilik ve Refraksiyon',
        build: () => calcCard({
            id: 'curvatureCorr',
            title: 'Eğrilik ve Refraksiyon Düzeltmesi',
            formulaTeX: `c = \\frac{1-k}}{2R} \\cdot S^2`,
            inputs: [
                { label: 'Yatay Mesafe', unit: 'm', key: 's', default: '1000' },
                { label: 'k (refraksiyon)', unit: '', key: 'k', default: '0.13' }
            ],
            compute: vals => {
                const c = curvatureRefractionCorrection(parseFloat(vals.s), parseFloat(vals.k));
                return [`c = ${c.toFixed(4)} m`, `${(c*1000).toFixed(1)} mm`];
            }
        })
    },
    // ─── U6: Ellipsoidal → Orthometric ──────────────
    {
        id: 'ellipsoidalToOrtho', title: 'Elipsoidal → Ortometrik',
        build: () => calcCard({
            id: 'ellipsoidalToOrtho',
            title: 'Elipsoidal → Ortometrik Yükseklik',
            formulaTeX: `H = h - N`,
            inputs: [
                { label: 'Elipsoidal Yükseklik (h)', unit: 'm', key: 'hEll', default: '112.5' },
                { label: 'Geoid Undülasyonu (N)', unit: 'm', key: 'nGeoid', default: '36.5' }
            ],
            compute: vals => {
                const H = ellipsoidalToOrthometric(parseFloat(vals.hEll), parseFloat(vals.nGeoid));
                return [`H = ${H.toFixed(3)} m`];
            }
        })
    },
    // ─── U6: EGM96 undulation ───────────────────────
    {
        id: 'egm96Fast', title: 'EGM96 Jeoit Undülasyonu',
        build: () => calcCard({
            id: 'egm96Fast',
            title: 'EGM96 Jeoit Undülasyonu (Hızlı)',
            formulaTeX: `N \\approx 36.5 + 2.0(\\phi - 41°) + 1.5(\\lambda - 28.9°)`,
            info: 'Davutpaşa kampüsü için yaklaşık model. ±0.5 m doğruluk.',
            inputs: [
                { label: 'Enlem (lat)', unit: '°', key: 'lat', default: '41.0241' },
                { label: 'Boylam (lon)', unit: '°', key: 'lon', default: '28.8866' }
            ],
            compute: vals => {
                const N = egm96Simple(parseFloat(vals.lat), parseFloat(vals.lon));
                return [`N = ${N.toFixed(3)} m`];
            }
        })
    },
];

/* ═══════════════════════════════════════════════
   CalcHubController — pageCalcHub içine kartları mount eder
   ═══════════════════════════════════════════════ */
export class CalcHubController {
    constructor() {
        this.activated = false;
    }
    activate() {
        if (this.activated) return;
        const grid = document.getElementById('calcGrid');
        if (!grid) return;
        grid.innerHTML = '';
        Calculators.forEach(c => grid.appendChild(c.build()));
        this.activated = true;
    }
}
