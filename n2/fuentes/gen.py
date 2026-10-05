import math, json
from ref import *
def curve(K0, F1, R, kh, dp, ks, dend, n1=24, n2=12, fl=None):
    def F(x):
        if x <= dp: return K0*x/(1+(K0*x/F1)**R)**(1/R) + kh*x
        Fp = F(dp); return max(Fp - ks*(x-dp), 0)
    xs = [dp*(i/n1)**1.6 for i in range(n1+1)] + [dp + (dend-dp)*i/n2 for i in range(1, n2+1)]
    return [round(x, 5) for x in xs], [round(F(x), 1) for x in xs]
if __name__ == '__main__':
  pass
ex = {}
# E1 puente HA, longitudinal, Lorca, terreno B
d, F = curve(K0=95000, F1=2350, R=2.2, kh=1100, dp=0.26, ks=4300, dend=0.40)
m = [2240, 200, 200, 200]; phi = [1, 0.833, 0.5, 0.167]
sp = spectrum(0.192, 1.0, 500, 1.0); r = n2(d, F, m, phi, 0, sp)
ex['E1'] = dict(d=d, F=F, m=m, phi=phi, r=r, sp={k: v for k, v in sp.items() if k != 'Se'})
# E2 pila de fábrica, transversal (sitio del ejemplo de cabeceo), terreno C
H = 40; b0, l0, mB, mL = 4.5, 2.5, 0.1, 0.1; gam = 22
w = lambda z: gam*(b0+2*mB*(H-z))*(l0+2*mL*(H-z))  # kN/m
ms_ = []; ph_ = []
for i in range(5):
    za, zb = 8*i, 8*i+8; zm = (za+zb)/2
    ms_.append(round(sum(w(za+(zb-za)*(k+.5)/200)*(zb-za)/200 for k in range(200))/G, 0)); ph_.append(round(zm/H, 3))
m2 = [309] + ms_[::-1]; phi2 = [1.0] + ph_[::-1]
d, F = curve(K0=1.05e6, F1=13600, R=3.0, kh=0, dp=0.045, ks=26000, dend=0.30)
sp2 = spectrum(0.1416, 1.0, 270, 1.0); r = n2(d, F, m2, phi2, 0, sp2)
ex['E2'] = dict(d=d, F=F, m=m2, phi=phi2, r=r, sp={k: v for k, v in sp2.items() if k != 'Se'})
# E3 edificio de 5 plantas de muros de HA, Barcelona, terreno B
m3 = [380, 420, 420, 420, 420]; phi3 = [1.0, 0.82, 0.62, 0.40, 0.19]
d, F = curve(K0=1.0e6, F1=6500, R=2.5, kh=3000, dp=0.045, ks=20000, dend=0.10)
sp3 = spectrum(0.087, 1.0, 450, 1.0); r = n2(d, F, m3, phi3, 0, sp3)
ex['E3'] = dict(d=d, F=F, m=m3, phi=phi3, r=r, sp={k: v for k, v in sp3.items() if k != 'Se'})
for k, e in ex.items():
    r = e['r']; print(k, 'm*=%.1f Γ=%.4f e*=%.3f du=%.4f' % (r['ms'], r['Gam'], r['es'], r['du']), 'TC=%.3f' % e['sp']['TC'])
    for h in r['hist']: print('   ', {a: (round(b, 5) if isinstance(b, float) else b) for a, b in h.items()})
    print('   dt=%.4f  1.5dt=%.4f dend=%.3f' % (r['dt'], 1.5*r['dt'], r['dend']))
json.dump(ex, open('examples.json', 'w'))
