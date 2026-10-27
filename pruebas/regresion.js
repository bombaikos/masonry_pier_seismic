// Prueba de regresión de la interfaz: mismos resultados antes y después de cambiar el diseño.
// Uso:  node pruebas/regresion.js capturar salida.json     (guarda el texto de cada paso en varios casos)
//       node pruebas/regresion.js comparar a.json b.json   (compara dos capturas)
// Los casos cambian datos por id de campo y leen el texto de cada <section id="p…">; no dependen del diseño.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const RAIZ = path.resolve(__dirname, '..');

const CASOS = {
  n2: { url: 'n2/index.html', casos: [
    { nombre: 'E1 puente hormigón', ej: 'E1' },
    { nombre: 'E2 pila de fábrica', ej: 'E2' },
    { nombre: 'E3 edificio rígido', ej: 'E3' },
    { nombre: 'E2 igual desplazamiento', ej: 'E2', set: { metodo: 'igual' } },
    { nombre: 'E2 a mano, ed. 2018', ej: 'E2', set: { siteMode: 'manual', agR: 0.12, K: 1.1, ed: '2018' } },
    { nombre: 'E2 ed. 2025, KL2, γSd 1.15', ej: 'E2', set: { ed: '2025', KL: '2', gSd: '1.15' } },
    { nombre: 'E1 dm último, du último, sin iteración', ej: 'E1', set: { dmCrit: 'last', duCrit: 'last', iterate: '0' } },
    { nombre: 'E3 clase III, ξ 8 %', ej: 'E3', set: { impClass: 'III', xi: 8, vs30: 200 } },
  ] },
  cabeceo: { url: 'cabeceo/index.html', casos: [
    { nombre: 'por defecto' },
    { nombre: 'transversal', set: { dir: 'T' } },
    { nombre: 'tablero deslizante', set: { deckFixed: '0' } },
    { nombre: 'junta en altura z = 20', set: { zJoint: '20' } },
    { nombre: 'a mano, KL2, γSd 1.15', set: { siteMode: 'manual', agR: 0.2, K: 1.2, KL: '2', gSd: '1.15' } },
    { nombre: 'pila baja, clase III', set: { H: 25, impClass: 'III', fShell: 8 } },
  ] },
};

async function capturar(salida) {
  const b = await chromium.launch(), res = {};
  for (const [app, cfg] of Object.entries(CASOS)) {
    res[app] = {};
    for (const c of cfg.casos) {
      const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
      const errs = []; p.on('pageerror', e => errs.push(e.message));
      await p.goto('file://' + path.join(RAIZ, cfg.url)); await p.waitForTimeout(300);
      if (c.ej) await p.evaluate(k => loadExample(k), c.ej);
      for (const [id, v] of Object.entries(c.set || {})) {
        await p.evaluate(([id, v]) => { const e = document.getElementById(id); e.value = String(v); e.dispatchEvent(new Event('input', { bubbles: true })); }, [id, v]);
      }
      await p.waitForTimeout(200);
      res[app][c.nombre] = await p.evaluate(() => {
        const o = {};
        document.querySelectorAll('#main section[id]').forEach(s => { o[s.id] = s.textContent.replace(/\s+/g, ' ').trim(); });
        return o;
      });
      res[app][c.nombre].__errores = errs;
      await p.close();
    }
  }
  await b.close(); fs.writeFileSync(salida, JSON.stringify(res, null, 1));
  let n = 0; for (const a of Object.values(res)) for (const c of Object.values(a)) n += Object.keys(c).length;
  console.log('capturados', n, 'bloques en', salida);
}

function comparar(fa, fb) {
  const A = JSON.parse(fs.readFileSync(fa)), B = JSON.parse(fs.readFileSync(fb)); let mal = 0, ok = 0;
  for (const app of Object.keys(A)) for (const caso of Object.keys(A[app])) {
    const a = A[app][caso], b = (B[app] || {})[caso] || {};
    for (const id of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (id === '__errores') { if ((b[id] || []).length) { mal++; console.log('ERROR JS', app, caso, b[id]); } continue; }
      if (a[id] === b[id]) ok++; else { mal++; console.log('DIFERENCIA', app, caso, 'paso', id); const x = a[id] || '', y = b[id] || ''; let i = 0; while (i < x.length && x[i] === y[i]) i++; console.log('   antes:', x.slice(Math.max(0, i - 40), i + 60)); console.log('   ahora:', y.slice(Math.max(0, i - 40), i + 60)); }
    }
  }
  console.log(mal ? `FALLO: ${mal} diferencias (${ok} bloques iguales)` : `TODO OK: ${ok} bloques idénticos`); process.exit(mal ? 1 : 0);
}
const [, , modo, x, y] = process.argv;
if (modo === 'capturar') capturar(x); else if (modo === 'comparar') comparar(x, y); else console.log('uso: capturar salida.json | comparar a.json b.json');
