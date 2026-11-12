# LỌC GIỌNG THẦY TỪ TỆP BÀI GIẢNG (mp3 thầy gửi). Bước 1 — phân tích: cửa sổ 1,5 s bước 0,5 s ⇒ mức (dBFS) + cos CAM++ với tâm thầy (do-a/tam-thay.npy).
#   python3 -I loc-yt.py <x16.f32> <CAM++.onnx> <tam-thay.npy> <ra.npz>
import sys, os
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'nhieu-that'))  # camxx.py (CAM++ onnx) ở nhieu-that/
from camxx import Cam
X, MH, TAM, RA = sys.argv[1:5]
x = np.fromfile(X, np.float32); tam = np.load(TAM); cam = Cam(MH)
W, B = 24000, 8000
t, db, cs = [], [], []
for i in range(0, len(x) - W + 1, B):
    w = x[i:i + W]; r = 20 * np.log10(np.sqrt(np.mean(w ** 2)) + 1e-9)
    e = cam.nhung(w) if r > -50 else None
    t.append(i / 16000); db.append(r); cs.append(float(e @ tam) if e is not None else np.nan)
t, db, cs = map(np.array, (t, db, cs))
np.savez(RA, t=t, db=db, cs=cs)
ok = ~np.isnan(cs)
print(f'{len(t)} cửa sổ · có tiếng {ok.sum()} · mức trung vị {np.median(db):.1f} dBFS')
for a, b in ((-1, 0.15), (0.15, 0.25), (0.25, 0.35), (0.35, 0.45), (0.45, 0.494), (0.494, 0.55), (0.55, 0.65), (0.65, 1.01)):
    print(f'cos [{a:.3f}, {b:.3f}): {np.sum(ok & (cs >= a) & (cs < b))}')
# đoạn liền có cos < 0,3 (không phải thầy / nhạc)
thap = ok & (cs < 0.3); i = 0
while i < len(t):
    if thap[i]:
        j = i
        while j + 1 < len(t) and thap[j + 1]: j += 1
        if j - i >= 2: print(f'  thấp {t[i]:.1f}–{t[j] + 1.5:.1f} s · cos TB {np.nanmean(cs[i:j + 1]):.2f} · mức {np.mean(db[i:j + 1]):.1f}')
        i = j + 1
    else: i += 1
