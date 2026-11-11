# ĐO NHIỄU THẬT trên «Xem lại Live»: trong vùng CHỈ CÓ THẦY (bỏ emNoi ± 1 s, bỏ lang), tách cửa sổ «giọng thầy» / «giọng khác» bằng CAM++,
# xác nhận có giọng nói bằng Silero VAD, đo mức (dBFS) theo khung 10 ms ở 24 kHz.
#   python3 -I phan-tich.py <thư mục live> <CAM++.onnx> <silero_vad.onnx> <tệp kết quả json>
import sys, os, json
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from camxx import Cam
import onnxruntime as ort

RA, MH, VAD, KQ = sys.argv[1:5]
cam = Cam(MH)
vad = ort.InferenceSession(VAD, providers=['CPUExecutionProvider'])

def silero(x16):
    """Xác suất có giọng mỗi khúc 32 ms (512 mẫu 16 kHz)."""
    st = np.zeros((2, 1, 128), np.float32); ctx = np.zeros(64, np.float32); o = []
    sr = np.array(16000, np.int64)
    for i in range(0, len(x16) - 511, 512):
        c = x16[i:i + 512]
        p, st = vad.run(None, {'input': np.concatenate([ctx, c])[None].astype(np.float32), 'state': st, 'sr': sr})
        ctx = c[-64:]; o.append(float(p.reshape(-1)[0]))
    return np.array(o)

CUA, BUOC = 1.0, 0.25   # cửa sổ 1 s, bước 0,25 s
MUC_CO_TIENG = -60.0    # khung 10 ms > −60 dBFS ⇒ có tiếng
du = []
for id in sorted(os.listdir(RA)):
    d = os.path.join(RA, id)
    x24 = np.fromfile(os.path.join(d, 't24.f32'), np.float32)
    x16 = np.fromfile(os.path.join(d, 't16.f32'), np.float32)
    b = json.load(open(os.path.join(d, 'buoi.json')))
    n = len(x24) // 240
    db = 10 * np.log10(np.mean(x24[:n * 240].reshape(n, 240).astype(np.float64) ** 2, axis=1) + 1e-12)
    t = (np.arange(n) + 0.5) * 0.01
    chi = np.ones(n, bool)
    for e in b['emNoi']: chi &= ~((t >= e['t0'] / 1000 - 1) & (t <= e['t1'] / 1000 + 1))
    for a, z in b['lang']: chi &= ~((t >= a / 1000) & (t <= z / 1000))
    pv = silero(x16)                                  # mỗi 32 ms
    pk = np.interp(t, (np.arange(len(pv)) + 0.5) * 0.032, pv)  # nội suy về khung 10 ms
    k = 0
    while (k + 100) <= n:
        if chi[k:k + 100].all():
            co = db[k:k + 100] > MUC_CO_TIENG
            if co.sum() >= 40:
                # nối các khung có tiếng (16 kHz) như bộ nhận giọng lượt 1
                s16 = np.concatenate([x16[(k + j) * 160:(k + j + 1) * 160] for j in range(100) if co[j]])
                e = cam.nhung(s16)
                if e is not None:
                    w = db[k:k + 100][co]
                    du.append(dict(id=id, t=k / 100, e=e, muc=float(10 * np.log10(np.mean(10 ** (w / 10)))), p50=float(np.median(w)),
                                   vad=float(np.mean(pk[k:k + 100][co])), dbk=db[k:k + 100].copy(), co=co.copy(), pk=pk[k:k + 100].copy()))
        k += 25
    print(id, 'chỉ thầy', round(chi.sum() / 100), 's, cửa sổ', sum(1 for r in du if r['id'] == id), flush=True)

E = np.array([r['e'] for r in du]); M = np.array([r['muc'] for r in du]); V = np.array([r['vad'] for r in du])
# tâm giọng thầy: khởi từ nửa to nhất có giọng, lặp lấy cửa sổ cos > 0,5
tam = E[(M >= np.median(M)) & (V > 0.5)].mean(0); tam /= np.linalg.norm(tam)
for _ in range(4):
    c = E @ tam; tam = E[c > 0.5].mean(0); tam /= np.linalg.norm(tam)
C = E @ tam
h, be = np.histogram(C, bins=np.arange(-0.2, 1.01, 0.05))
print('histogram cos:'); [print(f'  {be[i]:+.2f} {h[i]:5d} ' + '#' * int(60 * h[i] / max(h))) for i in range(len(h))]
np.save(os.path.join(os.path.dirname(KQ), 'tam-thay.npy'), tam)
out = [dict(id=r['id'], t=r['t'], cos=float(C[i]), muc=r['muc'], p50=r['p50'], vad=r['vad']) for i, r in enumerate(du)]
json.dump(out, open(KQ, 'w'))
# khung 10 ms (để phiên sau đo theo khung): lưu riêng
np.savez_compressed(os.path.join(os.path.dirname(KQ), 'khung.npz'), db=np.array([r['dbk'] for r in du]), co=np.array([r['co'] for r in du]), pk=np.array([r['pk'] for r in du]), cos=C, vad=V)
print('đã ghi', len(out), 'cửa sổ')
