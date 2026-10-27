#!/usr/bin/env python3
"""Inserta compartido/barra.css + shell.css y shell.js (con el logo) entre los marcadores de cabeceo/index.html,
y barra.css en la portada (index.html).
La app N2 los toma directamente en n2/fuentes/build.py. Uso: python3 compartido/inyectar.py"""
import os, re
AQUI = os.path.dirname(os.path.abspath(__file__))
def leer(n): return open(os.path.join(AQUI, n), encoding='utf-8').read()
def barra_css(): return leer('barra.css')
def shell_css(): return barra_css() + leer('shell.css')
def shell_js(): return leer('shell.js').replace('__LOGO__', leer('logo.txt').strip())
def inyectar(ruta, bloques):
    h = open(ruta, encoding='utf-8').read()
    for ini, fin, cont in bloques:
        a, b = h.index(ini), h.index(fin)
        h = h[:a + len(ini)] + '\n' + cont + '\n' + h[b:]
    open(ruta, 'w', encoding='utf-8').write(h)
if __name__ == '__main__':
    R = os.path.join(AQUI, '..')
    inyectar(os.path.join(R, 'cabeceo', 'index.html'), (('/*SHELL-CSS-INI*/', '/*SHELL-CSS-FIN*/', shell_css()), ('/*SHELL-JS-INI*/', '/*SHELL-JS-FIN*/', shell_js())))
    inyectar(os.path.join(R, 'index.html'), (('/*BARRA-CSS-INI*/', '/*BARRA-CSS-FIN*/', barra_css()),))
    print('cabeceo/index.html e index.html actualizados')
