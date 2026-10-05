# Briefing de traspaso: app N2 (EC8)

Fecha del traspaso: 2026-10-05. Estado: v2 entregada y validada; cambios de formato pendientes (no aplicados).

## 1. Objetivo
App estática de un solo archivo que aplica el método N2 (EN 1998-1 anejo B, B.1–B.6) con el Anexo Nacional español. Válida para edificios y puentes; el usuario piensa sobre todo en puentes con pilas de fábrica. Fase 1: un patrón de carga y una dirección. Diferido: dos direcciones (Ex + 0.3Ey), torsión (4.3.3.4.2.7), dos patrones en una pasada (tomar el peor).

## 2. Entrada y flujo de cálculo
1. Curva de capacidad pushover de SAP (d_C, F_b), en m y kN. Con modo "tabla" se dan masas y forma modal φ_i; con modo "directo" se introducen m* y Γ obtenidos de SAP.
2. SDOF: m* = Σ m_i Φ_i; Γ = m*/Σ m_i Φ_i²; F* = F_b/Γ; d* = d_C/Γ.
3. Bilineal por igualdad de energía: d_y* = 2(d_m* − E_m*/F_y*); T* = 2π√(m* d_y*/F_y*).
4. Espectro AN: T_C = K/4 (A), K·C/4 (B/C), K/2 (D); T_B = T_C/5; T_D = 2 s; C = (800/vs30)^0.465; S(a_g); Anexo A (T_E, T_F, d_g) para T > 4 s.
5. Desplazamiento objetivo: casos 1 (T* ≥ T_C), 2 (T* < T_C y q_u ≤ 1), 3 (q_u > 1); tope d_t* ≤ 3 d_et*. Iteración opcional (tolerancia 5 %, máx. 20). d_t = Γ d_t*. Curva hasta 1.5 d_t.
6. Opción alternativa "igual desplazamiento" (EC8-2 anejo H): d_t* = d_et* con T* de la primera bilineal.
7. Estados límite DL/SD/NC (T_R 225/475/2475; a_g(T_R) = γI·a_gR·(T_R/475)^(1/3)).

## 3. Anexo Nacional (puntos usados)
- AN.5: malla de 4697 puntos [lon, lat, K, a_gR], reglas de interpolación a/b/c (punto de malla, meridiano/paralelo con 2 puntos, 4 puntos). Fuera de malla a decenas de km: a_gR = 0 (sin acción sísmica).
- Baja sismicidad: a_g·S ≤ 0.1 g. Muy baja: a_gR < 0.04 g.
- Importancia, edificios (AN 4.2.5(5)P): γI 0.8/1.0/1.3/1.4 para clases I–IV. Puentes (EC8-2 AN 2.1(6)): clase I fijada por la autoridad (sin ferrocarril), II = 1.0, III = 1.3.
- 4.3.3.1(4): métodos no lineales permitidos si la memoria es justificada y verificable.

## 4. Decisiones tomadas con el usuario
- Off-grid ⇒ a_gR = 0.
- m*, Γ directos desde SAP (sin φ_i·m_i) como opción.
- Ofrecer N2 y "igual desplazamiento"; el usuario aún no sabe qué implica q = 1 en EC8-2.
- Pilas de fábrica: el cálculo se detiene al despegar la pila (inicio del rocking). N2 no está calibrado para rocking (sin periodo propio, autocentrado, disipación por impacto). Hace falta pushover controlado por desplazamientos en SAP si hay rama descendente.
- Desplazamiento último d_u: criterios "caída" (cortante cae a un % del máximo, por defecto 80 %), "último punto" o "manual". Hay que distinguir siempre el valor en la curva física (d_u, d_m) y el del SDOF (d_u*, d_m* = d/Γ).
- Chat: sin etiquetas HTML.

## 5. Hallazgos normativos (resumen; detalle en 03)
- EC8-3 no tiene método para elementos de fábrica exentos con rocking. La Circolare 2019 (C8.7.1.2.1, método cinemático lineal) sí. EC8-3 anexo C (fábrica, informativo en España): d_u = 80 % del cortante máximo; SD = 3/4 d_u; NC = d_u; DL = límite elástico de la bilineal.
- EC8-2 define el pushover en 4.2.5 y anejo H (informativo en España, AN.3) con d_T = d_E (análisis espectral q = 1, rigidez eficaz). No da fórmulas N2.

## 6. Validación hecha
- Motor JS vs `ref.py` (Python independiente) a 1e-6, todas las iteraciones. Reglas AN.5 a/b/c, continuidad anexo A en 4 s, casos límite (EPP, tope 3·d_et, rama 0–T_B, iteración ascendente, curva que no llega a 1.5 d_t, d_t > d_u, Madrid fuera de malla). Responsive y claro/oscuro revisados con Playwright.
- Ejemplos sintéticos (el usuario pidió "por ahora genera una sintética"):
  - E2 pila de fábrica, transversal (−3.195314, 37.389608; a_gR 0.1416 g; vs30 270; clase II): m* = 2165.3 t, Γ = 1.7088, e* = 0.644, T* = 0.327 s, caso 3, q_u = 1.491, primer d_t* = 0.0160 m, tras iterar d_t = 0.0263 m (μ = 1.69); igual desplazamiento d_t = 0.0251 m.
  - E1 (Lorca, vs30 500): Γ = 1.0434, T* 1.582 → 1.206 s, d_t = 0.0546 m.
  - E3 (Barcelona, vs30 450): Γ = 1.3602, caso 2 en la primera, d_t = 0.0052 m.

## 7. Riesgos / sin verificar
- La exportación Word solo se probó con una librería docx simulada (no se pudo instalar docx 9.6.1 aquí). Pedir al usuario que descargue un informe y lo abra en Word.
- Las curvas son sintéticas; falta contrastar con un pushover real de SAP.
- La iteración sigue literalmente el anexo B (se probó saltarla si es elástico y daba resultados no monótonos).

## 8. Inventario de archivos
- `index.html`: app construida (~224 KB).
- `ESPECIFICACION_APP_N2.md`: especificación autoritativa, con §10 cerrado, §13 decisiones v1, §14 ejemplos sintéticos, §15 cambios v2.
- `fuentes/`: engine.js (motor), ui.js (interfaz, ~100 KB), docx.js (informe Word), build.py (ensambla `index.html` a partir de la app de referencia), ref.py (referencia independiente), test.js, gen.py, robust*.py, shot.py, docxtest.py, grid.json, examples.json, curves.json.
- Para reconstruir: `build.py` espera la app de referencia (`862d6d03-index.html`, la app de rocking) y los ficheros de `fuentes/` en el mismo directorio. Revisar las rutas del script antes de ejecutarlo.
- Documentación a subir al proyecto: EC8-1 (txt), EC8-2 (pdf/txt), EC8-3 (pdf), la app de referencia, `Glosario_metodo_N2_1.docx`, `Glosario_analisis_cinematico_Circolare.docx`, `ESPECIFICACION_N2.md` (antigua; la nueva prevalece).

## 9. Puntos clave del motor (engine.js)
`computeN2(inp, grid)` devuelve R con p1 (curva), p2 (SDOF), p3 (d_m), p5 (primera iteración), p6 (iteraciones), p7 (espectro y resultado), p8 (DL/SD/NC), cmp (N2 vs igual), met, noSeismic, warn. Entradas: sdofMode ('tabla'|'directo'), mstar, GamIn, Mtot, metodo ('n2'|'igual'), dmCrit ('max'|'last'|'manual'), duCrit ('drop'|'last'|'manual'), duPct, iterate, tol, tipo ('puente'|'edificio'), impClass, gIman.
