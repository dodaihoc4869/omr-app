# XUẤT checkpoint (pickle JAX) ⇒ tệp .tgt cho lõi JS (src/lib/live/tach-giong-thay.ts) + đầu ra tham chiếu numpy (24 kHz) để test JS khớp số.
#   python3 -I xuat.py <ck.pkl> <ra.tgt> [ban] [tham-chieu.json]
import sys, json, pickle, struct, datetime
import numpy as np
ck, ra = sys.argv[1], sys.argv[2]
ban = sys.argv[3] if len(sys.argv) > 3 else 'thu'
with open(ck, 'rb') as fh: d = pickle.load(fh)
P = {k: np.asarray(v, np.float32) for k, v in d['P'].items()}
D, NB = P['bi'].shape[0], P['Wi'].shape[0]
h = {'ban': ban, 'ngay': datetime.date.today().isoformat(), 'buoc': int(d['buoc']), 'D': int(D), 'NB': int(NB), 'hiTu': 120, 'hzLuyen': 24000, 'giongLuyen': 'Xem lai Live 11/11'}
js = json.dumps(h, ensure_ascii=True).encode()
dau = b'TGT1' + struct.pack('<I', len(js)) + js
dau += b'\0' * ((-len(dau)) % 4)
thu = [np.asarray(d['MU'], np.float32), np.asarray(d['SD'], np.float32)] + [P[k].reshape(-1) for k in ['Wi', 'bi', 'g1x', 'g1h', 'g1b', 'g2x', 'g2h', 'g2b', 'Wo', 'bo']]
with open(ra, 'wb') as fh:
    fh.write(dau)
    for a in thu: fh.write(a.astype('<f4').tobytes())
print('đã ghi', ra, sum(a.size for a in thu), 'tham số')
if len(sys.argv) > 4:  # tham chiếu: 0,5 s tiếng giả 24 kHz ⇒ mặt nạ numpy
    rng = np.random.default_rng(3); x = (rng.standard_normal(12000) * 0.05).astype(np.float32)
    x += 0.1 * np.sin(2 * np.pi * 220 * np.arange(12000) / 24000).astype(np.float32)
    N, H = 480, 240; W = np.sqrt(0.5 - 0.5 * np.cos(2 * np.pi * np.arange(N) / N))
    buf = np.zeros(N); h1 = np.zeros(D); h2 = np.zeros(D); ms = []
    sg = lambda v: 1 / (1 + np.exp(-v))
    def gru(x, h, Wx, Wh, b):
        xt = x @ Wx + b; hh = h @ Wh
        z = sg(xt[:D] + hh[:D]); r = sg(xt[D:2 * D] + hh[D:2 * D]); n = np.tanh(xt[2 * D:] + r * hh[2 * D:])
        return (1 - z) * n + z * h
    for k in range(0, len(x) - H + 1, H):
        buf = np.concatenate([buf[H:], x[k:k + H]]); X = np.fft.rfft(buf * W)
        f = (np.log10(np.abs(X[:NB]) ** 2 + 1e-10) - d['MU']) / d['SD']
        a = np.tanh(f @ P['Wi'] + P['bi']); h1 = gru(a, h1, P['g1x'], P['g1h'], P['g1b']); h2 = gru(h1, h2, P['g2x'], P['g2h'], P['g2b'])
        ms.append(sg((h1 + h2) @ P['Wo'] + P['bo']))
    json.dump({'x': x.tolist(), 'm': [m.tolist() for m in ms]}, open(sys.argv[4], 'w'))
