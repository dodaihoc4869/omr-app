# TRÍCH DỮ LIỆU LUYỆN từ «Xem lại Live» (mọi phần của buổi, kể cả trong emNoi): cửa sổ 1 s bước 0,25 s ⇒ cos CAM++ với tâm thầy (T) và tâm «khác» (K).
# Khung 10 ms là GIỌNG THẦY SẠCH khi MỌI cửa sổ phủ nó có cosT ≥ 0,45 và cosK ≤ 0,20; là GIỌNG KHÁC khi mọi cửa sổ phủ có cosK ≥ 0,40 và cosT ≤ 0,20.
# Ghép khung liền ⇒ đoạn ≥ 1 s (giữ quãng nghỉ ngắn bên trong). Ra: <ra>/thay/<buổi>_<i>.f32, <ra>/khac/<buổi>_<i>.f32 (24 kHz) + muc-luc.json.
#   python3 -I trich-du-lieu.py <thư mục live> <CAM++.onnx> <thư mục đo A> <thư mục ra>
import sys, os, json
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from camxx import Cam
RA, MH, DA, OUT = sys.argv[1:5]
cam = Cam(MH)
tamT = np.load(os.path.join(DA, 'tam-thay.npy'))
R = json.load(open(os.path.join(DA, 'cua-so.json')))
# tâm K: cửa sổ vùng chỉ thầy có cos ≤ 0,25 và vad ≥ 0,6
x16 = {}
def s16(i):
    if i not in x16: x16[i] = np.fromfile(os.path.join(RA, i, 't16.f32'), np.float32)
    return x16[i]
EK = np.array([cam.nhung(s16(r['id'])[int(r['t'] * 16000):int(r['t'] * 16000) + 16000]) for r in R if r['cos'] <= 0.25 and r['vad'] >= 0.6])
tamK = EK.mean(0); tamK /= np.linalg.norm(tamK)
os.makedirs(os.path.join(OUT, 'thay'), exist_ok=True); os.makedirs(os.path.join(OUT, 'khac'), exist_ok=True)
muc = []
for id in sorted(os.listdir(RA)):
    x24 = np.fromfile(os.path.join(RA, id, 't24.f32'), np.float32); x = s16(id)
    n = len(x24) // 240
    db = 10 * np.log10(np.mean(x24[:n * 240].reshape(n, 240).astype(np.float64) ** 2, axis=1) + 1e-12)
    sT = np.zeros(n); minT = np.full(n, 9.0); maxKt = np.full(n, -9.0); minK = np.full(n, 9.0); maxTk = np.full(n, -9.0); phu = np.zeros(n, int)
    for k in range(0, n - 100 + 1, 25):
        w = x[k * 160:(k + 100) * 160]
        if 10 * np.log10(np.mean(w.astype(np.float64) ** 2) + 1e-12) < -50: continue
        e = cam.nhung(w); a, c = float(e @ tamT), float(e @ tamK)
        sl = slice(k, k + 100)
        sT[sl] += a; minT[sl] = np.minimum(minT[sl], a); maxKt[sl] = np.maximum(maxKt[sl], c)
        minK[sl] = np.minimum(minK[sl], c); maxTk[sl] = np.maximum(maxTk[sl], a); phu[sl] += 1
    b = json.load(open(os.path.join(RA, id, 'buoi.json'))); t = (np.arange(n) + 0.5) * 0.01; em = np.zeros(n, bool)
    for e in b['emNoi']: em |= (t >= e['t0'] / 1000 - 1) & (t <= e['t1'] / 1000 + 1)
    tb = sT / np.maximum(phu, 1)
    # ngoài emNoi ± 1 s: TB ≥ 0,40, nhỏ nhất ≥ 0,25, «khác» ≤ 0,25 · TRONG emNoi ± 1 s (có thể lẫn giọng em): lọc chặt TB ≥ 0,50, nhỏ nhất ≥ 0,40, «khác» ≤ 0,15
    thay = (phu > 0) & np.where(em, (tb >= 0.50) & (minT >= 0.40) & (maxKt <= 0.15), (tb >= 0.40) & (minT >= 0.25) & (maxKt <= 0.25))
    khac = (phu > 0) & (minK >= 0.40) & (maxTk <= 0.20)
    for ten, m in (('thay', thay), ('khac', khac)):
        k = 0; i = 0
        while k < n:
            if not m[k]: k += 1; continue
            z = k
            while z < n and m[z]: z += 1
            if z - k >= 50:
                seg = x24[k * 240:z * 240]
                seg.astype(np.float32).tofile(os.path.join(OUT, ten, f'{id[-8:]}_{i}.f32'))
                muc.append(dict(loai=ten, buoi=id[-8:], i=i, t0=k / 100, giay=(z - k) / 100, muc=float(np.percentile(db[k:z][db[k:z] > -60], 50)) if (db[k:z] > -60).any() else None))
                i += 1
            k = z
    print(id[-8:], 'thầy', round(sum(m['giay'] for m in muc if m['buoi'] == id[-8:] and m['loai'] == 'thay'), 1), 's · khác', round(sum(m['giay'] for m in muc if m['buoi'] == id[-8:] and m['loai'] == 'khac'), 1), 's', flush=True)
json.dump(muc, open(os.path.join(OUT, 'muc-luc.json'), 'w'), ensure_ascii=False)
