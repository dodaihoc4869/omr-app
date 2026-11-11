import sys, os, json
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from camxx import Cam
RA, MH, DA = sys.argv[1:4]
cam = Cam(MH); R = json.load(open(os.path.join(DA, 'cua-so.json')))
x = {}
E = []
for r in R:
    if r['cos'] <= 0.25 and r['vad'] >= 0.6:
        if r['id'] not in x: x[r['id']] = np.fromfile(os.path.join(RA, r['id'], 't16.f32'), np.float32)
        E.append(cam.nhung(x[r['id']][int(r['t'] * 16000):int(r['t'] * 16000) + 16000]))
t = np.mean(E, 0); t /= np.linalg.norm(t); np.save(os.path.join(DA, 'tam-khac.npy'), t); print('tâm khác từ', len(E))
