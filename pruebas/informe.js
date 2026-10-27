// Compara el informe Word (texto de document.xml) de dos copias de la app. La librería docx se sirve desde un paquete local
// (en la app se descarga de jsDelivr). Uso: node pruebas/informe.js RUTA_REPO_A RUTA_REPO_B RUTA_docx/dist/index.iife.js
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs'), os = require('os'), cp = require('child_process');
const [, , A, B, LIB] = process.argv;
async function informe(repo, app, ej) {
  const b = await chromium.launch(), p = await b.newPage({ acceptDownloads: true });
  await p.route('**/docx@*/**', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(LIB) }));
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(repo, app, 'index.html')); await p.waitForTimeout(500);
  if (ej) await p.evaluate(k => loadExample(k), ej);
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), p.evaluate(() => document.getElementById('btnDocx').click())]);
  const f = path.join(os.tmpdir(), 'inf_' + Math.random().toString(36).slice(2) + '.docx'); await dl.saveAs(f); await b.close();
  const xml = cp.execSync(`unzip -p ${f} word/document.xml`, { maxBuffer: 1 << 28 }).toString();
  return { texto: xml.replace(/<w:instrText[^>]*>.*?<\/w:instrText>/g, '').match(/<w:t[ >][^<]*|<w:t>[^<]*/g).map(x => x.replace(/<w:t[^>]*>/, '')).join(' '), imagenes: (xml.match(/<pic:pic/g) || []).length, errs };
}
(async () => {
  let mal = 0;
  for (const [app, ej] of [['n2/', 'E2'], ['n2/', 'E1'], ['cabeceo/', null]]) {
    const a = await informe(A, app.replace('/', ''), ej), b = await informe(B, app.replace('/', ''), ej);
    const igual = a.texto === b.texto && a.imagenes === b.imagenes && !a.errs.length && !b.errs.length;
    if (!igual) mal++;
    console.log(igual ? 'ok  ' : 'DIF ', app, ej || '', `texto ${a.texto.length}/${b.texto.length} caracteres, imágenes ${a.imagenes}/${b.imagenes}`, a.errs.concat(b.errs).join('|'));
  }
  console.log(mal ? 'FALLO' : 'TODO OK'); process.exit(mal ? 1 : 0);
})();
