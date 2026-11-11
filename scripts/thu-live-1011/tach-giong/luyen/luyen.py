# LUYỆN MÔ HÌNH «CHỈ GIỌNG THẦY» (riêng một người nói, không cần mẫu giọng lúc chạy) — JAX, CPU.
# Khung: 24 kHz, cửa sổ căn-Hann 480 mẫu (20 ms), bước 240 (10 ms) ⇒ trễ thuật toán 20 ms. Ở 48 kHz app dùng cửa sổ 960 / bước 480: các ô 0..220 trùng tần số.
# Mạng: log-phổ 221 ô (0–11 kHz, trên 11 kHz tệp MP3 không còn tiếng) ⇒ Dense 192 ⇒ GRU 192 ⇒ GRU 192 ⇒ Dense 221 ⇒ sigmoid = MẶT NẠ từng ô. Dải trên 11 kHz:
# app nhân với trung bình mặt nạ 6–11 kHz (giữ độ sáng khi thầy nói, tắt khi người khác nói).
# Mất mát: sai số phổ nén (|.|^0,3) có trọng số tăng ở 3–11 kHz (giữ độ sáng) + phạt THÊM khi mất tiếng thầy + phạt phần giọng khác còn lọt.
#   python3 -I luyen.py <du-lieu> <thư mục checkpoint> [số bước]
import sys, os, glob, json, time, subprocess, pickle
import numpy as np
import jax, jax.numpy as jnp, optax

DL, CK = sys.argv[1], sys.argv[2]
SO_BUOC = int(sys.argv[3]) if len(sys.argv) > 3 else 30000
os.makedirs(CK, exist_ok=True)
HZ, N, H, NB, D = 24000, 480, 240, 221, 192
GIAY, BATCH = 3.0, 16
L = int(GIAY * HZ)
WIN = np.sqrt(0.5 - 0.5 * np.cos(2 * np.pi * np.arange(N) / N)).astype(np.float32)
GIU = ['75f8acfc']                      # buổi giữ riêng để chấm (không luyện)
GIU_KHAC = ['bac5a835']                  # giọng khác thật giữ riêng
GIU_AM = [f'{i:02d}' for i in range(55, 61)]
rng = np.random.default_rng(int(time.time()))

def rf(p): return np.fromfile(p, np.float32)
def noi(ds, ho=(0.05, 0.6)):
    o = []
    for x in ds: o += [x, np.zeros(int(rng.uniform(*ho) * HZ), np.float32)]
    return np.concatenate(o)
def napDuLieu():  # quét lại mỗi 2000 bước: buổi Live mới (canh-buoi-moi.sh) tự vào tập luyện; tập chấm giữ cố định
    global THAY, THAY_V, KHAC, KHAC_V
    thayTep = sorted(glob.glob(os.path.join(DL, 'live/thay/*.f32')))
    khacTep = sorted(glob.glob(os.path.join(DL, 'live/khac/*.f32')))
    THAY = noi([rf(f) for f in thayTep if os.path.basename(f)[:8] not in GIU])
    THAY_V = noi([rf(f) for f in thayTep if os.path.basename(f)[:8] in GIU])
    KHAC = noi([rf(f) for f in khacTep if os.path.basename(f)[:8] not in GIU_KHAC], (0.05, 0.3))
    KHAC_V = noi([rf(f) for f in khacTep if os.path.basename(f)[:8] in GIU_KHAC], (0.05, 0.3))
napDuLieu()
AM = {os.path.basename(f)[:2]: rf(f) for f in glob.glob(os.path.join(DL, 'am/*.f32'))}
AM_L = [v for k, v in AM.items() if k not in GIU_AM]; AM_V = [v for k, v in AM.items() if k in GIU_AM]
onp = os.path.join(DL, 'on.f32')
if not os.path.exists(onp):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(DL, '../mau/on-that.wav'), '-ac', '1', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', '48k', '-f', 'mp3', '-'], capture_output=True, check=True)
    r = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'mp3', '-i', '-', '-ac', '1', '-ar', '24000', '-f', 'f32le', '-'], input=r.stdout, capture_output=True, check=True)
    np.frombuffer(r.stdout, np.float32).tofile(onp)
ON = rf(onp)
print(f'thầy luyện {len(THAY) / HZ:.0f} s · thầy chấm {len(THAY_V) / HZ:.0f} s · khác thật {len(KHAC) / HZ:.0f}/{len(KHAC_V) / HZ:.0f} s · AudioMNIST {len(AM_L)}/{len(AM_V)} người', flush=True)

def stft(x):  # x: (B, L) ⇒ (B, T, N/2+1) phức, khung nhân quả bắt đầu ở 0
    T = 1 + (x.shape[-1] - N) // H
    idx = np.arange(N)[None, :] + H * np.arange(T)[:, None]
    return np.fft.rfft(x[..., idx] * WIN, axis=-1)
def istft(X, dai):
    f = np.fft.irfft(X, N, axis=-1) * WIN; o = np.zeros(X.shape[:-2] + (dai,), np.float32)
    for t in range(X.shape[-2]): o[..., t * H:t * H + N] += f[..., t, :]
    return o
def cat(s, n):
    if len(s) <= n: return np.pad(s, (0, n - len(s)))
    a = rng.integers(0, len(s) - n); return s[a:a + n]
def rmsHd(x):
    f = x[:len(x) // 240 * 240].reshape(-1, 240); e = (f ** 2).mean(1); e = e[e > 1e-7]
    return np.sqrt(e.mean()) if len(e) else 0.0
def eq(T):  # đường cong khuếch đại ngẫu nhiên, trơn theo tần số (±4 dB), mô phỏng mic / vị trí khác
    k = np.linspace(0, 1, N // 2 + 1); g = sum(rng.uniform(-4, 4) * np.cos(np.pi * j * k) for j in range(1, 4)) * rng.uniform(0, 1)
    return 10 ** (g / 20)

def tocDo(s, n):  # đổi tốc độ / cao độ nhẹ (±6 % ≈ ±1 bán cung): cắt n·r mẫu rồi nội suy về n
    r = rng.uniform(0.94, 1.06); m = int(np.ceil(n * r)); x = cat(s, m)
    return np.interp(np.arange(n) * (m - 1) / max(n - 1, 1), np.arange(m), x).astype(np.float32)
def vang(x, rt60, drr):  # vang phòng tổng hợp: đường thẳng + đuôi ồn suy giảm hàm mũ (RT60 giây, tỉ lệ thẳng / vang dB)
    n = int(rt60 * HZ); tt = np.arange(n) / HZ
    h = rng.standard_normal(n) * np.exp(-6.9 * tt / rt60); h[:int(0.002 * HZ)] = 0
    h *= 10 ** (-drr / 20) / max(np.sqrt((h ** 2).sum()), 1e-9); h[0] = 1.0
    m = 1 << int(np.ceil(np.log2(len(x) + n)))
    return np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(h, m), m)[:len(x)].astype(np.float32)
def mau(thay, khac, am, rr=None):
    """Một mẫu 3 s: (Y phức, S phức) — Y = thầy + giọng khác + ồn, S = chỉ thầy (cùng EQ, cùng vang, cùng mức)."""
    t = (tocDo(thay, L) if rng.random() < 0.5 else cat(thay, L)) if rng.random() > 0.12 else np.zeros(L, np.float32)
    if rng.random() < 0.4 and t.any(): t = vang(t, rng.uniform(0.1, 0.35), rng.uniform(6, 20))
    n_k = 0 if rng.random() < 0.15 else (2 if rng.random() < 0.2 else 1); i = np.zeros(L, np.float32)
    for _ in range(n_k):
        nguon = khac if rng.random() < 0.4 else am[rng.integers(len(am))]
        s = (tocDo(nguon, L) if rng.random() < 0.3 else cat(nguon, L)).copy()
        if rng.random() < 0.6: s = vang(s, rng.uniform(0.2, 0.7), rng.uniform(-3, 10))
        if rng.random() < 0.6:  # chỉ nói một khúc ⇒ có lúc một mình, lúc chồng, có điểm bắt đầu / dứt
            a = rng.integers(0, L // 2); b = rng.integers(a + L // 4, L + 1); s[:a] = 0; s[b:] = 0
        r = rmsHd(s)
        if r > 0: i += s / r * 10 ** (-rng.uniform(-6, 12) / 20)
    rt = rmsHd(t)
    if rt > 0: t = t / rt; i = i  # giọng khác đã tính theo mức thầy = 1
    else: i = i * 10 ** (rng.uniform(-12, 0) / 20)
    if rng.random() < 0.5: on = cat(ON, L)
    else:  # ồn màu: phổ ~ f^(-a/2), a ∈ [0, 2] (trắng ⇒ hồng ⇒ nâu)
        fr = np.arange(L // 2 + 1) + 1.0
        on = np.fft.irfft((rng.standard_normal(L // 2 + 1) + 1j * rng.standard_normal(L // 2 + 1)) * fr ** (-rng.uniform(0, 2) / 2), L).astype(np.float32)
    ro = rmsHd(on); on = on / max(ro, 1e-9) * 10 ** (-rng.uniform(10, 45) / 20)
    muc = 10 ** (rng.uniform(-32, -12) / 20)
    S = stft((t * muc)[None])[0] * eq(None)
    Y = S + stft(((i + on) * muc)[None])[0]
    return Y, S

# ── chuẩn hoá đặc trưng (cố định, ghi vào checkpoint) ──
def dacTrung(Y): return np.log10(np.abs(Y[..., :NB]) ** 2 + 1e-10).astype(np.float32)
_tmp = np.stack([dacTrung(mau(THAY, KHAC, AM_L)[0]) for _ in range(64)])
MU = _tmp.mean((0, 1)); SD = _tmp.std((0, 1)) + 1e-3

def khoi(key, a, b): return jax.random.normal(key, (a, b)) * np.sqrt(1.0 / a)
def tao(key):
    k = jax.random.split(key, 8)
    return {'Wi': khoi(k[0], NB, D), 'bi': jnp.zeros(D),
            'g1x': khoi(k[1], D, 3 * D), 'g1h': khoi(k[2], D, 3 * D), 'g1b': jnp.zeros(3 * D),
            'g2x': khoi(k[3], D, 3 * D), 'g2h': khoi(k[4], D, 3 * D), 'g2b': jnp.zeros(3 * D),
            'Wo': khoi(k[5], D, NB) * 0.1, 'bo': jnp.full(NB, 2.0)}
def gru(x, Wx, Wh, b):  # x (B,T,D) ⇒ (B,T,D); z,r,n theo thứ tự [0:D,D:2D,2D:3D]; n = tanh(xn + r*(h Wh_n)); h' = (1-z) n + z h
    xs = jnp.einsum('btd,de->tbe', x, Wx) + b
    def buoc(h, xt):
        hh = h @ Wh
        z = jax.nn.sigmoid(xt[:, :D] + hh[:, :D]); r = jax.nn.sigmoid(xt[:, D:2 * D] + hh[:, D:2 * D])
        n = jnp.tanh(xt[:, 2 * D:] + r * hh[:, 2 * D:])
        h = (1 - z) * n + z * h
        return h, h
    _, hs = jax.lax.scan(buoc, jnp.zeros((x.shape[0], D)), xs)
    return jnp.transpose(hs, (1, 0, 2))
def matNa(p, f):
    x = jnp.tanh(((f - MU) / SD) @ p['Wi'] + p['bi'])
    x = gru(x, p['g1x'], p['g1h'], p['g1b'])
    x = gru(x, p['g2x'], p['g2h'], p['g2b']) + x
    return jax.nn.sigmoid(x @ p['Wo'] + p['bo'])
TS = np.ones(NB, np.float32); hz = np.arange(NB) * 50.0; TS[hz >= 3000] = 1.6; TS[hz >= 6000] = 2.2  # trọng số giữ độ sáng
TS = jnp.asarray(TS / TS.mean())
def matMat(p, f, Ya, Sa, Ia):
    M = matNa(p, f)
    c = 0.3
    Sh = (M * Ya) ** c; St = Sa ** c
    l1 = jnp.mean(TS * (Sh - St) ** 2)
    l2 = jnp.mean(TS * jax.nn.relu(St - Sh) ** 2)          # mất tiếng thầy ⇒ phạt thêm
    l3 = jnp.mean((M * Ia) ** c * (St < 1e-3 * jnp.max(St)))  # giọng khác lọt ở ô không có thầy
    return l1 + 1.0 * l2 + 0.05 * l3
lich = optax.warmup_cosine_decay_schedule(1e-4, 1.5e-3, min(500, SO_BUOC // 4), max(SO_BUOC, 1000), 5e-5)
toiUu = optax.chain(optax.clip_by_global_norm(1.0), optax.adam(lich))
@jax.jit
def buoc(p, o, f, Ya, Sa, Ia):
    l, g = jax.value_and_grad(matMat)(p, f, Ya, Sa, Ia)
    u, o = toiUu.update(g, o, p)
    return optax.apply_updates(p, u), o, l
matNaJ = jax.jit(matNa)

def loBatch(thay, khac, am, n):
    Y, S = zip(*[mau(thay, khac, am) for _ in range(n)]); Y = np.stack(Y); S = np.stack(S)
    Yb = Y[..., :NB]; Sb = S[..., :NB]
    return dacTrung(Y), np.abs(Yb).astype(np.float32), np.abs(Sb).astype(np.float32), np.abs(Yb - Sb).astype(np.float32)

# ── tập chấm cố định ──
def siSdr(o, g):
    a = (o * g).sum() / max((g * g).sum(), 1e-12); s = a * g; n = o - s
    return 10 * np.log10((s ** 2).sum() / max((n ** 2).sum(), 1e-12))
rv = np.random.default_rng(1)
def tapCham():
    o = []
    for k in range(24):
        t = THAY_V[(k * 2 * HZ) % (len(THAY_V) - L):][:L]
        s = KHAC_V[(k * HZ) % (len(KHAC_V) - L):][:L] if k % 2 == 0 else cat(AM_V[k % len(AM_V)], L)
        sir = [2, -5, 10][k % 3]
        o.append((t / max(rmsHd(t), 1e-9) * 0.1, s / max(rmsHd(s), 1e-9) * 0.1 * 10 ** (-sir / 20), sir))
    return o
CHAM = tapCham()
def cham(p):
    kq = {'thayGiu': [], 'khacGiam': [], 'chong': {2: [], -5: [], 10: []}}
    for t, s, sir in CHAM:
        for loai, x, goc in (('thay', t, t), ('khac', s, None), ('chong', t + s, t)):
            X = stft(x[None])[0]; M = np.asarray(matNaJ(P, dacTrung(X)[None]))[0]
            g = np.ones(N // 2 + 1, np.float32)[None].repeat(M.shape[0], 0); g[:, :NB] = M; g[:, NB:] = M[:, 120:NB].mean(1, keepdims=True)
            y = istft(X * g, L)
            dl = N  # trễ thuật toán: istft(stft) nhân quả không lùi mẫu ⇒ so trực tiếp
            if loai == 'thay': kq['thayGiu'].append(siSdr(y[N:-N], x[N:-N]))
            elif loai == 'khac': kq['khacGiam'].append(10 * np.log10((x[N:-N] ** 2).sum() / max((y[N:-N] ** 2).sum(), 1e-12)))
            else: kq['chong'][sir].append(siSdr(y[N:-N], goc[N:-N]) - siSdr(x[N:-N], goc[N:-N]))
    return {'thayGiuSiSdr': round(float(np.median(kq['thayGiu'])), 1), 'khacGiamDb': round(float(np.median(kq['khacGiam'])), 1),
            **{f'chongTang{k}dB': round(float(np.median(v)), 1) for k, v in kq['chong'].items()}}

def docTgt(duong):  # nạp trọng số từ tệp .tgt (định dạng của lõi JS src/lib/live/tach-giong-thay.ts) — để tinh chỉnh tiếp từ bản của nhánh khác
    import struct
    b = open(duong, 'rb').read(); assert b[:4] == b'TGT1'
    n = struct.unpack('<I', b[4:8])[0]; h = json.loads(b[8:8 + n]); o = (8 + n + 3) & ~3
    f = np.frombuffer(b[o:], '<f4'); D_, NB_ = h['D'], h['NB']; assert (D_, NB_) == (D, NB), 'khác kiến trúc'
    hinh = [('MU', (NB,)), ('SD', (NB,)), ('Wi', (NB, D)), ('bi', (D,)), ('g1x', (D, 3 * D)), ('g1h', (D, 3 * D)), ('g1b', (3 * D,)), ('g2x', (D, 3 * D)), ('g2h', (D, 3 * D)), ('g2b', (3 * D,)), ('Wo', (D, NB)), ('bo', (NB,))]
    p, i = {}, 0
    for k, sh in hinh:
        m = int(np.prod(sh)); p[k] = f[i:i + m].reshape(sh).copy(); i += m
    assert i == len(f)
    return {k: jnp.asarray(v) for k, v in p.items() if k not in ('MU', 'SD')}, p['MU'], p['SD'], h
P = tao(jax.random.PRNGKey(0)); O = toiUu.init(P); b0 = 0
moi = sorted(glob.glob(os.path.join(CK, 'ck-*.pkl')))
if not moi and os.environ.get('TG_KHOI'):  # TG_KHOI=<tệp .tgt>: khởi từ trọng số có sẵn (bước đếm lại từ 0, lịch học từ đầu)
    P, MU, SD, h0 = docTgt(os.environ['TG_KHOI']); O = toiUu.init(P); print('khởi từ', os.environ['TG_KHOI'], h0.get('ban'), flush=True)
if moi:
    with open(moi[-1], 'rb') as fh: d = pickle.load(fh)
    P, O, b0 = d['P'], d['O'], d['buoc']; MU, SD = d['MU'], d['SD']; print('nạp lại', moi[-1], flush=True)
t0 = time.time(); ls = []
for b in range(b0, SO_BUOC):
    f, Ya, Sa, Ia = loBatch(THAY, KHAC, AM_L, BATCH)
    P, O, l = buoc(P, O, f, Ya, Sa, Ia); ls.append(float(l))
    if (b + 1) % 100 == 0:
        print(f'bước {b + 1} mất mát {np.mean(ls):.4f} · {(time.time() - t0) / 100:.2f} s/bước', flush=True); ls = []; t0 = time.time()
    if (b + 1) % 2000 == 0: napDuLieu(); print(f'dữ liệu: thầy luyện {len(THAY) / HZ:.0f} s · khác thật {len(KHAC) / HZ:.0f} s', flush=True)
    if (b + 1) % 1000 == 0:
        with open(os.path.join(CK, f'ck-{b + 1:06d}.pkl'), 'wb') as fh: pickle.dump({'P': jax.device_get(P), 'O': jax.device_get(O), 'buoc': b + 1, 'MU': MU, 'SD': SD}, fh)
        for cu in sorted(glob.glob(os.path.join(CK, 'ck-*.pkl')))[:-3]: os.remove(cu)
        print('CHẤM', b + 1, json.dumps(cham(P)), flush=True)
