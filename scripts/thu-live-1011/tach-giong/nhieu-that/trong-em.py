# Giọng «khác» có phải là em đang lên bảng không: cửa sổ TRONG emNoi chấm với tâm thầy và tâm cụm khác.
import sys, os, json
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from camxx import Cam
RA, MH, KQ = sys.argv[1:4]
cam = Cam(MH); R = json.load(open(KQ))
tam = np.load(os.path.join(os.path.dirname(KQ), 'tam-thay.npy'))
x16 = {}
def x(i):
    if i not in x16: x16[i] = np.fromfile(os.path.join(RA, i, 't16.f32'), np.float32)
    return x16[i]
K = np.array([cam.nhung(x(r['id'])[int(r['t'] * 16000):int(r['t'] * 16000) + 16000]) for r in R if r['cos'] <= 0.25 and r['vad'] >= 0.6])
tk = K.mean(0); tk /= np.linalg.norm(tk)
print('tâm khác · tâm thầy cos =', round(float(tk @ tam), 2))
for id in sorted(os.listdir(RA)):
    b = json.load(open(os.path.join(RA, id, 'buoi.json'))); s = x(id); ct, ck, nt, nk, n = [], [], 0, 0, 0
    for e in b['emNoi']:
        for t in np.arange(e['t0'] / 1000 + 0.5, e['t1'] / 1000 - 1.5, 1.0):
            w = s[int(t * 16000):int(t * 16000) + 16000]
            if len(w) < 16000 or 10 * np.log10(np.mean(w.astype(np.float64) ** 2) + 1e-12) < -45: continue
            v = cam.nhung(w); a, c = float(v @ tam), float(v @ tk); n += 1
            if a >= 0.4 and c < a: nt += 1
            elif c >= 0.4 and a < c: nk += 1
    print(id[-8:], f'cửa sổ có tiếng trong emNoi: {n}, giống thầy {nt}, giống «khác» {nk}')
