# LƯỢT 3 (11/11 đêm): THÊM GIỌNG THẦY NẰM TRONG emNoi ± 1 s (lúc em bật mic — 62 % giọng thầy trích được nằm ở đây, lượt 2 gần như bỏ hết).
# Chỉ giữ khung CHẮC CHẮN là thầy MỘT MÌNH:
#  1) HIỆU CHỈNH NGƯỠNG trên tập GIỮ RIÊNG (không bao giờ luyện), cửa sổ 1 s CAM++ (camxx.py, fbank y hệt ma-nhan.mjs):
#     dương = giọng thầy buổi chấm 75f8acfc (cham/thay-that.wav, cham/thay-to.wav);
#     âm    = giọng khác CHƯA GẶP đi qua ĐÚNG đường «Xem lại Live» (MP3 24 kHz 48 kb/s): kho mở tập chấm (du-lieu/mo-cham), AudioMNIST người giữ riêng
#             (am/55..60), giọng khác thật giữ riêng (cham/khac-that.wav), các giọng mẫu của bản đo 18 s (mau/*.wav).
#     ⇒ T ≥ T_min = phân vị 99 % cos-thầy của âm (≤ 1 % cửa sổ giọng khác lọt). E = ngưỡng cos-em (phân vị của cos(dương, tâm giọng em)).
#     HỖN HỢP (thầy chấm + một giọng khác thấp hơn 0 / 6 / 10 / 20 dB) — rủi ro thật trong emNoi là NÓI CHỒNG: lưới (T, E), chọn bộ giữ nhiều thầy nhất mà
#     hỗn hợp 0 dB lọt ≤ TG_TRON (5 %) cửa sổ. TG_T / TG_E ép ngưỡng; TG_CHI_HIEU_CHINH=1 chỉ in lưới.
#  2) TRÍCH: khung 10 ms trong emNoi ± 1 s (ngoài khoảng lặng, không bão hoà) là thầy khi có ≥ 3 cửa sổ 1 s (bước 0,25 s) phủ nó và MỌI cửa sổ ấy có
#     cos-thầy ≥ T* và cos-em ≤ E* (cos-em = max(cos với tâm giọng em của đoạn emNoi đó, cos với tâm «khác» chung)); đoạn liền ≥ 0,5 s.
#     Tâm giọng em của từng đoạn emNoi = trung bình cửa sổ trong đoạn có cos-thầy ≤ 0,20 (≥ 4 cửa sổ; thiếu ⇒ cả buổi; thiếu nữa ⇒ tâm «khác» chung).
#     Bỏ khung đã có trong thư mục ra (tệp cũ là lát cắt đúng mẫu của t24 ⇒ dò vị trí) ⇒ không trùng. Buổi chấm 75f8acfc KHÔNG đụng.
#  Ra: <ra>/<buổi8>_em<i>.f32 (24 kHz, miền MP3 như tệp cũ) + <so-do.json> (chỉ số, không tiếng).
#   python3 -I them-thay-em-noi.py <thư mục live> <CAM++.onnx> <thư mục đo A> <du-lieu> <thư mục cham> <thư mục mau> <ra = du-lieu-f/live/thay> <so-do.json>
import sys, os, glob, json, subprocess
import numpy as np
D = os.path.dirname(os.path.abspath(__file__))
sys.path[:0] = [D, os.path.join(D, '..', 'nhieu-that')]
from camxx import Cam
LIVE, MH, DA, DL, CHAM, MAU, RA, SO = sys.argv[1:9]
cam = Cam(MH, int(os.environ.get('TG_LUONG', '2')))
tamT = np.load(os.path.join(DA, 'tam-thay.npy')); tamK = np.load(os.path.join(DA, 'tam-khac.npy'))
GIU = '75f8acfc'

def ff(x, hz, ra_hz, mp3):  # đổi tần số (và đi qua MP3 24 kHz 48 kb/s như «Xem lại Live» nếu mp3)
    b = np.asarray(x, np.float32).tobytes(); vao = ['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', str(hz), '-ac', '1', '-i', '-']
    if mp3:
        b = subprocess.run(vao + ['-ar', '24000', '-c:a', 'libmp3lame', '-b:a', '48k', '-f', 'mp3', '-'], input=b, capture_output=True, check=True).stdout
        vao = ['ffmpeg', '-v', 'error', '-f', 'mp3', '-i', '-']
    return np.frombuffer(subprocess.run(vao + ['-ac', '1', '-ar', str(ra_hz), '-f', 'f32le', '-'], input=b, capture_output=True, check=True).stdout, np.float32)
def wav16(p, mp3=False):
    if mp3:
        x = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', '24000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32)
        return ff(x, 24000, 16000, True)
    return np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32)
def dbm(w): return 10 * np.log10(np.mean(w.astype(np.float64) ** 2) + 1e-12)
def nhungCs(x16, buoc=0.25, san=-45):  # nhúng mọi cửa sổ 1 s có tiếng (≥ san dBFS)
    o = []
    for a in range(0, len(x16) - 16000 + 1, int(buoc * 16000)):
        w = x16[a:a + 16000]
        if dbm(w) >= san:
            e = cam.nhung(w)
            if e is not None: o.append(e)
    return np.array(o)
def chuan(v): return v / (np.linalg.norm(v) + 1e-9)
def muc(x, db):  # đặt mức RMS phần có tiếng
    f = x[:len(x) // 160 * 160].reshape(-1, 160); e = (f.astype(np.float64) ** 2).mean(1); e = e[e > 1e-7]
    return x * (10 ** (db / 20) / np.sqrt(e.mean())) if len(e) else x

# ── 1) hiệu chỉnh (véc-tơ nhúng lưu đệm ở <so-do>.npz — chỉ nhúng, không tiếng) ──
DEM = (SO[:-5] if SO.endswith('.json') else SO) + '.npz'
if os.path.exists(DEM):
    z = np.load(DEM, allow_pickle=True); eD = z['eD']; eA = z['eA'].item(); TRON = list(z['tron'])
else:
    duong = {t: wav16(os.path.join(CHAM, t + '.wav')) for t in ('thay-that', 'thay-to')}
    eD = np.concatenate([nhungCs(x) for x in duong.values()])
    am = {}
    for f in sorted(glob.glob(os.path.join(DL, 'mo-cham', '*.f32'))):
        x = np.fromfile(f, np.float32)[:20 * 24000]; am['mo:' + os.path.basename(f)[:-4]] = ff(x, 24000, 16000, True)
    for k in range(55, 61):
        p = os.path.join(DL, 'am', f'{k:02d}.f32')
        if os.path.exists(p): am[f'audiomnist:{k}'] = ff(np.fromfile(p, np.float32)[:20 * 24000], 24000, 16000, False)
    am['khac-that'] = wav16(os.path.join(CHAM, 'khac-that.wav'))
    for t in ('giong-nam', 'giong-nu', 'giong-viet', 'xon-xao-1', 'xon-xao-2', 'xon-xao-3', 'xon-xao-4', 'xon-xao-5'):
        p = os.path.join(MAU, t + '.wav')
        if os.path.exists(p): am['mau:' + t] = wav16(p, True)
    eA = {k: nhungCs(v, 0.5) for k, v in am.items()}
    # HỖN HỢP: thầy chấm + giọng khác thấp hơn s dB (giọng em = khac-that, hoặc 6 người kho mở chấm); tâm em = tâm giọng ấy khi nói một mình (đúng như lúc trích)
    TRON = []; thay = duong['thay-that']
    for ten in ['khac-that'] + [k for k in eA if k.startswith('mo:')][::11][:6]:
        o = am[ten]; tE = chuan(eA[ten].mean(0))
        for s in (0, 6, 10, 20):
            n = min(len(thay), len(o) if len(o) > 16000 * 3 else len(thay)); oo = np.resize(o, n)
            e = nhungCs(muc(thay[:n], -25) + muc(oo, -25 - s)); TRON.append((s, ten, e @ tamT, np.maximum(e @ tamK, e @ tE)))
    np.savez(DEM, eD=eD, eA=np.array(eA, dtype=object), tron=np.array(TRON, dtype=object))
# NGƯỠNG Ở MỨC KHUNG — đúng luật trích (khung giữ khi MỌI cửa sổ phủ nó qua): gộp các cửa sổ LIỀN NHAU phủ một khung = min cos-thầy, max cos-em
# (dương và hỗn hợp bước 0,25 s ⇒ 4 cửa sổ / khung; giọng khác một mình bước 0,5 s ⇒ 2). Lượt thử đầu chọn ngưỡng ở mức CỬA SỔ (T 0,636 · E 0,192) ⇒ ở mức khung
# gần như không khung thầy nào qua (3 buổi đầu 0 s) ⇒ hiệu chỉnh lại ở mức khung.
def lan(a, w, f): return np.array([f(a[i:i + w]) for i in range(0, len(a) - w + 1)]) if len(a) >= w else np.zeros(0)
tamKhacThat = chuan(eA['khac-that'].mean(0))
cD = lan(eD @ tamT, 4, np.min); cDE = lan(np.maximum(eD @ tamK, eD @ tamKhacThat), 4, np.max)
cA = np.concatenate([lan(e @ tamT, 2, np.min) for e in eA.values() if len(e) >= 2])
T_MIN = float(np.quantile(cA, 0.99))   # ≤ 1 % khung giọng khác (một mình) lọt
TRON_K = [(s, lan(c, 4, np.min), lan(d, 4, np.max)) for s, _, c, d in TRON]
def tronQua(T, E, s): a = [((c >= T) & (d <= E)) for s2, c, d in TRON_K if s2 == s]; return float(np.concatenate(a).mean()) if a else None
# LƯỚI (T, E): T ≥ T_MIN; chọn bộ GIỮ NHIỀU KHUNG THẦY NHẤT mà hỗn hợp có giọng khác ngang thầy (0 dB) lọt ≤ TG_TRON (mặc định 5 %) khung
luoi = []
for T in sorted({T_MIN, *[float(v) for v in np.quantile(cD, [0.1, 0.2, 0.3, 0.4, 0.5]) if v > T_MIN]}):
    for E in sorted({float(v) for v in np.quantile(cDE, [0.3, 0.5, 0.7, 0.8, 0.9, 0.95, 0.99])}):
        luoi.append({'T': round(T, 3), 'E': round(E, 3), 'thayQua': round(float(((cD >= T) & (cDE <= E)).mean()), 3), **{f'tron{s}dB': round(tronQua(T, E, s), 3) for s in (0, 6, 10, 20)}})
TRAN = float(os.environ.get('TG_TRON', '0.05'))
hop = [r for r in luoi if r['tron0dB'] <= TRAN] or sorted(luoi, key=lambda r: r['tron0dB'])[:1]
chon = max(hop, key=lambda r: (r['thayQua'], -r['tron6dB']))
T_SAO = float(os.environ.get('TG_T', chon['T'])); E_SAO = float(os.environ.get('TG_E', chon['E']))
cAw = {k: lan(e @ tamT, 2, np.min) for k, e in eA.items() if len(e) >= 2}
kq = {'nguong': {'T': round(T_SAO, 3), 'E': round(E_SAO, 3), 'T_min_1pt': round(T_MIN, 3), 'tranTron0dB': TRAN, 'muc': 'khung'}, 'chon': chon,
      'duong': {'khung': int(len(cD)), 'minCosP10_50_90': [round(float(v), 3) for v in np.quantile(cD, [0.1, 0.5, 0.9])]},
      'am': {'khung': int(len(cA)), 'nguoi': len(eA), 'lotT': round(float((cA >= T_SAO).mean()), 4), 'lotTmin': round(float((cA >= T_MIN).mean()), 4), 'minCosP50_99_max': [round(float(v), 3) for v in np.quantile(cA, [0.5, 0.99, 1.0])],
             'lotTheoNguoi': {k: round(float((v >= T_SAO).mean()), 3) for k, v in cAw.items() if (v >= T_SAO).any()}},
      'luoi': luoi}
print(json.dumps({k: v for k, v in kq.items() if k != 'luoi'}, ensure_ascii=False), flush=True)
for r in luoi: print('  lưới', json.dumps(r), flush=True)
if os.environ.get('TG_CHI_HIEU_CHINH'): sys.exit(0)

# ── 2) trích ──
os.makedirs(RA, exist_ok=True)
daCo = {}
for f in glob.glob(os.path.join(RA, '*.f32')):
    daCo.setdefault(os.path.basename(f)[:8], []).append(np.fromfile(f, np.float32))
tong = {}; truoc = sum(os.path.getsize(f) for f in glob.glob(os.path.join(RA, '*.f32')) if not os.path.basename(f).startswith(GIU)) / 4 / 24000
for id in sorted(os.listdir(LIVE)):
    d = os.path.join(LIVE, id)
    if id.endswith(GIU) or not os.path.exists(os.path.join(d, 't24.f32')): continue
    x24 = np.fromfile(os.path.join(d, 't24.f32'), np.float32); x = np.fromfile(os.path.join(d, 't16.f32'), np.float32)
    b = json.load(open(os.path.join(d, 'buoi.json'))); n = len(x24) // 240
    fr = x24[:n * 240].reshape(n, 240); t = (np.arange(n) + 0.5) * 0.01
    em = np.zeros(n, bool)
    for e in b['emNoi']: em |= (t >= e['t0'] / 1000 - 1) & (t <= e['t1'] / 1000 + 1)
    duoc = em & (np.abs(fr).max(1) < 0.98)
    for a, z in b['lang']: duoc &= ~((t >= a / 1000) & (t <= z / 1000))
    # khung đã có trong thư mục ra (tệp cũ = lát cắt đúng mẫu của t24)
    for s in daCo.get(id[-8:], []):
        if len(s) < 480: continue
        dau = s[:240]; ung = np.flatnonzero(x24[:len(x24) - len(s) + 1] == dau[0])
        for u in ung:
            if u % 240 == 0 and np.array_equal(x24[u:u + 240], dau) and np.array_equal(x24[u:u + len(s)], s): duoc[u // 240:(u + len(s)) // 240] = False; break
    cs = []
    for k in range(0, n - 100 + 1, 25):
        if not em[k:k + 100].any() or dbm(x[k * 160:(k + 100) * 160]) < -50: continue
        e = cam.nhung(x[k * 160:(k + 100) * 160])
        if e is not None: cs.append((k, e))
    if not cs: continue
    K_, E_ = np.array([k for k, _ in cs]), np.array([e for _, e in cs]); cT = E_ @ tamT; tg = (K_ + 50) * 0.01
    # tâm giọng em: theo đoạn emNoi ⇒ cả buổi ⇒ tâm «khác» chung
    emB = E_[cT <= 0.20]; tamB = chuan(emB.mean(0)) if len(emB) >= 4 else tamK
    cE = np.maximum(E_ @ tamK, E_ @ tamB)
    for e in b['emNoi']:
        o = (tg >= e['t0'] / 1000) & (tg <= e['t1'] / 1000) & (cT <= 0.20)
        if o.sum() >= 4:
            tamD = chuan(E_[o].mean(0)); vung = (tg >= e['t0'] / 1000 - 1) & (tg <= e['t1'] / 1000 + 1)
            cE[vung] = np.maximum(cE[vung], E_[vung] @ tamD)
    minT = np.full(n, 9.0); maxE = np.full(n, -9.0); phu = np.zeros(n, int)
    for (k, _), a, c in zip(cs, cT, cE):
        sl = slice(k, k + 100); minT[sl] = np.minimum(minT[sl], a); maxE[sl] = np.maximum(maxE[sl], c); phu[sl] += 1
    m = duoc & (phu >= 3) & (minT >= T_SAO) & (maxE <= E_SAO)
    k = 0; i = 0; s = 0.0
    while k < n:
        if not m[k]: k += 1; continue
        z = k
        while z < n and m[z]: z += 1
        if z - k >= 50:
            x24[k * 240:z * 240].astype(np.float32).tofile(os.path.join(RA, f'{id[-8:]}_em{i}.f32')); i += 1; s += (z - k) / 100
        k = z
    tong[id[-8:]] = {'giayMoi': round(s, 1), 'cuaSoEmNoi': len(cs), 'emTamRieng': bool(len(emB) >= 4)}
    print(id[-8:], json.dumps(tong[id[-8:]]), flush=True)
sau = sum(os.path.getsize(f) for f in glob.glob(os.path.join(RA, '*.f32')) if not os.path.basename(f).startswith(GIU)) / 4 / 24000
kq['trich'] = {'theoBuoi': tong, 'thayLuyenTruocGiay': round(truoc, 1), 'thayLuyenSauGiay': round(sau, 1)}
json.dump(kq, open(SO, 'w'), ensure_ascii=False, indent=1)
print('thầy luyện (giây tiếng, không tính quãng nghỉ chèn):', round(truoc, 1), '⇒', round(sau, 1), flush=True)
