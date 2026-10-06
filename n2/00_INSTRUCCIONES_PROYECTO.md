# Instrucciones del proyecto (pegar en "Instrucciones" del proyecto)

Proyecto: app web del método N2 (UNE-EN 1998-1:2018 anejo B + Anexo Nacional español), para puentes (foco: pilas de fábrica) y edificios.

## Cómo trabajar
- Lee primero `01_BRIEFING_TRASPASO.md`, después `02_CAMBIOS_PENDIENTES.md`. La especificación autoritativa es `ESPECIFICACION_APP_N2.md`.
- Entregable: un único `index.html` estático (sin servidor; solo Google Fonts y docx desde jsDelivr), misma identidad, estilo, estructura y código que la app de referencia `index.html` de rocking (Ines). Sin IA en la app.
- La memoria de cálculo va paso a paso: fórmula, sustitución, resultado. Figuras en SVG. Mapa AN.5, informe Word/PDF y anexo (estados límite, glosario, expresiones, criterios propios, referencias).
- Al usuario: escribe en español, punto como separador decimal. En el chat NO uses etiquetas HTML ni sub/superíndices con código: escribe d_t ≤ d_u, d_m*, F_y*, γI.
- El usuario va acumulando cambios de formato/UX: NO los apliques hasta que lo pida expresamente. Anótalos en `02_CAMBIOS_PENDIENTES.md`.
- Para datos vigentes (normas, valores) consulta la fuente; para cálculo valida el motor JS contra `ref.py` (independiente).
- No inventes artículos de la norma: cita apartado y página del PDF aportado.
