# Cambios pendientes (NO aplicar hasta que el usuario lo pida)

## Formato y unidades (pedidos por el usuario)
1. Unidades fijas: m y kN. Quitar selectores de unidades de F_b y d_C e informar de que son m y kN.
2. Cantidades en kN sin decimales.
3. Cantidades en metros con 3 decimales.
4. Separador de miles "," a partir de 10,000 (pantalla, figuras y ejes, Word). No en la curva pegada ni en el CSV.
5. Desplazamientos menores de 0.010 m en mm con 1 decimal, con la unidad escrita en celdas y sustituciones.

## Interfaz
6. Dividir el panel en dos bloques: "Mecanismo plástico d_m (para la bilineal)" y "Desplazamiento último d_u (capacidad)". Valores manuales en d_C de la curva física. La memoria debe mostrar d_m / d_m* y d_u / d_u* en los pasos 1 y 3.

## Propuesto, sin confirmar
7. Para fábrica, citar EC8-3 anexo C (C.3.3(2), C.4.1.2, C.4.1.3(2); informativo en España) en lugar de "criterio propio" para d_u y estados límite.

## Alcance diferido
- Dos direcciones (Ex + 0.3Ey), torsión (4.3.3.4.2.7), dos patrones de carga en una pasada.
- Acercar la opción "igual desplazamiento" al anejo H.1 de EC8-2 (hoy es d_t* = d_et* con T* de la primera bilineal).
- Probar el informe Word real y una curva real de SAP.
