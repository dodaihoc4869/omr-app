# Số đo A theo KHUNG 10 ms: mỗi khung có tiếng (> −60 dBFS, Silero ≥ 0,5) trong vùng chỉ thầy gán nhãn của cửa sổ 1 s có tâm gần nhất
# (T: cos ≥ 0,40 · K: cos ≤ 0,25 · ?: giữa). Mức giọng thầy / giọng khác (phân vị), hiệu (dB), tỉ lệ thời gian, chuyển lượt nhanh.
import sys, json
import numpy as np
R = json.load(open(sys.argv[1])); Z = np.load(sys.argv[2])
DB, CO, PK = Z['db'], Z['co'], Z['pk']
ket = {'buoi': {}, 'gop': {}}
gop = {'T': [], 'K': [], '?': []}
for id in sorted(set(r['id'] for r in R)):
    idx = [i for i, r in enumerate(R) if r['id'] == id]
    # khung → (mức, vad, nhãn cửa sổ có tâm gần nhất)
    kh = {}
    for i in idx:
        r = R[i]; tam = r['t'] + 0.5
        l = 'T' if r['cos'] >= 0.40 else ('K' if r['cos'] <= 0.25 else '?')
        for j in range(100):
            k = round(r['t'] * 100) + j; d = abs((k + 0.5) / 100 - tam)
            if k not in kh or d < kh[k][3]: kh[k] = (DB[i][j], PK[i][j], l, d)
    f = {'T': [], 'K': [], '?': []}
    for k, (m, p, l, _) in sorted(kh.items()):
        if m > -60 and p >= 0.5: f[l].append(m)
    tong = sum(len(v) for v in f.values())
    if tong < 300: continue
    o = {l: dict(giay=round(len(v) / 100, 1), p10=round(float(np.percentile(v, 10)), 1), p50=round(float(np.percentile(v, 50)), 1), p90=round(float(np.percentile(v, 90)), 1)) if len(v) >= 50 else dict(giay=round(len(v) / 100, 1)) for l, v in f.items()}
    o['tiLeKhac'] = round(len(f['K']) / tong, 2); o['tiLeMo'] = round(len(f['?']) / tong, 2)
    if 'p50' in o['T'] and 'p50' in o['K']: o['hieuP50'] = round(o['T']['p50'] - o['K']['p50'], 1)
    ket['buoi'][id] = o
    for l in f: gop[l] += f[l]
    print(id[-8:], json.dumps(o, ensure_ascii=False))
tong = sum(len(v) for v in gop.values())
g = {l: dict(giay=round(len(v) / 100, 1), p10=round(float(np.percentile(v, 10)), 1), p50=round(float(np.percentile(v, 50)), 1), p90=round(float(np.percentile(v, 90)), 1)) for l, v in gop.items()}
g['tiLeKhac'] = round(len(gop['K']) / tong, 2); g['tiLeMo'] = round(len(gop['?']) / tong, 2); g['hieuP50'] = round(g['T']['p50'] - g['K']['p50'], 1)
g['hieuThayP50KhacP90'] = round(g['T']['p50'] - g['K']['p90'], 1)
ket['gop'] = g
print('GỘP', json.dumps(g, ensure_ascii=False))
json.dump(ket, open(sys.argv[3], 'w'), ensure_ascii=False, indent=1)
