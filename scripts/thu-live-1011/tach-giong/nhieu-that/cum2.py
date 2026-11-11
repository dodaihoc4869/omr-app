# Cụm «khác» là ai: tâm từng buổi, cos giữa các tâm, cao độ F0 trung vị (tự tương quan, khung 40 ms có giọng), độ nghiêng phổ.
import sys, os, json
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from camxx import Cam
RA, MH, KQ = sys.argv[1:4]
cam = Cam(MH)
R = json.load(open(KQ))
tam = np.load(os.path.join(os.path.dirname(KQ), 'tam-thay.npy'))
x16 = {i: np.fromfile(os.path.join(RA, i, 't16.f32'), np.float32) for i in set(r['id'] for r in R)}

def f0(seg):
    o = []
    for i in range(0, len(seg) - 640, 320):
        f = seg[i:i + 640].astype(np.float64); f -= f.mean()
        if np.sqrt(np.mean(f ** 2)) < 10 ** (-40 / 20): continue
        a = np.correlate(f, f, 'full')[639:]
        lo, hi = 16000 // 400, 16000 // 70
        k = lo + int(np.argmax(a[lo:hi]))
        if a[k] / a[0] > 0.5: o.append(16000 / k)
    return o
def nghieng(seg):
    p = np.abs(np.fft.rfft(seg * np.hanning(len(seg)))) ** 2; f = np.fft.rfftfreq(len(seg), 1 / 16000)
    return 10 * np.log10(p[(f > 2000) & (f < 7000)].sum() / p[(f > 100) & (f < 1000)].sum())

nhom = {}
for r in R:
    loai = 'THAY' if r['cos'] >= 0.4 else 'KHAC' if r['cos'] <= 0.25 else None
    if loai is None or r['vad'] < 0.5: continue
    nhom.setdefault((r['id'][-8:], loai), []).append(r)
tams = {}
for (i, loai), ds in sorted(nhom.items()):
    seg = [x16['BH-20261111-' + i][int(r['t'] * 16000):int((r['t'] + 1) * 16000)] for r in ds]
    E = np.array([cam.nhung(s) for s in seg if len(s) >= 16000]); c = E.mean(0); c /= np.linalg.norm(c); tams[(i, loai)] = c
    F = [v for s in seg for v in f0(s)]
    print(f'{i} {loai}: n={len(ds):3d}  F0 P25/50/75 = {np.percentile(F,25):.0f}/{np.percentile(F,50):.0f}/{np.percentile(F,75):.0f} Hz  độ nghiêng {np.median([nghieng(s) for s in seg]):.1f} dB  tự nhất quán cos={np.median(E @ c):.2f}  cos với tâm thầy={c @ tam:.2f}')
ks = list(tams)
print('cos giữa các tâm:')
for a in ks: print('  ', f'{a[0]}-{a[1]:4s}', ' '.join(f'{tams[a] @ tams[b]:+.2f}' for b in ks))
