/* Armazón de interfaz compartido por las apps (guía de diseño, §2.3 y §3): barra superior estilo VLASTA con menús Archivo y Ayuda,
   datos en pestañas-cápsula, tarjeta de veredicto y resultados en pestañas, sin scroll de la página.
   No toca el motor de cálculo: reorganiza el DOM que ya generan buildForm() y render(), y conserva los ids de todos los campos.
   Cada app llama a Shell.init(cfg) antes de buildForm(), a Shell.organizarDatos() al final de buildForm(),
   a Shell.despuesDeRender(R) al final de run() y a Shell.fijarInicial() cuando ya hay datos de partida. */
const Shell = (() => {
  const LOGO = '__LOGO__';
  const ICONO_PC = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M1 5V1h4M9 1h4v4M13 9v4H9M5 13H1V9" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  let C = null, INICIAL = null;
  const E = { datos: 0, res: 0, scroll: {} };            // estado de la interfaz que sobrevive a cada recálculo
  const clave = () => 'ines-ui-' + C.id;
  const guardarVista = () => { try { localStorage.setItem(clave(), JSON.stringify({ datos: E.datos, res: E.res })); } catch (e) {} };
  const leerVista = () => { try { const v = JSON.parse(localStorage.getItem(clave()) || '{}'); if (Number.isInteger(v.datos)) E.datos = v.datos; if (Number.isInteger(v.res)) E.res = v.res; } catch (e) {} };
  const plano = h => { const d = document.createElement('div'); d.innerHTML = h; return d.textContent.trim(); };

  // ---------- barra superior
  function cabecera() {
    const b = $('#barra');
    b.className = 'barra';
    b.innerHTML = `
      <div class="barra-izq">
        <a class="marca" href="${C.inicio}" title="Menú de aplicaciones" aria-label="Menú de aplicaciones"><img class="logo" src="${LOGO}" alt="Ines"></a>
        <span class="sep-marca" aria-hidden="true"></span>
        <div class="nombre"><span class="fila-vl"><span class="vl">${C.nombre}</span><span class="ver"><span class="version">Beta</span><span class="ver-fecha" title="Fecha de esta versión [dd.mm.aa]">${C.fecha}</span></span></span><span class="lema">${C.lema}</span></div>
        <nav class="menus" id="menus" aria-label="Menú principal">
          <div class="menu-sup"><button type="button" class="menu-boton" aria-haspopup="menu" aria-expanded="false">Archivo</button><div class="vl-menu menu-lista" role="menu" hidden id="m-archivo"></div></div>
          <div class="menu-sup"><button type="button" class="menu-boton" aria-haspopup="menu" aria-expanded="false">Ayuda</button><div class="vl-menu menu-lista" role="menu" hidden id="m-ayuda"></div></div>
        </nav>
      </div>
      <button type="button" class="titulo-proy" id="titulo-proy" title="Propiedades del proyecto"><span class="etq" id="elemLine"></span><span class="proy" id="projTitle"></span></button>
      <div class="banderas"><button type="button" class="pantalla-completa" id="pantalla-completa" aria-label="Pantalla completa" title="Pantalla completa (F11)">${ICONO_PC}</button></div>
      <div class="solo-imp cab-imp"><b>${C.nombre} · ${C.lema}</b><span id="fecha-imp"></span></div>`;
    const item = (acc, txt, kbd = '', tit = '') => `<button type="button" role="menuitem" data-acc="${acc}"${tit ? ` title="${tit}"` : ''}><span>${txt}</span><kbd>${kbd}</kbd></button>`;
    const sep = '<div class="sep-menu" role="separator"></div>';
    const ej = C.ejemplos && C.ejemplos.length ? `${sep}<div class="menu-sub"><button type="button" role="menuitem" aria-haspopup="menu" class="con-sub"><span>Ejemplos</span><kbd>▸</kbd></button><div class="vl-menu submenu" role="menu">${C.ejemplos.map(([k, t, d]) => `<button type="button" role="menuitem" data-ej="${k}"><span>${t}</span><small>${d || ''}</small></button>`).join('')}</div></div>` : '';
    $('#m-archivo').innerHTML = item('nuevo', 'Nuevo', '', 'Vuelve a los datos de partida') + item('abrir', 'Abrir… [.json]', 'Ctrl+O', 'Abrir un proyecto .json de esta aplicación (también se puede arrastrar)') + item('guardar', 'Guardar [.json]', 'Ctrl+S', 'Guardar los datos del proyecto en un archivo') + ej
      + (C.importar ? sep + item('importar', C.importar.txt, '', C.importar.tit) : '') + sep + item('propiedades', 'Propiedades del proyecto…') + sep
      + item('docx', 'Descargar informe Word') + (C.csv ? item('csv', C.csv) : '') + item('imprimir', 'Imprimir…', 'Ctrl+P', 'La memoria completa, de principio a fin') + sep + item('menu', 'Menú de aplicaciones');
    $('#m-ayuda').innerHTML = item('ayuda', 'Ayuda de ' + C.nombre + '…', 'F1') + sep + item('acerca', 'Acerca de…');
    iniciarMenus();
    $('#titulo-proy').onclick = () => $('#dlg-prop').showModal();
    iniciarPantallaCompleta();
  }
  function iniciarMenus() {
    const sup = $$('.menu-sup'), cerrar = () => sup.forEach(m => { $('.menu-lista', m).hidden = true; $('.menu-boton', m).setAttribute('aria-expanded', 'false'); $$('.menu-sub', m).forEach(s => s.classList.remove('abierto')); });
    const abrir = m => { cerrar(); $('.menu-lista', m).hidden = false; $('.menu-boton', m).setAttribute('aria-expanded', 'true'); };
    const hayAbierto = () => sup.some(m => !$('.menu-lista', m).hidden);
    sup.forEach(m => {
      const bt = $('.menu-boton', m);
      bt.onclick = e => { e.stopPropagation(); $('.menu-lista', m).hidden ? abrir(m) : cerrar(); };
      bt.onpointerenter = e => { if (e.pointerType === 'mouse' && hayAbierto() && $('.menu-lista', m).hidden) abrir(m); };
    });
    $$('.menu-sub .con-sub').forEach(b => { b.onclick = e => { e.stopPropagation(); b.parentElement.classList.toggle('abierto'); }; });
    document.addEventListener('click', e => { if (!e.target.closest('.menu-sup')) cerrar(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrar(); });
    $('#menus').addEventListener('click', e => {
      const b = e.target.closest('[data-acc],[data-ej]'); if (!b) return;
      cerrar(); if (b.dataset.ej) return C.ejemplo(b.dataset.ej);
      acciones[b.dataset.acc] && acciones[b.dataset.acc]();
    });
  }
  function iniciarPantallaCompleta() {
    const b = $('#pantalla-completa'), d = document.documentElement, on = () => !!document.fullscreenElement;
    if (!d.requestFullscreen) { b.hidden = true; return; }
    b.onclick = () => { try { on() ? document.exitFullscreen() : d.requestFullscreen(); } catch (e) {} };
    document.addEventListener('fullscreenchange', () => { const t = on() ? 'Salir de pantalla completa' : 'Pantalla completa'; b.setAttribute('aria-label', t); b.title = t + ' (F11)'; });
  }

  // ---------- archivo (.json), diálogos, atajos
  const aviso = t => { const e = $('#repStatus'); if (!e) return; e.textContent = t; e.classList.add('v'); clearTimeout(aviso.t); aviso.t = setTimeout(() => e.classList.remove('v'), 3500); };
  const campos = () => $$('#form [id], #dlg-prop [id], #legado [id]').filter(e => /^(INPUT|SELECT|TEXTAREA)$/.test(e.tagName) && e.type !== 'file' && e.type !== 'button' && !/^(exSel)$/.test(e.id) && !e.closest('.gt-w'));
  function datosActuales() { const d = {}; campos().forEach(e => d[e.id] = e.value); return { formato: C.formato, version: 1, guardado: new Date().toISOString(), datos: d }; }
  function aplicar(d) {
    if (C.antesDeAplicar) C.antesDeAplicar(d);
    Object.entries(d).forEach(([id, v]) => { const e = document.getElementById(id); if (e && e.type !== 'file') e.value = v; });
    C.refrescar(); aviso('Datos abiertos');
  }
  function guardar() {
    const o = datosActuales(), nombre = ((o.datos.proj || C.id).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9_-]+/g, '_').slice(0, 60) || C.id) + '.json';
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(o, null, 2)], { type: 'application/json' })); a.download = nombre;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); aviso('Datos guardados en ' + nombre);
  }
  function abrirArchivo(f) {
    const r = new FileReader();
    r.onload = () => { try { const o = JSON.parse(r.result); if (!o || o.formato !== C.formato || typeof o.datos !== 'object') throw new Error('no es un proyecto de ' + C.nombre); aplicar(o.datos); } catch (e) { aviso('No se ha podido abrir: ' + e.message); } };
    r.readAsText(f);
  }
  const acciones = {
    nuevo() { if (INICIAL) aplicar(INICIAL); aviso('Proyecto nuevo'); },
    abrir() { $('#f-abrir').click(); },
    guardar,
    importar() { C.importar.accion(); },
    propiedades() { $('#dlg-prop').showModal(); },
    docx() { document.getElementById('btnDocx').click(); },
    csv() { const b = document.getElementById('btnCsv'); b && b.click(); },
    imprimir() { try { window.print(); } catch (e) {} },
    menu() { location.href = C.inicio; },
    ayuda() { $('#dlg-ayuda').showModal(); },
    acerca() { $('#dlg-acerca').showModal(); },
  };
  function dialogos() {
    const d = document.createElement('div');
    d.innerHTML = `
      <input type="file" id="f-abrir" accept=".json,application/json" hidden>
      <dialog class="vl-dlg" id="dlg-prop"><form method="dialog"><header><h3>Propiedades del proyecto</h3></header><div class="cuerpo" id="dlg-prop-cuerpo"></div><footer><button value="ok" class="primario">Cerrar</button></footer></form></dialog>
      <dialog class="vl-dlg ancho" id="dlg-ayuda"><form method="dialog"><header><h3>Ayuda de ${C.nombre}</h3></header><div class="cuerpo">${C.ayuda}</div><footer><button value="ok" class="primario">Cerrar</button></footer></form></dialog>
      <dialog class="vl-dlg" id="dlg-acerca"><form method="dialog"><header><h3>${C.nombre} · ${C.lema}</h3></header><div class="cuerpo">${C.acerca}<p>Versión ${C.fecha}. Aplicación autónoma en un solo archivo HTML: no envía datos a ningún servidor; los proyectos se guardan en archivos .json.</p></div><footer><button value="ok" class="primario">Cerrar</button></footer></form></dialog>
      <div id="repStatus" class="aviso-flot" role="status" aria-live="polite"></div>`;
    [...d.children].forEach(n => document.body.appendChild(n));
    $('#f-abrir').onchange = e => { if (e.target.files[0]) abrirArchivo(e.target.files[0]); e.target.value = ''; };
    $$('dialog.vl-dlg').forEach(x => x.addEventListener('click', e => { if (e.target === x) x.close(); }));
    document.body.addEventListener('dragover', e => e.preventDefault());
    document.body.addEventListener('drop', e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) abrirArchivo(f); });
    document.addEventListener('keydown', e => {
      if (e.key === 'F1') { e.preventDefault(); acciones.ayuda(); return; }
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 's') { e.preventDefault(); guardar(); } else if (k === 'o') { e.preventDefault(); acciones.abrir(); } else if (k === 'p') { e.preventDefault(); acciones.imprimir(); }
    });
    // Al entrar en un campo se selecciona su contenido; Enter pasa al siguiente
    document.addEventListener('focusin', e => { if (e.target.matches('.caja input')) e.target.select(); });
    document.addEventListener('keydown', e => {
      if (e.key !== 'Enter' || !e.target.matches('.caja input')) return; e.preventDefault();
      const l = $$('.panel-datos.activo .caja input:not(:disabled)'), i = l.indexOf(e.target); if (l[i + 1]) l[i + 1].focus();
    });
    window.addEventListener('beforeprint', () => { const f = $('#fecha-imp'); if (f) f.textContent = new Date().toLocaleDateString('es-ES'); });
  }

  // ---------- datos en pestañas
  function corto(sel, o) {
    const m = C.corto && C.corto[sel.id]; if (m && m[o.value]) return m[o.value];
    return o.textContent.split(/ · | \(/)[0];
  }
  function segDe(sel) {
    const w = document.createElement('div'); w.className = 'seg-caja';
    const seg = document.createElement('div'); seg.className = 'seg'; seg.setAttribute('role', 'radiogroup');
    seg.setAttribute('aria-label', plano($('label[for="' + sel.id + '"]') ? $('label[for="' + sel.id + '"]').innerHTML : sel.id));
    seg.onclick = e => { const b = e.target.closest('button'); if (!b) return; sel.value = b.dataset.v; sel.dispatchEvent(new Event('input', { bubbles: true })); sincronizarSeg(); };
    sel.hidden = true; w.appendChild(sel); w.appendChild(seg); return w;
  }
  function sincronizarSeg() {
    $$('#form select').forEach(sel => {
      const seg = sel.parentElement && $('.seg', sel.parentElement); if (!seg) return;
      const firma = [...sel.options].map(o => o.value + '|' + o.textContent).join('§');
      if (seg.dataset.firma !== firma) {
        seg.dataset.firma = firma; seg.innerHTML = '';
        [...sel.options].forEach(o => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.dataset.v = o.value; b.textContent = corto(sel, o); b.title = o.textContent; seg.appendChild(b); });
      }
      $$('button', seg).forEach(b => { const on = b.dataset.v === sel.value; b.setAttribute('aria-checked', on); b.classList.toggle('on', on); });
      seg.classList.toggle('apagado', sel.disabled);
      $$('button', seg).forEach(b => b.disabled = sel.disabled);
    });
  }
  function campo(f) {
    f.removeAttribute('style'); f.className = 'campo';
    const lab = $('label', f), ctl = $('input,select,textarea', f), gt = $('.gt-w', f);
    if (!lab) return;
    if (gt || (ctl && ctl.tagName === 'TEXTAREA')) { f.classList.add('col'); return; }
    if (!ctl) return;
    if (ctl.type === 'file') return;
    const u = $('.u', lab); let ud = ''; if (u) { ud = u.textContent.replace(/^\[|\]$/g, '').replace(/^—$/, ''); u.remove(); }
    if (ctl.tagName === 'SELECT') {
      if (ctl.options.length <= C.maxSeg && !(C.sinSeg || []).includes(ctl.id)) { f.appendChild(segDe(ctl)); return; }
      const c = document.createElement('div'); c.className = 'caja'; c.appendChild(ctl); f.appendChild(c); return;
    }
    const c = document.createElement('div'); c.className = 'caja'; ctl.removeAttribute('style');
    if (ctl.type === 'text') ctl.classList.add('texto');
    c.appendChild(ctl); if (ud) { const s = document.createElement('span'); s.className = 'ud'; s.textContent = ud; c.appendChild(s); } f.appendChild(c);
    if (ctl.type === 'text' && ['proj', 'elem'].includes(ctl.id)) f.classList.add('col');
  }
  function organizarDatos() {
    const form = $('#form'); if (!form || form.dataset.v) return; form.dataset.v = '1';
    // contenedor oculto: lo que ya no se muestra (botones de informe, selector de ejemplos…) sigue existiendo con sus ids y sus escuchadores
    const legado = document.createElement('div'); legado.id = 'legado'; legado.hidden = true; document.body.appendChild(legado);
    const grupos = []; let g = null;
    [...form.children].forEach(n => {
      if (n.tagName === 'H2') { g = { t: n.textContent.replace(/^Paso 1 · /, '').trim(), nodos: [] }; grupos.push(g); n.remove(); }
      else if (g) g.nodos.push(n);
    });
    const porTitulo = {}; grupos.forEach(x => porTitulo[x.t] = x);
    form.innerHTML = '';
    const caps = document.createElement('div'); caps.className = 'pestanas-datos'; caps.setAttribute('role', 'tablist'); form.appendChild(caps);
    const usados = new Set(), cuerpo = $('#dlg-prop-cuerpo');
    C.tabsDatos.forEach(([titulo, lista], i) => {
      const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.textContent = titulo; b.dataset.i = i; caps.appendChild(b);
      const p = document.createElement('div'); p.className = 'panel-datos'; p.setAttribute('role', 'tabpanel'); p.dataset.i = i; form.appendChild(p);
      lista.forEach(t => {
        const x = porTitulo[t]; if (!x) return; usados.add(t);
        const fs = document.createElement('fieldset'); fs.className = 'grupo'; const lg = document.createElement('legend'); lg.textContent = t; fs.appendChild(lg); p.appendChild(fs);
        const ayudas = [], lista2 = x.nodos.flatMap(n => (n.classList && n.classList.contains('q')) ? [...n.childNodes] : [n]);   // .q: recuadro de las preguntas iniciales, se desenvuelve
        lista2.forEach(n => {
          if (n.classList && n.classList.contains('hint')) { ayudas.push(plano(n.innerHTML)); return; }
          if (n.nodeType === 1) fs.appendChild(n);
        });
        if (ayudas.length) { lg.title = ayudas.join(' '); lg.classList.add('con-i'); lg.insertAdjacentHTML('beforeend', ' <span class="ic-i" aria-hidden="true">ⓘ</span>'); }
        $$('.fld', fs).forEach(f => { if ($('input[type=file]', f)) legado.appendChild(f); });   // el selector de archivo vive en Archivo › Importar
        $$('.fld', fs).forEach(campo);
        $$('.campo:has(.gt-w)', fs).forEach(f => fs.appendChild(f));                                  // las tablas van al final del grupo y ocupan el resto del alto
        // las propiedades del proyecto no ocupan sitio en las pestañas: van a su diálogo
        $$('.campo', fs).filter(f => $('#proj', f) || $('#elem', f)).forEach(f => cuerpo.appendChild(f));
        if (!$$('.campo, .gt-w', fs).length && !fs.querySelector('button')) fs.remove();
      });
    });
    grupos.filter(x => !usados.has(x.t)).forEach(x => x.nodos.forEach(n => legado.appendChild(n)));
    $$('.campo', legado).forEach(() => {});
    // el título del proyecto se edita en Propiedades: los dos campos conservan su id
    $$('.fld', legado).forEach(campo);
    $$('.gt-w').forEach(w => { w.title = 'Pega desde Excel en cualquier celda (se acepta la coma decimal)'; });
    const activar = i => {
      E.datos = i; guardarVista();
      $$('.pestanas-datos button').forEach(x => { const on = +x.dataset.i === i; x.setAttribute('aria-selected', on); x.classList.toggle('on', on); });
      $$('.panel-datos').forEach(x => x.classList.toggle('activo', +x.dataset.i === i));
    };
    caps.onclick = e => { const b = e.target.closest('button'); if (b) activar(+b.dataset.i); };
    activar(E.datos < C.tabsDatos.length ? E.datos : 0);
    sincronizarSeg();
  }

  // ---------- resultados en pestañas
  function veredicto(R) {
    const v = C.veredicto && C.veredicto(R); if (!v) return '';
    const frac = Math.max(0, Math.min(1, v.frac));
    return `<section class="panel veredicto"><div><div class="etq">${v.rotulo}</div><div class="cifra">${v.cifra}<small>${v.unidad || ''}</small></div></div>
      <div><div class="etq">${v.nota}</div><div class="medidor" role="img" aria-label="${v.aria || ''}"><i class="${v.ok === false ? 'no' : ''}" style="width:${(frac * 100).toFixed(1)}%"></i><b></b></div><div class="escala"><span>0</span><span>${v.limite || 'límite 1'}</span></div></div>
      <div class="sellos">${v.sellos.map(s => `<span class="sello ${s.ok ? 'ok' : 'no'}" title="${s.tit || ''}"><b>${s.k}</b> ${s.ok ? '✓ Cumple' : '✕ No cumple'}</span>`).join('')}</div></section>`;
  }
  function organizarResultados(R) {
    const main = $('#main'); if (!main) return;
    const prev = $('.panel-res.activo'); if (prev) E.scroll[E.res] = prev.scrollTop;
    const secs = $$(':scope > section', main);
    secs.forEach((s, i) => { s.dataset.orden = i; });
    const tabs = C.tabsRes, paneles = tabs.map(() => document.createElement('div'));
    paneles.forEach((p, i) => { p.className = 'panel-res'; p.setAttribute('role', 'tabpanel'); p.dataset.i = i; });
    const destino = s => { const id = (s.id || '').replace(/^p/, ''); const i = tabs.findIndex(t => t[1].includes(id)); return i < 0 ? 0 : i; };
    // la ficha de resumen: una copia de la figura principal junto a las conclusiones
    const figOrigen = C.resumenFig && secs.find(s => s.id === 'p' + C.resumenFig);
    secs.forEach(s => paneles[destino(s)].appendChild(s));
    const fig = figOrigen && $('.fig', figOrigen);
    if (fig) { const c = fig.cloneNode(true); c.classList.add('fig-resumen'); $$('[id]', c).forEach(x => x.removeAttribute('id')); paneles[0].insertBefore(c, paneles[0].firstChild); paneles[0].classList.add('resumen'); }
    paneles.forEach((p, i) => { if (!p.children.length) p.innerHTML = '<p class="vacio">Sin contenido con los datos actuales.</p>'; });
    const nav = document.createElement('div'); nav.className = 'tabs'; nav.setAttribute('role', 'tablist');
    tabs.forEach(([t], i) => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.i = i; b.textContent = t; nav.appendChild(b); });
    const caja = document.createElement('section'); caja.className = 'panel res'; caja.appendChild(nav); paneles.forEach(p => caja.appendChild(p));
    const activar = i => {
      E.res = i; guardarVista();
      $$('button', nav).forEach(x => { const on = +x.dataset.i === i; x.setAttribute('aria-selected', on); x.classList.toggle('on', on); });
      paneles.forEach(x => x.classList.toggle('activo', +x.dataset.i === i));
      if (paneles[i]) paneles[i].scrollTop = E.scroll[i] || 0;
    };
    nav.onclick = e => { const b = e.target.closest('button'); if (b) { E.scroll[E.res] = $('.panel-res.activo').scrollTop; activar(+b.dataset.i); } };
    main.innerHTML = veredicto(R); main.appendChild(caja);
    activar(E.res < tabs.length ? E.res : 0);
  }
  function despuesDeRender(R) { organizarResultados(R); sincronizarSeg(); }

  /* Los pasos, en el orden en que los calcula la app (para el informe Word, que no depende de en qué pestaña estén) */
  const secciones = () => $$('#main section[data-orden]').sort((a, b) => +a.dataset.orden - +b.dataset.orden);

  function init(cfg) {
    C = Object.assign({ maxSeg: 3, inicio: '../index.html', fecha: '27.10.26', ayuda: '', acerca: '' }, cfg);
    leerVista(); cabecera(); dialogos();
    $('.trabajo') && 0;
  }
  const fijarInicial = () => { INICIAL = datosActuales().datos; };
  return { init, organizarDatos, despuesDeRender, sincronizarSeg, secciones, fijarInicial, aviso, datosActuales };
})();
