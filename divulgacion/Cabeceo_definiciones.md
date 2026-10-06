# Método de cabeceo: definiciones de apoyo a la diapositiva (borrador)

Fuentes: EN 1998-3:2025, 11.3.3.3, 11.4.2(5) y 11.5.2.2 (fórmulas 11.4 a 11.9, 11.40 a 11.43); espectro de UNE-EN 1998-1:2018 con el Anexo Nacional; amortiguamientos equivalentes ξ_SD y ξ_NC de la Circolare 21/2019 (Italia). Convención como en N2: **el asterisco marca el sistema de un grado de libertad (SDOF)**; sin asterisco, la estructura real.

**Aviso de alcance.** EN 1998-3:2025 trata el cabeceo como mecanismo local de muros de fábrica en edificios, y excluye los puentes de fábrica (12.1(3)). Para pilas de viaducto el método se usa **por analogía**. Lo que sigue describe el método de la norma tal como está escrito; su aplicación a pilas es una decisión de proyecto.

## Qué es igual que en N2 y qué cambia
| Panel | N2 | Cabeceo |
|---|---|---|
| 1 | pushover (SAP) con tramo elástico, máximo y rama descendente | curva λ(d_C) analítica, recta desde λ₀ hasta 0, sin tramo elástico |
| 2 | m\*, Γ, F\* = F_b/Γ, d\* = d_C/Γ | misma transformación; el eje vertical es a\* = λg/e\* |
| 3 | bilineal por igualdad de energías | sin bilineal: rigidez secante en d_SD y d_NC |
| 4 | espectro elástico, periodo T\* de la bilineal | mismo espectro; periodo T_SD o T_NC de la secante |
| 5 | reducción por ductilidad (R) y corte con la capacidad | reducción por amortiguamiento (η); no hay corte |
| 6 | d_t = Γ d_t\*, el pushover llega a 1,5 d_t | d_C = Γ Δd, se compara con la capacidad |

## 1. Mecanismo y curva de capacidad
- **Mecanismo**: la pila se trata como bloque rígido que se despega y vuelca (rótulas en las esquinas de la base). Un solo grado de libertad: el giro del bloque.
- **λ** (α en la norma): multiplicador horizontal; la fuerza horizontal en equilibrio límite es λ·W, con W el peso del bloque. **λ₀**: valor al inicio del despegue (resistencia máxima).
- **d_C**: desplazamiento del nudo de control (cerca del centro de gravedad). **d_C0**: valor al que λ se anula (equilibrio límite bajo gravedad).
- Si las fuerzas permanentes y variables no cambian al avanzar el mecanismo, la curva es lineal (11.4): λ = λ₀(1 − d_C/d_C0).
- **F_b = λ·W** es la reacción en la base (cortante) y las cargas son proporcionales al peso (aceleración uniforme), no a mΦ como en N2.
- A diferencia de N2, no hay tramo elástico: antes del despegue se supone cuerpo rígido (11.3.3.3(7) permite añadir un tramo lineal con un periodo inicial T₀ si hace falta).

## 2. Paso al SDOF
- **Γ** (11.7), **m\*** (11.9), **d\*** = d_C/Γ (11.6), **F\*** = λ·ΣW/Γ (11.5): igual que N2.
- **a\*** = F\*/m\* = λg/e\*, con e\* = Γ·m\*/M la fracción de masa que participa. Es el eje vertical en formato aceleración-desplazamiento.
- **a₀\***: aceleración al inicio del despegue. **d₀\***: desplazamiento del SDOF en el que a\* se anula.
- Etiqueta de la diapositiva: 1GDL\* = ESTRUCTURA/Γ.

## 3. Sistema lineal equivalente
- Límites de la norma sobre la curva (11.4.2(5)):
  - **d_SD** = 40 % de d₀\* (o antes, si falla un elemento como un tirante).
  - **d_NC** = 60 % de d₀\*, siempre con d_SD ≤ d_NC.
  - Con λ lineal, esto equivale a una caída del 40 % y del 60 % del multiplicador (11.3.3.3(2)d).
- **Rigidez secante**: la recta desde el origen hasta el punto (d_LS, a\*(d_LS)), con LS = SD o NC.
- **T_LS** = 1,6π·√(d_LS / a\*(d_LS)) (11.40 y 11.41). El 1,6π (en lugar de 2π) acorta el periodo un 20 % respecto a la secante, para estimar mejor la demanda (nota de 11.5.2.2(1)).
- **T_SD** y **T_NC**: los dos periodos resultantes.

## 4. Espectro y periodo
- **S_e(T)**: espectro elástico de aceleración al 5 % (UNE-EN 1998-1:2018 con Anexo Nacional). **T_C**: fin de la meseta.
- **S_De(T)** = S_e(T)·(T/2π)²: espectro de desplazamiento. La recta de periodo T\_LS (formato aceleración-desplazamiento) corta al espectro en (S_De(T_LS), S_e(T_LS)).
- Diferencia con N2: allí el periodo T\* sale de la bilineal y es único; aquí hay un periodo por estado límite.

## 5. Desplazamiento de demanda y comprobación
- **η(ξ)**: corrección del espectro por amortiguamiento distinto del 5 %: η = √(10/(5+ξ)) ≥ 0,55 (EN 1998-1-1:2024, 5.2.2.2(12)).
- **ξ_SD** y **ξ_NC**: amortiguamientos equivalentes (en la diapositiva 8 % y 10 %). Esos valores proceden de la Circolare 21/2019, no de EN 1998-3; conviene citarlo así.
- **Δd** = η(ξ_LS)·S_De(T_LS): desplazamiento de demanda del SDOF. Es una lectura directa del espectro amortiguado en T_LS; no hay corte con la curva de capacidad ni factor R.
- Si el mecanismo se forma en la base (caso de una pila a nivel del suelo), la norma usa S_De con η (11.42, 11.43). Si se forma a una altura z, usa el espectro de suelo de planta S_eZ sin η (11.44, 11.45).
- La Circolare añade una variante en la que Δd se toma como el máximo de S_De entre T₀ y T_LS. No está en la norma europea como método general.

## 6. De vuelta a la estructura y comprobación
- **d_C = Γ·Δd**: desplazamiento del nudo de control (el inverso de d\* = d_C/Γ).
- **Comprobación** (11.42 y 11.43): γ_Sd·S_De(T_LS)·η(ξ_LS) ≤ d_LS/γ_Rd, con LS = SD y NC.
  - **γ_Sd**: coeficiente de incertidumbre de la acción (EN 1998-3, 4.2.2(5)).
  - **γ_Rd**: coeficiente de incertidumbre de la capacidad (Tabla 11.10): 1,55, 1,40 y 1,30 para niveles de conocimiento 1, 2 y 3, y se multiplica por 1,2 si se admiten bloques de resistencia infinita.
- A diferencia de N2, no se exige que el análisis llegue a 1,5 veces la demanda: la curva ya es completa hasta λ = 0.
- La comprobación del estado límite DL (que activa el cabeceo) no se muestra; se hace con la aceleración de despegue: γ_Sd·S_e(T₀) ≤ a_y\*/γ_Rd.

## Aviso sobre el dibujo
Las curvas y espectros son sintéticos y no a escala. Los valores 8 % y 10 % de ξ y los porcentajes 40 % y 60 % sí son los del método.

## Pendiente de confirmar
- Los valores de ξ_SD y ξ_NC (8 % y 10 %) y la variante del máximo de S_De entre T₀ y T_LS los tomé de mi lectura de la Circolare 2019 en una sesión anterior; no los he vuelto a contrastar con el texto. Conviene comprobarlos antes de publicar.
- La fórmula de γ_Sd y el valor numérico no se han consultado en este documento.
