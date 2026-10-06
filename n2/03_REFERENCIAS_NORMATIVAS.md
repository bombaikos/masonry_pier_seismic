# Referencias normativas: dónde está cada cosa

## UNE-EN 1998-1:2018 (EC8-1)
- Anejo B (informativo en la norma; normativo en España por AN.3): método N2, B.1–B.6.
- 4.3.3.4.2.3: curva hasta 1.5 d_t. 4.3.3.4.2.7: torsión. 4.3.3.1(4): no lineales con memoria justificada.
- Anejo A: T_E, T_F, d_g. AN.2 tabla AN.2 y AN.5 (mapa/malla). AN 4.2.5(5)P: importancia en edificios.
- Nota 2.1(4): a_g(T_R) = γI·a_gR·(T_R/475)^(1/k), k = 3.

## UNE-EN 1998-2:2018 (EC8-2, puentes)
- 4.2.5 (págs. 63–64): análisis estático no lineal; nota 2 sobre aplicabilidad a SDOF (longitudinal siempre; transversal con apoyo lateral uniforme; no con pila muy rígida ni si pesa la masa de pilas).
- Anejo H (informativo en España, AN.3; págs. 144–146): H.1 direcciones, punto de referencia en c.d.g. del tablero, d_T = d_E (espectral multimodal q = 1, rigidez eficaz, Ex + 0.3Ey); H.2 distribuciones (constante: Φ = 1 en tablero y z/zp en pilas; proporcional al primer modo); H.3 demandas de deformación (4.20); H.4 tablero sin plastificar y sin levantar todos los apoyos de un soporte; H.5 cortante y terreno.
- 4.1.9 (pág. 55) puentes irregulares; 4.2.4.4 (págs. 61–63) estructuras dúctiles, ecuación 4.20 θp,E ≤ θp,d; 2.3.6.1 rigidez eficaz (pág. 36); anejo E (pág. 133) propiedades probables y capacidades de rótula.
- AN 2.1(6): importancia en puentes (clase I a criterio de la autoridad, II = 1.0, III = 1.3).

## UNE-EN 1998-3 (EC8-3, existentes)
- Estados límite DL/SD/NC, T_R 225/475/2475. AN: clases I–II solo SD; III–IV DL + SD + NC.
- Anejo C fábrica (informativo en España): d_u = 80 % del cortante máximo; SD = 3/4 d_u; NC = d_u; DL = límite elástico bilineal. Niveles de conocimiento KL1–KL3, CF 1.35/1.20/1.00.
- No incluye un método para elementos de fábrica exentos con rocking.

## Circolare italiana 2019
- C8.7.1.2.1: método cinemático lineal para mecanismos locales (α0/λ, a*, d*, 0.4/0.6 d0, T_SLV = 1.68π√(d/a), amortiguamientos 8 %/10 %). No tiene equivalente en EC8-3.

## Pilas de fábrica en rocking
N2 solo tiene sentido hasta el cortante máximo/inicio del rocking. La rama descendente exige pushover por control de desplazamientos en SAP. Para el rocking libre, el marco adecuado es el cinemático (Circolare), no N2.
