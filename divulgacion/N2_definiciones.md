# Método N2: definiciones de apoyo a la diapositiva (borrador)

Fuente: UNE-EN 1998-1:2018, anejo B (B.1 a B.12 y 4.3.3.4.2.3). Convención: **el asterisco marca el sistema de un grado de libertad (SDOF)**; sin asterisco, la estructura real. Los símbolos μ y R_μ no son de la norma: la norma usa q_u (aquí q_u = factor de reducción por ductilidad); μ es el nombre habitual del N2 original y de la app.

## 1. Pushover (curva de capacidad real)
- **F_b**: cortante en la base. **d_C**: desplazamiento del nudo de control C (centro de masas de la cubierta), con forma normalizada Φ_C = 1.
- Cargas: F_i = m_i·Φ_i (B.1). Es triangular solo si la forma Φ es lineal con la altura.
- **F_b,máx**: cortante máximo. **d_m**: desplazamiento en ese punto (por defecto, donde se forma el mecanismo plástico).
- **d_u**: desplazamiento último. Criterio por defecto de la app: el cortante cae al 80 % del máximo tras el pico. Si la curva no baja hasta el 80 %, la app toma el último punto del pushover, que depende de dónde se detuvo el análisis; el usuario puede fijar un valor manual.
- En el dibujo, las flechas rojas son las cargas F_i y la flecha grande de la base es la reacción F_b (cortante en la base), opuesta a la suma de las cargas.

## 2. Paso al SDOF
- **m\*** = Σ m_i·Φ_i (B.2). **Γ** = m\* / Σ m_i·Φ_i² (B.3).
- **F\*** = F_b/Γ y **d\*** = d_C/Γ (B.4, B.5). Mismo factor en los dos ejes: la rigidez inicial no cambia (F\*/d\* = F_b/d_C).
- Puntos: **d_m\*** = d_m/Γ, **d_u\*** = d_u/Γ, **F_y\*** = F\*(d_m\*) = F_b,máx/Γ cuando d_m es el máximo.
- Aceleración equivalente: a\* = F\*/m\* (es el eje del formato aceleración-desplazamiento).

## 3. Bilineal equivalente (elasto-plástica perfecta, B.3)
- **F_y\*** = fuerza en la formación del mecanismo plástico = F\*(d_m\*).
- **E_m\***: energía (área bajo la curva real) hasta d_m\*. Las dos áreas se igualan: **d_y\*** = 2·(d_m\* − E_m\*/F_y\*) (B.6). Debe cumplirse 0 < d_y\* < d_m\*.
- Rigidez k\* = F_y\*/d_y\*. Periodo **T\*** = 2π·√(d_y\*/(F_y\*/m\*)) (B.7, igual que 2π√(m\*·d_y\*/F_y\*)). F_y\*/m\* es la altura de la meseta en el diagrama aceleración-desplazamiento.
- La norma da una única construcción. Lo que cambia entre curvas con y sin rama descendente es dónde se toma d_m\*.

## 4. Demanda elástica
- **S_e(T)**: espectro elástico de aceleración (UNE-EN 1998-1:2018 con Anexo Nacional). **T_C**: periodo de fin de la meseta.
- La recta de periodo T\* (en formato aceleración-desplazamiento, pendiente (2π/T\*)²) corta al espectro elástico en (d_et\*, S_e(T\*)).
- **d_et\*** = S_e(T\*)·(T\*/2π)² (B.8): desplazamiento si el sistema fuese elástico ilimitado.

## 5. Desplazamiento objetivo
- **q_u** = S_e(T\*)/(F_y\*/m\*) (B.11): cuántas veces la aceleración elástica supera la de la meseta. Es un cociente de alturas, no una diferencia, y por eso en el dibujo no se acota con una flecha: se marcan las dos alturas en el eje vertical. Si q_u ≤ 1 la respuesta es elástica y d_t\* = d_et\* (B.9).
- **μ** = d_t\*/d_y\*: ductilidad demandada del SDOF (horizontal en el diagrama). Es un resultado, no un dato. No es el q del proyecto por fuerzas (que incluye sobrerresistencia y es una decisión).
- **T\* ≥ T_C** (B.12): d_t\* = d_et\* (igual desplazamiento, empírico), y μ = q_u.
- **T\* < T_C** (B.10): d_t\* = (d_et\*/q_u)·(1 + (q_u − 1)·T_C/T\*), equivalente a μ = 1 + (q_u − 1)·T_C/T\*. Se verifica que d_t\* = μ·d_y\*.
- **Límite**: d_t\* no necesita superar 3·d_et\*. Si actúa, el resultado ya no es el corte con el espectro de esa μ.
- **Lectura gráfica**: el espectro inelástico de ductilidad μ se obtiene bajando cada punto (S_d, S_a) del elástico R veces y desplazándolo μ/R en horizontal (R = q_u en T\*). Su corte con la meseta de la bilineal da d_t\*. No es el espectro elástico lo que se corta con la capacidad.
- Diferencia con FEMA: allí se busca un amortiguamiento equivalente hasta que el espectro amortiguado corta la capacidad. Aquí se reduce por ductilidad.

## 6. De vuelta a la estructura
- **d_t** = Γ·d_t\*: desplazamiento objetivo de la estructura real, que es lo que se comprueba.
- 4.3.3.4.2.3(1): el pushover debe calcularse al menos hasta el **150 % de d_t**.
- Comprobar d_t con los estados límite (DL, SD, NC) es otro paso, fuera de esta diapositiva.

## Nota: iteración (opcional, tras B.12)
Si d_t\* difiere mucho de d_m\*, se repiten los pasos 2 a 4 de la norma (bilineal, periodo, desplazamiento objetivo) tomando d_m\* = d_t\*. La app itera hasta una variación menor del 5 %.

## Aviso sobre el dibujo
Las curvas son sintéticas y no a escala. En el panel 5 se ilustran dos casos con el mismo espectro (T\* = 0,8 s y 0,25 s con T_C = 0,5 s). Los valores que salen (por ejemplo μ = 2,44 y μ = 4,0) no son datos de ninguna estructura.
