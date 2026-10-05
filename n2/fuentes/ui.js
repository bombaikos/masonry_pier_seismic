// ===================== Interfaz: memoria de cálculo paso a paso =====================

// ---------- formato
const f = (x, n = 3) => (x == null || !isFinite(x)) ? '—' : Number(x).toFixed(n);
const fd = x => (x != null && isFinite(x) && Math.abs(x) < 0.01 && x !== 0) ? f(x, 5) : f(x, 4);   // desplazamientos [m]
const fF = x => f(x, 1);           // fuerzas [kN]
const fa = x => f(x, 3);           // aceleraciones [m/s²]
const fT = x => f(x, 3);           // periodos [s]
const pc = x => f(100 * x, 1);
const v = (b, s = '', p = '') => `<i class="v">${b}</i>${s ? `<sub>${s}</sub>` : ''}${p ? `<sup>${p}</sup>` : ''}`;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
// símbolos frecuentes
const Y = {
  ms: v('m', '', '*'), Gam: 'Γ', es: v('e', '', '*'), M: v('M'), Fb: v('F', 'b'), dC: v('d', 'C'), Fs: v('F', '', '*'), ds: v('d', '', '*'), as: v('a', '', '*'),
  Fy: v('F', 'y', '*'), dy: v('d', 'y', '*'), dm: v('d', 'm', '*'), Em: v('E', 'm', '*'), du: v('d', 'u'), dus: v('d', 'u', '*'), ks: v('k', '', '*'), Ts: v('T', '', '*'),
  Se: v('S', 'e'), SDe: v('S', 'De'), det: v('d', 'et', '*'), qu: v('q', 'u'), dts: v('d', 't', '*'), dt: v('d', 't'), TB: v('T', 'B'), TC: v('T', 'C'), TD: v('T', 'D'),
  ag: v('a', 'g'), agR: v('a', 'gR'), K: v('K'), S: v('S'), C: v('C'), gI: v('γ', 'I'), mu: v('μ'), Rmu: v('R', 'μ'), ay: v('a', 'y', '*'), mi: v('m', 'i'), phi: v('Φ', 'i')
};
const LS = {
  DL: { name: 'Limitación de daños', def: 'Daño ligero: los elementos estructurales no plastifican de forma significativa y conservan su resistencia y rigidez; no hace falta reparar.', req: 'que la estructura siga prácticamente en régimen elástico', color: 'var(--sky)' },
  SD: { name: 'Daños significativos', def: 'Daño importante, con resistencia y rigidez residuales; los elementos verticales siguen soportando las cargas verticales. Equivale al requisito de no colapso de la EN 1998-1.', req: 'que las deformaciones no superen las de daño significativo (en los elementos dúctiles, ¾ de la deformación última)', color: 'var(--coral)' },
  NC: { name: 'Proximidad al colapso', def: 'Daño grave, con resistencia y rigidez residuales bajas, pero los elementos verticales aún soportan las cargas verticales. Es el agotamiento de la capacidad de deformación.', req: 'que no se supere la capacidad última de deformación', color: 'var(--violet)' }
};
const casName = c => c === 0 ? 'ID' : String(c);
const lsCell = k => `<b>${k}</b> · ${LS[k].name}`;
const lsReq = (k, n) => `<tr class="req"><td class="l" colspan="${n}">${LS[k].def} Se exige ${LS[k].req}.</td></tr>`;

// ---------- gráficos SVG (adaptado de la app de cabeceo)
function svgT(str) {
  return String(str).replace(/([A-Za-zλθΔμ])_\{?([A-Za-z0-9.₀-₉áéíóúñμ]+(?:,[A-Za-z0-9.áéíóúñ]+)*)\}?(\*)?/g, (m, a, b, st) => `${a}<tspan baseline-shift="sub" font-size="75%">${b}</tspan>${st ? '<tspan baseline-shift="super" font-size="75%">*</tspan>' : ''}`)
    .replace(/([a-zA-Z₀-₉)])\*(?![^<]*<\/tspan>)/g, '$1<tspan baseline-shift="super" font-size="75%">*</tspan>');
}
function hT(str) {
  return String(str).replace(/([A-Za-zλθΔγμ])_\{?([A-Za-z0-9.₀-₉áéíóúñμ]+(?:,[A-Za-z0-9.áéíóúñ]+)*)\}?(\*)?/g, (m, a, b, st) => `<i class="v">${a}</i><sub>${b}</sub>${st ? '<sup>*</sup>' : ''}`)
    .replace(/([a-zA-Z₀-₉)])\*/g, '$1<sup>*</sup>');
}
function niceTicks(a, b, n = 5) {
  const span = b - a, step0 = span / n, p = Math.pow(10, Math.floor(Math.log10(step0)));
  const step = [1, 2, 2.5, 5, 10].map(k => k * p).find(s => span / s <= n + 0.5) || p * 10;
  const t = []; for (let x = Math.ceil(a / step - 1e-9) * step; x <= b + 1e-9; x += step) t.push(+x.toFixed(10));
  return t;
}
const tick = t => { const a = Math.abs(t); return a === 0 ? '0' : a >= 1000 ? String(Math.round(t)) : String(+t.toPrecision(4)); };
function chart(o) {
  const W = o.W || 680, H0 = o.H || 380, ml = 64, mr = o.y2 ? 58 : 18, mt = 16, mb = 46;
  const pw = W - ml - mr, ph = H0 - mt - mb;
  const below = o.legend && o.legendPos === 'below', lrows = below ? Math.ceil(o.legend.length / 2) : 0, Hh = H0 + (below ? lrows * 18 + 14 : 0);
  const X = x => ml + (x - o.x0) / (o.x1 - o.x0) * pw, Yy = y => mt + ph - (y - o.y0) / (o.y1 - o.y0) * ph;
  let s = `<svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="${o.title || ''}">`;
  s += `<defs><clipPath id="${o.id}c"><rect x="${ml}" y="${mt}" width="${pw}" height="${ph}"/></clipPath></defs>`;
  const xt = o.xticks || niceTicks(o.x0, o.x1, 6), yt = niceTicks(o.y0, o.y1, 5);
  for (const t of xt) s += `<line x1="${X(t)}" x2="${X(t)}" y1="${mt}" y2="${mt + ph}" style="stroke:var(--line);stroke-width:.6"/><text x="${X(t)}" y="${mt + ph + 16}" text-anchor="middle" font-size="11" style="fill:var(--muted)">${tick(t)}</text>`;
  for (const t of yt) s += `<line x1="${ml}" x2="${ml + pw}" y1="${Yy(t)}" y2="${Yy(t)}" style="stroke:var(--line);stroke-width:.6"/><text x="${ml - 6}" y="${Yy(t) + 4}" text-anchor="end" font-size="11" style="fill:var(--muted)">${tick(t)}</text>`;
  s += `<line x1="${ml}" x2="${ml + pw}" y1="${mt + ph}" y2="${mt + ph}" style="stroke:var(--ink);stroke-width:1"/><line x1="${ml}" x2="${ml}" y1="${mt}" y2="${mt + ph}" style="stroke:var(--ink);stroke-width:1"/>`;
  s += `<text x="${ml + pw / 2}" y="${H0 - 8}" text-anchor="middle" font-size="12" style="fill:var(--ink)">${svgT(o.xlabel)}</text>`;
  s += `<text x="14" y="${mt + ph / 2}" text-anchor="middle" font-size="12" transform="rotate(-90 14 ${mt + ph / 2})" style="fill:var(--ink)">${svgT(o.ylabel)}</text>`;
  s += `<g clip-path="url(#${o.id}c)">`;
  for (const b of (o.bands || [])) s += `<rect x="${X(b.x0)}" y="${mt}" width="${X(b.x1) - X(b.x0)}" height="${ph}" style="fill:${b.color};opacity:${b.op || .12}"/>`;
  for (const a of (o.areas || [])) s += `<path d="${a.pts.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)} ${Yy(p[1]).toFixed(1)}`).join(' ')} Z" style="fill:${a.color};opacity:${a.op || .18}"/>`;
  for (const l of (o.vlines || [])) s += `<line x1="${X(l.x)}" x2="${X(l.x)}" y1="${l.y0 != null ? Yy(l.y0) : mt}" y2="${l.y1 != null ? Yy(l.y1) : mt + ph}" style="stroke:${l.color || 'var(--muted)'};stroke-width:${l.w || 1};stroke-dasharray:${l.dash || '3 3'}"/>`;
  for (const l of (o.hlines || [])) s += `<line x1="${l.x0 != null ? X(l.x0) : ml}" x2="${l.x1 != null ? X(l.x1) : ml + pw}" y1="${Yy(l.y)}" y2="${Yy(l.y)}" style="stroke:${l.color || 'var(--muted)'};stroke-width:${l.w || 1};stroke-dasharray:${l.dash || '3 3'}"/>`;
  for (const se of o.series) {
    const d = se.pts.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)} ${Yy(p[1]).toFixed(1)}`).join(' ');
    s += `<path d="${d}" style="fill:none;stroke:${se.color};stroke-width:${se.w || 2};stroke-dasharray:${se.dash || 'none'};opacity:${se.op || 1}"/>`;
    if (se.dots) for (const p of se.pts) s += `<circle cx="${X(p[0]).toFixed(1)}" cy="${Yy(p[1]).toFixed(1)}" r="1.9" style="fill:${se.color}"/>`;
  }
  s += `</g>`;
  for (const a of (o.arrows || [])) { const x1 = X(a.x0), y1 = Yy(a.y0), x2 = X(a.x1), y2 = Yy(a.y1), an = Math.atan2(y2 - y1, x2 - x1), h = 7;
    const head = (x, y, ang) => `M${x} ${y} L${x - h * Math.cos(ang - .4)} ${y - h * Math.sin(ang - .4)} L${x - h * Math.cos(ang + .4)} ${y - h * Math.sin(ang + .4)} Z`;
    s += `<line x1="${x1}" x2="${x2}" y1="${y1}" y2="${y2}" style="stroke:${a.color || 'var(--ink)'};stroke-width:${a.w || 1.2}"/><path d="${head(x2, y2, an)}${a.both ? ' ' + head(x1, y1, an + Math.PI) : ''}" style="fill:${a.color || 'var(--ink)'}"/>`;
    if (a.label) s += `<text x="${(x1 + x2) / 2 + (a.ldx || 0)}" y="${(y1 + y2) / 2 + (a.ldy || -5)}" font-size="11.5" text-anchor="${a.anchor || 'middle'}" style="fill:${a.color || 'var(--ink)'}">${svgT(a.label)}</text>`; }
  for (const p of (o.points || [])) {
    s += p.sq ? `<rect x="${X(p.x) - 4.5}" y="${Yy(p.y) - 4.5}" width="9" height="9" style="fill:${p.hollow ? 'var(--paper)' : p.color};stroke:${p.color};stroke-width:1.6"/>`
      : `<circle cx="${X(p.x)}" cy="${Yy(p.y)}" r="${p.r || 4.5}" style="fill:${p.hollow ? 'var(--paper)' : p.color};stroke:${p.color};stroke-width:1.6"/>`;
    if (p.label) { const lx = X(p.x) + (p.dx != null ? p.dx : 8), ly = Yy(p.y) + (p.dy != null ? p.dy : -8);
      p.label.split('\n').forEach((t, i) => s += `<text x="${lx}" y="${ly + i * 14}" font-size="11.5" text-anchor="${p.anchor || 'start'}" style="fill:${p.tcolor || p.color}">${svgT(t)}</text>`); }
  }
  for (const t of (o.texts || [])) s += `<text x="${X(t.x) + (t.dx || 0)}" y="${Yy(t.y) + (t.dy || 0)}" font-size="${t.size || 11.5}" text-anchor="${t.anchor || 'start'}" style="fill:${t.color || 'var(--muted)'};font-weight:${t.bold ? 600 : 400}">${svgT(t.t)}</text>`;
  if (below) {
    o.legend.forEach((e, i) => { const x1 = ml + (i % 2) * pw / 2, ly = H0 + 8 + Math.floor(i / 2) * 18;
      const mark = e.box ? `<rect x="${x1}" y="${ly - 5}" width="22" height="10" style="fill:${e.color};opacity:${e.op || .25}"/>` : e.dot ? `<circle cx="${x1 + 11}" cy="${ly}" r="4.5" style="fill:${e.color};stroke:${e.color}"/>` : `<line x1="${x1}" x2="${x1 + 22}" y1="${ly}" y2="${ly}" style="stroke:${e.color};stroke-width:${e.w || 2.2};stroke-dasharray:${e.dash || 'none'}"/>`;
      s += `${mark}<text x="${x1 + 28}" y="${ly + 4}" font-size="11.5" style="fill:var(--ink)">${svgT(e.t)}</text>`; });
  } else if (o.legend) {
    const nL = o.legend.length;
    let ly = o.legendPos === 'br' ? mt + ph - nL * 17 - 4 : mt + 12; const lx = o.legendLeft ? ml + 12 : ml + pw - 12, lw = o.legendW || 230;
    s += `<rect x="${o.legendLeft ? lx - 6 : lx - lw - 6}" y="${ly - 10}" width="${lw + 12}" height="${nL * 17 + 4}" style="fill:var(--paper);opacity:.86"/>`;
    for (const e of o.legend) {
      const x1 = o.legendLeft ? lx : lx - lw;
      const mark = e.box ? `<rect x="${x1}" y="${ly - 5}" width="22" height="10" style="fill:${e.color};opacity:${e.op || .25}"/>`
        : e.dot ? `<circle cx="${x1 + 11}" cy="${ly}" r="4.5" style="fill:${e.hollow ? 'var(--paper)' : e.color};stroke:${e.color};stroke-width:1.6"/>`
        : e.color ? `<line x1="${x1}" x2="${x1 + 22}" y1="${ly}" y2="${ly}" style="stroke:${e.color};stroke-width:${e.w || 2.2};stroke-dasharray:${e.dash || 'none'}"/>` : '';
      s += `${mark}<text x="${x1 + 28}" y="${ly + 4}" font-size="11.5" style="fill:${e.muted ? 'var(--muted)' : 'var(--ink)'}">${svgT(e.t)}</text>`;
      ly += 17;
    }
  }
  return s + '</svg>';
}
const fig = (svg, cap) => `<div class="fig">${svg}${cap ? `<div class="cap">${hT(cap)}</div>` : ''}</div>`;
const up = (x, k = 1.12) => { const t = niceTicks(0, x * k, 8); return t[t.length - 1] >= x * k * 0.999 ? t[t.length - 1] : t[t.length - 1] + (t[1] - t[0]); };

// Esquema genérico del espectro elástico (sin valores), como en la app de cabeceo
function specSchema() {
  const sub = (a, b) => `${a}<tspan baseline-shift="sub" font-size="75%">${b}</tspan>`;
  const W = 760, Hh = 255, pw = 300, ph = 180, top = 30;
  const panel = (ox, fn, xmax, ymax, corners, labels, ylab, title) => {
    const X = t => ox + t / xmax * pw, Yy = y => top + ph - y / ymax * ph;
    let s = `<text x="${ox + pw / 2}" y="${top - 12}" text-anchor="middle" font-size="12" style="fill:var(--ink)">${title}</text>`;
    s += `<line x1="${ox}" x2="${ox + pw + 10}" y1="${Yy(0)}" y2="${Yy(0)}" style="stroke:var(--ink)"/><line x1="${ox}" x2="${ox}" y1="${Yy(0)}" y2="${top - 4}" style="stroke:var(--ink)"/>`;
    s += `<text x="${ox + pw + 12}" y="${Yy(0) + 4}" font-size="11.5" style="fill:var(--ink)">T</text><text x="${ox - 6}" y="${top + 2}" text-anchor="end" font-size="11.5" style="fill:var(--ink)">${ylab}</text>`;
    for (const [t, nm] of corners) s += `<line x1="${X(t)}" x2="${X(t)}" y1="${Yy(0)}" y2="${Yy(fn(t))}" style="stroke:var(--muted);stroke-dasharray:3 3;stroke-width:.9"/><text x="${X(t)}" y="${Yy(0) + 15}" text-anchor="middle" font-size="11" style="fill:var(--ink)">${nm}</text>`;
    const pts = []; for (let i = 0; i <= 300; i++) { const t = xmax * i / 300; pts.push(`${i ? 'L' : 'M'}${X(t).toFixed(1)} ${Yy(fn(t)).toFixed(1)}`); }
    s += `<path d="${pts.join(' ')}" style="fill:none;stroke:var(--violet);stroke-width:2.2"/>`;
    for (const [t, y, txt, anc] of labels) s += `<text x="${X(t)}" y="${Yy(y)}" text-anchor="${anc || 'start'}" font-size="10.5" style="fill:var(--muted)">${txt}</text>`;
    return s;
  };
  const TB = 0.3, TC = 0.9, TD = 2.0, TE = 3.0, TF = 4.0;
  const Sa = t => t <= TB ? 1 + t / TB * 1.5 : t <= TC ? 2.5 : t <= TD ? 2.5 * TC / t : 2.5 * TC * TD / (t * t);
  const Dp = 2.5 * TC * TD, dg = 0.395 * Dp;
  const Sd = t => t <= TD ? Sa(t) * t * t : t <= TE ? Dp : t <= TF ? Dp + (t - TE) / (TF - TE) * (dg - Dp) : dg;
  let s = `<svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Esquema del espectro elástico">`;
  s += panel(60, Sa, 3.4, 2.9, [[TB, sub('T', 'B')], [TC, sub('T', 'C')], [TD, sub('T', 'D')]],
    [[0.02, 0.8, `${sub('a', 'g')}·S`], [TB + 0.05, 2.6, `2.5·${sub('a', 'g')}·S·η`], [1.25, 1.95, '∝ 1/T'], [2.4, 0.95, '∝ 1/T²']], `${sub('S', 'e')}`, 'Aceleración');
  s += panel(430, Sd, 4.8, Dp * 1.25, [[TC, sub('T', 'C')], [TD, sub('T', 'D')], [TE, sub('T', 'E')], [TF, sub('T', 'F')]],
    [[1.55, Dp * 0.55, '∝ T', 'start'], [TD + 0.05, Dp * 1.06, 'constante'], [4.8, dg * 0.5, `${sub('d', 'g')} = 0.025·${sub('a', 'g')}·S·${sub('T', 'C')}·${sub('T', 'D')}`, 'end']], `${sub('S', 'De')}`, 'Desplazamiento (anejo A)');
  return s + '</svg>';
}

// ---------- mapa AN.5 (adaptado de la app de cabeceo)
function drawMap(canvas, grid, R) {
  const ctx = canvas.getContext('2d'), W = canvas.width, Hh = canvas.height;
  ctx.clearRect(0, 0, W, Hh); ctx.fillStyle = css('--paper'); ctx.fillRect(0, 0, W, Hh);
  const bounds = [0.02, 0.04, 0.06, 0.08, 0.10, 0.12, 0.14, 0.16, 0.18, 0.20, 0.22, 0.24, 0.27];
  const cols = ['#fff5c0', '#fee89a', '#fed976', '#feb24c', '#fd9a44', '#fd7c36', '#f5582a', '#e3321f', '#c51b22', '#a50f25', '#800026', '#5a0019'];
  const cfor = a => { for (let i = 1; i < bounds.length; i++) if (a < bounds[i]) return cols[i - 1]; return cols[cols.length - 1]; };
  const lon0 = -9.8, lon1 = 4.6, lat1 = 44.0, cl = Math.cos(39.5 * Math.PI / 180);
  const pw = W * 0.62, sx = pw / ((lon1 - lon0) * cl), sy = sx;
  const X = lo => 10 + (lo - lon0) * cl * sx, Yy = la => 14 + (lat1 - la) * sy;
  for (const p of grid) { if (p[1] < 35.5) continue; ctx.fillStyle = cfor(p[3]); ctx.fillRect(X(p[0]) - 1.6, Yy(p[1]) - 1.6, 3.2, 3.2); }
  const lat = R.inp.lat, lon = R.inp.lon;
  const star = (x, y, r, fill) => { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a)); } ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = '#111'; ctx.lineWidth = 1; ctx.stroke(); };
  star(X(lon), Yy(lat), 9, '#1f5f8b');
  const zx0 = W * 0.66, zw = W * 0.32, zy0 = 20, zh = zw;
  const zl0 = lon - 0.5, zl1 = lon + 0.5, zb0 = lat - 0.5, zb1 = lat + 0.5;
  const ZX = lo => zx0 + (lo - zl0) / (zl1 - zl0) * zw, ZY = la => zy0 + (zb1 - la) / (zb1 - zb0) * zh;
  ctx.strokeStyle = css('--line'); ctx.strokeRect(zx0, zy0, zw, zh);
  for (const p of grid) if (p[0] >= zl0 && p[0] <= zl1 && p[1] >= zb0 && p[1] <= zb1) { ctx.fillStyle = cfor(p[3]); ctx.fillRect(ZX(p[0]) - 8, ZY(p[1]) - 8, 16, 16); }
  ctx.font = '10px IBM Plex Sans, sans-serif';
  const hz = R.p7.hz;
  if (hz && hz.status !== 'fuera') for (const q of hz.used) { const x = ZX(q.p[0]), y = ZY(q.p[1]); ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5; ctx.strokeRect(x - 8, y - 8, 16, 16); ctx.fillStyle = css('--ink'); ctx.fillText(q.p[3].toFixed(3), x + 10, y - 9); }
  star(ZX(lon), ZY(lat), 10, '#1f5f8b');
  ctx.fillStyle = css('--ink'); ctx.font = '12px IBM Plex Sans, sans-serif';
  ctx.fillText('Malla AN.5: agR [g]', 12, Hh - 10);
  ctx.fillText(hz && hz.status === 'fuera' ? 'Detalle ±0.5°: fuera de la malla' : `Detalle ±0.5° y ${hz ? hz.used.length : 0} punto${hz && hz.used.length === 1 ? '' : 's'} usado${hz && hz.used.length === 1 ? '' : 's'}`, zx0, zy0 + zh + 16);
  const lx = zx0, ly = zy0 + zh + 30;
  cols.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(lx + i * (zw / cols.length), ly, zw / cols.length, 10); });
  ctx.fillStyle = css('--muted'); ctx.font = '10px IBM Plex Sans, sans-serif';
  ctx.fillText('0.02', lx, ly + 22); ctx.fillText('0.14', lx + zw * 0.5 - 8, ly + 22); ctx.fillText('0.27 g', lx + zw - 30, ly + 22);
}

// ---------- ejemplos sintéticos
const EXAMPLES = {
  E2: { label: 'Ejemplo 2 · Pila de fábrica (caso 3)', proj: 'Ejemplo sintético 2 · Viaducto con pilas de fábrica', elem: 'Pila de 40 m con su tablero tributario', tipo: 'puente', dir: 'T', mat: 'fabrica', pat: 'modal',
    curve: '__E2__', dUnit: 'm', fUnit: 'kN', ctrlRow: 1,
    mass: 'Tablero tributario (55 m) en cabeza; 309; 1.000\nPila, tramo 32–40 m; 318; 0.900\nPila, tramo 24–32 m; 610; 0.700\nPila, tramo 16–24 m; 995; 0.500\nPila, tramo 8–16 m; 1472; 0.300\nPila, tramo 0–8 m; 2040; 0.100',
    siteMode: 'coords', lat: 37.389608, lon: -3.195314, vs30: 270, impClass: 'II' },
  E1: { label: 'Ejemplo 1 · Puente de hormigón armado (caso 1)', proj: 'Ejemplo sintético 1 · Puente de hormigón armado', elem: 'Viaducto de 4 vanos de 40 m sobre 3 pilas de 10 m', tipo: 'puente', dir: 'L', mat: 'ha', pat: 'uniforme',
    curve: '__E1__', dUnit: 'm', fUnit: 'kN', ctrlRow: 1,
    mass: 'Tablero (160 m); 2240; 1.000\nPilas, tercio superior (3 pilas); 200; 0.833\nPilas, tercio medio (3 pilas); 200; 0.500\nPilas, tercio inferior (3 pilas); 200; 0.167',
    siteMode: 'coords', lat: 37.68, lon: -1.70, vs30: 500, impClass: 'II' },
  E3: { label: 'Ejemplo 3 · Edificio rígido (caso 2)', proj: 'Ejemplo sintético 3 · Edificio de muros de hormigón armado', elem: 'Edificio de 5 plantas', tipo: 'edificio', dir: 'X', mat: 'ha', pat: 'modal',
    curve: '__E3__', dUnit: 'm', fUnit: 'kN', ctrlRow: 1,
    mass: 'Cubierta (planta 5); 380; 1.00\nPlanta 4; 420; 0.82\nPlanta 3; 420; 0.62\nPlanta 2; 420; 0.40\nPlanta 1; 420; 0.19',
    siteMode: 'coords', lat: 41.39, lon: 2.17, vs30: 450, impClass: 'II' }
};

// ---------- formulario
const DIRS = { puente: [['L', 'Longitudinal'], ['T', 'Transversal']], edificio: [['X', 'X'], ['Y', 'Y']] };
const CLASSES = { puente: [['I', 'I · moderada (γI a fijar)'], ['II', 'II · normal (γI = 1.0)'], ['III', 'III · especial (γI = 1.3)']],
  edificio: [['I', 'I · γI = 0.8'], ['II', 'II · γI = 1.0'], ['III', 'III · γI = 1.3'], ['IV', 'IV · γI = 1.4']] };
const FIELDS = [
  ['Identificación', [['proj', 'Proyecto', 'txt', '', 'Nombre del proyecto'], ['elem', 'Elemento calculado', 'txt', '', 'p. ej. Pila 3']]],
  ['Preguntas iniciales', [
    ['tipo', 'Tipo de estructura', 'select', 'puente', [['puente', 'Puente (EN 1998-2)'], ['edificio', 'Edificio (EN 1998-1 / 1998-3)']]],
    ['dir', 'Dirección del cálculo', 'select', 'T', DIRS.puente],
    ['mat', 'Elementos que resisten el sismo', 'select', 'fabrica', [['ha', 'Hormigón armado'], ['acero', 'Acero o mixtos'], ['fabrica', 'Fábrica'], ['otro', 'Otro']]],
    ['pat', 'Patrón de cargas del pushover', 'select', 'modal', [['modal', 'Modal (forma del primer modo)'], ['uniforme', 'Uniforme (aceleración uniforme)']]]]],
  ['Curva pushover', [
    ['curve', 'Pares d<sub>C</sub> y F<sub>b</sub>, uno por línea (pegados de una hoja de cálculo o de un CSV)', 'area', '', 8],
    ['dUnit', 'Unidad de d<sub>C</sub>', 'select', 'm', [['m', 'm'], ['cm', 'cm'], ['mm', 'mm']]],
    ['fUnit', 'Unidad de F<sub>b</sub>', 'select', 'kN', [['kN', 'kN'], ['MN', 'MN']]]]],
  ['Sistema equivalente', [
    ['sdofMode', 'Origen de m* y Γ', 'select', 'tabla', [['tabla', 'Tabla de masas y forma Φ'], ['directo', 'Datos del programa (SAP2000…)']]],
    ['mstar', 'Masa del sistema equivalente m*', 'num', '', 't'], ['GamIn', 'Factor de transformación Γ', 'num', '', '—'], ['Mtot', 'Masa total M (opcional, para e*)', 'num', '', 't'],
    ['mass', 'Una masa por línea: nombre; m<sub>i</sub> [t]; Φ<sub>i</sub>', 'area', '', 6],
    ['ctrlRow', 'Fila del punto de control (0 = la de Φ máximo)', 'num', 1, '—']]],
  ['Emplazamiento y acción', [
    ['siteMode', 'Peligrosidad', 'select', 'coords', [['coords', 'Por coordenadas (AN.5)'], ['manual', 'a_gR y K a mano']]],
    ['lat', 'Latitud (+N)', 'num', 37.389608, '°'], ['lon', 'Longitud (+E, −O)', 'num', -3.195314, '°'],
    ['agR', 'a<sub>gR</sub>', 'num', 0.04, 'g'], ['K', 'K', 'num', 1.0, '—'],
    ['vs30', 'v<sub>s,30</sub> del terreno', 'num', 270, 'm/s'],
    ['impClass', 'Clase de importancia', 'select', 'II', CLASSES.puente],
    ['gIman', 'γ<sub>I</sub> de la autoridad (puentes de clase I)', 'num', '', '—'],
    ['xi', 'Amortiguamiento ξ', 'num', 5, '%']]],
  ['Opciones de cálculo', [
    ['metodo', 'Criterio del desplazamiento objetivo', 'select', 'n2', [['n2', 'N2 · EN 1998-1, anejo B'], ['igual', 'Igual desplazamiento · EN 1998-2, anejo H']]],
    ['dmCrit', 'Criterio para d<sub>m</sub>*', 'select', 'max', [['max', 'Cortante máximo'], ['last', 'Último punto'], ['manual', 'Valor manual de d_C']]],
    ['dmMan', 'd<sub>C</sub> de formación del mecanismo (manual)', 'num', '', 'u. de d_C'],
    ['duCrit', 'Criterio para d<sub>u</sub>', 'select', 'drop', [['drop', 'Caída del cortante'], ['last', 'Último punto'], ['manual', 'Valor manual']]],
    ['duPct', 'Caída al … de F<sub>b,máx</sub>', 'num', 80, '%'],
    ['duMan', 'd<sub>u</sub> manual', 'num', '', 'u. de d_C'],
    ['iterate', 'Iteración de la bilineal (B.5)', 'select', '1', [['1', 'Sí'], ['0', 'No']]],
    ['tol', 'Tolerancia de la iteración', 'num', 5, '%'],
    ['showB', 'Espectro inelástico en el paso 5 (opción B)', 'select', '0', [['0', 'No'], ['1', 'Sí']]]]]
];
function setOptions(id, opts) {
  const el = document.getElementById(id), cur = el.value;
  el.innerHTML = opts.map(([vv, t]) => `<option value="${vv}">${hT(t)}</option>`).join('');
  el.value = opts.some(o => o[0] === cur) ? cur : (opts.find(o => o[0] === 'II') || opts[0])[0];
}
function buildForm() {
  let h = `<h2>Ejemplos</h2><div style="display:flex;gap:6px"><select id="exSel">${Object.entries(EXAMPLES).map(([k, e]) => `<option value="${k}">${e.label}</option>`).join('')}</select><button id="btnEx" type="button" style="flex:none">Cargar</button></div>
  <p class="hint">Curvas sintéticas para probar la app. Al cargar un ejemplo se sustituyen todos los datos.</p>`;
  FIELDS.forEach(([title, fl], gi) => {
    h += `<h2>${gi === 0 ? 'Paso 0 · ' : ''}${title}</h2>` + (gi === 1 ? '<div class="q">' : '');
    for (const [id, lab, type, def, extra] of fl) {
      let ctl;
      if (type === 'select') ctl = `<select id="${id}">${extra.map(([vv, t]) => `<option value="${vv}"${vv === def ? ' selected' : ''}>${hT(t)}</option>`).join('')}</select>`;
      else if (type === 'txt') ctl = `<input id="${id}" type="text" value="${def}" placeholder="${extra}" style="font-family:var(--f-ui)">`;
      else if (type === 'area') ctl = `<textarea id="${id}" rows="${extra}" spellcheck="false"></textarea>`;
      else ctl = `<input id="${id}" type="number" step="any" value="${def}">`;
      const unit = type === 'num' ? ` <span class="u">[${hT(extra)}]</span>` : '';
      h += (type === 'txt' || type === 'area') ? `<div class="fld" style="grid-template-columns:1fr"><label for="${id}">${lab}</label>${ctl}</div>` : `<div class="fld"><label for="${id}">${lab}${unit}</label>${ctl}</div>`;
      if (id === 'curve') h += `<div class="fld" style="grid-template-columns:1fr"><label for="csvFile" class="hint" style="margin:0">o sube un archivo CSV / TXT</label><input id="csvFile" type="file" accept=".csv,.txt,.tsv,text/csv,text/plain"></div>`;
    }
    if (gi === 1) h += '</div><p class="hint">El N2 supone que la respuesta en la dirección calculada se parece a la de un sistema de un grado de libertad (EN 1998-2, 4.2.5, nota 2).</p>';
    if (title === 'Curva pushover') h += '<p class="hint">Separadores: tabulador, punto y coma o espacios. Se admite la coma decimal si las columnas van separadas por tabulador o punto y coma. Las líneas de cabecera se ignoran.</p>';
    if (title === 'Sistema equivalente') h += '<p class="hint">Con los datos del programa no hace falta la tabla de masas: m* y Γ deben corresponder a la misma forma y punto de control que la curva. Con la tabla, Φ<sub>i</sub> es la forma del patrón de cargas (normalmente el primer modo). La app la normaliza a Φ = 1 en el punto de control. En puentes, patrón uniforme: Φ = 1 en el tablero y z/z<sub>P</sub> en las pilas (EN 1998-2, H.2).</p>';
  });
  h += `<h2>Informe</h2><div style="display:flex;gap:6px;flex-wrap:wrap"><button id="btnDocx" type="button">Descargar informe Word</button><button id="btnPrint" type="button" class="ghost">Imprimir / PDF</button><button id="btnCsv" type="button" class="ghost">CSV de las curvas</button></div><p class="hint" id="repStatus">El informe recoge todos los pasos, tablas y figuras con los datos actuales.</p>`;
  h += `<nav class="steps">${[['0', 'Paso 0'], ['1', 'Paso 1'], ['2', 'Paso 2'], ['3', 'Paso 3'], ['4', 'Paso 4'], ['E', 'Espectro'], ['5', 'Paso 5'], ['6', 'Paso 6'], ['7', 'Paso 7'], ['8', 'Paso 8'], ['C', 'Conclusiones'], ['A', 'Anejo']].map(([k, t]) => `<a href="#p${k}">${t}</a>`).join('')}</nav>`;
  document.getElementById('form').innerHTML = h;
  document.querySelectorAll('#form input,#form select,#form textarea').forEach(el => el.addEventListener('input', syncVis));
  document.querySelectorAll('#form input:not([type=file]),#form select:not(#exSel),#form textarea').forEach(el => el.addEventListener('input', run));
  document.getElementById('tipo').addEventListener('input', () => { const t = document.getElementById('tipo').value; setOptions('dir', DIRS[t]); setOptions('impClass', CLASSES[t]); run(); });
  document.getElementById('btnEx').addEventListener('click', () => loadExample(document.getElementById('exSel').value));
  document.getElementById('csvFile').addEventListener('change', e => { const fl = e.target.files[0]; if (!fl) return; const rd = new FileReader(); rd.onload = () => { document.getElementById('curve').value = rd.result; run(); }; rd.readAsText(fl); });
  document.getElementById('btnDocx').addEventListener('click', e => exportDocx(e.currentTarget));
  document.getElementById('btnPrint').addEventListener('click', () => { try { window.print(); } catch (e) {} });
  document.getElementById('btnCsv').addEventListener('click', exportCsv);
}
function syncVis() {
  const g = id => document.getElementById(id).value, show = (id, on) => { const el = document.getElementById(id); if (el) el.closest('.fld').style.display = on ? '' : 'none'; };
  const dir = g('sdofMode') === 'directo', man = g('siteMode') === 'manual';
  ['mstar', 'GamIn', 'Mtot'].forEach(id => show(id, dir)); ['mass', 'ctrlRow'].forEach(id => show(id, !dir));
  ['agR', 'K'].forEach(id => show(id, man)); ['lat', 'lon'].forEach(id => show(id, !man));
  show('gIman', g('tipo') === 'puente' && g('impClass') === 'I');
  show('dmMan', g('dmCrit') === 'manual'); show('duMan', g('duCrit') === 'manual'); show('duPct', g('duCrit') === 'drop');
  show('tol', g('iterate') === '1');
}
function loadExample(k) {
  const e = EXAMPLES[k], set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  set('tipo', e.tipo); setOptions('dir', DIRS[e.tipo]); setOptions('impClass', CLASSES[e.tipo]);
  for (const [id, val] of Object.entries({ proj: e.proj, elem: e.elem, dir: e.dir, mat: e.mat, pat: e.pat, curve: e.curve, dUnit: e.dUnit, fUnit: e.fUnit, mass: e.mass, ctrlRow: e.ctrlRow,
    siteMode: e.siteMode, lat: e.lat, lon: e.lon, vs30: e.vs30, impClass: e.impClass, gIman: '', xi: 5, agR: 0.04, K: 1.0, dmCrit: 'max', dmMan: '', duCrit: 'drop', duPct: 80, duMan: '', iterate: '1', tol: 5,
    sdofMode: 'tabla', mstar: '', GamIn: '', Mtot: '', metodo: 'n2' })) set(id, val);
  syncVis();
  document.getElementById('exSel').value = k;
  run();
}
function readInputs() {
  const g = id => document.getElementById(id).value, n = id => parseFloat(g(id));
  return { proj: g('proj').trim(), elem: g('elem').trim(), tipo: g('tipo'), dir: g('dir'), mat: g('mat'), pat: g('pat'), curveTxt: g('curve'), dUnit: g('dUnit'), fUnit: g('fUnit'),
    sdofMode: g('sdofMode'), mstar: n('mstar'), GamIn: n('GamIn'), Mtot: n('Mtot'), metodo: g('metodo'),
    massTxt: g('mass'), ctrlRow: Math.round(n('ctrlRow')) || 0, siteMode: g('siteMode'), lat: n('lat'), lon: n('lon'), agR: n('agR'), K: n('K'), vs30: n('vs30'), impClass: g('impClass'), gIman: n('gIman'), xi: n('xi'),
    dmCrit: g('dmCrit'), dmMan: n('dmMan'), duCrit: g('duCrit'), duPct: n('duPct'), duMan: n('duMan'), iterate: g('iterate') === '1', tol: n('tol'), showB: g('showB') === '1' };
}

// ---------- secciones
function sec(id, n, title, cite, body) { return `<section id="p${id}"><h2><span class="n">${n}</span>${title}</h2><p class="cite">${cite}</p>${body}</section>`; }
const warns = (R, k) => (R.warn[k] || []).map(t => `<div class="warn">⚠ ${t}</div>`).join('');
const pill = ok => `<span class="pill ${ok ? 'ok' : 'no'}">${ok ? 'cumple' : 'no cumple'}</span>`;
const tw = (head, rows, cls = '') => `<div class="tw"><table class="${cls}"><thead><tr>${head.map(hh => `<th${/^l:/.test(hh) ? ' class="l"' : ''}>${hh.replace(/^l:/, '')}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;
const prow = (name, expr, val) => `<tr><td class="l">${name}</td><td class="l">${expr}</td><td><span class="res">${val}</span></td></tr>`;

function render(R) {
  const I = R.inp, p1 = R.p1, p2 = R.p2, p3 = R.p3, b = p3.b, p5 = R.p5, p6 = R.p6, fin = p6.fin, p7 = R.p7, rs = p7.res, bridge = p7.bridge;
  const dirTxt = bridge ? (I.dir === 'T' ? 'transversal' : 'longitudinal') : I.dir;
  const projTxt = I.proj ? esc(I.proj) : 'Proyecto sin nombre', elemTxt = I.elem ? esc(I.elem) : 'Elemento sin nombre';
  document.getElementById('projTitle').innerHTML = projTxt;
  document.getElementById('elemLine').innerHTML = `${elemTxt} · dirección ${dirTxt}`;
  document.title = (I.elem ? I.elem + ' · ' : '') + 'Método N2';
  const matTxt = { ha: 'hormigón armado', acero: 'acero o mixtos', fabrica: 'fábrica', otro: 'otro' }[I.mat];
  const ctrlTxt = bridge ? 'centro de gravedad del tablero deformado (EN 1998-2, H.1(2))' : 'centro de gravedad de la cubierta (EN 1998-1, 4.3.3.4.2.3(2))';
  const sp = p7, xi = p7.xi;
  const ms = p2.ms, Gam = p2.Gam;
  let h = '';

  // ===== Paso 0
  const hz = p7.hz;
  const ruleTxt = { a: 'el emplazamiento coincide con un punto de la malla: valor directo (regla a)', b: 'el emplazamiento está sobre un meridiano o un paralelo de la malla: media ponderada por el inverso de la distancia de los dos puntos más próximos (regla b)', c: 'media ponderada por el inverso de la distancia de los cuatro puntos más próximos (regla c)' };
  h += sec('0', '0', 'Identificación, datos y bases de cálculo', 'UNE-EN 1998-1:2018 (versión corregida 2022) con Anexo Nacional · UNE-EN 1998-2:2018 · UNE-EN 1998-3:2018', `
  <p>La app aplica el <b>método N2</b> del anejo B de la UNE-EN 1998-1 a una curva pushover obtenida fuera de la app (SAP2000, ETABS, OpenSees, SeismoStruct…), junto con las masas y la forma del patrón de cargas. Calcula el <b>desplazamiento objetivo</b> del punto de control y lo compara con la capacidad global de la curva. Cada resultado se muestra con su fórmula, los valores sustituidos y el resultado, para que la memoria se pueda verificar de forma independiente, como exige el Anexo Nacional para los métodos no lineales (UNE-EN 1998-1, AN.2, 4.3.3.1(4)).</p>
  ${tw(['l:Dato', 'l:Valor'], `
  <tr><td class="l">Proyecto</td><td class="l">${projTxt}</td></tr>
  <tr><td class="l">Elemento calculado</td><td class="l">${elemTxt}</td></tr>
  <tr><td class="l">Tipo de estructura</td><td class="l">${bridge ? 'puente: UNE-EN 1998-2, 4.2.5 y anejo H (informativo)' : 'edificio: UNE-EN 1998-1, 4.3.3.4.2; existente: UNE-EN 1998-3, 4.4.4'}</td></tr>
  <tr><td class="l">Dirección del cálculo</td><td class="l">${dirTxt} (una dirección por cálculo)</td></tr>
  <tr><td class="l">Elementos que resisten el sismo</td><td class="l">${matTxt}</td></tr>
  <tr><td class="l">Patrón de cargas</td><td class="l">${I.pat === 'modal' ? 'modal: fuerzas proporcionales a m<sub>i</sub>·Φ<sub>i</sub>' : 'uniforme: fuerzas proporcionales a las masas'} (${bridge ? 'EN 1998-2, H.2' : 'EN 1998-1, 4.3.3.4.2.2'})</td></tr>
  <tr><td class="l">Punto de control C</td><td class="l">${ctrlTxt}${p2.direct ? '' : `; en la tabla de masas, fila ${p2.ic + 1}: «${esc(p2.rows[p2.ic].name)}»`}</td></tr>
  <tr><td class="l">Curva pushover</td><td class="l">${p1.n} puntos${p1.added0 ? ' (incluido el origen, añadido por la app)' : ''} · unidades de entrada ${I.dUnit} y ${I.fUnit}</td></tr>
  <tr><td class="l">Sistema equivalente</td><td class="l">${p2.direct ? `datos del programa de cálculo: ${Y.ms} = ${f(ms, 1)} t, Γ = ${f(Gam, 4)}${p2.M ? `, ${v('M')} = ${f(p2.M, 1)} t` : ''}` : `${p2.rows.length} masas · ${v('M')} = ${f(p2.M, 1)} t`}</td></tr>
  <tr><td class="l">Peligrosidad</td><td class="l">${v('a', 'gR')} = ${f(p7.agR, 4)} g · ${v('K')} = ${f(p7.K, 2)} ${I.siteMode === 'coords' && hz && hz.status !== 'fuera' ? '(malla AN.5)' : '(introducidos a mano)'}</td></tr>
  <tr><td class="l">Terreno</td><td class="l">tipo ${p7.soil} (${v('v', 's,30')} = ${f(I.vs30, 0)} m/s) · UNE-EN 1998-1, tabla 3.1 y AN.1</td></tr>
  <tr><td class="l">Importancia</td><td class="l">clase ${p7.cls} · ${v('γ', 'I')} = ${f(p7.gI, 2)} (${bridge ? 'EN 1998-2, AN, 2.1(6)' : 'EN 1998-1, AN, 4.2.5(5)P'})</td></tr>
  <tr><td class="l">Amortiguamiento</td><td class="l">ξ = ${f(xi, 1)} % · η = ${f(p7.eta, 3)}</td></tr>
  <tr><td class="l">Desplazamiento objetivo</td><td class="l">${R.met === 'igual' ? 'igual desplazamiento, d<sub>t</sub>* = d<sub>et</sub>* (EN 1998-2, anejo H, H.1; análisis lineal con q = 1)' : 'método N2 (EN 1998-1, anejo B, normativo por AN.3)'}</td></tr>
  <tr><td class="l">Opciones</td><td class="l">${Y.dm}: ${p3.dmHow} · ${Y.du}: ${p2.duHow} · iteración ${I.iterate ? `activada (tolerancia ${f(I.tol, 1)} %)` : 'desactivada'}</td></tr>`)}
  <h3>Normas y bases de cálculo</h3>
  <ul>
  <li><b>UNE-EN 1998-1:2018</b> (julio de 2018, versión corregida de febrero de 2022), Eurocódigo 8, parte 1, con su <b>Anexo Nacional</b>: acción sísmica (3.1, 3.2.1, 3.2.2.2; AN.2 y malla AN.5), análisis pushover (4.3.3.4.2) y anejo B, <b>normativo en España</b> (AN.3), igual que el anejo A. No se utiliza la NCSE-02.</li>
  ${bridge ? '<li><b>UNE-EN 1998-2:2018</b>, Eurocódigo 8, parte 2 (puentes): clases y factores de importancia (2.1(4)P y 2.1(6), AN), análisis pushover (4.2.5) y anejo H, que en España mantiene su carácter informativo (AN.3).</li>' : ''}
  <li><b>UNE-EN 1998-3:2018</b>, Eurocódigo 8, parte 3: estados límite DL, SD y NC y sus periodos de retorno (2.1 y AN), y desplazamiento objetivo de estructuras existentes (4.4.4.4, que remite al anejo B de la parte 1).${bridge ? ' Se aplica a puentes por analogía.' : ''}</li>
  <li>Fajfar, P. (2000), <i>A nonlinear analysis method for performance-based seismic design</i>, Earthquake Spectra 16(3) · Vidic, T., Fajfar, P. y Fischinger, M. (1994), EESD 23.</li></ul>
  ${warns(R, '0')}
  <h3>Emplazamiento</h3>
  ${I.siteMode === 'coords' ? `<p>Coordenadas ${f(I.lat, 5)}° N, ${f(Math.abs(I.lon), 5)}° ${I.lon < 0 ? 'O' : 'E'}. ${hz.status === 'fuera' ? 'El punto queda fuera de la malla AN.5.' : `${v('a', 'gR')} y ${v('K')} se obtienen de la malla AN.5 (paso 0.1°): ${ruleTxt[hz.rule]} (UNE-EN 1998-1, AN.2, 3.2.1(2)).`}</p>
  ${hz.status !== 'fuera' ? tw(['Punto', 'Longitud', 'Latitud', 'Distancia [km]', 'K', 'a<sub>gR</sub> [g]'], `${hz.used.map((q, i) => `<tr><td>${i + 1}</td><td>${f(q.p[0], 1)}</td><td>${f(q.p[1], 1)}</td><td>${f(q.d, 2)}</td><td>${f(q.p[2], 1)}</td><td>${f(q.p[3], 3)}</td></tr>`).join('')}
  <tr class="tot"><td>${hz.rule === 'a' ? 'Valor directo' : 'Interpolado'}</td><td></td><td></td><td></td><td>${f(p7.K, 2)}</td><td>${f(p7.agR, 4)}</td></tr>`) : ''}
  <div class="fig"><canvas id="map" width="900" height="480"></canvas><div class="cap">Mapa de peligrosidad dibujado con la malla AN.5 de la UNE-EN 1998-1:2018. La estrella marca el emplazamiento; en el detalle, los cuadros con borde son los puntos usados en la interpolación.</div></div>` : `<p>Peligrosidad introducida a mano: ${v('a', 'gR')} = ${f(p7.agR, 3)} g, ${v('K')} = ${f(p7.K, 2)}.</p>`}
  <div class="interp">Magnitud asociada (solo informativa): ${v('M', 'w')} = ${p7.K <= 1.1 ? 6 : 8}, porque ${v('K')} ${p7.K <= 1.1 ? '≤' : '&gt;'} 1.1 (AN.2, 3.2.1(2)). En España no hay espectros de tipo 1 y 2: la forma del espectro depende de ${v('K')}.</div>`);

  // ===== Paso 1
  const cvPts = p1.d.map((x, i) => [x, p1.Fb[i]]);
  const fig1 = chart({ id: 'c1', x0: 0, x1: up(p1.dend, 1.04), y0: 0, y1: up(p1.Fmax, 1.18), xlabel: 'd_C [m]', ylabel: 'F_b [kN]',
    series: [{ pts: cvPts, color: 'var(--muted)', dots: true }],
    hlines: I.duCrit === 'drop' ? [{ y: p2.pct * p1.Fmax, color: 'var(--amber)', dash: '5 4' }] : [],
    vlines: [{ x: p2.du, color: 'var(--bad)', dash: '6 3', w: 1.4 }],
    points: [{ x: p1.dFmax, y: p1.Fmax, color: 'var(--ink)', label: `F_b,máx = ${fF(p1.Fmax)} kN\nen d_C = ${fd(p1.dFmax)} m`, dx: 10, dy: -30 },
      { x: p2.du, y: p2.Fdu, color: 'var(--bad)', hollow: true, label: `d_u = ${fd(p2.du)} m`, dx: 8, dy: 18 }],
    legend: [{ t: 'curva pushover F_b–d_C (puntos del análisis)', color: 'var(--muted)' }, ...(I.duCrit === 'drop' ? [{ t: `criterio de d_u: ${Math.round(p2.pct * 100)} % de F_b,máx`, color: 'var(--amber)', dash: '5 4' }] : []), { t: `desplazamiento último d_u = ${fd(p2.du)} m`, color: 'var(--bad)', dash: '6 3' }], legendW: 270 });
  const desc = p1.Fend < 0.95 * p1.Fmax;
  h += sec('1', '1', 'Curva pushover', `UNE-EN 1998-1, 4.3.3.4.2.1–4.3.3.4.2.3; anejo B.1${bridge ? ' · UNE-EN 1998-2, 4.2.5 y H.1–H.2' : ''}`, `
  <p>Se empuja la estructura con un patrón de fuerzas horizontales creciente, con las cargas gravitatorias constantes, y se registra el cortante en base ${Y.Fb} frente al desplazamiento ${Y.dC} del punto de control: el ${ctrlTxt}. ${bridge ? 'En puentes deben incluirse los efectos de segundo orden (EN 1998-2, 4.2.5(1)P).' : 'La norma pide al menos dos patrones, uniforme y modal (4.3.3.4.2.2); la app calcula uno cada vez.'}</p>
  ${tw(['l:Magnitud', 'l:Lectura', 'Valor'], `
  ${prow('Puntos de la curva', `${p1.n} pares (${v('d', 'C')}, ${v('F', 'b')})`, p1.n)}
  ${prow('Rigidez del primer tramo', `${v('K', '0')} = ${v('F', 'b,1')}/${v('d', 'C,1')} = ${fF(p1.Fb[1])}/${fd(p1.d[1])}`, `${f(p1.K0, 0)} kN/m`)}
  ${prow('Cortante máximo', `${v('F', 'b,máx')} en ${v('d', 'C')} = ${fd(p1.dFmax)} m`, `${fF(p1.Fmax)} kN`)}
  ${prow('Final de la curva', `${v('d', 'C,fin')} con ${v('F', 'b')} = ${fF(p1.Fend)} kN (${pc(p1.Fend / p1.Fmax)} % de ${v('F', 'b,máx')})`, `${fd(p1.dend)} m`)}
  ${prow('Desplazamiento último', `${v('d', 'u')}: ${p2.duHow}`, `${fd(p2.du)} m`)}`)}
  ${fig(fig1, `Curva pushover del análisis. Los puntos son los pares (d_C, F_b) introducidos. d_u es el desplazamiento último: ${p2.duHow.replace(/<sub>(.*?)<\/sub>/g, '_{$1}')}.`)}
  <div class="interp">La curva alcanza su cortante máximo, ${fF(p1.Fmax)} kN, en ${v('d', 'C')} = ${fd(p1.dFmax)} m, al ${pc(p1.dFmax / p1.dend)} % de su recorrido. ${desc ? `Después pierde resistencia: al final conserva el ${pc(p1.Fend / p1.Fmax)} %.` : 'Después mantiene la resistencia hasta el final del análisis.'} ${I.duCrit === 'drop' && p2.du >= p1.dend - 1e-12 ? `La curva no cae al ${Math.round(p2.pct * 100)} % del máximo: ${v('d', 'u')} se toma en el último punto, que es una cota inferior de la capacidad real.` : ''}</div>
  ${I.mat === 'fabrica' ? `<div class="warn">⚠ Elementos de fábrica: si el mecanismo es el cabeceo (giro con despegue en una junta), el N2 del anejo B está calibrado para sistemas elastoplásticos y el resultado es orientativo. Un sistema que cabecea no tiene periodo propio, se autocentra y disipa sobre todo en los impactos. Para pilas exentas, contrasta con el análisis cinemático (Circolare 2019, C8.7.1.2.1) de la app de cabeceo.</div>` : ''}
  ${warns(R, '1')}`);

  // ===== Paso 2
  const sPts = p2.ds.map((x, i) => [x, p2.Fs[i]]);
  const jA = p1.imax;
  const fig2 = chart({ id: 'c2', x0: 0, x1: up(p1.dend, 1.04), y0: 0, y1: up(p1.Fmax, 1.18), xlabel: 'd_C, d* [m]', ylabel: 'F_b, F* [kN]',
    series: [{ pts: cvPts, color: 'var(--muted)', w: 1.6 }, { pts: sPts, color: 'var(--accent)' }],
    vlines: [{ x: p2.du, color: 'var(--muted)', dash: '6 3' }, { x: p2.dus, color: 'var(--accent)', dash: '6 3' }],
    arrows: Math.abs(Gam - 1) > 0.02 ? [{ x0: p1.d[jA], y0: p1.Fb[jA], x1: p2.ds[jA] * 1.02, y1: p2.Fs[jA] * 1.02, color: 'var(--accent)', label: '÷ Γ', ldx: 14, ldy: 4, anchor: 'start' }] : [],
    points: [{ x: p2.du, y: p2.Fdu, color: 'var(--muted)', hollow: true, label: `d_u = ${fd(p2.du)} m`, dy: 18 }, { x: p2.dus, y: p2.Fdu / Gam, color: 'var(--accent)', hollow: true, label: `d_u* = ${fd(p2.dus)} m`, anchor: 'end', dx: -8, dy: 18 }],
    legend: [{ t: 'estructura real F_b–d_C', color: 'var(--muted)', w: 1.6 }, { t: 'sistema equivalente F*–d* (÷ Γ)', color: 'var(--accent)' }, { t: 'desplazamiento último real d_u', color: 'var(--muted)', dash: '6 3' }, { t: 'equivalente d_u* = d_u/Γ', color: 'var(--accent)', dash: '6 3' }], legendW: 230 });
  const rowsM = p2.rows.map((r, i) => `<tr${r.ctrl ? ' class="hl"' : ''}><td>${i + 1}</td><td class="l">${esc(r.name)}${r.ctrl ? ' · <b>C</b>' : ''}</td><td>${f(r.m, 1)}</td><td>${f(r.phiIn, 3)}</td><td>${f(r.phi, 3)}</td><td>${f(r.mphi, 1)}</td><td>${f(r.mphi2, 1)}</td></tr>`).join('');
  const nShow = p1.n;
  const rowsT = p1.d.map((x, i) => `<tr${i === p1.imax ? ' class="hl"' : ''}><td>${i}</td><td>${fd(x)}</td><td>${fF(p1.Fb[i])}</td><td>${fd(p2.ds[i])}</td><td>${fF(p2.Fs[i])}</td><td>${fa(p2.as[i])}</td></tr>`).join('');
  h += sec('2', '2', 'Sistema equivalente de un grado de libertad', 'UNE-EN 1998-1, anejo B.1–B.2, ecs. (B.1)–(B.5)', `
  <p>La estructura se sustituye por un oscilador de un grado de libertad con la misma curva de capacidad, escalada. Se supone que la forma de la deformada no cambia durante la respuesta: es la del patrón de cargas, Φ<sub>i</sub>, normalizada a Φ = 1 en el punto de control (B.1). Las fuerzas del patrón son ${v('F', 'i')} = ${Y.mi}·${Y.phi}.</p>
  ${p2.direct ? `<p>${Y.ms} y Γ se toman del <b>programa de cálculo</b> (por ejemplo, la salida del pushover de SAP2000 con el procedimiento del Eurocódigo 8). Son los mismos valores que daría la tabla de masas, ${Y.ms} = Σ ${Y.mi}·${Y.phi} (B.2) y Γ = ${Y.ms}/Σ ${Y.mi}·${Y.phi}² (B.3), siempre que el programa use la forma del patrón de cargas y el mismo punto de control que la curva.</p>
  ${tw(['l:Parámetro', 'l:Origen', 'Resultado'], `
  ${prow('Masa del sistema equivalente', `${Y.ms}: dato del programa`, `${f(ms, 1)} t`)}
  ${prow('Factor de transformación', `Γ: dato del programa`, f(Gam, 4))}
  ${prow('Masa total', p2.M ? `${Y.M}: dato` : `${Y.M}: no introducida`, p2.M ? `${f(p2.M, 1)} t` : '—')}
  ${prow('Fracción de masa participante (informativa)', p2.M ? `${Y.es} = Γ·${Y.ms}/${Y.M} = ${f(Gam, 4)}·${f(ms, 1)}/${f(p2.M, 1)}` : `${Y.es}: requiere ${Y.M}`, p2.es != null ? f(p2.es, 3) : '—')}
  ${prow('Desplazamiento último equivalente', `${Y.dus} = ${Y.du}/Γ = ${fd(p2.du)}/${f(Gam, 4)}`, `${fd(p2.dus)} m`)}`)}` : `
  ${tw(['i', 'l:Masa', 'm<sub>i</sub> [t]', 'Φ<sub>i</sub> entrada', 'Φ<sub>i</sub> [—]', 'm<sub>i</sub>Φ<sub>i</sub> [t]', 'm<sub>i</sub>Φ<sub>i</sub>² [t]'], rowsM + `<tr class="tot"><td>Σ</td><td></td><td>${f(p2.M, 1)}</td><td></td><td></td><td>${f(ms, 1)}</td><td>${f(p2.s2, 1)}</td></tr>`)}
  ${tw(['l:Parámetro', 'l:Expresión con valores', 'Resultado'], `
  ${prow('Masa del sistema equivalente', `${Y.ms} = Σ ${Y.mi}·${Y.phi} (B.2)`, `${f(ms, 1)} t`)}
  ${prow('Factor de transformación', `Γ = ${Y.ms} / Σ ${Y.mi}·${Y.phi}² = ${f(ms, 1)}/${f(p2.s2, 1)} (B.3)`, f(Gam, 4))}
  ${prow('Masa total', `${Y.M} = Σ ${Y.mi}`, `${f(p2.M, 1)} t`)}
  ${prow('Fracción de masa participante (informativa)', `${Y.es} = Γ·${Y.ms}/${Y.M} = ${f(Gam, 4)}·${f(ms, 1)}/${f(p2.M, 1)}`, f(p2.es, 3))}
  ${prow('Desplazamiento último equivalente', `${Y.dus} = ${Y.du}/Γ = ${fd(p2.du)}/${f(Gam, 4)}`, `${fd(p2.dus)} m`)}`)}`}
  <div class="eq">${Y.Fs} = ${Y.Fb}/Γ &nbsp;&nbsp; ${Y.ds} = ${Y.dC}/Γ &nbsp;&nbsp; ${Y.as} = ${Y.Fs}/${Y.ms}<span class="tag">(B.4), (B.5)</span></div>
  ${fig(fig2, 'Transformación de la curva pushover (gris) en la del sistema equivalente (azul). Las dos magnitudes se dividen por el mismo factor Γ, así que la curva conserva su forma. d_u se transforma en d_u* = d_u/Γ.')}
  <h3>Curva del sistema equivalente</h3>
  ${tw(['k', 'd<sub>C</sub> [m]', 'F<sub>b</sub> [kN]', 'd* [m]', 'F* [kN]', 'a* = F*/m* [m/s²]'], rowsT)}
  <div class="interp">Γ = ${f(Gam, 3)}: el punto de control se desplaza ${f(Gam, 3)} veces lo que el sistema equivalente, y el cortante en base es ${f(Gam, 3)} veces su fuerza. ${Math.abs(Gam - 1) < 0.08 ? 'Γ es casi 1 porque la mayor parte de la masa se mueve con el punto de control: las dos curvas casi coinciden. ' : ''}${p2.es != null ? `En el modo de la estructura participa el ${pc(p2.es)} % de la masa (${Y.es} = ${f(p2.es, 3)}); con patrón uniforme, ${Y.as} = λ·g/${Y.es}, la misma transformación de la Circolare sin el factor de confianza.` : ''}</div>
  ${bridge ? `<div class="interp">En puentes el N2 da resultados realistas si la respuesta en la dirección calculada se aproxima con un sistema de un grado de libertad: casi siempre en dirección longitudinal de puentes rectos, y en transversal si las pilas dan un apoyo lateral parecido a un tablero rígido. No es así con una pila excepcionalmente rígida entre pilas regulares, o si la masa de las pilas pesa en la respuesta (EN 1998-2, 4.2.5, nota 2).</div>` : ''}
  ${warns(R, '2')}`);

  // ===== Paso 3
  const bilPts = (bb, xend) => [[0, 0], [bb.dy, bb.Fy], [Math.max(bb.dm, xend || 0), bb.Fy]];
  const areaPts = [[0, 0], ...p2.ds.map((x, i) => [x, p2.Fs[i]]).filter(p => p[0] < b.dm), [b.dm, b.Fy], [b.dm, 0]];
  const x3 = up(Math.max(b.dm, p2.dus) * 1.08, 1.06);
  const fig3 = chart({ id: 'c3', x0: 0, x1: Math.min(x3, up(p2.ds[p1.n - 1], 1.02)), y0: 0, y1: up(p1.Fmax / Gam, 1.22), xlabel: 'd* [m]', ylabel: 'F* [kN]',
    areas: [{ pts: areaPts, color: 'var(--accent)', op: .16 }],
    series: [{ pts: sPts, color: 'var(--accent)' }, { pts: [[0, 0], [b.dy, b.Fy], [b.dm, b.Fy]], color: 'var(--coral)', dash: '7 4', w: 2.2 }],
    vlines: [{ x: b.dm, color: 'var(--coral)', dash: '3 3' }, { x: p2.dus, color: 'var(--accent)', dash: '6 3' }],
    points: [{ x: b.dy, y: b.Fy, color: 'var(--coral)', label: `d_y* = ${fd(b.dy)} m`, dx: 8, dy: 20 },
      { x: b.dm, y: b.Fy, color: 'var(--coral)', label: `d_m* = ${fd(b.dm)} m\nF_y* = ${fF(b.Fy)} kN`, dx: 10, dy: -32 },
      { x: p2.dus, y: p2.Fdu / Gam, color: 'var(--accent)', hollow: true, label: `d_u* = ${fd(p2.dus)} m`, anchor: 'end', dx: -8, dy: 20 }],
    texts: [{ x: b.dm * 0.55, y: b.Fy * 0.35, t: `E_m* = ${f(b.Em, 2)} kN·m`, color: 'var(--accent)', anchor: 'middle' }],
    legend: [{ t: 'sistema equivalente F*–d*', color: 'var(--accent)' }, { t: 'bilineal elastoplástica perfecta', color: 'var(--coral)', dash: '7 4' }, { t: 'E_m*: energía bajo la curva hasta d_m*', box: true, color: 'var(--accent)', op: .25 }], legendW: 250 });
  const segRows = b.segs.map(s => `<tr><td>${s.k}</td><td>${fd(s.x0)}</td><td>${fd(s.x1)}</td><td>${fF(s.y0)}</td><td>${fF(s.y1)}</td><td>${f(s.a, 3)}</td><td>${f(s.cum, 3)}</td></tr>`).join('');
  h += sec('3', '3', 'Bilineal equivalente', 'UNE-EN 1998-1, anejo B.3, ec. (B.6) y figura B.1', `
  <p>La curva del sistema equivalente se sustituye por una <b>elastoplástica perfecta</b>. Su resistencia ${Y.Fy} es la fuerza al formarse el <b>mecanismo plástico</b>, en ${Y.dm}; su rigidez inicial se elige para que las dos curvas encierren la misma energía hasta ${Y.dm}. ${Y.dm} no es el desplazamiento último ${Y.dus}: en general ${Y.dm} ≤ ${Y.dus}.</p>
  ${tw(['l:Parámetro', 'l:Expresión con valores', 'Resultado'], `
  ${prow('Desplazamiento de formación del mecanismo', `${Y.dm}: ${p3.dmHow}${p3.dmHow === 'cortante máximo' ? ` (${v('d', 'C')} = ${fd(p1.dFmax)} m; ${fd(p1.dFmax)}/${f(Gam, 4)})` : ''}`, `${fd(b.dm)} m`)}
  ${prow('Resistencia de plastificación', `${Y.Fy} = ${Y.Fs}(${Y.dm})`, `${fF(b.Fy)} kN`)}
  ${prow('Energía de deformación hasta d<sub>m</sub>*', `${Y.Em} = Σ ½·(${v('F', 'k', '*')} + ${v('F', 'k+1', '*')})·(${v('d', 'k+1', '*')} − ${v('d', 'k', '*')})`, `${f(b.Em, 3)} kN·m`)}`)}
  <div class="eq">${Y.dy} = 2·(${Y.dm} − ${Y.Em}/${Y.Fy}) <span class="s">= 2·(${fd(b.dm)} − ${f(b.Em, 3)}/${fF(b.Fy)})</span> = <span class="res">${fd(b.dy)} m</span><span class="tag">(B.6)</span></div>
  <p>La energía bajo la bilineal es ${v('E', 'bil')} = ${Y.Fy}·(${Y.dm} − ${Y.dy}/2) = ${fF(b.Fy)}·(${fd(b.dm)} − ${fd(b.dy)}/2) = ${f(b.Fy * (b.dm - b.dy / 2), 3)} kN·m, igual a ${Y.Em}.</p>
  ${fig(fig3, 'Bilineal equivalente. El área sombreada E_m* bajo la curva real hasta d_m* es igual al área bajo la bilineal; de ahí sale d_y*. d_u* queda a la derecha de d_m* cuando la curva sigue con pérdida de resistencia.')}
  <h3>Integración de la energía por trapecios</h3>
  ${tw(['k', 'd<sub>k−1</sub>* [m]', 'd<sub>k</sub>* [m]', 'F<sub>k−1</sub>* [kN]', 'F<sub>k</sub>* [kN]', 'Área [kN·m]', 'Acumulada [kN·m]'], segRows + `<tr class="tot"><td>Σ</td><td></td><td></td><td></td><td></td><td></td><td>${f(b.Em, 3)}</td></tr>`)}
  <p class="hint">Si ${Y.dm} cae entre dos puntos, el último tramo termina en ${Y.dm} con ${Y.Fs} interpolada linealmente. Con una curva poligonal la regla de los trapecios es exacta.</p>
  <div class="interp">${b.ok ? `Se cumple 0 &lt; ${Y.dy} &lt; ${Y.dm}: la bilineal plastifica al ${pc(b.dy / b.dm)} % de ${Y.dm}. ${b.dy / b.dm > 0.8 ? 'La curva es casi lineal hasta el mecanismo: hay poca reserva plástica antes de d_m*.' : b.dy / b.dm < 0.25 ? 'La curva se ablanda pronto: la bilineal es muy rígida respecto a la secante en d_m*.' : ''}` : `${Y.dy} sale fuera de (0, ${Y.dm}): la bilineal no representa la curva. Revisa ${Y.dm} o la curva.`} ${p2.dus > b.dm * 1.05 ? `La curva sigue hasta ${Y.dus} = ${fd(p2.dus)} m, ${f(p2.dus / b.dm, 2)} veces ${Y.dm}: la bilineal no usa esa parte de la curva.` : ''}</div>
  ${warns(R, '3')}`);

  // ===== Paso 4
  const Tini = 2 * Math.PI * Math.sqrt(ms / p1.K0);
  const x4 = up(Math.min(b.dm, 3 * b.dy) * 1.05, 1.05);
  const fig4 = chart({ id: 'c4', x0: 0, x1: x4, y0: 0, y1: up(b.Fy, 1.3), xlabel: 'd* [m]', ylabel: 'F* [kN]',
    series: [{ pts: sPts, color: 'var(--accent)', dots: true }, { pts: bilPts(b, x4), color: 'var(--coral)', dash: '7 4', w: 2.2 }, { pts: [[0, 0], [x4, p1.K0 * x4]], color: 'var(--muted)', dash: '2 3', w: 1.3 }],
    points: [{ x: b.dy, y: b.Fy, color: 'var(--coral)', label: `d_y* = ${fd(b.dy)} m · F_y* = ${fF(b.Fy)} kN`, dy: -12, dx: 10 }],
    legend: [{ t: 'sistema equivalente F*–d* (detalle del origen)', color: 'var(--accent)' }, { t: `rama elástica: k* = ${f(p5.k, 0)} kN/m → T* = ${fT(p5.T)} s`, color: 'var(--coral)', dash: '7 4' }, { t: `rigidez del primer tramo K_0 → ${fT(Tini)} s`, color: 'var(--muted)', dash: '2 3' }], legendPos: 'br', legendW: 320 });
  h += sec('4', '4', 'Periodo del sistema equivalente', 'UNE-EN 1998-1, anejo B.4, ec. (B.7)', `
  <p>El periodo sale de la rigidez de la rama elástica de la bilineal, no de un análisis modal. Como esa rama es secante a la curva real, ${Y.Ts} suele ser algo más largo que el periodo del primer modo elástico.</p>
  ${tw(['l:Parámetro', 'l:Expresión con valores', 'Resultado'], `
  ${prow('Rigidez de la rama elástica', `${Y.ks} = ${Y.Fy}/${Y.dy} = ${fF(b.Fy)}/${fd(b.dy)}`, `${f(p5.k, 0)} kN/m`)}
  ${prow('Aceleración de plastificación', `${Y.ay} = ${Y.Fy}/${Y.ms} = ${fF(b.Fy)}/${f(ms, 1)}`, `${fa(p5.ay)} m/s²`)}
  ${prow('Periodo con la rigidez del primer tramo (comparación)', `2π·√(${Y.ms}/${v('K', '0')}) = 2π·√(${f(ms, 1)}/${f(p1.K0, 0)})`, `${fT(Tini)} s`)}`)}
  <div class="eq">${Y.Ts} = 2π·√(${Y.ms}·${Y.dy}/${Y.Fy}) <span class="s">= 2π·√(${f(ms, 1)}·${fd(b.dy)}/${fF(b.Fy)})</span> = <span class="res">${fT(p5.T)} s</span><span class="tag">(B.7)</span></div>
  <p class="hint">Unidades: t·m/kN = s², porque 1 kN = 1 t·m/s².</p>
  ${fig(fig4, 'Detalle del origen de la curva del sistema equivalente. La rama elástica de la bilineal (coral) une el origen con (d_y*, F_y*); su pendiente k* fija el periodo T*. La recta gris es la rigidez del primer tramo de la curva.')}
  <div class="interp">${Y.Ts} = ${fT(p5.T)} s ${p5.T >= sp.TC ? `≥ ${Y.TC} = ${fT(sp.TC)} s: periodo medio o largo` : `&lt; ${Y.TC} = ${fT(sp.TC)} s: periodo corto`} (anejo B.5). Es ${f(p5.T / Tini, 2)} veces el periodo con la rigidez del primer tramo (${fT(Tini)} s)${p5.T / Tini > 1.4 ? ': la curva se ablanda mucho antes del mecanismo y la rama elástica de la bilineal es bastante más flexible que la inicial' : ''}.</div>`);

  if (!R.noSeismic) {
  // ===== Espectro
  const Tmax = Math.max(4, Math.ceil(Math.max(fin.T, p5.T) * 1.15 * 2) / 2);
  const Ts = []; for (let i = 0; i <= 600; i++) Ts.push(Tmax * i / 600);
  const SeMax = 2.5 * p7.ag * G * p7.S * p7.eta;
  const figSe = chart({ id: 'cSe', x0: 0, x1: Tmax, y0: 0, y1: up(SeMax, 1.2), xlabel: 'T [s]', ylabel: 'S_e [m/s²]',
    series: [{ pts: Ts.map(T => [T, sp.Se(T, p7.ag, xi)]), color: 'var(--violet)' }],
    vlines: [{ x: sp.TB, color: 'var(--muted)' }, { x: sp.TC, color: 'var(--muted)' }, { x: sp.TD, color: 'var(--muted)' }, { x: p5.T, color: 'var(--accent)', dash: '6 3', w: 1.4 }],
    points: [{ x: p5.T, y: p5.Se, color: 'var(--accent)', label: `S_e(T*) = ${fa(p5.Se)} m/s²`, dx: 8, dy: -10 }],
        legend: [{ t: `espectro elástico, ξ = ${f(xi, 0)} %`, color: 'var(--violet)' }, { t: `T_B = ${fT(sp.TB)} · T_C = ${fT(sp.TC)} · T_D = ${f(sp.TD, 1)} s`, color: 'var(--muted)', dash: '3 3' }, { t: `T* = ${fT(p5.T)} s (paso 4)`, color: 'var(--accent)', dash: '6 3' }], legendW: 250, H: 340 });
  const figSd = chart({ id: 'cSd', x0: 0, x1: Tmax, y0: 0, y1: up(Math.max(...Ts.map(T => sp.SDe(T, p7.ag, xi))), 1.15), xlabel: 'T [s]', ylabel: 'S_De [m]',
    series: [{ pts: Ts.map(T => [T, sp.SDe(T, p7.ag, xi)]), color: 'var(--violet)' }],
    vlines: [{ x: sp.TC, color: 'var(--muted)' }, { x: sp.TD, color: 'var(--muted)' }, { x: p5.T, color: 'var(--accent)', dash: '6 3', w: 1.4 }],
    points: [{ x: p5.T, y: p5.det, color: 'var(--accent)', label: `d_et* = ${fd(p5.det)} m`, dx: 8, dy: -10 }],
    legend: [{ t: 'S_De = S_e·(T/2π)²', color: 'var(--violet)' }, { t: 'T_C, T_D', color: 'var(--muted)', dash: '3 3' }, { t: `T* = ${fT(p5.T)} s`, color: 'var(--accent)', dash: '6 3' }], legendPos: 'br', legendW: 170, H: 340 });
  const Sexpr = p7.soil === 'A' ? '1' : p7.soil === 'D' ? (p7.ag <= 0.1 ? '2 (a<sub>g</sub> ≤ 0.1 g)' : p7.ag <= 0.4 ? `2.33 − 3.33·${f(p7.ag, 4)}` : '1 (a<sub>g</sub> &gt; 0.4 g)')
    : (p7.ag <= 0.1 ? `${v('C')} (a<sub>g</sub> ≤ 0.1 g)` : p7.ag <= 0.4 ? `${v('C')} + 3.33·(${f(p7.ag, 4)} − 0.1)·(1 − ${v('C')}) = ${f(p7.C, 3)} + 3.33·${f(p7.ag - 0.1, 4)}·(${f(1 - p7.C, 3).replace('-', '−')})` : '1 (a<sub>g</sub> &gt; 0.4 g)');
  h += sec('E', 'E', 'Espectro elástico de respuesta', 'UNE-EN 1998-1: 3.2.1(3), 3.2.2.2 (ecs. 3.2–3.7), anejo A · Anexo Nacional: AN.2 (tablas AN.1 y AN.2), AN.5', `
  <p>La demanda es el <b>espectro de respuesta elástico en el emplazamiento</b> de la UNE-EN 1998-1:2018, 3.2.2.2, con los parámetros de su <b>Anexo Nacional</b>: ${Y.agR} y ${Y.K} de la malla AN.5 y forma del espectro de la tabla AN.2. Se usa el sismo de cálculo para el requisito de <b>no colapso</b> (periodo de retorno de 475 años, 10 % en 50 años; ${bridge ? 'EN 1998-2, 2.1(3)P' : 'EN 1998-1, 2.1(1)P'}), que equivale al estado límite de <b>daños significativos (SD)</b> de la EN 1998-3. El paso 8 repite el cálculo para los otros estados límite.</p>
  ${fig(specSchema(), 'Esquema del espectro elástico (UNE-EN 1998-1, 3.2.2.2 y anejo A). T_B: inicio de la meseta de aceleración constante. T_C: fin de la meseta; desde ahí S_e ∝ 1/T. T_D: inicio del desplazamiento espectral constante (S_e ∝ 1/T²). T_E y T_F (anejo A): transición hacia el desplazamiento del terreno d_g. En las figuras del emplazamiento, la línea vertical azul discontinua es el periodo T* de la estructura.')}
  ${tw(['l:Parámetro', 'l:Expresión con valores', 'Valor'], `
  ${prow('Aceleración de cálculo', `${Y.ag} = ${Y.gI}·${Y.agR} = ${f(p7.gI, 2)}·${f(p7.agR, 4)} (3.2.1(3))`, `${f(p7.ag, 4)} g`)}
  ${prow('Coeficiente del terreno', `${Y.C} = (800/${v('v', 's,30')})<sup>0.465</sup> = (800/${f(I.vs30, 0)})<sup>0.465</sup>`, f(p7.C, 3))}
  ${prow('Tipo de terreno', `según ${v('v', 's,30')} = ${f(I.vs30, 0)} m/s (tabla 3.1 y AN.1)`, p7.soil)}
  ${prow('Factor de suelo', `${Y.S} = ${Sexpr} (tabla AN.2)`, f(p7.S, 3))}
  ${prow('Fin de la meseta', `${Y.TC} = ${p7.soil === 'A' ? `${Y.K}/4 = ${f(p7.K, 2)}/4` : p7.soil === 'D' ? `${Y.K}/2 = ${f(p7.K, 2)}/2` : `${Y.K}·${Y.C}/4 = ${f(p7.K, 2)}·${f(p7.C, 3)}/4`} (tabla AN.2)`, `${fT(sp.TC)} s`)}
  ${prow('Inicio de la meseta', `${Y.TB} = ${Y.TC}/5 (tabla AN.2)`, `${fT(sp.TB)} s`)}
  ${prow('Inicio del desplazamiento constante', `${Y.TD} (tabla AN.2)`, `${f(sp.TD, 1)} s`)}
  ${prow('Corrección por amortiguamiento', `η = √(10/(5 + ξ)) = √(10/(5 + ${f(xi, 1)})) ≥ 0.55 (3.6)`, f(p7.eta, 3))}
  ${prow('Meseta de aceleración', `2.5·${Y.ag}·${Y.S}·η = 2.5·${f(p7.ag, 4)}·9.81·${f(p7.S, 3)}·${f(p7.eta, 3)}`, `${fa(SeMax)} m/s²`)}`)}
  ${tw(['l:Rango de periodos', `l:${Y.Se}(T)`, 'l:Ec.'], `
  <tr><td class="l">0 ≤ T ≤ ${Y.TB}</td><td class="l">${Y.ag}·${Y.S}·[1 + (T/${Y.TB})·(2.5·η − 1)]</td><td class="l">(3.2)</td></tr>
  <tr><td class="l">${Y.TB} ≤ T ≤ ${Y.TC}</td><td class="l">2.5·${Y.ag}·${Y.S}·η</td><td class="l">(3.3)</td></tr>
  <tr><td class="l">${Y.TC} ≤ T ≤ ${Y.TD}</td><td class="l">2.5·${Y.ag}·${Y.S}·η·${Y.TC}/T</td><td class="l">(3.4)</td></tr>
  <tr><td class="l">${Y.TD} ≤ T ≤ 4 s</td><td class="l">2.5·${Y.ag}·${Y.S}·η·${Y.TC}·${Y.TD}/T²</td><td class="l">(3.5)</td></tr>
  <tr><td class="l">Desplazamiento</td><td class="l">${Y.SDe}(T) = ${Y.Se}(T)·(T/2π)²; para T &gt; 4 s, anejo A</td><td class="l">(3.7)</td></tr>`)}
  <div>${fig(figSe, 'Espectro elástico de aceleración en el emplazamiento, con T* y la ordenada S_e(T*) que usa el paso 5.')}${fig(figSd, 'Espectro elástico de desplazamiento. En T* da d_et*, el desplazamiento del sistema equivalente si fuera indefinidamente elástico.')}</div>
  <div class="interp">${Y.Ts} = ${fT(p5.T)} s cae en la ${hT(sp.branch(p5.T))} del espectro: ${Y.Se}(${Y.Ts}) = ${fa(p5.Se)} m/s² (${f(p5.Se / G, 3)} g). ${p5.T < sp.TB ? 'Es la rama creciente, poco habitual en estructuras reales: la estructura es muy rígida.' : ''}</div>
  ${warns(R, 'E')}`);

  // ===== Paso 5
  const cas = p5.cas, igual = R.met === 'igual';
  const casN2 = p5.T >= sp.TC ? 1 : p5.qu <= 1 ? 2 : 3;
  const casTxt = { 0: 'Igual desplazamiento (EN 1998-2, H.1)', 1: `Caso 1 · ${Y.Ts} ≥ ${Y.TC}: igual desplazamiento`, 2: `Caso 2 · ${Y.Ts} &lt; ${Y.TC} y ${Y.qu} ≤ 1: respuesta elástica`, 3: `Caso 3 · ${Y.Ts} &lt; ${Y.TC} y ${Y.qu} &gt; 1: amplificación en periodo corto` };
  const casSvg = { 0: 'Igual desplazamiento · d_t* = d_et* (EN 1998-2, H.1)', 1: 'Caso 1 · T* ≥ T_C: igual desplazamiento', 2: 'Caso 2 · T* < T_C y q_u ≤ 1: elástico', 3: 'Caso 3 · T* < T_C y q_u > 1: amplificación' };
  const adrs = (ag, Tm, fn) => { const pts = []; for (let i = 1; i <= 500; i++) { const T = Tm * i / 500; pts.push(fn(T)); } return pts; };
  const xA = up(Math.max(p5.dt, p5.det, b.dy) * 1.55, 1.05), yA = up(Math.max(SeMax, p5.ay), 1.18);
  const aPts = p2.ds.map((x, i) => [x, p2.as[i]]);
  const app5 = Math.min(p5.Se, p5.ay);
  const ray = (T, c, dash, lab) => ({ pts: [[0, 0], [xA * 1.5, (2 * Math.PI / T) ** 2 * xA * 1.5]], color: c, dash: dash || '3 3', w: 1.2 });
  const inel = I.showB ? adrs(p7.ag, Tmax, T => { const Rm = T < sp.TC ? (p5.mu - 1) * T / sp.TC + 1 : p5.mu; return [p5.mu / Rm * sp.SDe(T, p7.ag, xi), sp.Se(T, p7.ag, xi) / Rm]; }) : null;
  const ser5 = [{ pts: adrs(p7.ag, Tmax, T => [sp.SDe(T, p7.ag, xi), sp.Se(T, p7.ag, xi)]), color: 'var(--violet)' },
    ray(p5.T, 'var(--accent)', '6 3'), ray(sp.TC, 'var(--muted)', '2 3'),
    { pts: aPts, color: 'var(--accent)', w: 1.3, op: .55 },
    { pts: [[0, 0], [b.dy, p5.ay], [Math.max(xA, b.dm), p5.ay]], color: 'var(--coral)', dash: '7 4', w: 2.2 }];
  if (inel) ser5.push({ pts: inel, color: 'var(--violet)', dash: '5 4', w: 1.5 });
  const arr5 = [{ x0: p5.dt, y0: app5 * 0.5, x1: p5.dt, y1: 0, color: 'var(--accent)', w: 1.6 }];
  if (cas === 3) {
    arr5.push({ x0: b.dy, y0: p5.ay * 0.3, x1: p5.det, y1: p5.ay * 0.3, both: true, color: 'var(--amber)', label: 'd_et* − d_y*', ldy: -5 });
    arr5.push({ x0: b.dy, y0: p5.ay * 0.16, x1: p5.dt0 > 3 * p5.det ? p5.dt0 : p5.dt, y1: p5.ay * 0.16, both: true, color: 'var(--amber)', label: '(d_et* − d_y*)·T_C/T*', ldy: -5 });
  }
  const fig5 = chart({ id: 'c5', x0: 0, x1: xA, y0: 0, y1: yA, xlabel: 'S_De, d* [m]', ylabel: 'S_e, a* [m/s²]',
    series: ser5,
    vlines: cas === 3 ? [{ x: b.dy, color: 'var(--amber)', dash: '2 3', y0: 0, y1: p5.ay }, { x: p5.det, color: 'var(--amber)', dash: '2 3', y0: 0, y1: p5.Se }] : [],
    arrows: arr5,
    points: [{ x: p5.det, y: p5.Se, color: 'var(--violet)', label: `d_et* = ${fd(p5.det)} m\nS_e(T*) = ${fa(p5.Se)} m/s²`, anchor: 'end', dx: -10, dy: -26 },
      { x: b.dy, y: p5.ay, color: 'var(--coral)', r: 3.5, label: `a_y* = ${fa(p5.ay)} m/s²`, anchor: 'end', dx: -8, dy: cas === 3 ? -8 : 20 },
      { x: p5.dt, y: app5, color: 'var(--accent)', label: `d_t* = ${fd(p5.dt)} m`, dx: 8, dy: cas === 3 ? -10 : 18 }],
    texts: [{ x: 0, y: yA, t: casSvg[cas], color: 'var(--ink)', dx: 12, dy: 18, bold: true, size: 12.5 }],
    legend: [{ t: `espectro elástico S_e–S_De, ξ = ${f(xi, 0)} %`, color: 'var(--violet)' }, { t: `recta del periodo T* = ${fT(p5.T)} s`, color: 'var(--accent)', dash: '6 3', w: 1.4 }, { t: `recta del periodo T_C = ${fT(sp.TC)} s`, color: 'var(--muted)', dash: '2 3', w: 1.4 },
      { t: 'capacidad a* = F*/m*', color: 'var(--accent)', w: 1.3 }, { t: 'bilineal en aceleración', color: 'var(--coral)', dash: '7 4' }, ...(inel ? [{ t: `espectro inelástico para μ = ${f(p5.mu, 2)} (opción B)`, color: 'var(--violet)', dash: '5 4', w: 1.5 }] : []),
      { t: 'demanda elástica (d_et*, S_e(T*))', dot: true, color: 'var(--violet)' }, { t: 'desplazamiento objetivo d_t*', dot: true, color: 'var(--accent)' }], legendPos: 'below', H: 430 });
  const subst3 = `(${fd(p5.det)}/${f(p5.qu, 3)})·[1 + (${f(p5.qu, 3)} − 1)·${fT(sp.TC)}/${fT(p5.T)}]`;
  h += sec('5', '5', 'Desplazamiento objetivo del sistema equivalente', 'UNE-EN 1998-1, anejo B.5, ecs. (B.8)–(B.12) y figura B.2', `
  <p>Primero se calcula el desplazamiento que tendría el sistema equivalente si fuera indefinidamente elástico, ${Y.det}, y la relación ${Y.qu} entre la aceleración elástica y su resistencia. Después se elige la expresión según el periodo: el límite entre periodo corto y periodo medio es ${Y.TC}.</p>
  ${tw(['l:Parámetro', 'l:Expresión con valores', 'Resultado'], `
  ${prow('Desplazamiento elástico', `${Y.det} = ${Y.Se}(${Y.Ts})·(${Y.Ts}/2π)² = ${fa(p5.Se)}·(${fT(p5.T)}/2π)² (B.8)`, `${fd(p5.det)} m`)}
  ${prow('Relación demanda elástica / resistencia', `${Y.qu} = ${Y.Se}(${Y.Ts})·${Y.ms}/${Y.Fy} = ${fa(p5.Se)}·${f(ms, 1)}/${fF(b.Fy)} (B.11)`, f(p5.qu, 3))}`)}
  ${tw(['l:Caso', 'l:Condición', `l:${Y.dts}`, 'l:Lectura'], `
  <tr${casN2 === 1 ? ' class="hl"' : ''}><td class="l">1</td><td class="l">${Y.Ts} ≥ ${Y.TC}</td><td class="l">${Y.det} (B.12)</td><td class="l">Igual desplazamiento. Vale tanto si plastifica como si no</td></tr>
  <tr${casN2 === 2 ? ' class="hl"' : ''}><td class="l">2</td><td class="l">${Y.Ts} &lt; ${Y.TC} y ${Y.qu} ≤ 1</td><td class="l">${Y.det} (B.9)</td><td class="l">No plastifica: el punto queda en la rama elástica de la bilineal</td></tr>
  <tr${casN2 === 3 ? ' class="hl"' : ''}><td class="l">3</td><td class="l">${Y.Ts} &lt; ${Y.TC} y ${Y.qu} &gt; 1</td><td class="l">(${Y.det}/${Y.qu})·[1 + (${Y.qu} − 1)·${Y.TC}/${Y.Ts}] (B.10)</td><td class="l">Amplificación en periodo corto</td></tr>`)}
  <p>Aquí ${Y.Ts} = ${fT(p5.T)} s ${p5.T >= sp.TC ? '≥' : '&lt;'} ${Y.TC} = ${fT(sp.TC)} s${p5.T < sp.TC ? ` y ${Y.qu} = ${f(p5.qu, 3)} ${p5.qu > 1 ? '&gt;' : '≤'} 1` : ''}: <b>${casTxt[casN2]}</b>.</p>
  ${igual ? `<p><b>Criterio elegido: igual desplazamiento.</b> El anejo H de la EN 1998-2 (informativo en España) lleva el pushover hasta ${v('d', 'E')}, el desplazamiento de un análisis espectral lineal con q = 1 y la rigidez eficaz de los elementos dúctiles (H.1). Con un modo equivale a ${Y.dts} = ${Y.det}, sea cual sea el periodo: no se aplica la amplificación del caso 3. La tabla de casos del N2 se muestra a título comparativo; el N2 daría ${Y.dts} = ${fd(p5.n2dt)} m.</p>
  <div class="eq">${Y.dts} = ${Y.det} = <span class="res">${fd(p5.dt)} m</span><span class="tag">(EN 1998-2, H.1)</span></div>` : `
  <div class="eq">${Y.dts} = ${cas === 3 ? `(${Y.det}/${Y.qu})·[1 + (${Y.qu} − 1)·${Y.TC}/${Y.Ts}] <span class="s">= ${subst3}</span> = ${p5.capped ? `${fd(p5.dt0)} m &gt; 3·${Y.det} → ` : ''}` : `${Y.det} = `}<span class="res">${fd(p5.dt)} m</span><span class="tag">${cas === 3 ? '(B.10)' : cas === 2 ? '(B.9)' : '(B.12)'}</span></div>
  <p>Límite: ${Y.dts} no necesita superar 3·${Y.det} = ${fd(3 * p5.det)} m (anejo B.5) ${p5.capped ? '→ <b>se aplica el límite</b>' : '→ no se alcanza'}. En los casos 1 y 2 ${Y.dts} = ${Y.det}; en el caso 3, ${Y.dts} &gt; ${Y.det}.</p>`}
  <h3>Relación con la ductilidad${igual ? ' (N2, comparativa)' : ''}</h3>
  <p>Para un oscilador elastoplástico, la reducción de la demanda elástica por ductilidad es ${Y.Rmu} = (${Y.mu} − 1)·T/${Y.TC} + 1 si T &lt; ${Y.TC} y ${Y.Rmu} = ${Y.mu} si T ≥ ${Y.TC} (Vidic, Fajfar y Fischinger, 1994). En el punto de funcionamiento ${Y.Rmu} = ${Y.qu}, de donde sale la ductilidad movilizada:</p>
  ${tw(['l:Parámetro', 'l:Expresión con valores', 'Resultado'], `
  ${prow('Ductilidad movilizada', `${Y.mu} = ${Y.dts}/${Y.dy} = ${fd(p5.dt)}/${fd(b.dy)}`, f(p5.mu, 3))}
  ${prow('Comprobación por la relación R<sub>μ</sub>–μ–T', p5.T < sp.TC ? `${Y.mu} = (${Y.qu} − 1)·${Y.TC}/${Y.Ts} + 1 = (${f(p5.qu, 3)} − 1)·${fT(sp.TC)}/${fT(p5.T)} + 1` : `${Y.mu} = ${Y.qu}`, f(p5.muVFF, 3))}`)}
  <p class="hint">Las dos ductilidades coinciden cuando la estructura plastifica (${Y.qu} &gt; 1) y no se aplica el límite de 3·${Y.det}. Si ${Y.qu} ≤ 1 la estructura no plastifica y ${Y.mu} = ${Y.dts}/${Y.dy} ≤ 1.</p>
  <h3>Construcción gráfica</h3>
  <p>En ejes ${Y.Se}–${Y.SDe} cada periodo es una recta desde el origen, ${Y.Se} = (2π/T)²·${Y.SDe}. La recta de ${Y.Ts} corta al espectro en (${Y.det}, ${Y.Se}(${Y.Ts})); la capacidad se dibuja en aceleración, ${Y.as} = ${Y.Fs}/${Y.ms}. ${cas === 3 ? `En el caso 3, como ${Y.dy} = ${Y.det}/${Y.qu}, la ecuación (B.10) equivale a ${Y.dts} = ${Y.dy} + (${Y.det} − ${Y.dy})·${Y.TC}/${Y.Ts} = ${fd(b.dy)} + (${fd(p5.det)} − ${fd(b.dy)})·${fT(sp.TC)}/${fT(p5.T)} = ${fd(b.dy + (p5.det - b.dy) * sp.TC / p5.T)} m: el tramo entre ${Y.dy} y ${Y.det} se estira por ${Y.TC}/${Y.Ts} a partir de ${Y.dy} (flechas ámbar).` : cas === 1 ? `En el caso 1 se aplica la regla de igual desplazamiento: ${Y.dts} es la abscisa de la intersección de la recta de ${Y.Ts} con el espectro, ${p5.qu > 1 ? 'y el punto de funcionamiento queda en la meseta de la bilineal' : 'y el punto queda en la rama elástica porque la demanda no llega a la resistencia'}.` : `En el caso 2 la demanda elástica no llega a la resistencia: el punto de funcionamiento es la propia intersección, sobre la rama elástica de la bilineal.`}</p>
  ${fig(fig5, `Desplazamiento objetivo del sistema equivalente en ejes S_e–S_De (formato aceleración–desplazamiento, figura B.2). El espectro (violeta) se corta con la recta del periodo T*; la capacidad (azul) y su bilineal (coral) están en aceleración, F*/m*. La flecha azul señala d_t* en el eje de desplazamientos.${inel ? ' El espectro inelástico (opción B) es S_a = S_e/R_μ y S_d = (μ/R_μ)·S_De con la μ calculada; pasa por el punto de funcionamiento. No es un espectro con amortiguamiento equivalente: se mantiene ξ = 5 % y la no linealidad entra por la ductilidad.' : ' En el panel de datos se puede añadir el espectro inelástico (opción B).'}`)}
  <div class="interp">${igual ? `Con el criterio de igual desplazamiento ${Y.dts} = ${Y.det} = ${fd(p5.dt)} m${casN2 === 3 ? `, un ${pc(1 - p5.dt / p5.n2dt)} % menos que el N2 (${fd(p5.n2dt)} m): en periodo corto con plastificación este criterio no recoge la amplificación de la demanda` : ': en este caso coincide con el N2'}. Ductilidad movilizada ${Y.mu} = ${f(p5.mu, 2)}.` : cas === 1 ? `Periodo medio o largo: el desplazamiento del sistema no lineal es el del elástico, ${Y.dts} = ${Y.det} = ${fd(p5.dt)} m. ${p5.qu > 1 ? `Con ${Y.qu} = ${f(p5.qu, 2)} la estructura plastifica y moviliza una ductilidad ${Y.mu} = ${f(p5.mu, 2)}.` : `Con ${Y.qu} = ${f(p5.qu, 2)} ≤ 1 la estructura no llega a plastificar (${Y.mu} = ${f(p5.mu, 2)}).`}` : cas === 2 ? `Periodo corto, pero la demanda elástica (${fa(p5.Se)} m/s²) no llega a la resistencia (${Y.ay} = ${fa(p5.ay)} m/s²): la estructura responde en régimen elástico y ${Y.dts} = ${Y.det} = ${fd(p5.dt)} m, el ${pc(p5.dt / b.dy)} % de ${Y.dy}.` : `Periodo corto con plastificación: la estructura necesita ${f(p5.dt / p5.det, 2)} veces el desplazamiento elástico (${fd(p5.dt)} frente a ${fd(p5.det)} m). Moviliza una ductilidad ${Y.mu} = ${f(p5.mu, 2)}, mayor que ${Y.qu} = ${f(p5.qu, 2)}, como ocurre siempre en el caso 3.`}</div>
  ${warns(R, '5')}`);

  // ===== Paso 6
  const its = p6.its.filter(x => !x.bad);
  const iterCols = ['var(--coral)', 'var(--amber)', 'var(--sky)', 'var(--violet)', 'var(--ink)'];
  const dashes = ['7 4', '5 3', '3 3', '8 3 2 3', '2 2'];
  const x6 = up(Math.max(b.dm, ...its.map(x => Math.max(x.dm, x.dt))) * 1.15, 1.04);
  const fig6 = chart({ id: 'c6', x0: 0, x1: Math.min(x6, up(p2.ds[p1.n - 1], 1.02)), y0: 0, y1: up(p1.Fmax / Gam, 1.22), xlabel: 'd* [m]', ylabel: 'F* [kN]',
    series: [{ pts: sPts, color: 'var(--accent)' }, ...its.map((x, i) => ({ pts: [[0, 0], [x.dy, x.Fy], [x.dm, x.Fy]], color: iterCols[Math.min(i, 4)], dash: dashes[Math.min(i, 4)], w: 2 }))],
    vlines: [{ x: fin.dt, color: 'var(--accent)', dash: '6 3', w: 1.4 }],
    points: its.map((x, i) => ({ x: x.dm, y: x.Fy, color: iterCols[Math.min(i, 4)], r: 3.5 })),
    texts: [{ x: fin.dt, y: 0, t: `d_t* = ${fd(fin.dt)} m`, color: 'var(--accent)', dx: 5, dy: -6 }],
    legend: [{ t: 'sistema equivalente F*–d*', color: 'var(--accent)' }, ...its.slice(0, 6).map((x, i) => ({ t: `${i === 0 ? 'primera bilineal' : `iteración ${i}`}: d_m* = ${fd(x.dm)} m`, color: iterCols[Math.min(i, 4)], dash: dashes[Math.min(i, 4)] })), { t: 'desplazamiento objetivo final d_t*', color: 'var(--accent)', dash: '6 3', w: 1.4 }], legendW: 270, legendPos: 'br' });
  const itRows = p6.its.map((x, i) => x.bad ? `<tr><td>${i}</td><td>${fd(x.dm)}</td><td>${fF(x.Fy)}</td><td>${f(x.Em, 3)}</td><td>${fd(x.dy)}</td><td colspan="7" class="l">d<sub>y</sub>* fuera de rango: la iteración se detiene</td></tr>`
    : `<tr${x === fin ? ' class="hl"' : ''}><td>${i}</td><td>${fd(x.dm)}</td><td>${fF(x.Fy)}</td><td>${f(x.Em, 3)}</td><td>${fd(x.dy)}</td><td>${fT(x.T)}</td><td>${fa(x.Se)}</td><td>${fd(x.det)}</td><td>${f(x.qu, 3)}</td><td>${casName(x.cas)}</td><td>${fd(x.dt)}</td><td>${x.change != null ? pc(x.change) : '—'}</td></tr>`).join('');
  const stopTxt = { igual: `no se aplica: con el criterio de igual desplazamiento la rigidez es la eficaz de los elementos dúctiles (EN 1998-2, 2.3.6.1 y H.1), que la app toma de la primera bilineal`, cero: 'no procede', conv: `ha convergido en ${its.length - 1} iteraci${its.length - 1 === 1 ? 'ón' : 'ones'}: el último cambio de ${Y.dts} es menor que la tolerancia (${f(I.tol, 1)} %)`, off: 'está desactivada: el resultado es el de la primera bilineal', end: `se detiene porque ${Y.dts} supera el final de la curva`, max: 'no ha convergido en 20 ciclos', dy: `se detiene porque ${Y.dy} sale fuera de rango` }[p6.stop];
  h += sec('6', '6', igual ? 'Iteración de la bilineal (no se aplica)' : 'Iteración de la bilineal', 'UNE-EN 1998-1, anejo B.5, «Procedimiento iterativo (opcional)»', `
  <p>Si ${Y.dts} es muy distinto del ${Y.dm} usado para la bilineal, el anejo B permite repetir los pasos 3 a 5 con ${Y.dm} ← ${Y.dts} y ${Y.Fy} ← ${Y.Fs}(${Y.dts}). La app itera hasta que |${v('d', 't,i+1', '*')} − ${v('d', 't,i', '*')}|/${v('d', 't,i', '*')} &lt; tolerancia (${f(I.tol, 1)} %; la norma no la fija), con un máximo de 20 ciclos.</p>
  ${tw(['i', 'd<sub>m</sub>* [m]', 'F<sub>y</sub>* [kN]', 'E<sub>m</sub>* [kN·m]', 'd<sub>y</sub>* [m]', 'T* [s]', 'S<sub>e</sub>(T*) [m/s²]', 'd<sub>et</sub>* [m]', 'q<sub>u</sub>', 'Caso', 'd<sub>t</sub>* [m]', 'Cambio [%]'], itRows)}
  ${fig(fig6, 'Bilineales de cada iteración superpuestas a la curva del sistema equivalente. Cada bilineal termina en su d_m* (punto); la vertical azul es el desplazamiento objetivo final.')}
  <div class="interp">La iteración ${stopTxt}. ${its.length > 1 ? (fin.dt < its[0].dt ? `${Y.dts} pasa de ${fd(its[0].dt)} a ${fd(fin.dt)} m (${pc(fin.dt / its[0].dt - 1)} %): como ${Y.dts} &lt; ${Y.dm}, ${Y.Fy} baja, la rama elástica se acerca a la rigidez inicial y ${Y.Ts} se acorta (${fT(its[0].T)} → ${fT(fin.T)} s).` : `${Y.dts} pasa de ${fd(its[0].dt)} a ${fd(fin.dt)} m (+${pc(fin.dt / its[0].dt - 1)} %): como ${Y.dts} &gt; ${Y.dm}, la bilineal se ajusta a una parte más avanzada de la curva (${Y.Ts}: ${fT(its[0].T)} → ${fT(fin.T)} s).`) : ''} ${fin.dt <= fin.dy ? `En el resultado final ${Y.dts} ≤ ${Y.dy}: la respuesta es elástica y la bilineal se ha ajustado a la rigidez secante en ${Y.dts}, es decir, al periodo elástico de la estructura.` : ''} Resultado final: <b>${fin.cas === 0 ? 'igual desplazamiento' : `caso ${fin.cas}`}</b>, ${Y.Ts} = ${fT(fin.T)} s, ${Y.dts} = <b>${fd(fin.dt)} m</b>, ${Y.mu} = ${f(fin.mu, 2)}.</div>
  ${warns(R, '6')}`);

  // ===== Paso 7
  const x7 = up(Math.max(p1.dend, 1.5 * rs.dt) * 1.02, 1.03);
  const fig7 = chart({ id: 'c7', x0: 0, x1: x7, y0: 0, y1: up(p1.Fmax, 1.2), xlabel: 'd_C [m]', ylabel: 'F_b [kN]',
    bands: [{ x0: 0, x1: rs.dt, color: 'var(--accent)', op: .08 }],
    series: [{ pts: cvPts, color: 'var(--muted)' }],
    vlines: [{ x: rs.dt, color: 'var(--accent)', dash: 'none', w: 2 }, { x: 1.5 * rs.dt, color: 'var(--amber)', dash: '6 3', w: 1.4 }, { x: p2.du, color: 'var(--bad)', dash: '6 3', w: 1.4 }, { x: p1.dend, color: 'var(--muted)', dash: '2 3' }],
    points: [{ x: Math.min(rs.dt, p1.dend), y: rs.Ft, color: 'var(--accent)', label: `d_t = ${fd(rs.dt)} m`, dx: 8, dy: 18 }],
    texts: [{ x: 1.5 * rs.dt, y: up(p1.Fmax, 1.2), t: `1.5·d_t = ${fd(1.5 * rs.dt)} m`, color: 'var(--amber)', dx: 4, dy: 30 }, { x: p2.du, y: up(p1.Fmax, 1.2), t: `d_u = ${fd(p2.du)} m`, color: 'var(--bad)', dx: 4, dy: 46 }],
    legend: [{ t: 'curva pushover F_b–d_C', color: 'var(--muted)' }, { t: 'desplazamiento objetivo d_t = Γ·d_t*', color: 'var(--accent)' }, { t: 'alcance mínimo del análisis 1.5·d_t', color: 'var(--amber)', dash: '6 3' }, { t: 'desplazamiento último d_u', color: 'var(--bad)', dash: '6 3' }, { t: 'final de la curva', color: 'var(--muted)', dash: '2 3' }], legendW: 250, legendLeft: rs.dt > 0.5 * x7 ? false : false });
  h += sec('7', '7', 'Vuelta a la estructura y comprobaciones', `UNE-EN 1998-1, anejo B (ec. B.13) y 4.3.3.4.2.3(1)${bridge ? ' · UNE-EN 1998-2, 4.2.5 y anejo H' : ' · UNE-EN 1998-3, 4.4.4.4'}`, `
  <div class="eq">${Y.dt} = Γ·${Y.dts} <span class="s">= ${f(Gam, 4)}·${fd(fin.dt)}</span> = <span class="res">${fd(rs.dt)} m</span><span class="tag">(B.13)</span></div>
  <p>El desplazamiento objetivo corresponde al punto de control. Con ${Y.dt} se leen en el modelo de cálculo los esfuerzos y deformaciones de cada elemento.</p>
  ${tw(['l:Comprobación', 'l:Expresión con valores', 'Resultado'], `
  <tr><td class="l">Alcance del análisis (requisito, no comprobación de capacidad)</td><td class="l">${v('d', 'C,fin')} ≥ 1.5·${Y.dt}: ${fd(p1.dend)} ${rs.reach ? '≥' : '&lt;'} 1.5·${fd(rs.dt)} = ${fd(1.5 * rs.dt)} m (4.3.3.4.2.3(1))</td><td>${pill(rs.reach)}</td></tr>
  <tr><td class="l">Capacidad global de desplazamiento</td><td class="l">${Y.dt} ≤ ${Y.du}: ${fd(rs.dt)} ${rs.okU ? '≤' : '&gt;'} ${fd(p2.du)} m · ${Y.du}/${Y.dt} = ${f(rs.ratioU, 2)}</td><td>${pill(rs.okU)}</td></tr>
  <tr><td class="l">Cortante en base en ${Y.dt}</td><td class="l">${Y.Fb}(${Y.dt})${rs.dt > p1.dend ? ' (fuera de la curva: se toma el último punto)' : ''}</td><td>${fF(rs.Ft)} kN</td></tr>
  <tr><td class="l">Desplazamiento de plastificación de la bilineal</td><td class="l">${v('d', 'y')} = Γ·${Y.dy} = ${f(Gam, 4)}·${fd(fin.dy)}</td><td>${fd(rs.dy)} m</td></tr>
`)}
  <h3>Comparación de los dos criterios</h3>
  ${tw(['l:Criterio', 'l:Expresión', 'T* [s]', 'd<sub>t</sub>* [m]', 'd<sub>t</sub> [m]', 'l:Uso en esta memoria'], `
  <tr${R.met === 'n2' ? ' class="hl"' : ''}><td class="l">N2 · EN 1998-1, anejo B (normativo por AN.3)</td><td class="l">caso ${R.cmp.n2.fin.cas}${I.iterate ? ', con iteración' : ''}</td><td>${fT(R.cmp.n2.fin.T)}</td><td>${fd(R.cmp.n2.fin.dt)}</td><td>${fd(R.cmp.n2.dt)}</td><td class="l">${R.met === 'n2' ? 'elegido' : 'comparación'}</td></tr>
  <tr${R.met === 'igual' ? ' class="hl"' : ''}><td class="l">Igual desplazamiento · EN 1998-2, anejo H (informativo)</td><td class="l">${Y.dts} = ${Y.det}, rigidez de la primera bilineal</td><td>${fT(R.cmp.igual.fin.T)}</td><td>${fd(R.cmp.igual.fin.dt)}</td><td>${fd(R.cmp.igual.dt)}</td><td class="l">${R.met === 'igual' ? 'elegido' : 'comparación'}</td></tr>`)}
  <div class="interp">${(() => { const a = R.cmp.n2.dt, c = R.cmp.igual.dt, r = a / c - 1; return Math.abs(r) < 0.02 ? `Los dos criterios dan prácticamente lo mismo (diferencia del ${pc(Math.abs(r))} %): el periodo es medio o largo, o la estructura no plastifica, y ambos aplican la regla de igual desplazamiento.` : r > 0 ? `El N2 da un ${pc(r)} % más que el criterio de igual desplazamiento${R.cmp.n2.fin.cas === 3 ? ': en periodo corto con plastificación (caso 3) el N2 amplifica la demanda, y el criterio del anejo H queda del lado de la inseguridad' : ' por la diferencia de periodo entre la bilineal iterada y la primera'}.` : `El criterio de igual desplazamiento da un ${pc(-r)} % más que el N2, porque usa el periodo de la primera bilineal, más largo que el de la bilineal iterada del N2.`; })()}</div>
  ${fig(fig7, 'Comprobaciones globales sobre la curva pushover: desplazamiento objetivo d_t (banda azul hasta d_t), alcance mínimo del análisis 1.5·d_t y desplazamiento último d_u.')}
  <div class="interp">${rs.okU ? `La estructura alcanza la demanda: ${Y.du} es ${f(rs.ratioU, 2)} veces ${Y.dt}.` : `La estructura no alcanza la demanda: ${Y.dt} supera ${Y.du} en un ${pc(rs.dt / p2.du - 1)} %.`} ${rs.reach ? 'La curva llega más allá de 1.5·d_t, como pide la norma.' : 'La curva no llega a 1.5·d_t: hay que prolongar el análisis pushover.'} ${rs.dt <= rs.dy ? `${Y.dt} ≤ ${v('d', 'y')}: la estructura no plastifica con el sismo de cálculo.` : `En ${Y.dt} la estructura ha plastificado (${Y.mu} = ${f(fin.mu, 2)}).`}</div>
  <h3>Comprobaciones locales (fuera de la app)</h3>
  <ul><li>Elementos y mecanismos <b>dúctiles</b>: deformaciones en ${Y.dt} frente a su capacidad, p. ej. giro de rótula θ ≤ θ<sub>u</sub>${bridge ? ' (EN 1998-2, H.3 y ec. 4.20)' : ' (EN 1998-3, anejos A a C)'}.</li>
  <li>Elementos y mecanismos <b>frágiles</b> (cortante, nudos${bridge ? ', cimentación' : ''}): fuerzas en ${Y.dt} frente a su resistencia${bridge ? ' (EN 1998-2, H.5)' : ''}.</li>
  ${bridge ? '<li>Tablero sin plastificación significativa y sin levantamiento de todos los apoyos de un mismo soporte antes de d<sub>t</sub> (EN 1998-2, H.4).</li>' : '<li>Derivas entre plantas.</li>'}
  <li>Un elemento puede fallar en ${Y.dt} aunque la curva global tenga margen.</li></ul>
  ${warns(R, '7')}`);

  // ===== Paso 8
  const L8 = R.p8;
  const lsC = { DL: 'var(--sky)', SD: 'var(--coral)', NC: 'var(--violet)' };
  const x8 = up(Math.max(p1.dend, ...L8.map(x => x.dt)) * 1.02, 1.03);
  const fig8 = chart({ id: 'c8', x0: 0, x1: x8, y0: 0, y1: up(p1.Fmax, 1.2), xlabel: 'd_C [m]', ylabel: 'F_b [kN]',
    series: [{ pts: cvPts, color: 'var(--muted)' }],
    vlines: L8.flatMap(x => [{ x: x.dt, color: lsC[x.k], dash: 'none', w: 1.8 }, { x: x.cap, color: lsC[x.k], dash: '2 3', w: 1.3 }]),
    points: L8.map(x => ({ x: x.dt, y: interpXY(p1.d, p1.Fb, Math.min(x.dt, p1.dend)), color: lsC[x.k] })),
    texts: L8.map((x, i) => ({ x: x.dt, y: p1.Fmax * (0.42 - 0.12 * i), t: `${x.k}: d_t = ${fd(x.dt)} m`, color: lsC[x.k], dx: 6 })),
    legend: [{ t: 'curva pushover F_b–d_C', color: 'var(--muted)' }, ...L8.map(x => ({ t: `${x.k}: d_t (continua) y límite global (puntos)`, color: lsC[x.k] }))], legendW: 270 });
  const reqLS = bridge ? 'En puentes la EN 1998-3 no es de aplicación directa: la tabla se da por analogía.' : (['III', 'IV'].includes(p7.cls) ? `Clase de importancia ${p7.cls}: el Anexo Nacional de la EN 1998-3 exige comprobar <b>DL, SD y NC</b> (AN.2, 2.1(2)P).` : `Clase de importancia ${p7.cls}: el Anexo Nacional de la EN 1998-3 exige comprobar solo <b>SD</b> (AN.2, 2.1(2)P).`);
  h += sec('8', '8', 'Desplazamiento objetivo por estado límite', 'UNE-EN 1998-3, 2.1 y 2.2 con su Anexo Nacional · UNE-EN 1998-1, 2.1(4) nota', `
  <p>La EN 1998-3 define tres estados límite, cada uno con un periodo de retorno de la acción sísmica (2.1(3)P; el Anexo Nacional adopta los recomendados). La app repite el cálculo completo (${R.met === 'igual' ? 'criterio de igual desplazamiento' : 'N2'}), con la misma curva, bilineal y opciones, para cada nivel de acción. La aceleración se escala con el periodo de retorno según la nota de 2.1(4) de la EN 1998-1: ${Y.ag}(${v('T', 'R')}) = ${Y.gI}·${Y.agR}·(${v('T', 'R')}/475)<sup>1/3</sup>; el factor de suelo ${Y.S} se recalcula para cada ${Y.ag}. ${reqLS}</p>
  ${tw(['l:Estado límite', 'T<sub>R</sub> [años]', 'l:Probabilidad', 'a<sub>g</sub> [g]', 'S', 'T* [s]', 'Caso', 'μ', 'd<sub>t</sub> [m]', 'l:Límite global orientativo', 'l:Resultado'], L8.map(x => `<tr><td class="l">${lsCell(x.k)}</td><td>${x.TR}</td><td class="l">${x.P}</td><td>${f(x.ag, 4)}</td><td>${f(x.S, 3)}</td><td>${fT(x.T)}</td><td>${casName(x.cas)}</td><td>${f(x.mu, 2)}</td><td>${fd(x.dt)}</td><td class="l">${x.k === 'DL' ? `${Y.dt} ≤ ${v('d', 'y')} = Γ·${Y.dy} = ${fd(x.cap)} m` : x.k === 'SD' ? `${Y.dt} ≤ ¾·${Y.du} = ${fd(x.cap)} m` : `${Y.dt} ≤ ${Y.du} = ${fd(x.cap)} m`}</td><td class="l">${pill(x.ok)}${x.reach ? '' : ' · la curva no llega a 1.5·d<sub>t</sub>'}</td></tr>${lsReq(x.k, 11)}`).join(''))}
  ${fig(fig8, 'Desplazamientos objetivo de los tres estados límite sobre la curva pushover (líneas continuas) y límites globales orientativos de cada uno (líneas de puntos, mismo color).')}
  <div class="interp">${L8.every(x => x.ok) ? 'Con los límites globales orientativos se cumplen los tres estados límite.' : `No se cumple${L8.filter(x => !x.ok).length > 1 ? 'n' : ''} el límite global orientativo de ${L8.filter(x => !x.ok).map(x => `${x.k} (${LS[x.k].name.toLowerCase()})`).join(' y ')}.`} Los límites globales son un criterio propio de la app (el de DL, la plastificación de la bilineal; el de SD, ¾ de ${Y.du} por analogía con θ<sub>SD</sub> = ¾·θ<sub>u</sub> de la EN 1998-3, anejo A); la comprobación reglamentaria es local, elemento a elemento, con el ${Y.dt} de cada estado límite.</div>`);

  // ===== Conclusiones
  h += sec('C', 'C', 'Conclusiones', 'Resumen de resultados generado con reglas programadas', `
  <p><b>Proyecto:</b> ${projTxt}<br><b>Elemento:</b> ${elemTxt} · dirección ${dirTxt}</p>
  ${tw(['l:Magnitud', 'Valor'], `
  <tr><td class="l">Sistema equivalente: ${Y.ms} · Γ · ${Y.es}</td><td>${f(ms, 1)} t · ${f(Gam, 3)} · ${p2.es != null ? f(p2.es, 3) : '—'}</td></tr>
  <tr><td class="l">Bilineal final: ${Y.Fy} · ${Y.dy} · ${Y.Ts}</td><td>${fF(fin.Fy)} kN · ${fd(fin.dy)} m · ${fT(fin.T)} s</td></tr>
  <tr><td class="l">Acción: ${Y.ag} · terreno · ${Y.TC}</td><td>${f(p7.ag, 4)} g · ${p7.soil} · ${fT(sp.TC)} s</td></tr>
  <tr><td class="l">Criterio · ${Y.qu} · ${Y.mu}</td><td>${fin.cas === 0 ? 'igual desplazamiento (EN 1998-2, H.1)' : `N2, caso ${fin.cas} del anejo B.5`} · ${f(fin.qu, 2)} · ${f(fin.mu, 2)}</td></tr>
  <tr class="hl"><td class="l">Desplazamiento objetivo ${Y.dt} (sismo de 475 años)</td><td>${fd(rs.dt)} m</td></tr>
  <tr><td class="l">${Y.dt} ≤ ${Y.du} = ${fd(p2.du)} m</td><td>${pill(rs.okU)}</td></tr>
  <tr><td class="l">Curva hasta 1.5·${Y.dt}</td><td>${pill(rs.reach)}</td></tr>
  ${L8.map(x => `<tr><td class="l">${lsCell(x.k)} · ${Y.dt} = ${fd(x.dt)} m (orientativo)</td><td>${pill(x.ok)}</td></tr>`).join('')}`)}
  <div class="interp">Con el sismo de cálculo (${f(p7.ag, 3)} g, terreno ${p7.soil}) el ${bridge ? 'puente' : 'edificio'} en dirección ${dirTxt} tiene un periodo equivalente ${Y.Ts} = ${fT(fin.T)} s (${fin.cas === 0 ? 'criterio de igual desplazamiento' : `N2, caso ${fin.cas}`}) y un desplazamiento objetivo en el punto de control ${Y.dt} = ${fd(rs.dt)} m. ${rs.okU ? `La curva tiene margen: ${Y.du} = ${fd(p2.du)} m, ${f(rs.ratioU, 2)} veces la demanda.` : `La curva no tiene capacidad suficiente: ${Y.du} = ${fd(p2.du)} m &lt; ${Y.dt}.`} ${rs.reach ? '' : 'Antes de dar el resultado por bueno hay que prolongar el pushover hasta 1.5·d_t. '}${I.mat === 'fabrica' ? 'Al ser elementos de fábrica, el resultado es orientativo si el mecanismo es el cabeceo. ' : ''}Falta la comprobación local de cada elemento con ${Y.dt}${I.pat === 'modal' ? ' y repetir el cálculo con el patrón uniforme' : ' y repetir el cálculo con el patrón modal'} (se toma el resultado más desfavorable).</div>`);

  } else {
    h += sec('E', 'E', 'Sin acción sísmica', 'UNE-EN 1998-1, AN.2 (3.2.1(2)) y AN.5', `
  <p>${Y.agR} = 0: ${I.siteMode === 'coords' ? `el emplazamiento está fuera de la malla AN.5 (el punto más próximo está a ${f(hz.dmin, 0)} km). La malla del Anexo Nacional no tiene puntos donde la aceleración es despreciable` : 'se ha introducido a mano'}. No hay acción sísmica que considerar: no se calcula el desplazamiento objetivo (pasos 5 a 8).</p>
  <div class="interp">Los pasos 1 a 4 describen la capacidad de la estructura (curva, sistema equivalente, bilineal y periodo ${Y.Ts} = ${fT(p5.T)} s), que no depende del emplazamiento.</div>`);
  }
  // ===== Anejo
  h += sec('A', 'A', 'Anejo', 'Estados límite, glosario, expresiones utilizadas, criterios propios y referencias', `
  <h3>Estados límite</h3>
  ${tw(['l:Sigla', 'l:Nombre (EN 1998-3, 2.1)', 'l:Significado', 'l:Periodo de retorno recomendado (AN: se adoptan)', 'l:Equivalente en EN 1998-1 / NTC 2018'], `
  <tr><td class="l">DL</td><td class="l">${LS.DL.name}</td><td class="l">${LS.DL.def} Se exige ${LS.DL.req}.</td><td class="l">225 años (20 % en 50 años)</td><td class="l">Limitación de daño (EN 1998-1, 95 años) · SLD</td></tr>
  <tr><td class="l">SD</td><td class="l">${LS.SD.name}</td><td class="l">${LS.SD.def} Se exige ${LS.SD.req}.</td><td class="l">475 años (10 % en 50 años)</td><td class="l">No colapso (EN 1998-1 y EN 1998-2) · SLV</td></tr>
  <tr><td class="l">NC</td><td class="l">${LS.NC.name}</td><td class="l">${LS.NC.def} Se exige ${LS.NC.req}.</td><td class="l">2475 años (2 % en 50 años)</td><td class="l">SLC</td></tr>`)}
  <h3>Glosario</h3>
  <dl class="gl">
  <dt>m<sub>i</sub>, M</dt><dd>Masa i del modelo (planta, tablero, tramo de pila); masa total M = Σ m<sub>i</sub> [t]</dd>
  <dt>Φ<sub>i</sub></dt><dd>Desplazamiento normalizado de la masa i, con Φ = 1 en el punto de control [—]</dd>
  <dt>C, d<sub>C</sub></dt><dd>Punto de control (cubierta en edificios; c.d.g. del tablero en puentes) y su desplazamiento; d<sub>n</sub> en el anejo B [m]</dd>
  <dt>F<sub>b</sub></dt><dd>Cortante en base de la estructura real [kN]</dd>
  <dt>K<sub>0</sub></dt><dd>Rigidez del primer tramo de la curva pushover [kN/m]</dd>
  <dt>m*, Γ, e*</dt><dd>Masa del sistema equivalente [t]; factor de transformación (de participación) [—]; fracción de masa participante e* = Γ·m*/M [—]</dd>
  <dt>F*, d*, a*</dt><dd>Fuerza [kN], desplazamiento [m] y aceleración a* = F*/m* [m/s²] del sistema equivalente</dd>
  <dt>F<sub>y</sub>*, d<sub>y</sub>*, a<sub>y</sub>*</dt><dd>Fuerza, desplazamiento y aceleración de plastificación de la bilineal [kN, m, m/s²]</dd>
  <dt>d<sub>m</sub>*, E<sub>m</sub>*</dt><dd>Desplazamiento al formarse el mecanismo plástico [m]; energía de deformación real hasta d<sub>m</sub>* [kN·m]</dd>
  <dt>d<sub>u</sub>, d<sub>u</sub>*</dt><dd>Desplazamiento último real y del sistema equivalente [m]</dd>
  <dt>k*, T*</dt><dd>Rigidez de la rama elástica de la bilineal [kN/m]; periodo del sistema equivalente [s]</dd>
  <dt>S<sub>e</sub>(T), S<sub>De</sub>(T)</dt><dd>Espectro elástico de aceleración [m/s²] y de desplazamiento [m]</dd>
  <dt>a<sub>gR</sub>, a<sub>g</sub>, γ<sub>I</sub></dt><dd>Aceleración de referencia en terreno A [g]; aceleración de cálculo a<sub>g</sub> = γ<sub>I</sub>·a<sub>gR</sub> [g]; factor de importancia [—]</dd>
  <dt>K, M<sub>w</sub></dt><dd>Coeficiente de contribución (AN.5) [—]; magnitud asociada (informativa)</dd>
  <dt>C, S, v<sub>s,30</sub></dt><dd>Coeficiente del terreno (AN) [—]; factor de suelo [—]; velocidad media de las ondas de cortante en los 30 m superiores [m/s]</dd>
  <dt>T<sub>B</sub>, T<sub>C</sub>, T<sub>D</sub>, T<sub>E</sub>, T<sub>F</sub></dt><dd>Periodos de esquina del espectro (T<sub>E</sub> y T<sub>F</sub>: anejo A) [s]</dd>
  <dt>η, ξ</dt><dd>Corrección por amortiguamiento [—]; amortiguamiento [%]</dd>
  <dt>d<sub>et</sub>*</dt><dd>Desplazamiento objetivo del sistema equivalente si fuera indefinidamente elástico [m]</dd>
  <dt>q<sub>u</sub></dt><dd>Relación entre la aceleración de la estructura con comportamiento elástico ilimitado y la de la estructura con resistencia limitada [—]</dd>
  <dt>μ, R<sub>μ</sub></dt><dd>Ductilidad movilizada μ = d<sub>t</sub>*/d<sub>y</sub>*; factor de reducción por ductilidad [—]</dd>
  <dt>d<sub>t</sub>*, d<sub>t</sub></dt><dd>Desplazamiento objetivo del sistema equivalente y de la estructura real [m]</dd>
  <dt>d<sub>E</sub></dt><dd>Desplazamiento del punto de referencia del tablero en un análisis espectral lineal con q = 1 (EN 1998-2, H.1) [m]</dd>
  <dt>T<sub>R</sub></dt><dd>Periodo de retorno de la acción sísmica [años]</dd>
  <dt>DL, SD, NC</dt><dd>Estados límite de limitación de daños, daños significativos y proximidad al colapso (EN 1998-3)</dd></dl>
  <h3>Expresiones utilizadas</h3>
  ${tw(['l:Paso', 'l:Expresión', 'l:Referencia'], [
    ['0', 'a<sub>gR</sub>, K: valor del punto (a); Σ(a<sub>gR,j</sub>/d<sub>j</sub>)/Σ(1/d<sub>j</sub>) con 2 puntos sobre meridiano o paralelo (b) o con los 4 más próximos (c)', 'UNE-EN 1998-1, AN.2, 3.2.1(2); AN.5'],
    ['1', 'F<sub>i</sub> = m<sub>i</sub>·Φ<sub>i</sub> (modal) · F<sub>i</sub> ∝ m<sub>i</sub> (uniforme) · Φ<sub>C</sub> = 1', 'EN 1998-1, 4.3.3.4.2.2; anejo B.1 (B.1)' + (bridge ? '; EN 1998-2, H.2 (H.3)–(H.6)' : '')],
    ['2', 'm* = Σ m<sub>i</sub>Φ<sub>i</sub> · Γ = m*/Σ m<sub>i</sub>Φ<sub>i</sub>² · F* = F<sub>b</sub>/Γ · d* = d<sub>C</sub>/Γ', 'Anejo B.2, (B.2)–(B.5)'],
    ['2', 'e* = Γ·m*/M · a* = F*/m*', 'Informativas'],
    ['3', 'F<sub>y</sub>* = F*(d<sub>m</sub>*) · E<sub>m</sub>* ≈ Σ ½(F<sub>k</sub>* + F<sub>k+1</sub>*)(d<sub>k+1</sub>* − d<sub>k</sub>*) · d<sub>y</sub>* = 2(d<sub>m</sub>* − E<sub>m</sub>*/F<sub>y</sub>*)', 'Anejo B.3, (B.6)'],
    ['4', 'k* = F<sub>y</sub>*/d<sub>y</sub>* · T* = 2π√(m*d<sub>y</sub>*/F<sub>y</sub>*)', 'Anejo B.4, (B.7)'],
    ['E', 'a<sub>g</sub> = γ<sub>I</sub>a<sub>gR</sub> · C = (800/v<sub>s,30</sub>)<sup>0.465</sup> · S(a<sub>g</sub>) · T<sub>C</sub> = K/4 (A), KC/4 (B, C), K/2 (D) · T<sub>B</sub> = T<sub>C</sub>/5 · T<sub>D</sub> = 2.0 s', 'EN 1998-1, 3.2.1(3); AN.2, tabla AN.2'],
    ['E', 'η = √(10/(5 + ξ)) ≥ 0.55 · S<sub>e</sub>(T), ecs. (3.2)–(3.5) · S<sub>De</sub> = S<sub>e</sub>(T/2π)²; T &gt; 4 s: anejo A', 'EN 1998-1, 3.2.2.2, (3.2)–(3.7); anejo A'],
    ['5', 'd<sub>et</sub>* = S<sub>e</sub>(T*)(T*/2π)² · q<sub>u</sub> = S<sub>e</sub>(T*)m*/F<sub>y</sub>*', 'Anejo B.5, (B.8) y (B.11)'],
    ['5', 'T* ≥ T<sub>C</sub>: d<sub>t</sub>* = d<sub>et</sub>* · T* &lt; T<sub>C</sub>, q<sub>u</sub> ≤ 1: d<sub>t</sub>* = d<sub>et</sub>* · q<sub>u</sub> &gt; 1: d<sub>t</sub>* = (d<sub>et</sub>*/q<sub>u</sub>)[1 + (q<sub>u</sub> − 1)T<sub>C</sub>/T*] · d<sub>t</sub>* ≤ 3d<sub>et</sub>*', 'Anejo B.5, (B.9), (B.10), (B.12)'],
    ['5', 'R<sub>μ</sub> = (μ − 1)T/T<sub>C</sub> + 1 (T &lt; T<sub>C</sub>); R<sub>μ</sub> = μ (T ≥ T<sub>C</sub>) · μ = d<sub>t</sub>*/d<sub>y</sub>* · S<sub>a</sub> = S<sub>e</sub>/R<sub>μ</sub>, S<sub>d</sub> = (μ/R<sub>μ</sub>)S<sub>De</sub>', 'Vidic, Fajfar y Fischinger (1994); Fajfar (2000)'],
    ['6', 'd<sub>m</sub>* ← d<sub>t</sub>*, F<sub>y</sub>* ← F*(d<sub>t</sub>*) hasta |d<sub>t,i+1</sub>* − d<sub>t,i</sub>*|/d<sub>t,i</sub>* &lt; tolerancia', 'Anejo B.5, procedimiento iterativo (opcional)'],
    ['7', 'd<sub>t</sub> = Γ·d<sub>t</sub>* · curva hasta 1.5·d<sub>t</sub> · d<sub>t</sub> ≤ d<sub>u</sub>', 'Anejo B (B.13); EN 1998-1, 4.3.3.4.2.3(1)'],
    ['5', 'd<sub>t</sub>* = d<sub>et</sub>* para cualquier T* (igual desplazamiento) · d<sub>T</sub> = d<sub>E</sub> ≈ Γ·S<sub>De</sub>(T*)', 'EN 1998-2, H.1 (H.1)–(H.2); aplicación con un modo'],
    ['8', 'a<sub>g</sub>(T<sub>R</sub>) = γ<sub>I</sub>·a<sub>gR</sub>·(T<sub>R</sub>/475)<sup>1/3</sup> · T<sub>R</sub> = 225, 475, 2475 años', 'EN 1998-1, 2.1(4) nota (k = 3); EN 1998-3, 2.1(3)P y AN']
  ].map(r => `<tr><td class="l">${r[0]}</td><td class="l m">${r[1]}</td><td class="l">${r[2]}</td></tr>`).join(''))}
  <h3>Notas sobre criterios propios</h3>
  <ol>
  <li><b>Emplazamientos fuera de la malla AN.5.</b> La malla del Anexo Nacional no tiene puntos donde la aceleración es despreciable. Un emplazamiento a más de 12 km del punto más próximo (dentro de la malla la distancia máxima es de unos 8 km) se considera fuera de ella y se toma a<sub>gR</sub> = 0: no hay acción sísmica. Si la celda de 0.1° que contiene el punto no tiene sus cuatro esquinas, se avisa de que está en el borde.</li>
  <li><b>m* y Γ del programa de cálculo.</b> Se pueden introducir directamente en lugar de la tabla de masas. Deben corresponder a la misma forma del patrón de cargas y al mismo punto de control que la curva pushover.</li>
  <li><b>Distancias de la interpolación</b> en km, con la aproximación equirrectangular local (1° de latitud = 110.57 km; 1° de longitud = 111.32·cos φ km).</li>
  <li><b>Desplazamiento último d<sub>u</sub>:</b> por defecto, donde el cortante cae al 80 % del máximo tras el pico (porcentaje editable). La norma no lo fija. Si la curva no cae tanto, se toma el último punto, que es una cota inferior de la capacidad.</li>
  <li><b>d<sub>m</sub>*:</b> por defecto, el desplazamiento del cortante máximo, que se interpreta como la formación del mecanismo plástico (anejo B.3). No se identifica con d<sub>u</sub>*.</li>
  <li><b>Iteración:</b> se aplica tal como la describe el anejo B, incluso si la respuesta es elástica. En ese caso la bilineal se ajusta a la rigidez secante en d<sub>t</sub>* y el periodo tiende al elástico. Tolerancia por defecto del 5 % (la norma no la fija) y máximo de 20 ciclos.</li>
  <li><b>Estados límite (paso 8):</b> la aceleración de cada periodo de retorno se escala desde la de 475 años con el exponente 1/3 de la nota de 2.1(4) de la EN 1998-1, conservando γ<sub>I</sub>. Los límites globales (DL: d<sub>t</sub> ≤ Γ·d<sub>y</sub>* de la primera bilineal; SD: d<sub>t</sub> ≤ ¾·d<sub>u</sub>; NC: d<sub>t</sub> ≤ d<sub>u</sub>) son orientativos. La EN 1998-3 comprueba elemento a elemento.</li>
  <li><b>Criterio de igual desplazamiento (EN 1998-2, anejo H).</b> La app lo aplica con un modo, d<sub>t</sub>* = d<sub>et</sub>* = S<sub>De</sub>(T*), con T* de la primera bilineal (rigidez eficaz, sin iteración). El anejo H obtiene d<sub>E</sub> de un análisis multimodal con q = 1, la rigidez eficaz de los elementos dúctiles (2.3.6.1) y la combinación E<sub>x</sub> + 0.3·E<sub>y</sub>. Siempre se muestra la comparación con el N2.</li>
  <li><b>Elementos de fábrica:</b> si el mecanismo es el cabeceo, el N2 es orientativo (sistema no elastoplástico, sin periodo propio). Para ese caso está la app de análisis cinemático según la Circolare 2019.</li></ol>
  <h3>Referencias</h3>
  <p>UNE-EN 1998-1:2018 (versión corregida 2022), Eurocódigo 8, parte 1, con Anexo Nacional. · UNE-EN 1998-2:2018, Eurocódigo 8, parte 2: puentes, con Anexo Nacional. · UNE-EN 1998-3:2018, Eurocódigo 8, parte 3: evaluación y adecuación sísmica de edificios, con Anexo Nacional. · Fajfar, P. (2000), A nonlinear analysis method for performance-based seismic design, Earthquake Spectra 16(3), 573–592. · Vidic, T., Fajfar, P. y Fischinger, M. (1994), Consistent inelastic design spectra: strength and displacement, Earthquake Engineering and Structural Dynamics 23, 507–521. · Circolare 21 gennaio 2019, n. 7 C.S.LL.PP., C8.7.1.2.1.</p>`);

  const main = document.getElementById('main'); main.innerHTML = h;
  main.querySelectorAll('.interp,.warn,.cap,td,th,li,p,h2,h3').forEach(el => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const n of nodes) { if (!/[A-Za-zλθΔγμ]_[A-Za-z0-9áéíóú]|[a-zA-Z₀-₉)]\*/.test(n.nodeValue) || n.parentElement.closest('svg,sub,sup')) continue;
      const sp_ = document.createElement('span'); sp_.innerHTML = hT(n.nodeValue.replace(/&/g, '&amp;').replace(/</g, '&lt;')); n.replaceWith(sp_); }
  });
  const cv = document.getElementById('map');
  if (cv) drawMap(cv, GRID, R);
  window.__R = R;
}

// ---------- CSV de las curvas
function exportCsv() {
  const R = window.__R; if (!R) return;
  const L = ['d_C [m];F_b [kN];d* [m];F* [kN];a* [m/s2]'];
  R.p1.d.forEach((x, i) => L.push([x, R.p1.Fb[i], R.p2.ds[i], R.p2.Fs[i], R.p2.as[i]].map(y => (+y).toPrecision(8)).join(';')));
  const blob = new Blob([L.join('\n')], { type: 'text/csv' }), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'Curvas_N2_' + ((R.inp.elem || 'elemento').replace(/[^A-Za-z0-9áéíóúñÁÉÍÓÚÑ]+/g, '_').slice(0, 50)) + '.csv';
  document.body.appendChild(a); a.click(); a.remove();
}

function run() {
  try { const R = computeN2(readInputs(), GRID); render(R); }
  catch (e) { document.getElementById('main').innerHTML = `<section><h2>Revisa los datos</h2><p>No se ha podido calcular con los datos actuales: ${hT(esc(e.message))}</p></section>`; console.error(e); }
}
