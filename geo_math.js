/* ═══════════════════════════════════════════════
   GEO MATH — Shared Geodesic Math
   Pure functions; no DOM, no IO. Used by App,
   U3Controller, calculators.js, U3 engine.
   Tüm açılar varsayılan olarak GON cinsinden.
   ═══════════════════════════════════════════════ */

export const GON_TO_RAD = Math.PI / 200.0;
export const RAD_TO_GON = 200.0 / Math.PI;

export function normalizeGon(a) {
    a = a % 400;
    return a < 0 ? a + 400 : a;
}

/** 1. Temel Ödev — Düz Hesap.
 *  (Y_A, X_A, α, S) → (Y_B, X_B). α gon cinsinden. */
export function firstFundamental(ya, xa, azimuthGon, distance) {
    const r = azimuthGon * GON_TO_RAD;
    const dy = distance * Math.sin(r);
    const dx = distance * Math.cos(r);
    return { y: ya + dy, x: xa + dx, dy, dx };
}

/** 2. Temel Ödev — Ters Hesap.
 *  (Y_A, X_A, Y_B, X_B) → (α gon, S). */
export function secondFundamental(ya, xa, yb, xb) {
    const dy = yb - ya;
    const dx = xb - xa;
    const dist = Math.sqrt(dy * dy + dx * dx);
    if (dist < 1e-12) return { azimuth: 0, distance: 0, dy, dx };

    const base = dx !== 0
        ? Math.abs(Math.atan(Math.abs(dy / dx))) * RAD_TO_GON
        : 100.0;

    let az;
    if      (dy >= 0 && dx >= 0) az = base;
    else if (dy >= 0 && dx <  0) az = 200 - base;
    else if (dy <  0 && dx <  0) az = 200 + base;
    else                         az = 400 - base;

    return { azimuth: normalizeGon(az), distance: dist, dy, dx };
}

/** 3. Temel Ödev — Açı Nakli.
 *  (α_AB, β kırılma açısı) → α_BC.
 *  α_BC = α_AB + 200 + β (mod 400). */
export function thirdFundamental(azAB_gon, breakAngle_gon) {
    return normalizeGon(azAB_gon + 200 + breakAngle_gon);
}

/** İleri Kesim (Forward Intersection).
 *  A, B noktalarından bilinmeyen P'ye ölçülen yatay
 *  doğrultular α_AP, α_BP'den P koordinatları.
 *  Schreiber çözümü:
 *    P = A + S_AP * direction(α_AP)
 *  S_AP'yi sinüs teoremiyle çözeriz:
 *    S_AB / sin(γ) = S_AP / sin(β)
 *  γ = açı(P, β = açı(A. */
export function forwardIntersection(yA, xA, yB, xB, azAP_gon, azBP_gon) {
    const azAB = secondFundamental(yA, xA, yB, xB);
    const sAB = azAB.distance;

    // A noktasındaki iç açı (BAP) = α_AP − α_AB
    let alphaA = normalizeGon(azAP_gon - azAB.azimuth);
    // B noktasındaki iç açı (ABP) = α_AB + 200 - α_BP (B'den A'ya doğrultu)
    const azBA = normalizeGon(azAB.azimuth + 200);
    let alphaB = normalizeGon(azBA - azBP_gon);

    // 200 derece civarına gelmeyen kanonik formlar
    if (alphaA > 200) alphaA = 400 - alphaA;
    if (alphaB > 200) alphaB = 400 - alphaB;

    const gamma = 200 - alphaA - alphaB;   // P noktasındaki iç açı
    if (Math.abs(gamma) < 1e-6) {
        return { error: 'Geometrik tekillik: A-B-P kollinear.' };
    }

    // Sinüs teoremi
    const sinG = Math.sin(gamma * GON_TO_RAD);
    const sinA = Math.sin(alphaA * GON_TO_RAD);
    const sinB = Math.sin(alphaB * GON_TO_RAD);
    const sAP = sAB * sinB / sinG;

    // P koordinatları
    const P = firstFundamental(yA, xA, azAP_gon, sAP);
    return {
        y: P.y, x: P.x,
        sAB, sAP, sBP: sAB * sinA / sinG,
        alphaA, alphaB, gamma
    };
}

/** Geri Kesim (Resection / Snellius–Pothenot).
 *  Bilinmeyen P noktasında 3 bilinen noktaya (A, B, C)
 *  ölçülen yatay açılarla (α_PAB ve α_PBC) P koordinatları.
 *  Cot-formülü (Tienstra/Tijmen):
 *    yP = (yA*cot α + yB*cot β + yC*cot γ + ...) / (...)
 *  Pratik form için Collins/Cassini varyantı.
 *  Burada Tienstra varyantı kullanıyoruz:
 *    Verilen iki açı α (BAC görüş açısı) ve β (CAB değil,
 *    P'den A-B ve P'den B-C iç açıları).
 *  Geometrik tekillik: 3 nokta dairesel (P bu dairede ise) → çözüm yok.
 */
export function resection(yA, xA, yB, xB, yC, xC, alphaAPB_gon, alphaBPC_gon) {
    // Açıları radyan'a
    const a = alphaAPB_gon * GON_TO_RAD;
    const b = alphaBPC_gon * GON_TO_RAD;

    // 3 noktanın birbirine oranlarını ve iç açılarını hesapla
    const azAB = secondFundamental(yA, xA, yB, xB);
    const azBC = secondFundamental(yB, xB, yC, xC);
    const sAB = azAB.distance;
    const sBC = azBC.distance;

    // Kollineerlik kontrolü
    const cross = (xB - xA) * (yC - yA) - (yB - yA) * (xC - xA);
    if (Math.abs(cross) < 1e-6) {
        return { error: 'Geometrik tekillik: A, B, C kollinear.' };
    }

    // Cassini çözümü
    const cotA = 1 / Math.tan(a);
    const cotB = 1 / Math.tan(b);

    // K1, K2 yardımcıları
    const denom = (xC - xB) * cotB + (xA - xB) * cotA - (yC - yA);
    if (Math.abs(denom) < 1e-9) {
        return { error: 'Geometrik tekillik: P noktası dairede.' };
    }

    const K1 = (xB + (yC - yB) * cotB);
    const K2 = (xB + (yA - yB) * cotA);
    // Daha sağlam ve klasik Cassini formülü (yarıdan kısaltılmış):
    // Tienstra ağırlık katsayılarıyla yapalım:
    const cotPAB = cotA;
    const cotBPC = cotB;
    // Açı(BAC), açı(ABC), açı(BCA) (üçgen iç açıları)
    const angleA = Math.acos(((xB - xA) * (xC - xA) + (yB - yA) * (yC - yA))
                            / (Math.sqrt((xB - xA) ** 2 + (yB - yA) ** 2)
                             * Math.sqrt((xC - xA) ** 2 + (yC - yA) ** 2)));
    const angleB = Math.acos(((xA - xB) * (xC - xB) + (yA - yB) * (yC - yB))
                            / (Math.sqrt((xA - xB) ** 2 + (yA - yB) ** 2)
                             * Math.sqrt((xC - xB) ** 2 + (yC - yB) ** 2)));
    const angleC = Math.PI - angleA - angleB;

    // Tienstra ağırlıkları (cot − cot α şeklinde)
    const wA = 1 / (1 / Math.tan(angleA) - cotPAB);
    const wB = 1 / (1 / Math.tan(angleB) - 1 / Math.tan(Math.PI - a - b));
    const wC = 1 / (1 / Math.tan(angleC) - cotBPC);

    const W = wA + wB + wC;
    if (Math.abs(W) < 1e-9) {
        return { error: 'Geometrik tekillik: Tienstra ağırlık toplamı sıfır.' };
    }

    return {
        y: (wA * yA + wB * yB + wC * yC) / W,
        x: (wA * xA + wB * xB + wC * xC) / W,
        weights: { wA, wB, wC, W }
    };
}

/** Eğik mesafeden yatay mesafe.
 *  Z = zenith (gon), s = eğik. → s_h = s · sin(Z). */
export function slopeReduction(s, Z_gon) {
    return s * Math.sin(Z_gon * GON_TO_RAD);
}

/** Üçgen iç açı kapama hatası ve dağıtımı.
 *  Beklenen toplam = 200 gon. */
export function triangleClosure(b1, b2, b3) {
    const sum = b1 + b2 + b3;
    const w = sum - 200;       // kapama hatası
    const correction = -w / 3; // her açıya eşit dağıt
    return {
        sum, w, correction,
        adjusted: [b1 + correction, b2 + correction, b3 + correction]
    };
}

/** Trigonometrik nivelman.
 *  Δh = D·cot(Z) + (1−k)·D²/(2R) + (i − t).
 *  D yatay mesafe (m), Z zenith (gon),
 *  i alet yüksekliği, t hedef yüksekliği,
 *  k refraksiyon (varsayılan 0.13), R yarıçap (varsayılan 6371000). */
export function trigLevelling(D, Z_gon, i = 0, t = 0, k = 0.13, R = 6371000) {
    const Zr = Z_gon * GON_TO_RAD;
    const cotZ = Math.cos(Zr) / Math.sin(Zr);
    const dh_geom = D * cotZ;
    const dh_corr = (1 - k) * D * D / (2 * R);
    const dh = dh_geom + dh_corr + (i - t);
    return { dh, dh_geom, dh_corr, instrumentTarget: i - t };
}

/** Eğrilik + refraksiyon düzeltmesi.
 *  Δ = (1−k)·D²/(2R) — m. */
export function curvatureRefraction(D, k = 0.13, R = 6371000) {
    return (1 - k) * D * D / (2 * R);
}

/** Sinüs teoremi — verilen 1 kenar + tüm açılarla diğer kenarları çöz.
 *  a = bilinen kenar, A = a karşı açısı (gon), B, C diğer açılar.
 *  α + β + γ = 200 olmalı (toleransla). */
export function sineTheorem(a, A_gon, B_gon, C_gon) {
    const sumAng = A_gon + B_gon + C_gon;
    if (Math.abs(sumAng - 200) > 1e-3) {
        return { error: `Açı toplamı 200ᵍ değil: ${sumAng.toFixed(4)}ᵍ` };
    }
    const sinA = Math.sin(A_gon * GON_TO_RAD);
    if (Math.abs(sinA) < 1e-9) return { error: 'Karşı açı sıfır.' };
    const factor = a / sinA;
    return {
        b: factor * Math.sin(B_gon * GON_TO_RAD),
        c: factor * Math.sin(C_gon * GON_TO_RAD),
        sumAng
    };
}

/** Nivelman halka kapama hatası ve dağıtımı.
 *  Δh listesi → Σ (kapalı halkada teorik 0).
 *  Eşit dağıtılmış düzeltme uygulanır. */
export function levellingLoopClosure(deltas) {
    if (!Array.isArray(deltas) || deltas.length === 0) {
        return { error: 'Boş liste.' };
    }
    const sum = deltas.reduce((a, b) => a + b, 0);
    const w = sum;
    const correction = -w / deltas.length;
    return {
        n: deltas.length,
        sum, w, correction,
        adjusted: deltas.map(d => d + correction)
    };
}

/** Gon → Derece-dakika-saniye string. */
export function gonToDms(gon) {
    if (gon == null || isNaN(gon)) return '—';
    const deg = gon * 0.9;
    const sign = deg < 0 ? '-' : '';
    const abs = Math.abs(deg);
    const d = Math.floor(abs);
    const minF = (abs - d) * 60;
    const m = Math.floor(minF);
    const s = (minF - m) * 60;
    return `${sign}${d}° ${m.toString().padStart(2, '0')}' ${s.toFixed(1).padStart(4, '0')}"`;
}

export function fmtGon(g, dp = 4) {
    return (g == null || isNaN(g)) ? '—' : g.toFixed(dp) + 'ᵍ';
}

export function fmtMeter(m, dp = 3) {
    return (m == null || isNaN(m)) ? '—' : m.toFixed(dp) + ' m';
}
