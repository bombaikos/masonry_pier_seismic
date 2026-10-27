// Pruebas de funcionamiento de la interfaz (N2 y cabeceo): sin scroll de página, pestañas, segmentados, campos en gris,
// Archivo (guardar y abrir .json devuelven los mismos resultados), orden de los pasos para el informe y veredicto.
// Uso: node pruebas/interfaz.js
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), os = require('os');
const RAIZ = path.resolve(__dirname, '..');
let mal = 0;
const ok = (c, m) => { if (!c) { mal++; console.log('  FALLO:', m); } else console.log('  ok:', m); };
const APPS = [
  { n: 'N2', url: 'n2/index.html', sellos: 3, seg: { id: 'tipo', valor: 'edificio' }, apagado: { id: 'agR', activa: ['siteMode', 'manual'] }, cambio: { id: 'xi', v: '8' }, pasos: 12 },
  { n: 'cabeceo', url: 'cabeceo/index.html', sellos: 4, seg: { id: 'deckFixed', valor: '0' }, apagado: null, cambio: { id: 'H', v: '32' } },
];
(async () => {
  const b = await chromium.launch();
  for (const A of APPS) {
    console.log('\n== ' + A.n);
    for (const [w, h] of [[1280, 800], [1366, 768], [1024, 720]]) {
      const p = await b.newPage({ viewport: { width: w, height: h } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
      await p.goto('file://' + path.join(RAIZ, A.url)); await p.waitForTimeout(400);
      const sc = await p.evaluate(() => [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth]);
      if (w >= 1024) ok(sc[0] <= sc[1] && sc[2] <= sc[3], `sin scroll de página a ${w}×${h} (${sc})`);
      ok(errs.length === 0, `sin errores de JS a ${w}×${h} ${errs.join('|')}`); await p.close();
    }
    const p = await b.newPage({ viewport: { width: 1280, height: 800 }, acceptDownloads: true }); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + path.join(RAIZ, A.url)); await p.waitForTimeout(400);
    // barra
    ok(await p.$('#pantalla-completa') !== null, 'botón de pantalla completa en la barra');
    ok((await p.$$eval('.menu-boton', x => x.map(y => y.textContent))).join() === 'Archivo,Ayuda', 'menús Archivo y Ayuda');
    const der = await p.evaluate(() => { const r = document.getElementById('pantalla-completa').getBoundingClientRect(); return r.right > innerWidth - 40; });
    ok(der, 'pantalla completa a la derecha del todo');
    // pestañas de datos: todas muestran su panel
    const nd = await p.$$eval('.pestanas-datos button', x => x.length);
    for (let i = 0; i < nd; i++) { await p.click(`.pestanas-datos button[data-i="${i}"]`); const v = await p.$$eval('.panel-datos.activo .caja input,.panel-datos.activo .seg,.panel-datos.activo select,.panel-datos.activo .gt-w', x => x.length); if (!v) ok(false, 'pestaña de datos ' + i + ' vacía'); }
    ok(nd >= 3, `${nd} pestañas de datos`);
    // pestañas de resultados
    const nr = await p.$$eval('.tabs button', x => x.length);
    for (let i = 0; i < nr; i++) { await p.click(`.tabs button[data-i="${i}"]`); const n = await p.$$eval('.panel-res.activo > *', x => x.length); if (!n) ok(false, 'pestaña de resultados ' + i + ' vacía'); }
    ok(nr >= 6, `${nr} pestañas de resultados`);
    // gráficas: ninguna línea o relleno invisible (p. ej. por una variable CSS sin definir), en claro y oscuro
    for (const esq of ['light', 'dark']) {
      await p.emulateMedia({ colorScheme: esq });
      let svgs = 0; const malas = [];
      for (let i = 0; i < nr; i++) {
        await p.click(`.tabs button[data-i="${i}"]`);
        const r = await p.evaluate(() => { let t = 0; const o = []; document.querySelectorAll('.panel-res.activo svg').forEach(s => { if (!s.getBoundingClientRect().width) return; t++; s.querySelectorAll('path,line,polyline,rect,circle,polygon').forEach(e => { const c = getComputedStyle(e); if (c.stroke === 'none' && (c.fill === 'none' || c.fill === 'rgba(0, 0, 0, 0)') && !e.closest('defs,marker,clipPath')) o.push((e.closest('section') || {}).id + ' ' + (e.getAttribute('style') || '').slice(0, 50)); }); }); return [t, o]; });
        svgs += r[0]; malas.push(...r[1]);
      }
      ok(svgs >= 10 && malas.length === 0, `${svgs} gráficas con todas sus líneas visibles (${esq}) ${malas.slice(0, 3).join(' | ')}`);
      const sinDef = await p.evaluate(() => { const r = getComputedStyle(document.documentElement), usados = new Set(); document.documentElement.outerHTML.replace(/var\(\s*(--[a-z0-9-]+)\s*\)/g, (m, v) => usados.add(v)); return [...usados].filter(v => !r.getPropertyValue(v).trim()); });
      ok(sinDef.length === 0, `todas las variables CSS usadas están definidas (${esq}) ${sinDef.join(',')}`);
    }
    await p.emulateMedia({ colorScheme: 'light' }); await p.click('.tabs button[data-i="0"]');
    // veredicto
    ok((await p.$$('.veredicto .sello')).length === A.sellos, `veredicto con ${A.sellos} sellos`);
    // la pestaña activa sobrevive a un cambio de dato
    await p.click(`.tabs button[data-i="2"]`);
    await p.evaluate(([id, v]) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, [A.cambio.id, A.cambio.v]); await p.waitForTimeout(200);
    ok(await p.$eval('.tabs button.on', x => x.dataset.i) === '2', 'la pestaña de resultados activa se conserva al cambiar un dato');
    // segmentado: clic cambia el select oculto y recalcula
    const antes = await p.$eval('#main', x => x.textContent.length);
    await p.click(`.pestanas-datos button[data-i="0"]`);
    const sel = A.seg; await p.click(`.campo:has(#${sel.id}) .seg button[data-v="${sel.valor}"]`); await p.waitForTimeout(250);
    ok(await p.$eval('#' + sel.id, x => x.value) === sel.valor, `el segmentado cambia #${sel.id} a ${sel.valor}`);
    ok(await p.$eval(`.campo:has(#${sel.id}) .seg button.on`, x => x.dataset.v) === sel.valor, 'el segmentado marca la opción activa');
    // campos no aplicables en gris (N2)
    if (A.apagado) {
      await p.click(`.pestanas-datos button[data-i="3"]`);
      ok(await p.$eval('#' + A.apagado.id, x => x.disabled), `#${A.apagado.id} en gris y desactivado`);
      ok((await p.$eval(`.campo:has(#${A.apagado.id})`, x => x.title)).length > 5, 'el campo en gris explica qué falta');
    }
    // Archivo: guardar → cambiar → abrir restaura los mismos resultados
    const textoRes = () => p.evaluate(() => [...document.querySelectorAll('#main section[data-orden]')].map(s => s.textContent.replace(/\s+/g, ' ')).join('|'));
    const t0 = await textoRes();
    await p.click('.menu-boton'); const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-acc="guardar"]')]);
    const f = path.join(os.tmpdir(), 'prueba_' + A.n + '.json'); await dl.saveAs(f);
    const J = JSON.parse(fs.readFileSync(f)); ok(J.formato && J.datos && Object.keys(J.datos).length > 15, `guardar produce un .json con ${Object.keys(J.datos).length} datos`);
    // cambiar datos y abrir
    await p.evaluate(([id, v]) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, [A.cambio.id, '20']); await p.waitForTimeout(200);
    ok((await textoRes()) !== t0, 'cambiar un dato cambia los resultados');
    await p.setInputFiles('#f-abrir', f); await p.waitForTimeout(500);
    ok((await textoRes()) === t0, 'abrir el .json restaura exactamente los mismos resultados');
    // formato ajeno
    fs.writeFileSync(f + '.x', JSON.stringify({ formato: 'otra-app', datos: {} })); await p.setInputFiles('#f-abrir', f + '.x'); await p.waitForTimeout(200);
    ok((await p.$eval('#repStatus', x => x.textContent)).includes('No se ha podido abrir'), 'un .json de otra aplicación se rechaza con aviso');
    // Ctrl+S
    const [dl2] = await Promise.all([p.waitForEvent('download'), p.keyboard.press('Control+s')]); ok(!!dl2.suggestedFilename().endsWith('.json'), 'Ctrl+S guarda un .json');
    // pasos en orden para el informe Word
    const ord = await p.evaluate(() => Shell.secciones().map(s => s.id)); const orig = await p.evaluate(() => [...document.querySelectorAll('#main section[data-orden]')].sort((a, b) => a.dataset.orden - b.dataset.orden).map(s => s.id));
    ok(ord.length > 8 && ord.join() === orig.join(), `Shell.secciones() da los ${ord.length} pasos en orden`);
    // F1 abre la ayuda, Esc la cierra; Propiedades edita proyecto
    await p.keyboard.press('F1'); ok(await p.$eval('#dlg-ayuda', x => x.open), 'F1 abre la ayuda'); await p.keyboard.press('Escape'); ok(!(await p.$eval('#dlg-ayuda', x => x.open)), 'Esc cierra la ayuda');
    await p.click('#titulo-proy'); await p.fill('#dlg-prop #proj', 'Proyecto de prueba'); await p.waitForTimeout(200); await p.keyboard.press('Escape');
    ok((await p.$eval('#projTitle', x => x.textContent)) === 'Proyecto de prueba', 'Propiedades del proyecto cambia el título de la barra');
    ok(errs.length === 0, 'sin errores de JS durante las pruebas ' + errs.join('|'));
    await p.close();
  }
  await b.close(); console.log(mal ? `\nFALLO: ${mal} comprobaciones` : '\nTODO OK'); process.exit(mal ? 1 : 0);
})();
