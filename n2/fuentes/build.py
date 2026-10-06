import json, re, os
HERE=os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)
# app de referencia (rocking, Ines) = index.html de la raíz del repo; salida: n2/index.html
# Se localiza cada parte por su marcador (no por número de línea), para no depender de ediciones del cabeceo.
R=os.path.join(HERE,'..','..','cabeceo','index.html')
if not os.path.exists(R): R=os.path.join(HERE,'..','..','index.html')
L=open(R).read().split('\n')
def find(pred,what):
    i=[k for k,l in enumerate(L) if pred(l)]
    assert i,'marcador no encontrado: '+what
    return i[0]
iStyle=find(lambda l:l.strip()=='</style>','fin de estilos </style>')
iHdr=find(lambda l:l.startswith('<header class="top">'),'<header class="top">')
iGrid=find(lambda l:l.startswith('const GRID'),'const GRID')
head='\n'.join(L[:iStyle+1])  # doctype .. </style>
head=head.replace('<title>Cabeceo de pilas de fábrica</title>','<title>Método N2</title>')
extra='''
textarea{font-family:var(--f-mono);font-size:.8rem;width:100%;padding:5px 6px;border:1px solid var(--line);border-radius:6px;background:var(--paper);color:var(--ink);resize:vertical;line-height:1.35;white-space:pre;overflow-x:auto}
textarea:focus{outline:2px solid var(--accent);outline-offset:0}
input[type=file]{font-family:var(--f-ui);font-size:.78rem;padding:2px;border:none}
button.ghost{background:transparent;color:var(--accent)}
section ul,section ol{margin:6px 0;padding-left:22px;max-width:78ch}
section li{margin:3px 0}
.tw{max-height:none}
span.pill{white-space:nowrap}
.fld:has(select){grid-template-columns:minmax(0,1fr) 150px}
@media print{button,input[type=file]{display:none}}
</style>'''
head=head.replace('</style>', extra, 1) if head.rstrip().endswith('</style>') else head
assert head.count('</style>')==1
hdr=L[iHdr]+'\n</header>'
hdr=re.sub(r'<p class="sub">.*?</p>','<p class="sub">Método N2 · desplazamiento objetivo a partir de una curva pushover · UNE-EN 1998-1:2018, anejo B, con Anexo Nacional · UNE-EN 1998-2 · UNE-EN 1998-3 · unidades SI: m, kN, t, s</p>',hdr)
assert 'Método N2 · desplazamiento' in hdr
grid=L[iGrid]
body='''
<div class="wrap"><aside id="form" aria-label="Datos"></aside><main id="main"></main></div>
<footer>Ines · Método N2. Todos los resultados, textos e interpretaciones se generan con reglas programadas, sin intervención de IA. Los resultados dependen de las hipótesis indicadas en cada paso; revísalas antes de usarlos.</footer>
<script>'''
eng=open('engine.js').read().replace("if (typeof module !== 'undefined') module.exports","if (typeof module !== 'undefined' && module.exports) module.exports")
ui=open('ui.js').read()
cur=json.load(open('curves.json'))
for k,v in cur.items(): ui=ui.replace(f"'__{k}__'", json.dumps(v))
assert '__E' not in ui
docx=open('docx.js').read()
out=head+'\n'+hdr+body+'\n'+eng+'\n'+grid+'\n\n'+docx+'\n'+ui+"\nbuildForm(); loadExample('E2');\n</script>\n</html>\n"
open(os.path.join(HERE,'..','index.html'),'w').write(out)
print(len(out))
