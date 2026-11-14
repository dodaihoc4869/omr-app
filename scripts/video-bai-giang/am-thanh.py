# VIDEO BÀI GIẢNG — ÂM THANH (thử 14/11). Ba lớp, cùng đồng hồ với kich-ban.json:
#   1) GIỌNG THẦY: ghép đúng các mảnh giọng (t0 ← [s0, s1] của tiếng gốc), mép nối làm mềm 12 ms, rồi lọc ồn + nén nhẹ.
#   2) NHẠC NỀN tự soạn (MIDI, Fa trưởng 112 BPM, I-V-vi-IV) ⇒ fluidsynth + FluidR3_GM (giấy phép MIT). Nhạc nhỏ đi khi Thầy nói (sidechain),
#      lắng xuống lúc đố vui, giai điệu chỉ ở mở đầu và kết.
#   3) TIẾNG ĐỘNG tổng hợp bằng numpy: vút (vào / ra), bóp, dập, tích tắc, chuông đúng, bong bóng.
# Dùng: python3 am-thanh.py <kich-ban.json> <tieng.mp3> <thư mục ra>   ⇒ <ra>/am-thanh.m4a (đã chuẩn -16 LUFS)
import json, os, struct, subprocess, sys
import numpy as np

kb_tep, tieng_tep, ra = sys.argv[1:4]
os.makedirs(ra, exist_ok=True)
kb = json.load(open(kb_tep, encoding='utf8'))
SR = 48000
T = kb['tong']
N = int(round(T * SR))
rng = np.random.default_rng(1311)

def chay(*lenh):
    subprocess.run(lenh, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def ghi_wav(tep, x):
    x = np.clip(x, -1, 1)
    if x.ndim == 1: x = x[:, None]
    du = (x * 32767).astype('<i2').tobytes()
    with open(tep, 'wb') as f:
        ch = x.shape[1]
        f.write(b'RIFF' + struct.pack('<I', 36 + len(du)) + b'WAVEfmt ' + struct.pack('<IHHIIHH', 16, 1, ch, SR, SR * ch * 2, ch * 2, 16) + b'data' + struct.pack('<I', len(du)) + du)

# ── 1) GIỌNG ──
goc = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', tieng_tep, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], check=True, capture_output=True).stdout, dtype='<f4')
giong = np.zeros(N, dtype=np.float32)
mem = int(0.012 * SR)
for m in kb['giong']:
    a, b, o = int(m['s0'] * SR), int(m['s1'] * SR), int(m['t0'] * SR)
    if a < 0 or b > len(goc) or b <= a: continue
    doan = goc[a:b].copy()
    k = min(mem, len(doan) // 2)
    doan[:k] *= np.linspace(0, 1, k); doan[len(doan) - k:] *= np.linspace(1, 0, k)
    e = min(N, o + len(doan)); giong[o:e] += doan[:e - o]
ghi_wav(f'{ra}/giong-tho.wav', giong)
chay('ffmpeg', '-y', '-v', 'error', '-i', f'{ra}/giong-tho.wav', '-af', 'highpass=f=85,afftdn=nf=-28,equalizer=f=3200:t=q:w=1.2:g=2.5,acompressor=threshold=-22dB:ratio=3:attack=5:release=140:makeup=2.5,alimiter=limit=0.89', '-ar', str(SR), f'{ra}/giong.wav')

# ── 2) NHẠC (MIDI tự viết) ──
BPM, PPQ = kb.get('nhip', 112), 480
BEAT = 60 / BPM; BAR = 4 * BEAT
su = []  # (tick, thứ tự, bytes)
def tk(giay): return int(round(giay / BEAT * PPQ))
def not_(kenh, t, d, so, luc):
    if luc <= 0: return
    su.append((tk(t), 1, bytes([0x90 | kenh, so, min(127, int(luc))]))); su.append((tk(t + d), 0, bytes([0x80 | kenh, so, 0])))
def nhac_cu(kenh, so): su.append((0, 0, bytes([0xC0 | kenh, so])))
for kenh, so in [(0, 12), (1, 33), (2, 45), (3, 89), (4, 108), (5, 9)]: nhac_cu(kenh, so)
su.append((0, 0, bytes([0xB3, 7, 70]))); su.append((0, 0, bytes([0xB2, 7, 85])))

HOP = [  # (bass, hợp âm giữa)
    (41, [65, 69, 72]), (36, [64, 67, 72]), (38, [62, 65, 69]), (34, [62, 65, 70])]
GIAI = [[72, None, 69, 72, 77, None, 76, 74], [72, None, 67, 72, 76, None, 74, 72], [69, None, 65, 69, 74, None, 72, 69], [70, 72, 74, 77, 74, None, 72, None]]
doan = kb['doan']
ket = next(d for d in doan if d['loai'] == 'ket')
dv = next((d['doVui'] for d in doan if d['loai'] == 'canh' and d.get('doVui')), None)
so_o = int((T - 1.2) // BAR)  # ô nhịp hợp âm cuối
mo_dau_doan = next(d for d in doan if d['loai'] == 'mo-dau')
N_MO = max(2, round(mo_dau_doan['t1'] / BAR))  # số ô nhịp mở đầu (kịch bản đặt mở đầu đúng N ô)
o_ket = int(ket['t0'] // BAR)
for o in range(so_o + 1):
    t0 = o * BAR
    bass, hop = HOP[o % 4]
    cuoi = o == so_o
    mo_dau = o < N_MO
    lang = dv is not None and t0 + BAR > dv['t0'] - 0.3 and t0 < dv['t1']
    giai = mo_dau or o >= o_ket
    if cuoi:  # hợp âm Fa ngân + chũm chọe
        for s in [41, 53]: not_(1, t0, BAR, s, 95)
        for s in [65, 69, 72, 77]: not_(0, t0, BAR, s, 85); not_(3, t0, BAR * 1.2, s - 12, 70); not_(4, t0, BAR, s, 70)
        not_(9, t0, BEAT, 49, 100); not_(9, t0, BEAT, 36, 110); continue
    # đệm pad cả ô
    for s in hop: not_(3, t0, BAR * 0.98, s - 12, 46 if not mo_dau else 55)
    # marimba rải 8 móc đơn
    mau = [hop[0], hop[1], hop[2], hop[1], hop[0] + 12, hop[2], hop[1], hop[2]]
    for i, s in enumerate(mau):
        if lang and i % 2: continue
        not_(0, t0 + i * BEAT / 2, BEAT / 2 * 0.9, s, (70 if i % 2 == 0 else 56) * (0.8 if lang else 1))
    # bass nảy
    if not (o == 0 or lang):
        for i, (b, v) in enumerate([(0, 92), (1.5, 70), (2, 84), (3, 74), (3.5, 64)]):
            not_(1, t0 + b * BEAT, BEAT * 0.45, bass + (12 if i == 1 else 7 if i == 3 else 0), v)
    # pizz chặn nhịp phách lẻ — bật từng khối 8 ô
    if not mo_dau and not lang and (o // 8) % 2 == 1:
        for i in range(4):
            for s in hop: not_(2, t0 + (i + 0.5) * BEAT, BEAT * 0.25, s, 50)
    # giai điệu kalimba + chuông
    if giai and not cuoi:
        for i, s in enumerate(GIAI[o % 4]):
            if s is None: continue
            not_(4, t0 + i * BEAT / 2, BEAT / 2 * 0.95, s, 92); not_(5, t0 + i * BEAT / 2, BEAT / 2 * 0.6, s + 12, 46)
    # trống
    if o >= N_MO - 1 or o >= o_ket:
        if o == N_MO or o == o_ket: not_(9, t0, BEAT * 2, 49, 92)
        if o == N_MO - 1:  # dồn trống vào thẻ chương đầu
            for i in range(8): not_(9, t0 + 2 * BEAT + i * BEAT / 4, BEAT / 4, 38, 40 + i * 9)
            not_(9, t0, BEAT, 36, 90)
            continue
        if not lang:
            for b in [0, 2] + ([2.5] if o % 2 else []): not_(9, t0 + b * BEAT, BEAT / 2, 36, 96)
            for b in [1, 3]: not_(9, t0 + b * BEAT, BEAT / 2, 39, 74)
        for i in range(8): not_(9, t0 + i * BEAT / 2, BEAT / 4, 42, 52 if i % 2 else 38)
        if not lang:
            for i in range(16): not_(9, t0 + i * BEAT / 4, BEAT / 8, 82, 26 + (8 if i % 4 == 2 else 0))
            if o % 2 == 1: not_(9, t0 + 3.5 * BEAT, BEAT / 2, 46, 48)

su.sort(key=lambda x: (x[0], x[1]))
def vlq(n):
    out = [n & 0x7F]; n >>= 7
    while n: out.insert(0, (n & 0x7F) | 0x80); n >>= 7
    return bytes(out)
than = bytearray(b'\x00\xff\x51\x03' + int(60_000_000 / BPM).to_bytes(3, 'big'))
truoc = 0
for t, _, b in su: than += vlq(t - truoc) + b; truoc = t
than += b'\x00\xff\x2f\x00'
with open(f'{ra}/nhac.mid', 'wb') as f:
    f.write(b'MThd' + struct.pack('>IHHH', 6, 0, 1, PPQ) + b'MTrk' + struct.pack('>I', len(than)) + than)
chay('fluidsynth', '-ni', '-g', '0.7', '-r', str(SR), '-F', f'{ra}/nhac-tho.wav', '/usr/share/sounds/sf2/FluidR3_GM.sf2', f'{ra}/nhac.mid')

# ── 3) TIẾNG ĐỘNG ──
def bao(x, a, r):
    n = len(x); e = np.ones(n); ka, kr = int(a * SR), int(r * SR)
    if ka: e[:ka] = np.linspace(0, 1, ka) ** 1.5
    if kr: e[n - kr:] *= np.linspace(1, 0, kr) ** 2
    return x * e
def loc_thap(x, fc):  # lọc thông thấp một cực, tần số cắt đổi theo thời gian
    fc = np.broadcast_to(fc, x.shape); a = np.exp(-2 * np.pi * fc / SR); y = np.zeros_like(x); z = 0.0
    for i in range(len(x)): z = (1 - a[i]) * x[i] + a[i] * z; y[i] = z
    return y
def vut(dai=0.6, len_=True):
    n = int(dai * SR); x = rng.standard_normal(n); u = np.linspace(0, 1, n)
    fc = 300 + 5200 * (u ** 1.6 if len_ else (1 - u) ** 1.6)
    y = loc_thap(x, fc) - loc_thap(x, fc * 0.18)
    y = bao(y, dai * (0.75 if len_ else 0.15), dai * (0.25 if len_ else 0.8))
    y /= np.max(np.abs(y)) + 1e-9
    pan = u if len_ else 1 - u
    return np.stack([y * np.cos(pan * np.pi / 2), y * np.sin(pan * np.pi / 2)], 1) * 0.42
def bop():
    n = int(0.11 * SR); t = np.arange(n) / SR; f = 340 + 760 * np.exp(-t * 55)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 34)
    y[: int(0.002 * SR)] += rng.standard_normal(int(0.002 * SR)) * 0.3
    return np.stack([y, y], 1) * 0.34
def dap():
    n = int(0.55 * SR); t = np.arange(n) / SR; f = 46 + 110 * np.exp(-t * 18)
    boom = np.tanh(1.8 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.exp(-t * 6.5)
    ns = loc_thap(rng.standard_normal(n), 1800) * np.exp(-t * 22) * 0.9
    sh = loc_thap(rng.standard_normal(n), 9000) * np.exp(-t * 9) * 0.12
    y = boom * 0.8 + ns + sh
    return np.stack([y, y], 1) * 0.5
def tich(cao=False):
    n = int(0.07 * SR); t = np.arange(n) / SR
    y = (np.sin(2 * np.pi * (2300 if cao else 1700) * t) + 0.6 * np.sin(2 * np.pi * (3400 if cao else 2550) * t)) * np.exp(-t * 80)
    return np.stack([y, y], 1) * (0.32 if cao else 0.24)
def dung():
    n = int(1.6 * SR); y = np.zeros(n)
    for k, f0 in enumerate([1046.5, 1318.5, 1568.0, 2093.0]):
        o = int(k * 0.075 * SR); t = np.arange(n - o) / SR
        for r, a in [(1, 1), (2.0, 0.35), (2.76, 0.22), (5.4, 0.08)]: y[o:] += a * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t * (3.2 + r))
    return np.stack([y, y], 1) * 0.16
def bot():
    n = int(0.12 * SR); t = np.arange(n) / SR; f = 300 + 1400 * (t / t[-1]) ** 1.3
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / t[-1]) ** 0.6
    return np.stack([y, y], 1) * 0.3
def bip():
    n = int(0.09 * SR); t = np.arange(n) / SR; f = 1500 + 400 * np.exp(-t * 40)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 45)
    return np.stack([y, y], 1) * 0.12
def dung_nhe():
    n = int(0.9 * SR); y = np.zeros(n)
    for k, f0 in enumerate([1318.5, 1760.0]):
        o = int(k * 0.09 * SR); t = np.arange(n - o) / SR
        y[o:] += np.sin(2 * np.pi * f0 * t) * np.exp(-t * 5) + 0.3 * np.sin(2 * np.pi * f0 * 2 * t) * np.exp(-t * 8)
    return np.stack([y, y], 1) * 0.1
def ve():  # tiếng bút dạ quệt
    n = int(0.32 * SR); x = rng.standard_normal(n); u = np.linspace(0, 1, n)
    y = loc_thap(x, 2500 + 2500 * u) - loc_thap(x, 900)
    y = bao(y, 0.05, 0.18); y /= np.max(np.abs(y)) + 1e-9
    return np.stack([y * (1 - u * 0.5), y * (0.5 + u * 0.5)], 1) * 0.16
MAU = {'bip': bip(), 'dung-nhe': dung_nhe(), 've': ve(), 'vut': vut(), 'vut-ra': vut(0.5, False), 'bop': bop(), 'dap': dap(), 'tich': tich(), 'tich-cuoi': tich(True), 'dung': dung(), 'bot': bot()}
sfx = np.zeros((N + SR * 2, 2))
for s in kb['sfx']:
    x = MAU.get(s['loai'])
    if x is None: continue
    o = int(s['t'] * SR) - (int(0.42 * SR) if s['loai'] == 'vut' else 0)
    o = max(0, o); sfx[o:o + len(x)] += x
ghi_wav(f'{ra}/sfx.wav', sfx[:N])

# ── TRỘN ── nhạc né giọng (sidechain), giọng ở giữa, chuẩn -16 LUFS, cắt đúng độ dài video
chay('ffmpeg', '-y', '-v', 'error', '-i', f'{ra}/giong.wav', '-i', f'{ra}/nhac-tho.wav', '-i', f'{ra}/sfx.wav', '-filter_complex',
     f'[0:a]aresample={SR},asplit=2[g][gk];'
     f'[1:a]aresample={SR},volume=1.0,afade=t=out:st={T - 1.6:.3f}:d=1.5[n];'
     f'[n][gk]sidechaincompress=threshold=0.03:ratio=4:attack=25:release=480:makeup=1[nd];'
     f'[g]pan=stereo|c0=c0|c1=c0[gs];'
     f'[gs][nd][2:a]amix=inputs=3:normalize=0:duration=first,loudnorm=I=-16:TP=-1.5:LRA=11,atrim=0:{T:.3f},apad=whole_dur={T:.3f}[o]',
     '-map', '[o]', '-ar', str(SR), '-c:a', 'aac', '-b:a', '192k', f'{ra}/am-thanh.m4a')
print('xong', f'{ra}/am-thanh.m4a')
