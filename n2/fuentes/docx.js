// ---------- informe Word (.docx) generado en el navegador a partir de la memoria mostrada
const LIGHT = { '--bg': '#ffffff', '--paper': '#ffffff', '--ink': '#1d2327', '--muted': '#5b646b', '--line': '#dcdad3', '--soft': '#eeede7', '--accent': '#1f7fbf', '--accent-soft': '#e4f0f9',
  '--coral': '#c4552c', '--amber': '#b27414', '--violet': '#6b62c9', '--sky': '#2a9d6f', '--ok': '#2e7d32', '--bad': '#b3261e', '--pier': '#d6d3c9', '--pier-line': '#6d6a62', '--brand': '#2b91cf', '--band': '#10283b' };
function loadDocxLib() {
  if (window.docx) return Promise.resolve(window.docx);
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/docx@9.6.1/dist/index.iife.js';
    s.onload = () => window.docx ? res(window.docx) : rej(new Error('La librería docx no se ha cargado')); s.onerror = () => rej(new Error('No se ha podido descargar la librería docx (¿sin conexión?)')); document.head.appendChild(s); });
}
function svgToPng(svg, widthPx = 1400) {
  return new Promise((res, rej) => {
    const clone = svg.cloneNode(true);
    let txt = new XMLSerializer().serializeToString(clone).replace(/var\((--[a-z-]+)\)/g, (m, k) => LIGHT[k] || '#000');
    if (!/xmlns=/.test(txt)) txt = txt.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    txt = txt.replace('<svg', '<svg style="font-family:Arial,Helvetica,sans-serif"');
    const vb = svg.viewBox.baseVal, ratio = vb && vb.width ? vb.height / vb.width : 0.6;
    const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = widthPx; c.height = Math.round(widthPx * ratio);
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(b => b.arrayBuffer().then(buf => res({ buf, w: c.width, h: c.height })), 'image/png'); };
    img.onerror = () => rej(new Error('No se pudo convertir una figura'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(txt);
  });
}
function canvasToPng(cv) { return new Promise(res => cv.toBlob(b => b.arrayBuffer().then(buf => res({ buf, w: cv.width, h: cv.height })), 'image/png')); }
function dataUrlToBuf(u) { const b = atob(u.split(',')[1]); const a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a.buffer; }

async function exportDocx(btn) {
  const status = document.getElementById('repStatus');
  const say = t => { if (status) status.textContent = t; };
  try {
    say('Preparando el informe…'); btn.disabled = true;
    const D = await loadDocxLib();
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, ImageRun, AlignmentType, ShadingType, BorderStyle, Footer, Header, PageNumber, LevelFormat, TableOfContents, PageBreak } = D;
    const FONT = 'Calibri', MATH = 'Cambria';
    const runsOf = (node, st = {}) => {
      const out = [];
      node.childNodes.forEach(n => {
        if (n.nodeType === 3) { const t = n.nodeValue.replace(/\s+/g, ' '); if (t) out.push(new TextRun({ text: t, font: st.math ? MATH : FONT, italics: !!st.i, bold: !!st.b, subScript: !!st.sub, superScript: !!st.sup, color: st.color, size: st.size })); return; }
        if (n.nodeType !== 1 || n.tagName === 'svg') return;
        const tg = n.tagName, s2 = { ...st };
        if (tg === 'SUB') s2.sub = true; if (tg === 'SUP') s2.sup = true;
        if (tg === 'I' || tg === 'EM') { s2.i = true; s2.math = true; }
        if (tg === 'B' || tg === 'STRONG' || n.classList.contains('res')) s2.b = true;
        if (n.classList.contains('n')) { out.push(...runsOf(n, s2)); out.push(new TextRun({ text: '  ', font: FONT })); return; }
        if (tg === 'BR') { out.push(new TextRun({ break: 1 })); return; }
        if (n.classList.contains('pill')) { s2.b = true; s2.color = n.classList.contains('ok') ? '2E7D32' : 'B3261E'; }
        out.push(...runsOf(n, s2));
      });
      return out;
    };
    const hRuns = n => runsOf({ childNodes: [...n.childNodes].filter(c => !(c.classList && c.classList.contains('n'))) });   // el número lo pone Word
    const P = (node, opt = {}) => new Paragraph({ children: runsOf(node, opt.st || {}), spacing: { after: 120 }, ...opt.p });
    const children = [];
    // portada
    const logoSrc = document.querySelector('header.top img')?.src;
    if (logoSrc) children.push(new Table({ width: { size: 9638, type: WidthType.DXA }, columnWidths: [9638], rows: [new TableRow({ children: [new TableCell({ width: { size: 9638, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, fill: '10283B', color: 'auto' },
      margins: { top: 200, bottom: 200, left: 240, right: 240 }, children: [new Paragraph({ children: [new ImageRun({ type: 'png', data: dataUrlToBuf(logoSrc), transformation: { width: 150, height: 58 } })] })] })] })] }));
    const I = readInputs();
    children.push(new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun('Método N2 · desplazamiento objetivo')] }));
    children.push(new Paragraph({ children: [new TextRun({ text: 'Proyecto: ', bold: true, font: FONT }), new TextRun({ text: I.proj || '—', font: FONT })] }));
    children.push(new Paragraph({ children: [new TextRun({ text: 'Elemento: ', bold: true, font: FONT }), new TextRun({ text: I.elem || '—', font: FONT })] }));
    children.push(new Paragraph({ children: [new TextRun({ text: 'Dirección: ', bold: true, font: FONT }), new TextRun({ text: I.tipo === 'puente' ? (I.dir === 'T' ? 'transversal' : 'longitudinal') : I.dir, font: FONT }), new TextRun({ text: '   ·   Fecha: ', bold: true, font: FONT }), new TextRun({ text: new Date().toLocaleDateString('es-ES'), font: FONT })] }));
    children.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: 'Análisis estático no lineal (pushover) y método N2.', font: FONT })] }));
    children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: 'Normas:', bold: true, font: FONT })] }));
    for (const nm of ['UNE-EN 1998-1:2018 (corr. 2022) con Anexo Nacional (acción sísmica)', ...(I.tipo === 'puente' ? ['UNE-EN 1998-2:2018'] : []), ...(I.ed === '2018' ? ['UNE-EN 1998-3:2018'] : I.ed === '2025' ? ['EN 1998-3:2025'] : ['UNE-EN 1998-3:2018', 'EN 1998-3:2025'])]) children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: nm, font: FONT })] }));
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(new TableOfContents('Índice', { hyperlink: true, headingStyleRange: '1-2' }));
    children.push(new Paragraph({ children: [new PageBreak()] }));
    const bd = { style: BorderStyle.SINGLE, size: 4, color: 'DCDAD3' };
    const figs = []; // promesas en orden
    let olInst = 0;   // cada lista numerada reinicia su cuenta
    for (const sec of document.querySelectorAll('#main > section')) {
      const walk = async el => {
        for (const n of el.children) {
          const tg = n.tagName, cl = n.classList;
          if (tg === 'H2') children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, numbering: { reference: 'ines-titulos', level: 0 }, children: hRuns(n) }));
          else if (tg === 'H3') children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, numbering: { reference: 'ines-titulos', level: 1 }, children: hRuns(n) }));
          else if (cl.contains('cite')) children.push(P(n, { st: { color: '5B646B', size: 18, i: false } }));
          else if (cl.contains('eq')) children.push(new Paragraph({ children: runsOf(n, { math: true }), spacing: { before: 60, after: 120 }, shading: { type: ShadingType.CLEAR, fill: 'EEEDE7', color: 'auto' } }));
          else if (cl.contains('interp')) children.push(new Paragraph({ children: runsOf(n), spacing: { after: 160 }, shading: { type: ShadingType.CLEAR, fill: 'E4F0F9', color: 'auto' }, border: { left: { style: BorderStyle.SINGLE, size: 18, color: '1F7FBF', space: 6 } } }));
          else if (cl.contains('warn')) children.push(new Paragraph({ children: runsOf(n), spacing: { after: 160 }, shading: { type: ShadingType.CLEAR, fill: 'F6EEDF', color: 'auto' }, border: { left: { style: BorderStyle.SINGLE, size: 18, color: 'B27414', space: 6 } } }));
          else if (tg === 'P') children.push(P(n));
          else if (tg === 'OL' || tg === 'UL') { const inst = tg === 'OL' ? ++olInst : 0; for (const li of n.children) children.push(new Paragraph({ numbering: tg === 'OL' ? { reference: 'ines-numeros', level: 0, instance: inst } : { reference: 'ines-vinetas', level: 0 }, children: runsOf(li), spacing: { after: 60 } })); }
          else if (tg === 'DL') {
            const cell = (kids, w, o = {}) => new TableCell({ width: { size: w, type: WidthType.DXA }, borders: { top: bd, bottom: bd, left: bd, right: bd }, shading: o.head ? { type: ShadingType.CLEAR, fill: 'EEEDE7', color: 'auto' } : undefined, margins: { top: 40, bottom: 40, left: 80, right: 80 }, children: [new Paragraph({ children: kids })] });
            const dts = [...n.querySelectorAll('dt')], W1 = 2600, W2 = 9638 - W1;
            children.push(new Table({ width: { size: 9638, type: WidthType.DXA }, columnWidths: [W1, W2], rows: [
              new TableRow({ tableHeader: true, children: [cell([new TextRun({ text: 'Variable', bold: true, font: FONT, size: 18 })], W1, { head: true }), cell([new TextRun({ text: 'Significado', bold: true, font: FONT, size: 18 })], W2, { head: true })] }),
              ...dts.map(dt => new TableRow({ cantSplit: true, children: [cell(runsOf(dt, { math: true, size: 18 }), W1), cell(runsOf(dt.nextElementSibling, { size: 18 }), W2)] }))] }));
            children.push(new Paragraph({ children: [], spacing: { after: 80 } }));
          }
          else if (cl.contains('tw')) {
            const t = n.querySelector('table'); if (!t) continue;
            const trs = [...t.querySelectorAll('tr')], ncol = Math.max(...trs.map(r => r.children.length));
            const W = 9638, lens = Array(ncol).fill(8); trs.forEach(r => [...r.children].forEach((c, j) => { if (c.colSpan === 1) lens[j] = Math.max(lens[j], Math.min(40, c.textContent.trim().length)); }));
            const sum = lens.reduce((a, b) => a + b, 0), cols = lens.map(l => Math.floor(W * l / sum));
            const rows = trs.map(r => new TableRow({ tableHeader: !!r.querySelector('th'), children: [...r.children].map((c, j) => new TableCell({ columnSpan: c.colSpan > 1 ? c.colSpan : undefined, width: { size: c.colSpan > 1 ? cols.slice(j, j + c.colSpan).reduce((a, b) => a + b, 0) : (cols[j] || 1000), type: WidthType.DXA }, borders: { top: bd, bottom: bd, left: bd, right: bd },
              shading: c.tagName === 'TH' ? { type: ShadingType.CLEAR, fill: 'EEEDE7', color: 'auto' } : (r.classList.contains('hl') ? { type: ShadingType.CLEAR, fill: 'E4F0F9', color: 'auto' } : undefined),
              margins: { top: 40, bottom: 40, left: 80, right: 80 }, children: [new Paragraph({ alignment: (c.cellIndex === 0 || c.classList.contains('l')) ? AlignmentType.LEFT : AlignmentType.RIGHT, children: runsOf(c, { size: 18, b: c.tagName === 'TH' }) })] })) }));
            children.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: cols, rows }));
            children.push(new Paragraph({ children: [], spacing: { after: 80 } }));
          }
          else if (cl.contains('fig')) {
            const svg = n.querySelector('svg'), cv = n.querySelector('canvas'), cap = n.querySelector('.cap');
            const img = svg ? await svgToPng(svg) : cv ? await canvasToPng(cv) : null;
            if (img) { let wpx = 600, hpx = Math.round(wpx * img.h / img.w); if (hpx > 380) { hpx = 380; wpx = Math.round(hpx * img.w / img.h); } children.push(new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, children: [new ImageRun({ type: 'png', data: img.buf, transformation: { width: wpx, height: hpx } })] })); }
            if (cap) children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, children: runsOf(cap, { i: false, size: 18, color: '5B646B' }) }));
          }
          else if (cl.contains('grid2') || tg === 'DIV') await walk(n);
        }
      };
      say('Procesando ' + (sec.querySelector('h2')?.textContent || '') + '…');
      await walk(sec);
    }
    const doc = new Document({ creator: 'Ines', title: 'Método N2', features: { updateFields: true },   // Word actualiza el índice al abrir
      styles: { default: { document: { run: { font: FONT, size: 21 } } },
        paragraphStyles: [
          { id: 'Title', name: 'Title', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, bold: true, size: 44, color: '10283B' }, paragraph: { spacing: { before: 360, after: 160 } } },
          { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, bold: true, size: 30, color: '10283B' }, paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 } },
          { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, bold: true, size: 24, color: '1F7FBF' }, paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 1 } }
        ] },
      numbering: { config: [
        { reference: 'ines-titulos', levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: '%1', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 567, hanging: 567 } } } },
          { level: 1, format: LevelFormat.DECIMAL, text: '%1.%2', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 709, hanging: 709 } } } }] },
        { reference: 'ines-vinetas', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 420, hanging: 240 } } } }] },
        { reference: 'ines-numeros', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 420, hanging: 240 } } } }] }
      ] },
      sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
        headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: (I.elem || 'Método N2'), size: 16, color: '5B646B', font: FONT })] })] }) },
        footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Página ', size: 16, color: '5B646B', font: FONT }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '5B646B', font: FONT })] })] }) },
        children }] });
    say('Generando el archivo…');
    const blob = await Packer.toBlob(doc);
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'Informe_N2_' + ((I.elem || 'elemento').replace(/[^A-Za-z0-9áéíóúñÁÉÍÓÚÑ]+/g, '_').slice(0, 60)) + '.docx';
    document.body.appendChild(a); a.click(); a.remove();
    window.__lastReport = blob;
    say('Informe generado. Si no se ha descargado, abre la app desde GitHub o en local: algunos visores bloquean las descargas.');
  } catch (e) { say('No se ha podido generar el informe: ' + e.message); }
  finally { btn.disabled = false; }
}

