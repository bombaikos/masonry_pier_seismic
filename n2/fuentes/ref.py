# Implementación de referencia independiente (Python) del método N2, UNE-EN 1998-1 anejo B + AN español.
import math, json
G = 9.81

def interp(xs, ys, x):
    if x <= xs[0]: return ys[0]
    for i in range(1, len(xs)):
        if xs[i] >= x:
            r = (x - xs[i-1]) / (xs[i] - xs[i-1]); return ys[i-1] + r * (ys[i] - ys[i-1])
    return None  # fuera de la curva

def area(xs, ys, x):
    s = 0.0
    for i in range(1, len(xs)):
        if xs[i] <= x: s += 0.5 * (ys[i] + ys[i-1]) * (xs[i] - xs[i-1])
        else:
            if xs[i-1] < x:
                yx = interp(xs, ys, x); s += 0.5 * (yx + ys[i-1]) * (x - xs[i-1])
            break
    return s

def spectrum(agR, K, vs30, gI, xi=5.0):
    C = (800 / vs30) ** 0.465
    soil = 'A' if vs30 > 800 else 'B' if vs30 >= 360 else 'C' if vs30 >= 180 else 'D'
    TC = K/4 if soil == 'A' else K/2 if soil == 'D' else K*C/4
    TB, TD = TC/5, 2.0
    ag = gI * agR
    if soil == 'A': S = 1.0
    elif soil == 'D': S = 2 if ag <= 0.1 else (2.33 - 3.33*ag if ag <= 0.4 else 1)
    else: S = C if ag <= 0.1 else (C + 3.33*(ag-0.1)*(1-C) if ag <= 0.4 else 1)
    eta = max(math.sqrt(10/(5+xi)), 0.55)
    a = ag * G
    def Se(T):
        if T <= TB: return a*S*(1 + T/TB*(2.5*eta - 1))
        if T <= TC: return 2.5*a*S*eta
        if T <= TD: return 2.5*a*S*eta*TC/T
        return 2.5*a*S*eta*TC*TD/T**2   # (válido hasta 4 s; los ejemplos no lo superan)
    return dict(C=C, soil=soil, TB=TB, TC=TC, TD=TD, ag=ag, S=S, eta=eta, Se=Se)

def n2(d, F, m, phi, ctrl, sp, dm_crit='max', iterate=True, tol=0.05, du_pct=0.8):
    phi = [p/phi[ctrl] for p in phi]
    ms = sum(mi*p for mi, p in zip(m, phi)); s2 = sum(mi*p*p for mi, p in zip(m, phi))
    Gam = ms/s2; M = sum(m); es = Gam*ms/M
    ds = [x/Gam for x in d]; Fs = [y/Gam for y in F]
    imax = max(range(len(F)), key=lambda i: F[i])
    # d_u: primera caída al du_pct·Fmax después del máximo
    du = d[-1]
    for i in range(imax+1, len(F)):
        if F[i] <= du_pct*F[imax]:
            r = (F[i-1] - du_pct*F[imax])/(F[i-1]-F[i]); du = d[i-1] + r*(d[i]-d[i-1]); break
    dm = ds[imax] if dm_crit == 'max' else ds[-1]
    hist = []
    TC = sp['TC']
    for it in range(21):
        Fy = interp(ds, Fs, dm); Em = area(ds, Fs, dm)
        dy = 2*(dm - Em/Fy)
        T = 2*math.pi*math.sqrt(ms*dy/Fy)
        Se = sp['Se'](T); det = Se*(T/(2*math.pi))**2; qu = Se*ms/Fy
        if T >= TC: case, dt = 1, det
        elif qu <= 1: case, dt = 2, det
        else: case, dt = 3, det/qu*(1 + (qu-1)*TC/T)
        capped = dt > 3*det
        if capped: dt = 3*det
        hist.append(dict(dm=dm, Fy=Fy, Em=Em, dy=dy, T=T, Se=Se, det=det, qu=qu, case=case, dt=dt, capped=capped))
        if not iterate: break
        if it > 0 and abs(dt - hist[-2]['dt'])/hist[-2]['dt'] < tol: break
        if dt > ds[-1]: break
        dm = dt
    return dict(ms=ms, s2=s2, Gam=Gam, M=M, es=es, du=du, dus=du/Gam, hist=hist, dt=Gam*hist[-1]['dt'], dend=d[-1])

def site(grid, lon, lat):
    # AN.2, 3.2.1(2): punto de malla, sobre meridiano/paralelo (2 puntos) o 4 puntos; distancias en km
    cl = math.cos(math.radians(lat))
    dist = lambda p: math.hypot((p[0]-lon)*111.32*cl, (p[1]-lat)*110.57)
    on = lambda v: abs(v*10 - round(v*10)) < 1e-6
    ex = [p for p in grid if abs(p[0]-lon) < 1e-6 and abs(p[1]-lat) < 1e-6]
    if ex: return ex[0][3], ex[0][2], 'a'
    if on(lon) or on(lat):
        line = [p for p in grid if (on(lon) and abs(p[0]-lon) < 1e-6) or (on(lat) and abs(p[1]-lat) < 1e-6)]
        nn = sorted(line, key=dist)[:2]
        if len(nn) == 2:
            w = [1/dist(p) for p in nn]
            return sum(wi*p[3] for wi, p in zip(w, nn))/sum(w), sum(wi*p[2] for wi, p in zip(w, nn))/sum(w), 'b'
    nn = sorted(grid, key=dist)[:4]; w = [1/dist(p) for p in nn]
    return sum(wi*p[3] for wi, p in zip(w, nn))/sum(w), sum(wi*p[2] for wi, p in zip(w, nn))/sum(w), 'c'
