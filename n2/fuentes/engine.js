// ===== Motor de cálculo: método N2 (UNE-EN 1998-1:2018, anejo B) con el Anexo Nacional español =====
// Funciones puras, sin DOM. Unidades internas: m, kN, t, s (kN/t = m/s²).
const G = 9.81;

// ---- utilidades numéricas
function interpXY(xs, ys, x) {               // interpolación lineal; null fuera de rango
  if (x < xs[0] - 1e-12 || x > xs[xs.length - 1] + 1e-12) return null;
  for (let i = 1; i < xs.length; i++) if (xs[i] >= x - 1e-15) { const r = (x - xs[i - 1]) / (xs[i] - xs[i - 1] || 1); return ys[i - 1] + r * (ys[i] - ys[i - 1]); }
  return ys[ys.length - 1];
}
function trapz(xs, ys, x) {                  // ∫0^x por trapecios; devuelve también los tramos usados
  let s = 0; const segs = [];
  for (let i = 1; i < xs.length; i++) {
    if (xs[i - 1] >= x) break;
    const xb = Math.min(xs[i], x), yb = xb === xs[i] ? ys[i] : interpXY(xs, ys, xb);
    const a = 0.5 * (ys[i - 1] + yb) * (xb - xs[i - 1]);
    s += a; segs.push({ k: i, x0: xs[i - 1], x1: xb, y0: ys[i - 1], y1: yb, a, cum: s });
  }
  return { E: s, segs };
}
function bisect(f, a, b, tol = 1e-10, it = 200) {
  let fa = f(a); const fb = f(b);
  if (fa * fb > 0) return NaN;
  for (let i = 0; i < it; i++) { const m = 0.5 * (a + b), fm = f(m); if (Math.abs(b - a) < tol) return m; if (fa * fm <= 0) b = m; else { a = m; fa = fm; } }
  return 0.5 * (a + b);
}

// ---- lectura de tablas pegadas (curva y masas)
function parseRows(txt) {
  const rows = [];
  for (const raw of String(txt || '').split(/\r?\n/)) {
    const line = raw.trim(); if (!line) continue;
    let tk = line.split(/\t|;/).map(s => s.trim()).filter(s => s !== '');
    if (tk.length === 1) tk = line.split(/\s+/);
    if (tk.length === 1 && (line.match(/,/g) || []).length === 1) tk = line.split(',');
    if (tk.length === 1 && (line.match(/,/g) || []).length >= 2) tk = line.split(',');
    rows.push(tk.map(s => s.replace(/,/g, '.')));
  }
  return rows;
}
function parseCurve(txt, du, fu) {
  const kd = { m: 1, cm: 0.01, mm: 0.001 }[du] || 1, kf = { kN: 1, MN: 1000 }[fu] || 1;
  const pts = [], skipped = [];
  parseRows(txt).forEach((r, i) => { const a = parseFloat(r[0]), b = parseFloat(r[1]); if (r.length >= 2 && isFinite(a) && isFinite(b)) pts.push([a * kd, b * kf]); else if (pts.length) skipped.push(i + 1); });   // cabeceras iniciales: se ignoran sin aviso
  return { pts, skipped };
}
function parseMasses(txt) {
  const rows = [], skipped = [];
  parseRows(txt).forEach((r, i) => {
    const nums = r.map(parseFloat);
    if (r.length >= 3 && isFinite(nums[r.length - 2]) && isFinite(nums[r.length - 1])) rows.push({ name: r.slice(0, r.length - 2).join(' '), m: nums[r.length - 2], phi: nums[r.length - 1] });
    else if (r.length === 2 && isFinite(nums[0]) && isFinite(nums[1])) rows.push({ name: `Masa ${rows.length + 1}`, m: nums[0], phi: nums[1] });
    else if (rows.length) skipped.push(i + 1);
  });
  return { rows, skipped };
}

// ---- peligrosidad: AN.2, 3.2.1(2) y malla AN.5 (lon, lat, K, agR)
function siteHazard(grid, lon, lat) {
  const cl = Math.cos(lat * Math.PI / 180);
  const dist = p => Math.hypot((p[0] - lon) * 111.32 * cl, (p[1] - lat) * 110.57);
  const on = v => Math.abs(v * 10 - Math.round(v * 10)) < 1e-6;
  const all = grid.map(p => ({ p, d: dist(p) })).sort((a, b) => a.d - b.d);
  const near4 = all.slice(0, 4);
  // ¿dentro de la malla? las cuatro esquinas de la celda de 0.1° que contiene el punto
  const lo0 = Math.floor(lon * 10 + 1e-9) / 10, la0 = Math.floor(lat * 10 + 1e-9) / 10;
  const has = (x, y) => grid.some(p => Math.abs(p[0] - x) < 1e-6 && Math.abs(p[1] - y) < 1e-6);
  const corners = [[lo0, la0], [lo0 + 0.1, la0], [lo0, la0 + 0.1], [lo0 + 0.1, la0 + 0.1]].filter(c => has(+c[0].toFixed(1), +c[1].toFixed(1))).length;
  const status = all[0].d > 12 ? 'fuera' : corners < 4 ? 'borde' : 'dentro';
  const idw = pts => { const w = pts.map(q => 1 / q.d), sw = w.reduce((a, b) => a + b, 0);
    return { agR: pts.reduce((a, q, i) => a + w[i] * q.p[3], 0) / sw, K: pts.reduce((a, q, i) => a + w[i] * q.p[2], 0) / sw }; };
  if (all[0].d < 1e-6) return { agR: all[0].p[3], K: all[0].p[2], rule: 'a', used: [all[0]], status, dmin: 0 };
  if (on(lon) || on(lat)) {
    const line = all.filter(q => (on(lon) && Math.abs(q.p[0] - lon) < 1e-6) || (on(lat) && Math.abs(q.p[1] - lat) < 1e-6)).slice(0, 2);
    if (line.length === 2 && line[1].d < 15) return { ...idw(line), rule: 'b', used: line, status, dmin: all[0].d };
  }
  return { ...idw(near4), rule: 'c', used: near4, status, dmin: all[0].d };
}

// ---- espectro elástico: EN 1998-1, 3.2.2.2 y anejo A, con la tabla AN.2
function spectrumParams(K, vs30) {
  const C = Math.pow(800 / vs30, 0.465);
  const soil = vs30 > 800 ? 'A' : vs30 >= 360 ? 'B' : vs30 >= 180 ? 'C' : 'D';
  const TC = soil === 'A' ? K / 4 : soil === 'D' ? K / 2 : K * C / 4, TB = TC / 5, TD = 2.0;
  const TE = { A: 4.5, B: 5.0, C: 6.0, D: 6.0 }[soil], TF = 10.0;
  const Sof = ag => soil === 'A' ? 1 : soil === 'D' ? (ag <= 0.1 ? 2 : ag <= 0.4 ? 2.33 - 3.33 * ag : 1)
    : (ag <= 0.1 ? C : ag <= 0.4 ? C + 3.33 * (ag - 0.1) * (1 - C) : 1);
  const eta = xi => Math.max(Math.sqrt(10 / (5 + xi)), 0.55);
  function SDe(T, ag, xi) {          // [m]
    const S = Sof(ag), a = ag * G, e = eta(xi);
    if (T <= 4) {
      let Se;
      if (T <= TB) Se = a * S * (1 + T / TB * (2.5 * e - 1));
      else if (T <= TC) Se = 2.5 * a * S * e;
      else if (T <= TD) Se = 2.5 * a * S * e * TC / T;
      else Se = 2.5 * a * S * e * TC * TD / (T * T);
      return Se * (T / (2 * Math.PI)) ** 2;
    }
    const d4 = 2.5 * a * S * e * TC * TD / 16 * (4 / (2 * Math.PI)) ** 2;     // anejo A: SDe constante de T_D a T_E (= valor en 4 s)
    const dg = 0.025 * a * S * TC * TD;
    if (T <= TE) return d4;
    if (T <= TF) return dg * (2.5 * e + (T - TE) / (TF - TE) * (1 - 2.5 * e));
    return dg;
  }
  function Se(T, ag, xi) {           // [m/s²]
    if (T <= 1e-9) return ag * G * Sof(ag);
    if (T <= 4) { const S = Sof(ag), a = ag * G, e = eta(xi);
      if (T <= TB) return a * S * (1 + T / TB * (2.5 * e - 1));
      if (T <= TC) return 2.5 * a * S * e;
      if (T <= TD) return 2.5 * a * S * e * TC / T;
      return 2.5 * a * S * e * TC * TD / (T * T); }
    return SDe(T, ag, xi) * (2 * Math.PI / T) ** 2;
  }
  const branch = T => T <= TB ? 'rama 0–T_B (creciente)' : T <= TC ? 'meseta T_B–T_C' : T <= TD ? 'rama T_C–T_D (∝ 1/T)' : T <= 4 ? 'rama T_D–4 s (∝ 1/T²)' : 'anejo A (T > 4 s)';
  return { C, soil, TB, TC, TD, TE, TF, Sof, eta, SDe, Se, branch };
}

// ---- núcleo del anejo B: bilineal, periodo y desplazamiento objetivo para un d_m* dado
function bilinear(cv, dm) {
  const Fy = interpXY(cv.ds, cv.Fs, dm), tz = trapz(cv.ds, cv.Fs, dm), Em = tz.E;
  const dy = 2 * (dm - Em / Fy);
  return { dm, Fy, Em, dy, segs: tz.segs, ok: dy > 0 && dy < dm };
}
function target(b, ms, sp, ag, xi, met) {
  const k = b.Fy / b.dy, T = 2 * Math.PI * Math.sqrt(ms * b.dy / b.Fy);
  const Se = sp.Se(T, ag, xi), det = Se * (T / (2 * Math.PI)) ** 2, qu = Se * ms / b.Fy;
  let cas, dt0;
  if (T >= sp.TC) { cas = 1; dt0 = det; }
  else if (qu <= 1) { cas = 2; dt0 = det; }
  else { cas = 3; dt0 = det / qu * (1 + (qu - 1) * sp.TC / T); }
  const n2dt = Math.min(dt0, 3 * det);                                      // resultado del N2 (para comparar)
  if (met === 'igual') { cas = 0; dt0 = det; }                              // EN 1998-2, H.1: igual desplazamiento (q = 1)
  const capped = dt0 > 3 * det, dt = capped ? 3 * det : dt0;
  const mu = dt / b.dy;                                                     // ductilidad movilizada
  const muVFF = T < sp.TC ? (qu - 1) * sp.TC / T + 1 : qu;                  // Vidic, Fajfar y Fischinger
  return { k, T, Se, det, qu, cas, dt0, dt, capped, mu, muVFF, n2dt, ay: b.Fy / ms, branch: sp.branch(T) };
}
function runN2(cv, ms, sp, ag, xi, dm0, opt) {
  const its = [];
  let dm = dm0, stop = '';
  for (let i = 0; i < 20; i++) {
    const b = bilinear(cv, dm);
    if (!b.ok) { its.push({ i, ...b, bad: true }); stop = 'dy'; break; }
    const t = target(b, ms, sp, ag, xi, opt.met);
    const it = { i, ...b, ...t };
    if (i > 0) it.change = Math.abs(t.dt - its[i - 1].dt) / its[i - 1].dt;
    its.push(it);
    if (!opt.iterate || opt.met === 'igual' || !(ag > 0)) { stop = opt.met === 'igual' ? 'igual' : !(ag > 0) ? 'cero' : 'off'; break; }
    if (i > 0 && it.change < opt.tol) { stop = 'conv'; break; }
    if (t.dt > cv.ds[cv.ds.length - 1]) { stop = 'end'; break; }
    dm = t.dt;
    if (i === 19) stop = 'max';
  }
  const good = its.filter(x => !x.bad);
  return { its, stop, fin: good[good.length - 1] || null, first: good[0] || null };
}

// ---- cálculo completo
function computeN2(inp, grid) {
  const R = { inp, warn: {} };
  const W = (k, t) => (R.warn[k] = R.warn[k] || []).push(t);

  // Paso 1 · curva
  const pc = parseCurve(inp.curveTxt, inp.dUnit, inp.fUnit);
  let pts = pc.pts.slice();
  if (pts.length < 2) throw new Error('la curva pushover necesita al menos dos puntos (d_C, F_b)');
  pts = pts.map(p => [Math.abs(p[0]), Math.abs(p[1])]);
  let added0 = false;
  if (pts[0][0] > 1e-12) { pts.unshift([0, 0]); added0 = true; }
  else if (Math.abs(pts[0][1]) > 1e-9) W('1', 'El primer punto tiene d<sub>C</sub> = 0 pero F<sub>b</sub> ≠ 0: se toma F<sub>b</sub> = 0.');
  pts[0] = [0, 0];
  let mono = true; for (let i = 1; i < pts.length; i++) if (!(pts[i][0] > pts[i - 1][0])) mono = false;
  if (!mono) throw new Error('los desplazamientos de la curva deben ser estrictamente crecientes');
  const d = pts.map(p => p[0]), Fb = pts.map(p => p[1]);
  const n = pts.length;
  if (n < 11) W('1', `La curva tiene ${n} puntos (incluido el origen): se recomiendan al menos 10 para que la energía y la bilineal sean fiables.`);
  if (pc.skipped.length) W('1', `Se han ignorado ${pc.skipped.length} líneas que no son pares numéricos (líneas ${pc.skipped.slice(0, 6).join(', ')}${pc.skipped.length > 6 ? '…' : ''}).`);
  // saltos: tramo que se lleva más del 25 % del recorrido o caída brusca de fuerza
  const dd = d.slice(1).map((x, i) => x - d[i]);
  const big = dd.findIndex(x => x > 0.25 * d[n - 1]);
  if (big >= 0 && n > 6) W('1', `Entre d<sub>C</sub> = ${d[big].toFixed(4)} y ${d[big + 1].toFixed(4)} m hay un tramo sin puntos que abarca más del 25 % de la curva.`);
  const Fmax0 = Math.max(...Fb);
  for (let i = 1; i < n; i++) if (Fb[i - 1] - Fb[i] > 0.15 * Fmax0) { W('1', `Caída brusca del cortante entre d<sub>C</sub> = ${d[i - 1].toFixed(4)} y ${d[i].toFixed(4)} m (${(100 * (Fb[i - 1] - Fb[i]) / Fmax0).toFixed(0)} % de F<sub>b,máx</sub>).`); break; }
  const imax = Fb.indexOf(Fmax0);
  R.p1 = { d, Fb, n, added0, imax, Fmax: Fmax0, dFmax: d[imax], dend: d[n - 1], Fend: Fb[n - 1], K0: Fb[1] / d[1] };

  // Paso 2 · transformación
  let rows = [], ic = -1, M, ms, s2, Gam, es;
  const direct = inp.sdofMode === 'directo';
  if (direct) {
    if (!(inp.mstar > 0) || !(inp.GamIn > 0)) throw new Error('faltan m* y Γ del sistema equivalente (modo «datos del programa»)');
    ms = inp.mstar; Gam = inp.GamIn; s2 = ms / Gam; M = inp.Mtot > 0 ? inp.Mtot : null; es = M ? Gam * ms / M : null;
    if (es != null && (es > 1 + 1e-6 || es < 0.2)) W('2', `e* = Γ·m*/M = ${es.toFixed(3)}: fuera del rango habitual (0.5–1). Revisa m*, Γ y M.`);
  } else {
    const pm = parseMasses(inp.massTxt);
    if (!pm.rows.length) throw new Error('falta la tabla de masas m_i y forma Φ_i');
    const rows0 = pm.rows;
    ic = inp.ctrlRow > 0 && inp.ctrlRow <= rows0.length ? inp.ctrlRow - 1 : rows0.reduce((b, r, i) => Math.abs(r.phi) > Math.abs(rows0[b].phi) ? i : b, 0);
    const phiC = rows0[ic].phi;
    if (!(Math.abs(phiC) > 0)) throw new Error('Φ en el punto de control no puede ser 0');
    rows = rows0.map((r, i) => { const phi = r.phi / phiC; return { ...r, phiIn: r.phi, phi, mphi: r.m * phi, mphi2: r.m * phi * phi, ctrl: i === ic }; });
    M = rows.reduce((a, r) => a + r.m, 0); ms = rows.reduce((a, r) => a + r.mphi, 0); s2 = rows.reduce((a, r) => a + r.mphi2, 0);
    Gam = ms / s2; es = Gam * ms / M;
    if (pm.skipped.length) W('2', `Se han ignorado ${pm.skipped.length} líneas de la tabla de masas que no tienen el formato «nombre; m; Φ».`);
    if (rows.some(r => r.phi > 1 + 1e-9)) W('2', 'Hay masas con Φ<sub>i</sub> &gt; 1: el punto de control no es el de mayor desplazamiento. Revisa la fila elegida como punto de control.');
    if (rows.some(r => r.phi < -1e-9)) W('2', 'Hay masas con Φ<sub>i</sub> negativo: la forma tiene cambios de signo (modo superior). El N2 supone una forma sin cambios de signo.');
    if (Math.abs(phiC - 1) > 1e-9) W('2', `Φ en el punto de control era ${phiC}; la app ha normalizado la forma dividiendo por ese valor (anejo B.1).`);
  }
  const ds = d.map(x => x / Gam), Fs = Fb.map(x => x / Gam), as = Fs.map(x => x / ms);
  const cv = { ds, Fs };
  // d_u
  const pct = (inp.duPct > 0 && inp.duPct < 100 ? inp.duPct : 80) / 100;
  let du = d[n - 1], duHow = 'último punto de la curva';
  if (inp.duCrit === 'drop') {
    duHow = `último punto (la curva no cae al ${Math.round(pct * 100)} % de F<sub>b,máx</sub>)`;
    for (let i = imax + 1; i < n; i++) if (Fb[i] <= pct * Fmax0) { const r = (Fb[i - 1] - pct * Fmax0) / (Fb[i - 1] - Fb[i]); du = d[i - 1] + r * (d[i] - d[i - 1]); duHow = `caída al ${Math.round(pct * 100)} % de F<sub>b,máx</sub> tras el máximo`; break; }
  } else if (inp.duCrit === 'manual' && inp.duMan > 0) { du = Math.min(inp.duMan * ({ m: 1, cm: 0.01, mm: 0.001 }[inp.dUnit] || 1), d[n - 1]); duHow = 'valor del usuario'; }
  R.p2 = { direct, rows, ic, M, ms, s2, Gam, es, ds, Fs, as, du, dus: du / Gam, duHow, pct, Fdu: interpXY(d, Fb, du) };

  // Acción sísmica
  let agR = inp.agR, K = inp.K, hz = null;
  if (inp.siteMode === 'coords' && grid) {
    hz = siteHazard(grid, inp.lon, inp.lat);
    if (hz.status === 'fuera') {
      agR = 0; K = 1;
      W('0', `El emplazamiento está fuera de la malla AN.5: el punto más próximo está a ${hz.dmin.toFixed(0)} km. La malla del Anexo Nacional no tiene puntos donde la aceleración es despreciable, así que se toma <b>a<sub>gR</sub> = 0</b>: no hay acción sísmica que considerar.`);
    } else { agR = hz.agR; K = hz.K; if (hz.status === 'borde') W('0', 'El emplazamiento está en el borde de la malla AN.5: la celda que lo contiene no tiene sus cuatro esquinas. Se interpola con los cuatro puntos más próximos.'); }
  }
  const bridge = inp.tipo === 'puente';
  const gIb = { I: inp.gIman > 0 ? inp.gIman : 1.0, II: 1.0, III: 1.3 }, gIe = { I: 0.8, II: 1.0, III: 1.3, IV: 1.4 };
  const cls = bridge ? (['I', 'II', 'III'].includes(inp.impClass) ? inp.impClass : 'II') : inp.impClass;
  const gI = bridge ? gIb[cls] : gIe[cls];
  const ag = gI * agR, xi = inp.xi > 0 ? inp.xi : 5;
  const sp = spectrumParams(K, inp.vs30);
  const S = sp.Sof(ag), eta = sp.eta(xi);
  if (ag > 0 && ag * S <= 0.1) W('E', `a<sub>g</sub>·S = ${(ag * S).toFixed(3)} g ≤ 0.1 g: zona de <b>baja sismicidad</b> (AN.2, 3.2.1(4)${bridge ? '; EN 1998-2 AN, 2.3.7(1)' : ''}).`);
  if (agR > 0 && agR < 0.04) W('E', `a<sub>gR</sub> = ${agR.toFixed(3)} g &lt; 0.04 g: zona de <b>muy baja sismicidad</b> (AN.2, 3.2.1(5)P); no es obligatorio aplicar la EN 1998.`);
  if (ag > 0.4) W('E', 'a<sub>g</sub> &gt; 0.4 g: el Anexo Nacional toma S = 1 y el espectro de norma no representa los pulsos de largo periodo de los registros cercanos a falla.');
  if (bridge && cls === 'I' && !(inp.gIman > 0)) W('E', 'Puente de clase I: γ<sub>I</sub> lo fija la autoridad competente (EN 1998-2, AN, 2.1(6)). Introduce su valor; mientras tanto se usa 1.0.');
  R.p7 = { ...sp, agR, K, hz, gI, cls, ag, xi, S, eta, bridge, TR: 475 };

  // Pasos 3–6 · bilineal, periodo, desplazamiento objetivo, iteración
  let dm0 = ds[imax], dmHow = 'cortante máximo';
  if (inp.dmCrit === 'last') { dm0 = ds[n - 1]; dmHow = 'último punto de la curva'; }
  else if (inp.dmCrit === 'manual' && inp.dmMan > 0) { dm0 = Math.min(inp.dmMan * ({ m: 1, cm: 0.01, mm: 0.001 }[inp.dUnit] || 1), d[n - 1]) / Gam; dmHow = 'valor del usuario'; }
  const met = inp.metodo === 'igual' ? 'igual' : 'n2';
  const opt = { iterate: !!inp.iterate, tol: (inp.tol > 0 ? inp.tol : 5) / 100, met };
  R.met = met; R.noSeismic = !(ag > 0);
  const N2 = runN2(cv, ms, sp, ag, xi, dm0, opt);
  if (!N2.first) throw new Error('la bilineal no tiene solución: d_y* sale fuera de (0, d_m*). Revisa la curva y el criterio de d_m*');
  R.p3 = { dm0, dmHow, b: N2.first };
  R.p5 = N2.first;
  R.p6 = N2;
  const fin = N2.fin;
  if (N2.its[0].bad) W('3', 'd<sub>y</sub>* sale fuera de (0, d<sub>m</sub>*).');
  if (R.noSeismic) return R;
  if (N2.first.T < sp.TB) W('5', `T* = ${N2.first.T.toFixed(3)} s &lt; T<sub>B</sub> = ${sp.TB.toFixed(3)} s: el periodo cae en la rama creciente del espectro, donde el N2 es menos fiable (estructura muy rígida).`);
  if (N2.first.capped) W('5', 'd<sub>t</sub>* se limita a 3·d<sub>et</sub>* (anejo B.5): la estructura es muy débil para su periodo.');
  if (opt.iterate) {
    if (N2.stop === 'max') W('6', 'La iteración no ha convergido en 20 ciclos: revisa la curva o la tolerancia.');
    if (N2.stop === 'end') W('6', 'd<sub>t</sub>* supera el final de la curva: no se puede seguir iterando. Hay que prolongar el análisis pushover.');
    if (N2.stop === 'dy') W('6', 'En una iteración d<sub>y</sub>* sale fuera de (0, d<sub>m</sub>*): se conserva el último resultado válido.');
  }

  // Paso 7 · vuelta a la estructura
  const dt = Gam * fin.dt, dy = Gam * fin.dy;
  const reach = d[n - 1] >= 1.5 * dt, okU = dt <= du;
  if (!reach) W('7', `La curva pushover llega a d<sub>C</sub> = ${d[n - 1].toFixed(4)} m, menos que 1.5·d<sub>t</sub> = ${(1.5 * dt).toFixed(4)} m (EN 1998-1, 4.3.3.4.2.3): hay que prolongar el análisis.`);
  if (!okU) W('7', `d<sub>t</sub> = ${dt.toFixed(4)} m &gt; d<sub>u</sub> = ${du.toFixed(4)} m: la estructura no alcanza la demanda.`);
  R.p7.res = { dt, dy, reach, okU, Ft: interpXY(d, Fb, Math.min(dt, d[n - 1])), ratioU: du / dt };
  // Comparación de los dos criterios con los mismos datos
  const cmp = {};
  for (const m of ['n2', 'igual']) { const r = runN2(cv, ms, sp, ag, xi, dm0, { ...opt, met: m }); cmp[m] = { r, fin: r.fin, dt: Gam * r.fin.dt }; }
  R.cmp = cmp;

  // Paso 8 · estados límite (EN 1998-3, 2.1 y AN): a_g(T_R) = γ_I·a_gR·(T_R/475)^(1/3)
  const LSdef = [{ k: 'DL', TR: 225, P: '20 % en 50 años' }, { k: 'SD', TR: 475, P: '10 % en 50 años' }, { k: 'NC', TR: 2475, P: '2 % en 50 años' }];
  R.p8 = LSdef.map(L => {
    const f = Math.pow(L.TR / 475, 1 / 3), agL = ag * f;
    const r = runN2(cv, ms, sp, agL, xi, dm0, opt), x = r.fin;
    const dtL = Gam * x.dt;
    const cap = L.k === 'DL' ? Gam * N2.first.dy : L.k === 'SD' ? 0.75 * du : du;
    return { ...L, f, ag: agL, S: sp.Sof(agL), T: x.T, cas: x.cas, mu: x.mu, dts: x.dt, dt: dtL, cap, ok: dtL <= cap, stop: r.stop, reach: d[n - 1] >= 1.5 * dtL };
  });
  return R;
}

if (typeof module !== 'undefined') module.exports = { computeN2, spectrumParams, siteHazard, parseCurve, parseMasses, bilinear, target, runN2, interpXY, trapz };
