# App del método N2 (EN 1998-1, anejo B) · Especificación

Documento de arranque de la app del método N2. Es autónomo: recoge las conclusiones de la conversación en que se diseñó y las convenciones de la app de cabeceo de pilas de fábrica (Circolare 2019), que ya está terminada y sirve de **modelo de estilo, estructura y código**. Las fórmulas están en LaTeX (GitHub las renderiza).

Documentos que acompañan a esta especificación:
- `index.html` de la app de cabeceo: modelo de interfaz, motor, figuras SVG, mapa AN.5, informe Word y reglas de presentación.
- *Glosario del método N2* y *Glosario del análisis cinemático (Circolare)*, en Word, con la notación unificada de las dos apps.

---

## 0. Reglas comunes con la app de cabeceo

0. **Sin inteligencia artificial.** Cálculos, textos, interpretaciones automáticas y avisos se generan con reglas programadas (plantillas y condiciones sobre los resultados). La app no llama a ningún servicio de IA. El pie de página lo dice.
1. **Identidad Ines.**
   - Logotipo en la cabecera sobre banda azul marino #10283b; las letras del logo son blancas.
   - Azul de marca #2b91cf; acento #1f7fbf (claro) / #5cb3ea (oscuro).
   - Cabecera: el **nombre del proyecto** como título principal; debajo el elemento calculado; en letra pequeña el tipo de cálculo, las normas y las unidades.
   - Modo claro y oscuro.
2. **Paso 0 con identificación y preguntas iniciales.** Proyecto, elemento, dirección y opciones de cálculo; datos y bases de cálculo con cada norma citada; mapa de peligrosidad AN.5 dibujado en canvas con el emplazamiento y los 4 puntos de la interpolación.
3. **Un paso = una sección.** Cada sección lleva:
   - título y cita normativa;
   - texto breve y fórmula simbólica → sustitución → resultado;
   - tabla si hay discretización (estilo hoja de cálculo);
   - figura;
   - interpretación automática (recuadro azul) y avisos (recuadro ámbar).
4. **Parámetros en tablas.** Una fila por parámetro, con nombre, expresión con valores y resultado; nunca una línea larga con varios parámetros encadenados.
5. **Figuras:**
   - una por concepto, a escala cuando sea posible;
   - leyenda completa (toda línea explicada);
   - etiquetas «símbolo = valor unidad»;
   - leyendas que no tapen curvas (dejar margen vertical);
   - ejes que muestren siempre todos los periodos y puntos relevantes (rango automático);
   - el pie explica qué se lee en la figura.
6. **Rectas de periodo** en diagramas aceleración–desplazamiento: se dibujan como «recta del periodo T = …». Un punto de capacidad se marca en el color de la curva de capacidad, no en el del periodo.
7. **Estados límite siempre explicados** (nombre, significado y lo que se exige) donde aparezcan.
8. **Nomenclatura única** en figuras, fórmulas, tablas y glosario. Notación del EC8: $S_\mathrm{e}$, $S_\mathrm{De}$. Punto decimal. Unidades entre corchetes.
9. **Anejo final:**
   - estados límite;
   - glosario;
   - «Expresiones utilizadas» (paso, expresión, referencia);
   - notas sobre criterios propios;
   - referencias.
10. **Informe:** botones «Descargar informe Word» (docx 9.6.1 desde jsDelivr, recorre la memoria en pantalla) e «Imprimir / PDF». Funcionan en GitHub Pages o en local, no en el visor de artefactos de Claude.
11. **Archivo único** `index.html` autocontenido: motor, malla AN.5 embebida, logo en base64. Solo depende de Google Fonts y, al exportar, de docx.

## 0 bis. Notación unificada N2 – cinemático

| Concepto | N2 (esta app) | Cabeceo (Circolare) |
|---|---|---|
| Punto y desplazamiento de control | C, $d_\mathrm{C}$ ($d_\mathrm{n}$ en el anejo B) | C, $d_\mathrm{C}$ |
| Forma | $\Phi_i$, con $\Phi_\mathrm{C} = 1$ | $\Phi_i$ (giro rígido), con $\Phi_\mathrm{C} = 1$ |
| Masa equivalente | $m^* = \sum m_i\Phi_i$ | $m^* = \sum W_i\Phi_i/g$ |
| Factor de transformación | $\Gamma = m^*/\sum m_i\Phi_i^2$ | ídem |
| Fracción de masa participante | $e^* = \Gamma m^*/M$ (informativa) | $e^* = \Gamma m^*/M$ (entra en $a^*$) |
| Curva del sistema equivalente | $F^* = F_\mathrm{b}/\Gamma$, $d^* = d_\mathrm{C}/\Gamma$; en aceleración $a^* = F^*/m^*$ | $a^* = \lambda g/(e^* FC)$, $d^* = d_\mathrm{C}/\Gamma$ |
| Espectros | $S_\mathrm{e}(T)$ [m/s²], $S_\mathrm{De}(T)$ [m] | ídem |

Relación útil para el glosario: $F_\mathrm{b}/(M g) = \lambda$ si el patrón es uniforme; con $F^* = F_\mathrm{b}/\Gamma$ se obtiene $a^* = F^*/m^* = \lambda g/(e^*)$. Es la misma transformación que la de la Circolare sin el factor de confianza.

---

## 1. Objetivo y alcance

Web que, a partir de una curva pushover $F_\mathrm{b}$–$d_\mathrm{C}$, ejecuta el método N2 completo y lo muestra paso a paso, con:

- gráficas reales de cada paso, con los puntos característicos marcados;
- operaciones trazables: fórmula → valores sustituidos → resultado, con unidades y subíndices bien formateados;
- espectro elástico construido con la formulación del EC8 a partir de los datos sísmicos del emplazamiento y de la estructura;
- informe exportable.

**Fuera de la app** (se hace en el software de análisis: SAP2000, ETABS, OpenSees, SeismoStruct…):

- el análisis pushover (curva $F_\mathrm{b}$–$d_\mathrm{C}$);
- las masas por planta $m_i$ y la forma normalizada $\Phi_i$ del patrón de carga (normalmente el primer modo, con $\Phi_n = 1$ en el nudo de control).

**Plataforma**

- Web estática: HTML, CSS y JavaScript, sin servidor ni base de datos.
- Debe funcionar abriendo `index.html` en local (sin servidor) y publicada en GitHub Pages.
- Sin paso de compilación obligatorio. Librerías por CDN con versión fijada, o copiadas al repositorio para uso sin conexión.
- Gráficas en SVG generadas con código propio y fórmulas con subíndices HTML, como en la app de cabeceo (sin Chart.js ni KaTeX): todo funciona sin conexión.

**Alcance por fases**

1. Motor de cálculo validado con un ejemplo resuelto a mano.
2. Interfaz de entradas y gráficas paso a paso.
3. Extras: dos patrones de carga (modal y uniforme), dos direcciones, torsión, informe exportable.

---

## 2. Nomenclatura

El asterisco indica magnitudes del sistema equivalente de un grado de libertad (SDOF).

| Símbolo | Significado |
|---|---|
| $m_i$ | Masa de la planta $i$ |
| $\Phi_i$ | Desplazamiento normalizado de la planta $i$ ($\Phi_n = 1$ en el nudo de control) |
| $F_\mathrm{b}$ | Cortante en base de la estructura real |
| $d_\mathrm{C}$ | Desplazamiento del punto de control C (centro de masas de cubierta; $d_\mathrm{n}$ en el anejo B) |
| $m^*$ | Masa equivalente |
| $\Gamma$ | Factor de transformación |
| $F^*,\ d^*$ | Fuerza y desplazamiento del SDOF |
| $F_\mathrm{y}^*,\ d_\mathrm{y}^*$ | Fuerza y desplazamiento de plastificación de la bilineal |
| $d_\mathrm{m}^*$ | Desplazamiento al formarse el mecanismo plástico |
| $E_\mathrm{m}^*$ | Energía de deformación real hasta $d_\mathrm{m}^*$ |
| $d_\mathrm{u},\ d_\mathrm{u}^*$ | Desplazamiento último real y equivalente |
| $T^*$ | Periodo del SDOF |
| $S_\mathrm{e}(T)$ | Aceleración espectral elástica |
| $T_\mathrm{B},\ T_\mathrm{C},\ T_\mathrm{D}$ | Periodos de esquina del espectro |
| $d_\mathrm{et}^*$ | Desplazamiento objetivo del SDOF si fuera indefinidamente elástico |
| $q_\mathrm{u}$ | Relación entre la demanda elástica y la resistencia |
| $\mu$ | Ductilidad movilizada |
| $R_\mu$ | Factor de reducción por ductilidad |
| $d_\mathrm{t}^*,\ d_\mathrm{t}$ | Desplazamiento objetivo del SDOF y de la estructura real |

---

## 3. Entradas

### 3.1 Curva pushover
- Pares $(d_\mathrm{C}, F_\mathrm{b})$, pegados desde el portapapeles o subidos como CSV.
- Unidades seleccionables (m, cm, mm; kN, MN). Internamente se trabaja en SI: m, kN, t, s. En pantalla: aceleraciones en [m/s²], desplazamientos en [m], $a_g$ en [g].
- Validaciones: el primer punto es (0, 0) o se añade; los desplazamientos son crecientes; hay al menos 10 puntos; se avisa si hay saltos bruscos.

### 3.2 Masas y forma
- Tabla por planta: $m_i$ y $\Phi_i$.
- Normalización automática a $\Phi_n = 1$ en el nudo de control.
- Patrón de carga: modal ($F_i = m_i\Phi_i$) o uniforme ($F_i \propto m_i$). Es informativo en fase 1; en fase 3 se tratan ambos.

### 3.3 Datos sísmicos (Anexo Nacional español, UNE-EN 1998-1:2018, versión corregida 2022)

**Peligrosidad** (AN.2, 3.2.1(2), y AN.5)
- Entrada principal: coordenadas del emplazamiento (longitud, latitud). La app obtiene $a_{gR}$ (en g, suelo tipo A) y el coeficiente de contribución $K$ de la malla de AN.5 (paso 0.1°, 4 697 puntos, extraída a `datos/agR_K_AN5.csv`).
  - Punto de la malla: valor directo.
  - Sobre un meridiano o paralelo de la malla: $a_{gR} = \dfrac{a_{gR1}/d_1 + a_{gR2}/d_2}{1/d_1 + 1/d_2}$ (los dos puntos más próximos).
  - En otro caso: la misma media ponderada por el inverso de la distancia con los cuatro puntos más próximos.
  - $K$ se interpola igual.
  - Alternativa: $a_{gR}$ y $K$ introducidos a mano.
- Magnitud (solo informativa en la app): $M_w = 6$ si $K \le 1.1$ y $M_w = 8$ si $K > 1.1$.
- En España no hay "tipo 1 / tipo 2" de espectro: la forma depende de $K$.

**Importancia** (AN.2, 4.2.5(5)P): $a_g = \gamma_\mathrm{I}\,a_{gR}$

| Clase | I | II | III | IV |
|---|---|---|---|---|
| $\gamma_\mathrm{I}$ | 0.8 | 1.0 | 1.3 | 1.4 |

**Terreno** (tabla AN.1): tipos A ($v_{s,30} > 800$ m/s), B (360–800), C (180–360), D (< 180), S1 y S2 (estudio específico: la app no los calcula). Se introduce $v_{s,30}$ y se calcula $C = (800/v_{s,30})^{0.465}$.

**Espectro elástico horizontal** (tabla AN.2). Lectura del texto extraído, **pendiente de confirmar con la tabla original**:

| Terreno | $S$ | $T_\mathrm{C}$ (s) | $T_\mathrm{B}$ (s) | $T_\mathrm{D}$ (s) |
|---|---|---|---|---|
| A | 1 | $K/4$ | $T_\mathrm{C}/5$ | 2.0 |
| B, C | $a_g \le 0.1g$: $C$; $\ 0.1g < a_g \le 0.4g$: $C + 3.33\,(a_g/g - 0.1)(1 - C)$; $\ a_g > 0.4g$: 1 | $K\,C/4$ | $T_\mathrm{C}/5$ | 2.0 |
| D | $a_g \le 0.1g$: 2; $\ 0.1g < a_g \le 0.4g$: $2.33 - 3.33\,a_g/g$; $\ a_g > 0.4g$: 1 | $K/2$ | $T_\mathrm{C}/5$ | 2.0 |

  Comprobación de coherencia: $C = 1$ en $v_{s,30} = 800$ enlaza A con B; $C = 2$ en $v_{s,30} = 180$ enlaza C con D ($S = 2$, $T_\mathrm{C} = K/2$).
- Umbrales: baja sismicidad $a_g S \le 0.1g$; muy baja sismicidad $a_{gR} < 0.04g$ (avisos).
- Amortiguamiento $\xi$ (5 % por defecto, $\eta = 1$); $\eta$ según EN 1998-1, 3.2.2.2(3).

**Otros datos del Anexo Nacional relevantes para la app**
- AN.3: **el anejo B (N2) es normativo en España**, igual que el anejo A (espectros de desplazamiento).
- 4.3.3.1(4): los métodos no lineales están permitidos si la memoria justifica todos los parámetros y permite una verificación independiente. La trazabilidad de la app responde a esta exigencia.
- $\beta = 0.2$ (edificios) para el espectro de cálculo (no interviene en el N2).

### 3.4 Opciones de cálculo
- Criterio para $d_\mathrm{m}^*$: punto de cortante máximo (por defecto), último punto o selección manual.
- Criterio para $d_\mathrm{u}$: caída al 80 % del cortante máximo (por defecto, porcentaje editable), último punto o manual.
- Iteración de la bilineal (activada por defecto) y tolerancia (5 % por defecto).

---

## 4. Algoritmo

### Paso 1 · Curva pushover
Lectura y validación de la curva $F_\mathrm{b}$–$d_\mathrm{C}$ (apartado 3.1).

### Paso 2 · Transformación al SDOF

$$m^* = \sum m_i\,\Phi_i \qquad \Gamma = \frac{m^*}{\sum m_i\,\Phi_i^2}$$

$$F^* = \frac{F_\mathrm{b}}{\Gamma} \qquad d^* = \frac{d_\mathrm{C}}{\Gamma}$$

Ambos ejes se dividen por $\Gamma$, así que la curva conserva su forma. También: $d_\mathrm{u}^* = d_\mathrm{u}/\Gamma$.

### Paso 3 · Bilineal equivalente (elastoplástica perfecta)

- $d_\mathrm{m}^*$: desplazamiento al formarse el mecanismo plástico. **No se identifica con $d_\mathrm{u}^*$**, salvo que el análisis termine justo al formarse el mecanismo. En general $d_\mathrm{m}^* \le d_\mathrm{u}^*$.
- $F_\mathrm{y}^* = F^*(d_\mathrm{m}^*)$.
- Energía por trapecios:

$$E_\mathrm{m}^* = \int_0^{d_\mathrm{m}^*} F^*\,\mathrm{d}d^* \approx \sum_k \tfrac12\,(F_k^* + F_{k+1}^*)\,(d_{k+1}^* - d_k^*)$$

- Igualando la energía de la curva real con la de la bilineal, $E_\mathrm{bil} = F_\mathrm{y}^*\,(d_\mathrm{m}^* - d_\mathrm{y}^*/2)$:

$$d_\mathrm{y}^* = 2\left(d_\mathrm{m}^* - \frac{E_\mathrm{m}^*}{F_\mathrm{y}^*}\right)$$

- Comprobar que $0 < d_\mathrm{y}^* < d_\mathrm{m}^*$; si no, avisar.

### Paso 4 · Periodo equivalente

$$k^* = \frac{F_\mathrm{y}^*}{d_\mathrm{y}^*} \qquad T^* = 2\pi\sqrt{\frac{m^*\,d_\mathrm{y}^*}{F_\mathrm{y}^*}}$$

$T^*$ no es el periodo del primer modo elástico; normalmente es algo más largo.

### Espectro elástico (EN 1998-1, 3.2.2.2)

| Rango | $S_\mathrm{e}(T)$ |
|---|---|
| $0 \le T \le T_\mathrm{B}$ | $a_\mathrm{g} S \left[1 + \dfrac{T}{T_\mathrm{B}}(2.5\,\eta - 1)\right]$ |
| $T_\mathrm{B} \le T \le T_\mathrm{C}$ | $2.5\,a_\mathrm{g} S\,\eta$ |
| $T_\mathrm{C} \le T \le T_\mathrm{D}$ | $2.5\,a_\mathrm{g} S\,\eta\,\dfrac{T_\mathrm{C}}{T}$ |
| $T_\mathrm{D} \le T \le 4\ \mathrm{s}$ | $2.5\,a_\mathrm{g} S\,\eta\,\dfrac{T_\mathrm{C}T_\mathrm{D}}{T^2}$ |

$$\eta = \sqrt{\frac{10}{5+\xi}} \ge 0.55 \qquad S_\mathrm{De}(T) = S_\mathrm{e}(T)\left(\frac{T}{2\pi}\right)^2$$

En formato ADRS, cada periodo es una recta desde el origen: $S_\mathrm{a} = (2\pi/T)^2\,S_\mathrm{d}$. **La rama $0$–$T_\mathrm{B}$ debe incluirse** (queda muy pegada al origen en ADRS, pero se usa si $T^* < T_\mathrm{B}$).

### Paso 5 · Desplazamiento objetivo del SDOF

$$d_\mathrm{et}^* = S_\mathrm{e}(T^*)\left(\frac{T^*}{2\pi}\right)^2 \qquad q_\mathrm{u} = \frac{S_\mathrm{e}(T^*)\,m^*}{F_\mathrm{y}^*}$$

| Caso | Condición | $d_\mathrm{t}^*$ | Lectura |
|---|---|---|---|
| 1 | $T^* \ge T_\mathrm{C}$ | $d_\mathrm{et}^*$ | Igual desplazamiento. Vale tanto si plastifica como si no |
| 2 | $T^* < T_\mathrm{C}$ y $q_\mathrm{u} \le 1$ | $d_\mathrm{et}^*$ | No plastifica; el punto queda en la rama elástica de la bilineal |
| 3 | $T^* < T_\mathrm{C}$ y $q_\mathrm{u} > 1$ | $\dfrac{d_\mathrm{et}^*}{q_\mathrm{u}}\left[1 + (q_\mathrm{u}-1)\dfrac{T_\mathrm{C}}{T^*}\right]$ | Amplificación en periodos cortos |

Límites: $d_\mathrm{et}^* \le d_\mathrm{t}^* \le 3\,d_\mathrm{et}^*$.

**Relación con la ductilidad** (Vidic, Fajfar y Fischinger). Para un oscilador genérico de masa $m$ y resistencia $F_\mathrm{y}$, $R_\mu = S_\mathrm{e}(T)\,m/F_\mathrm{y}$, con:

$$R_\mu = (\mu - 1)\frac{T}{T_\mathrm{C}} + 1 \ \ (T < T_\mathrm{C}) \qquad R_\mu = \mu \ \ (T \ge T_\mathrm{C})$$

En el N2, $m = m^*$ y $F_\mathrm{y} = F_\mathrm{y}^*$, y en el punto de funcionamiento $R_\mu = q_\mathrm{u}$. De ahí:

$$\mu = (q_\mathrm{u}-1)\frac{T_\mathrm{C}}{T^*} + 1 \ \ (T^* < T_\mathrm{C}) \qquad \mu = q_\mathrm{u} \ \ (T^* \ge T_\mathrm{C})$$

$$d_\mathrm{t}^* = \mu\,d_\mathrm{y}^* = d_\mathrm{et}^*\,\frac{\mu}{q_\mathrm{u}}$$

En el caso 3 siempre se cumple $\mu > q_\mathrm{u} > 1$.

**Construcción gráfica (opción A, la principal en la app).** Como $d_\mathrm{y}^* = d_\mathrm{et}^*/q_\mathrm{u}$:

$$d_\mathrm{t}^* = d_\mathrm{y}^* + (d_\mathrm{et}^* - d_\mathrm{y}^*)\frac{T_\mathrm{C}}{T^*}$$

Es decir, el tramo entre $d_\mathrm{y}^*$ y $d_\mathrm{et}^*$ se estira por $T_\mathrm{C}/T^*$ a partir de $d_\mathrm{y}^*$.

**Espectro inelástico (opción B, capa opcional).** Para la $\mu$ ya calculada, punto a punto:

$$S_\mathrm{a} = \frac{S_\mathrm{e}(T)}{R_\mu} \qquad S_\mathrm{d} = \frac{\mu}{R_\mu}\,S_\mathrm{De}(T)$$

El punto de funcionamiento es la intersección de la meseta de capacidad con esta curva. No es un espectro con amortiguamiento equivalente (eso es el método del espectro de capacidad, ATC-40/FEMA-440); aquí se mantiene $\xi = 5\,\%$ y la no linealidad entra por la ductilidad.

### Paso 6 · Iteración (anejo B.5, opcional en la norma)

Si $d_\mathrm{t}^*$ difiere de $d_\mathrm{m}^*$, se repiten los pasos 3 a 5 con $d_\mathrm{m}^* \leftarrow d_\mathrm{t}^*$ y $F_\mathrm{y}^* \leftarrow F^*(d_\mathrm{t}^*)$, hasta:

$$\frac{\left|d_{\mathrm{t},i+1}^* - d_{\mathrm{t},i}^*\right|}{d_{\mathrm{t},i}^*} < \text{tolerancia}$$

La tolerancia no la fija la norma; se usa 5 % por defecto. Máximo 20 iteraciones; si no converge, se avisa.

- Si $d_\mathrm{t}^* < d_\mathrm{m}^*$: $F_\mathrm{y}^*$ baja, la rama elástica se acerca a la rigidez inicial, $T^*$ suele acortarse y $d_\mathrm{t}^*$ suele reducirse algo.
- Si $d_\mathrm{t}^* > d_\mathrm{m}^*$: con meseta plana apenas cambia nada; con endurecimiento o pérdida de resistencia sí cambia. Si $d_\mathrm{t}^*$ supera el final de la curva, no se puede iterar: se avisa.

### Paso 7 · Vuelta a la estructura y comprobaciones

$$d_\mathrm{t} = \Gamma\,d_\mathrm{t}^*$$

- La curva pushover debe llegar al menos a $1.5\,d_\mathrm{t}$ (EN 1998-1, 4.3.3.4.2.3). Es un requisito sobre el alcance del análisis, no una comprobación formal del tipo $d_\mathrm{u} \ge 1.5\,d_\mathrm{t}$.
- Si $d_\mathrm{t} > d_\mathrm{u}$, la estructura no alcanza la demanda: no cumple.
- En $d_\mathrm{t}$ se hacen las comprobaciones locales (fuera de la app en fase 1): mecanismos dúctiles por deformación ($\theta \le \theta_\mathrm{u}$), mecanismos frágiles por fuerza ($V \le V_\mathrm{R}$), derivas entre plantas (EN 1998-3 en edificios existentes). Un elemento puede fallar en $d_\mathrm{t}$ aunque la curva global tenga margen.
- Orden típico: $d_\mathrm{y}^* < d_\mathrm{m}^* \le d_\mathrm{u}^*$.

---

## 5. Gráficas

Una por paso, con datos reales, ejes rotulados con unidades y puntos anotados con su valor.

| Paso | Gráfica | Elementos |
|---|---|---|
| 1–2 | $F_\mathrm{b}$–$d_\mathrm{C}$ y $F^*$–$d^*$ superpuestas | $d_\mathrm{u}$, $d_\mathrm{u}^*$, flecha "÷Γ", línea del criterio de $d_\mathrm{u}$ |
| 3 | $F^*$–$d^*$ con bilineal | Área $E_\mathrm{m}^*$ sombreada, $F_\mathrm{y}^*$, $d_\mathrm{y}^*$, $d_\mathrm{m}^*$, $d_\mathrm{u}^*$ |
| 4 | Misma gráfica | Rigidez $k^*$ y valor de $T^*$ |
| Espectro | $S_\mathrm{e}$–$T$ | $T_\mathrm{B}$, $T_\mathrm{C}$, $T_\mathrm{D}$, $T^*$ y $S_\mathrm{e}(T^*)$ |
| 5 | ADRS ($S_\mathrm{a}$–$S_\mathrm{d}$) | Espectro elástico, recta de $T^*$, recta de $T_\mathrm{C}$, capacidad bilineal en aceleración ($F^*/m^*$), punto $d_\mathrm{et}^*$, **flecha señalando $d_\mathrm{t}^*$**, rótulo del caso (1, 2 o 3), construcción de la opción A; opción B conmutable |
| 6 | $F^*$–$d^*$ | Bilineales de cada iteración superpuestas y tabla de convergencia |
| 7 | $F_\mathrm{b}$–$d_\mathrm{C}$ | $d_\mathrm{t}$, $1.5\,d_\mathrm{t}$, $d_\mathrm{u}$ y semáforo de cumplimiento |

Convenciones (paleta Ines): curva real y del sistema equivalente en azul de acento #1f7fbf, curva física sin transformar en gris, bilineal en coral discontinua, espectro en violeta; estados límite SLD verde, SLV coral, SLC violeta. La identidad de cada serie nunca depende solo del color (leyenda y estilo de línea).

---

## 6. Trazabilidad y formato

- Cada resultado se muestra en tres niveles: fórmula simbólica → sustitución numérica → resultado con unidades. Ejemplo:
  $d_\mathrm{y}^* = 2\,(d_\mathrm{m}^* - E_\mathrm{m}^*/F_\mathrm{y}^*) = 2\,(0.100 - 40.0/500) = 0.040\ \mathrm{m}$
- Subíndices y superíndices reales (HTML `<sub>`/`<sup>` y `tspan` en SVG), nunca guiones bajos visibles.
- Punto decimal (p. ej. 0.403), cifras significativas coherentes y unidades SI entre corchetes en ejes y tablas (p. ej. $d^*$ [m]); los paréntesis se reservan para argumentos de funciones, $S_\mathrm{e}(T)$.
- Avisos visibles cuando una hipótesis no se cumple: $d_\mathrm{y}^*$ fuera de rango, iteración sin converger, curva que no llega a $1.5\,d_\mathrm{t}$, $d_\mathrm{t} > d_\mathrm{u}$, $T^* < T_\mathrm{B}$, parámetros del Anejo Nacional provisionales.
- Exportación: informe imprimible (HTML/PDF) con entradas, pasos, gráficas y resultados; CSV de las curvas transformadas.

---

## 7. Arquitectura propuesta

```
/index.html
/css/estilos.css
/js/motor/        ← funciones puras, sin DOM, testeables
    transformacion.js   (m*, Γ, F*, d*)
    bilineal.js         (d_m*, F_y*, E_m*, d_y*)
    espectro.js         (S_e, S_De, parámetros por terreno)
    objetivo.js         (d_et*, q_u, casos, μ, límites)
    iteracion.js
/js/ui/           ← entradas, gráficas, fórmulas
/datos/anejo_nacional.json   ← parámetros del espectro, editables
/ejemplos/        ← curvas de ejemplo en CSV
/tests/           ← comparación con el ejemplo resuelto a mano
/docs/ESPECIFICACION.md
```

El motor no depende de la interfaz: cada función recibe datos y devuelve resultados más la traza de la operación (fórmula, sustitución, resultado).

---

## 8. Validación

- Ejemplo de referencia resuelto a mano (o el ejemplo de Fajfar de la bibliografía) con todos los valores intermedios.
- Casos de prueba que cubran los casos 1, 2 y 3 del paso 5, la rama $0$–$T_\mathrm{B}$, el límite $3\,d_\mathrm{et}^*$, la iteración en ambos sentidos y una curva que no llega a $1.5\,d_\mathrm{t}$.

---

## 9. Decisiones tomadas

- El pushover y los datos modales se obtienen fuera de la app.
- $d_\mathrm{m}^*$ es el desplazamiento de formación del mecanismo (por defecto, el del cortante máximo), no $d_\mathrm{u}^*$.
- La iteración del paso 6 se trata como un paso propio y se activa por defecto.
- En el paso 5, la construcción de la opción A es la principal y la opción B es una capa opcional.
- Se incluye la rama $0$–$T_\mathrm{B}$ del espectro.
- Se usa el EN 1998-1:2004; la nueva generación (EN 1998-1-1) revisa parte del procedimiento y queda como posible ampliación.

## 10. Pendiente

- [x] Anexo Nacional español incorporado (apartado 3.3): $a_g = \gamma_\mathrm{I}\,a_{gR}$, malla AN.5, $S$, $T_\mathrm{B}$, $T_\mathrm{D}$.
- [x] Tabla AN.2 confirmada con el texto de la norma: $T_\mathrm{C} = K/4$ (A), $K C/4$ (B, C), $K/2$ (D); $T_\mathrm{B} = T_\mathrm{C}/5$; $T_\mathrm{D} = 2.0$ s.
- [x] Emplazamientos fuera de la malla AN.5: la malla no tiene puntos donde la aceleración es despreciable. Si el punto más próximo está a más de 12 km (dentro de la malla la distancia máxima es de unos 8 km), $a_{gR} = 0$: sin acción sísmica, la memoria se queda en los pasos 1 a 4 (capacidad).
- [x] NCSE-02: no se ofrece (la app usa la UNE-EN 1998-1 con su AN).
- [x] Ejemplo de validación: tres curvas sintéticas (apartado 14) validadas con una implementación independiente en Python.
- [x] Fase 1 y 2: un patrón y una dirección. Dos direcciones y torsión quedan para más adelante.
- [x] $\gamma_\mathrm{I}$ de puentes (UNE-EN 1998-2, AN, 2.1(6)): clase II = 1.0; clase III = 1.3; clase I, la fija la autoridad competente (dato manual).
- [ ] Repetir el cálculo con los dos patrones (modal y uniforme) en una misma pasada y tomar el más desfavorable.
- [ ] Dos direcciones (combinación $E_x$ + 0.3 $E_y$) y torsión (4.3.3.4.2.7).

---


---

## 11. Aprendizajes de la app de cabeceo aplicables al N2

- **Explicar qué se compara en cada figura.** Si la comprobación es en desplazamiento, la figura lo enseña con verticales y una cota de margen, no con una intersección aparente. En el N2, el punto de funcionamiento sí es una intersección (paso 5), pero hay que explicar qué rama del espectro se usa.
- **Esquema genérico del espectro** antes de los espectros del emplazamiento, con $T_\mathrm{B}$, $T_\mathrm{C}$, $T_\mathrm{D}$ (y $T_\mathrm{E}$, $T_\mathrm{F}$ del anejo A) y sus ramas; el pie explica que las verticales discontinuas de los espectros del emplazamiento son periodos de la estructura.
- **Parámetros del espectro en tabla** ($C$, terreno, $S$, $T_\mathrm{B}$, $T_\mathrm{C}$, $T_\mathrm{D}$).
- **Diagrama $S_\mathrm{e}$–$S_\mathrm{De}$** con las rectas de periodo.
- **Aviso cuando $a_g > 0.4g$:** el AN toma $S = 1$ y el espectro de norma no representa pulsos cercanos a falla.
- **Transformación visible:** curva física y curva del sistema equivalente en los mismos ejes, con flechas «÷ Γ».
- **Tablas con discretización** como en una hoja de cálculo (el usuario lo pidió expresamente).
- **Aviso de discretización:** si la integración numérica difiere más de un 10 % de la exacta, aviso; la exacta no se muestra.

## 12. Publicación en GitHub

- Un único `index.html` autocontenido (ver regla 11). Se abre en local con doble clic o se publica en GitHub Pages subiendo el archivo.
- El mapa sísmico se dibuja en `<canvas>` con la malla embebida (4697 puntos, unos 65 kB); `fetch` de un CSV no funciona en `file://`, por eso va embebida.
- Código de la app de cabeceo reutilizable: `chart()` (ejes, doble eje, bandas, verticales, flechas, leyenda con muestras de línea o recuadro), `svgT`/`hT` (subíndices), `drawMap`, interpolación AN.5, espectros AN (con anejo A), exportación Word (`report.js`).

## 13. Decisiones de la versión 1 (octubre de 2026)

- **Edificios y puentes.** Un selector «tipo de estructura» cambia: clases de importancia y $\gamma_\mathrm{I}$ (EN 1998-1 AN 4.2.5(5)P o EN 1998-2 AN 2.1(6)), punto de control (cubierta / c.d.g. del tablero deformado, EN 1998-2 H.1(2)), direcciones (X/Y o longitudinal/transversal), citas y comprobaciones locales.
- **EN 1998-2, anejo H (informativo en España).** No usa el N2: lleva el pushover hasta $d_\mathrm{E}$, desplazamiento de un análisis espectral lineal con $q = 1$ y rigidez eficaz (igual desplazamiento). La app calcula el N2 del anejo B de la EN 1998-1 (normativo por AN.3) y en puentes añade la comparación con $d_\mathrm{E} \approx \Gamma S_\mathrm{De}(T^*)$ (estimación con un modo). Difieren en el caso 3.
- **Elementos de fábrica.** Aviso fijo (apartado 11.7 de la especificación de cabeceo): si el mecanismo es el cabeceo, el N2 es orientativo; remite a la app de cabeceo.
- **Pasos 3 a 5** muestran la primera bilineal (criterio de $d_\mathrm{m}^*$); el **paso 6** muestra la iteración y el resultado final, que es el que usan los pasos 7 y 8.
- **Iteración literal del anejo B**, también si la respuesta es elástica: la bilineal tiende a la rigidez secante en $d_\mathrm{t}^*$ (periodo elástico). Se probó a no iterar en respuesta elástica, pero daba resultados no monótonos con $a_g$ (DL mayor que SD en el ejemplo 1).
- **Paso 8 (nuevo): estados límite de la EN 1998-3** (DL 225, SD 475, NC 2475 años; AN: clases I–II solo SD, III–IV los tres). $a_g(T_\mathrm{R}) = \gamma_\mathrm{I} a_{gR} (T_\mathrm{R}/475)^{1/3}$ (EN 1998-1, 2.1(4) nota), N2 completo por nivel. Límites globales orientativos (criterio propio): DL $d_\mathrm{t} \le \Gamma d_\mathrm{y}^*$; SD $d_\mathrm{t} \le \tfrac34 d_\mathrm{u}$; NC $d_\mathrm{t} \le d_\mathrm{u}$. En puentes, por analogía.
- **Sección «Espectro» (E)** entre los pasos 4 y 5, con el esquema genérico, la tabla de parámetros y los espectros $S_\mathrm{e}$–$T$ y $S_\mathrm{De}$–$T$.
- **Opción B** (espectro inelástico) conmutable en el panel; desactivada por defecto.
- **Entradas por texto pegado:** curva (tabulador, punto y coma o espacios; coma decimal admitida con tabulador o punto y coma; cabeceras ignoradas) o archivo CSV; masas «nombre; m; Φ». Fila del punto de control elegible (0 = la de Φ máximo).
- **Desplazamientos** con 4 decimales (5 si son menores de 0.01 m).
- **Exportación:** informe Word (docx 9.6.1), Imprimir/PDF y CSV de las curvas transformadas.

## 14. Ejemplos sintéticos de validación

Curvas generadas con una ley tipo Menegotto-Pinto con endurecimiento y rama descendente; resultados comprobados con una implementación independiente en Python (todas las iteraciones coinciden a 1e-6).

| Ejemplo | Datos | Primera pasada | Final |
|---|---|---|---|
| 1 · Puente de HA, longitudinal | Lorca (−1.70, 37.68; regla b de AN.5, $a_{gR}$ = 0.1922 g), terreno B ($v_{s,30}$ = 500), clase II; $m^*$ = 2540 t, Γ = 1.0434 | $T^*$ = 1.582 s, caso 1, $d_\mathrm{t}^*$ = 0.0686 m | 3 ciclos: $T^*$ = 1.206 s, $d_\mathrm{t}$ = 0.0546 m |
| 2 · Pila de fábrica, transversal | (−3.195, 37.390), $a_{gR}$ = 0.1416 g, terreno C ($v_{s,30}$ = 270), clase II; $m^*$ = 2165 t, Γ = 1.7088 | $T^*$ = 0.327 s, caso 3, $q_\mathrm{u}$ = 1.49, $d_\mathrm{t}^*$ = 0.0160 m | 2 ciclos: $d_\mathrm{t}$ = 0.0263 m, μ = 1.69 |
| 3 · Edificio de muros, 5 plantas | Barcelona (2.17, 41.39), $a_{gR}$ = 0.0859 g, terreno B ($v_{s,30}$ = 450), clase II; $m^*$ = 1233 t, Γ = 1.3602 | $T^*$ = 0.278 s, caso 2, $q_\mathrm{u}$ = 0.71 | 3 ciclos: caso 3 marginal ($q_\mathrm{u}$ ≈ 1.06), $d_\mathrm{t}$ = 0.0052 m |

Pruebas adicionales: curva elastoplástica exacta ($d_\mathrm{y}^*$ recuperado exactamente), límite 3·$d_\mathrm{et}^*$, rama 0–$T_\mathrm{B}$, reglas a/b/c de AN.5, Madrid fuera de malla, continuidad del anejo A en 4 s, iteración hacia arriba ($d_\mathrm{m}^*$ manual pequeño), curva que no llega a 1.5·$d_\mathrm{t}$ y $d_\mathrm{t} > d_\mathrm{u}$.

## 15. Cambios de la versión 2

- **Fuera de malla, $a_{gR} = 0$.** No hay acción sísmica: la memoria muestra la capacidad (pasos 1 a 4) y una sección «Sin acción sísmica»; no se calculan los pasos 5 a 8. Lo mismo si se introduce $a_{gR} = 0$ a mano.
- **$m^*$ y Γ del programa de cálculo.** Nuevo selector «Origen de $m^*$ y Γ»: tabla de masas y forma (como antes) o datos del programa (SAP2000…), con $M$ opcional para $e^*$. Con datos del programa no hace falta la tabla $m_i$, $\Phi_i$.
- **Dos criterios para el desplazamiento objetivo**, a elegir en el panel:
  - N2 (EN 1998-1, anejo B, normativo por AN.3): casos 1 a 3, límite de 3·$d_\mathrm{et}^*$ e iteración opcional.
  - Igual desplazamiento (EN 1998-2, anejo H, informativo): $d_\mathrm{t}^* = d_\mathrm{et}^*$ con $T^*$ de la primera bilineal (rigidez eficaz), sin iteración.
  - El paso 7 compara siempre los dos criterios. El paso 8 usa el elegido.
- **Panel:** se ocultan los campos que no aplican (tabla de masas o $m^*$ y Γ; coordenadas o $a_{gR}$ y $K$; $\gamma_\mathrm{I}$ manual solo en puentes de clase I; valores manuales de $d_\mathrm{m}^*$ y $d_\mathrm{u}$).

