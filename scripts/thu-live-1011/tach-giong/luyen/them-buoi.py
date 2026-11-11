# THÊM BUỔI MỚI vào tập luyện (buổi chưa có dấu .da-trich): CHỈ vùng ngoài emNoi ± 1 s, ngoài khoảng lặng, bỏ khung bão hoà (đỉnh ≥ 0,98) / gần câm.
# Giọng thầy: cửa sổ 1 s có cos TB ≥ 0,40, nhỏ nhất ≥ 0,25 với tâm thầy (và ≤ 0,25 với tâm «khác» của buổi thử) ⇒ du-lieu/live/thay/<buổi>_<i>.f32
# Giọng khác THẬT trong lớp: mọi cửa sổ phủ có cos thầy ≤ 0,15 và có tiếng ⇒ du-lieu/live/khac/<buổi>_<i>.f32. Buổi chấm cố định (75f8acfc) không đụng.
#   python3 -I them-buoi.py <thư mục live> <CAM++.onnx> <thư mục đo A> <du-lieu/live>
import sys, os, json
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from camxx import Cam
RA, MH, DA, OUT = sys.argv[1:5]
cam = Cam(MH)
tamT = np.load(os.path.join(DA, 'tam-thay.npy')); tamK = np.load(os.path.join(DA, 'tam-khac.npy')) if os.path.exists(os.path.join(DA, 'tam-khac.npy')) else None
for id in sorted(os.listdir(RA)):
    d = os.path.join(RA, id)
    if os.path.exists(os.path.join(d, '.da-trich')) or not os.path.exists(os.path.join(d, 't24.f32')) or id.endswith('75f8acfc'): continue
    x24 = np.fromfile(os.path.join(d, 't24.f32'), np.float32); x = np.fromfile(os.path.join(d, 't16.f32'), np.float32)
    b = json.load(open(os.path.join(d, 'buoi.json')))
    n = len(x24) // 240
    fr = x24[:n * 240].reshape(n, 240)
    db = 10 * np.log10(np.mean(fr.astype(np.float64) ** 2, axis=1) + 1e-12); dinh = np.abs(fr).max(1)
    t = (np.arange(n) + 0.5) * 0.01
    duoc = dinh < 0.98
    for e in b['emNoi']: duoc &= ~((t >= e['t0'] / 1000 - 1) & (t <= e['t1'] / 1000 + 1))
    for a, z in b['lang']: duoc &= ~((t >= a / 1000) & (t <= z / 1000))
    sT = np.zeros(n); minT = np.full(n, 9.0); maxT = np.full(n, -9.0); maxK = np.full(n, -9.0); phu = np.zeros(n, int)
    for k in range(0, n - 100 + 1, 25):
        if not duoc[k:k + 100].all(): continue
        w = x[k * 160:(k + 100) * 160]
        if 10 * np.log10(np.mean(w.astype(np.float64) ** 2) + 1e-12) < -50: continue
        e = cam.nhung(w); a = float(e @ tamT); c = float(e @ tamK) if tamK is not None else -1
        sl = slice(k, k + 100); sT[sl] += a; minT[sl] = np.minimum(minT[sl], a); maxT[sl] = np.maximum(maxT[sl], a); maxK[sl] = np.maximum(maxK[sl], c); phu[sl] += 1
    thay = duoc & (phu > 0) & (sT / np.maximum(phu, 1) >= 0.40) & (minT >= 0.25) & (maxK <= 0.25)
    khac = duoc & (phu > 0) & (maxT <= 0.15) & (db > -50)
    tong = {}
    for ten, m, toiThieu in (('thay', thay, 50), ('khac', khac, 50)):
        k = 0; i = 0; s = 0
        while k < n:
            if not m[k]: k += 1; continue
            z = k
            while z < n and m[z]: z += 1
            if z - k >= toiThieu:
                x24[k * 240:z * 240].astype(np.float32).tofile(os.path.join(OUT, ten, f'{id[-8:]}_{i}.f32')); i += 1; s += (z - k) / 100
            k = z
        tong[ten] = round(s, 1)
    open(os.path.join(d, '.da-trich'), 'w').write(json.dumps(tong))
    print(id, json.dumps(tong), flush=True)
