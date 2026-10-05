const E = require('./engine.js');
const ex = require('./examples.json');
const grid = require('./grid.json');
const site = { E1: [0.192, 500], E2: [0.1416, 270], E3: [0.087, 450] };
let bad = 0;
const cmp = (lab, a, b, tol = 1e-6) => { const ok = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)); if (!ok) { bad++; console.log('  DIF', lab, a, b); } };
for (const k of ['E1', 'E2', 'E3']) {
  const e = ex[k];
  const inp = { curveTxt: e.d.map((x, i) => `${x}\t${e.F[i]}`).join('\n'), dUnit: 'm', fUnit: 'kN', massTxt: e.m.map((m, i) => `M${i + 1}; ${m}; ${e.phi[i]}`).join('\n'),
    ctrlRow: 1, duCrit: 'drop', duPct: 80, dmCrit: 'max', iterate: true, tol: 5, siteMode: 'manual', agR: site[k][0], K: 1.0, vs30: site[k][1], tipo: 'puente', impClass: 'II', xi: 5 };
  const R = E.computeN2(inp, grid), r = e.r;
  cmp(k + ' m*', R.p2.ms, r.ms); cmp(k + ' Γ', R.p2.Gam, r.Gam); cmp(k + ' e*', R.p2.es, r.es); cmp(k + ' du', R.p2.du, r.du);
  if (R.p6.its.length !== r.hist.length) { bad++; console.log('  nº iteraciones', R.p6.its.length, r.hist.length); }
  r.hist.forEach((h, i) => { const j = R.p6.its[i]; if (!j) return; for (const [a, b] of [['dm', 'dm'], ['Fy', 'Fy'], ['Em', 'Em'], ['dy', 'dy'], ['T', 'T'], ['Se', 'Se'], ['det', 'det'], ['qu', 'qu'], ['dt', 'dt']]) cmp(`${k} it${i} ${a}`, j[a], h[b]); if (j.cas !== h.case) { bad++; console.log('  caso', j.cas, h.case); } });
  cmp(k + ' dt', R.p7.res.dt, r.dt);
  console.log(k, 'caso', R.p5.cas, 'T*', R.p5.T.toFixed(4), 'dt', R.p7.res.dt.toFixed(5), 'its', R.p6.its.length, R.p6.stop, 'avisos', JSON.stringify(R.warn).slice(0, 300));
  console.log('   EL', R.p8.map(x => `${x.k}: ag ${x.ag.toFixed(3)} dt ${x.dt.toFixed(4)} caso ${x.cas} ok ${x.ok}`).join(' | '));
}
// casos sintéticos analíticos
// (a) curva elastoplástica perfecta exacta: d_y* recuperado exactamente
{ const k0 = 50000, Fy = 2000, dy = Fy / k0; const d = [], F = []; for (let i = 0; i <= 40; i++) { const x = 0.2 * i / 40; d.push(x); F.push(Math.min(k0 * x, Fy)); } d.splice(1, 0, dy); F.splice(1, 0, Fy); d.sort((a, b) => a - b); for (let i = 0; i < d.length; i++) F[i] = Math.min(k0 * d[i], Fy);
  const cv = { ds: d, Fs: F }; const b = E.bilinear(cv, 0.2); cmp('EPP dy', b.dy, dy, 1e-9); console.log('EPP: dy recuperado', b.dy, 'exacto', dy); }
// (b) límite 3·d_et*: estructura muy débil y rígida
{ const sp = E.spectrumParams(1.0, 270); const b = { dm: 0.05, Fy: 100, dy: 0.00002, Em: 0 }; const t = E.target(b, 1000, sp, 0.25, 5);
  console.log('3·det: T', t.T.toFixed(3), 'qu', t.qu.toFixed(2), 'caso', t.cas, 'dt0/det', (t.dt0 / t.det).toFixed(2), 'capped', t.capped); if (!t.capped) bad++; cmp('cap', t.dt, 3 * t.det); }
// (c) rama 0–T_B
{ const sp = E.spectrumParams(1.0, 270); const T = sp.TB / 2; const se = sp.Se(T, 0.2, 5), S = sp.Sof(0.2); cmp('rama TB', se, 0.2 * 9.81 * S * (1 + 0.5 * 1.5)); console.log('rama 0–TB OK', se.toFixed(4)); }
// (d) peligrosidad AN.5 frente a Python
for (const [lo, la, ag, K, rule] of [[-3.195314, 37.389608, 0.14158828671031362, 1.0, 'c'], [-1.70, 37.68, 0.19220000000000004, 1.0, 'b'], [2.17, 41.39, 0.08588108302963005, 1.0, 'c'], [-1.7, 37.7, 0.192, 1.0, 'a']]) {
  const h = E.siteHazard(grid, lo, la); cmp(`agR ${lo},${la}`, h.agR, ag, 1e-9); if (h.rule !== rule) { bad++; console.log('  regla', h.rule, rule); } }
console.log('Madrid', JSON.stringify(E.siteHazard(grid, -3.70, 40.42)).slice(0, 120));
// (e) anejo A continuidad en 4 s
{ const sp = E.spectrumParams(1.0, 270); cmp('SDe 4s', sp.SDe(4.0001, 0.2, 5), sp.SDe(3.9999, 0.2, 5), 1e-3); }
console.log(bad ? `FALLOS: ${bad}` : 'TODO OK');
