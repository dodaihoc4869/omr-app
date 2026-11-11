# LẤY GIỌNG THẦY TỪ BÀI GIẢNG YOUTUBE — CHẠY TRONG PHIÊN (máy CI bị YouTube chặn «Sign in to confirm you're not a bot», kể cả có PO-token).
# Tải LẦN LƯỢT từng video (yt-dlp + PO-token bgutil chế độ script, --js-runtimes node, hỏi giãn; KHÔNG cookie / tài khoản), lọc sạch, ghi:
#   <ra>/<id>.flac (48 kHz mono 16 bit, CHỈ đoạn thầy giảng: bỏ nhạc mở / kết, im lặng dài, tiếng không phải giọng thầy) + <ra>/<id>.json (dải tần, giây, cos)
#   video GIỮ RIÊNG để chấm (không luyện) ghi vào <ra>/cham/. Mục lục chung: <ra>/muc-luc.json. Tiếng KHÔNG vào git.
#   python3 -I lay-yt-phien.py <ky-thuat.md> <thư mục tải tạm> <ra> <CAM++.onnx> <silero_vad.onnx> [tâm thầy live .npy]
# Biến: YT_DLP (đường yt-dlp) · YT_POT (server_home của bgutil) · YT_SO (số video tối đa, 40) · YT_PHUT_TOI_DA (phút sạch tối đa / video, 25) ·
#       YT_NGHI (giây nghỉ khi bị gắn cờ, 720) · YT_GIU (số video giữ riêng, 2)
# Lọc từng khung 10 ms: Silero VAD ≥ 0,5 (nở ±150 ms) · CAM++ cửa sổ 1,5 s bước 1 s: cos với tâm video ≥ 0,5 VÀ với tâm chung ≥ 0,4 ·
# không bão hoà · nền yên (khối 5 s: P90 − P10 dB khung ≥ 25) · quãng nghỉ dài còn 0,15 s · đoạn ≥ 1 s · bỏ 2 phút đầu / 1 phút cuối (nhạc mở / kết).
import sys, os, re, json, glob, subprocess, random, time
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'nhieu-that'))
import onnxruntime as ort
from camxx import Cam
MD, TAI, RA, CAMP, VADP = sys.argv[1:6]
TAM_LIVE = sys.argv[6] if len(sys.argv) > 6 and os.path.exists(sys.argv[6]) else None
E = os.environ.get
SO, PHUT_TOI_DA, NGHI, SO_GIU = int(E('YT_SO', '40')), float(E('YT_PHUT_TOI_DA', '25')), int(E('YT_NGHI', '720')), int(E('YT_GIU', '2'))
os.makedirs(TAI, exist_ok=True); os.makedirs(os.path.join(RA, 'cham'), exist_ok=True)
HZ = 48000

ds, nhom, thay = [], '', set()
for dong in open(MD, encoding='utf-8'):
    if dong.startswith('## '): nhom = dong[3:].strip()
    m = re.match(r'### (.*) \(`([A-Za-z0-9_-]{11})`\)', dong)
    if m and m.group(2) not in thay: thay.add(m.group(2)); ds.append((m.group(2), nhom, m.group(1)))
theoNhom = {}
for v in ds: theoNhom.setdefault(v[1], []).append(v)
rd = random.Random(11)
for v in theoNhom.values(): rd.shuffle(v)
ung = []
while len(ung) < SO and any(theoNhom.values()):
    for n in list(theoNhom):
        if theoNhom[n] and len(ung) < SO: ung.append(theoNhom[n].pop())

MUC = os.path.join(RA, 'muc-luc.json')
muc = json.load(open(MUC)) if os.path.exists(MUC) else {'nguon': 'YouTube — bài giảng của thầy Đỗ Đại Học (kênh của thầy); tải để luyện mô hình riêng giọng thầy, KHÔNG phát lại / KHÔNG vào git', 'video': {}}
cam = Cam(CAMP, 4); vad = ort.InferenceSession(VADP, providers=['CPUExecutionProvider'])
tamLive = np.load(TAM_LIVE) if TAM_LIVE else None

def biChan(tu):
    """Máy chủ (googlevideo / google) proxy của phiên từ chối CONNECT kể từ thời điểm tu (UTC, ISO) — đọc nhật ký của chính proxy."""
    try:
        st = json.loads(subprocess.run(['curl', '-sS', E('HTTPS_PROXY', '') + '/__agentproxy/status'], capture_output=True, text=True).stdout)
        return sorted({r['host'].split(':')[0] for r in st.get('recentRelayFailures', []) if r.get('ts', '') >= tu and re.search(r'googlevideo|google\.com|youtube', r.get('host', ''))})
    except Exception: return []
def tai(id):
    """Tải tiếng opus 48 kHz của một video; trả (đường tệp | None, lỗi, máy chủ googlevideo)."""
    for lan in range(3):
        for f in glob.glob(os.path.join(TAI, id + '.*')): os.remove(f)
        t0 = time.strftime('%Y-%m-%dT%H:%M:%S', time.gmtime())
        r = subprocess.run([E('YT_DLP', 'yt-dlp'), '-v', '--no-warnings', '--no-progress', '--js-runtimes', 'node', '--sleep-requests', '3', '--sleep-interval', '10', '--max-sleep-interval', '20',
                            '--extractor-args', 'youtubepot-bgutilscript:server_home=' + E('YT_POT', ''), '-f', '251/bestaudio', '-o', os.path.join(TAI, id + '.%(ext)s'),
                            f'https://www.youtube.com/watch?v={id}'], capture_output=True, text=True)
        may = sorted(set(re.findall(r'https://([a-z0-9-]+\.googlevideo\.com)', r.stdout + r.stderr)))
        tep = [f for f in glob.glob(os.path.join(TAI, id + '.*')) if not f.endswith('.part')]
        if r.returncode == 0 and tep: return tep[0], '', may
        loi = (re.findall(r'^ERROR: .*', r.stderr, re.M) or [r.stderr[-300:]])[0][:200]
        chan = biChan(t0); gv = [h for h in chan if 'googlevideo' in h]
        if gv: return None, 'proxy chặn: ' + ' '.join(gv), may            # chỉ máy chủ TIẾNG (googlevideo) bị chặn mới tính là «proxy chặn»
        if chan: loi += ' · proxy từ chối (phụ): ' + ' '.join(chan)
        if 'not a bot' in loi or 'HTTP Error 429' in loi or 'API page 403' in loi:
            print(f'  bị gắn cờ ({loi[:80]}) — nghỉ {NGHI} s rồi thử lại', flush=True); time.sleep(NGHI); continue
        return None, loi, may
    return None, loi, may

def silero(x16):
    st = np.zeros((2, 1, 128), np.float32); ctx = np.zeros(64, np.float32); o = []; sr = np.array(16000, np.int64)
    for i in range(0, len(x16) - 511, 512):
        c = x16[i:i + 512]; p, st = vad.run(None, {'input': np.concatenate([ctx, c])[None].astype(np.float32), 'state': st, 'sr': sr}); ctx = c[-64:]; o.append(float(p.reshape(-1)[0]))
    return np.array(o)
def tamCum(V):
    t = V.mean(0); t /= np.linalg.norm(t) + 1e-9
    for _ in range(6):
        s = V[V @ t > 0.5]
        if len(s) < 5: break
        t = s.mean(0); t /= np.linalg.norm(t) + 1e-9
    return t
def daiTan(y):
    K = 4096; m = len(y) // K
    if m < 20: return {}
    F = y[:m * K].reshape(m, K); e = (F ** 2).mean(1); F = F[e > np.percentile(e, 50)]
    p = (np.abs(np.fft.rfft(F * np.hanning(K), axis=1)) ** 2).mean(0); hz = np.arange(len(p)) * HZ / K
    ref = p[(hz > 500) & (hz < 4000)].mean(); bd = lambda a, b: round(float(10 * np.log10(p[(hz >= a) & (hz < b)].mean() / ref + 1e-20)), 1)
    tc = [h for h, v in zip(hz, 10 * np.log10(p / ref + 1e-20)) if v > -60 and h < 23500]
    return {'dB_8_11k': bd(8000, 11000), 'dB_11_16k': bd(11000, 16000), 'dB_16_20k': bd(16000, 20000), 'tanCaoHz_tren_-60dB': int(max(tc or [0])),
            'ghiChu': 'phổ trung bình các khung to của phần ĐÃ LỌC, dB so với dải 0,5–4 kHz'}
def tamChung():
    vs = [np.array(v['_tam']) for v in muc['video'].values() if v.get('_tam') and v.get('nhan')]
    if not vs: return tamLive
    t = np.mean(vs, 0); return t / (np.linalg.norm(t) + 1e-9)

for id, nh, tieuDe in ung:
    if id in muc['video'] and muc['video'][id].get('xong'): continue
    t0 = time.time(); print(f'== {id} [{nh}] {tieuDe[:60]}', flush=True)
    p, loi, may = tai(id)
    v = {'id': id, 'nhom': nh, 'tieuDe': tieuDe, 'mayChu': may, 'xong': True}
    if not p:
        v.update(loi=loi, xong='không tải' if 'proxy' not in loi.lower() else False); muc['video'][id] = v
        json.dump(muc, open(MUC, 'w'), ensure_ascii=False, indent=1); print('  LỖI', loi, may, flush=True)
        if loi.startswith('proxy chặn'):   # máy chủ chưa mở (tên lấy từ nhật ký proxy): gom lại, video này tải lại ở lượt sau
            chan = loi.split(': ', 1)[1].split()
            v['mayChuBiChan'] = chan; muc['video'][id] = v; json.dump(muc, open(MUC, 'w'), ensure_ascii=False, indent=1)
            with open(os.path.join(RA, 'may-chu-bi-chan.txt'), 'a') as fh: fh.write(' '.join(chan) + '\n')
            print('  PROXY CHẶN máy chủ:', chan, flush=True)
        continue
    x = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', str(HZ), '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32).copy()
    os.remove(p)
    v['giayTho'] = round(len(x) / HZ)
    x16 = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', str(HZ), '-ac', '1', '-i', '-', '-ar', '16000', '-f', 'f32le', '-'], input=x.tobytes(), capture_output=True, check=True).stdout, np.float32)
    n = len(x) // 480; fr = x[:n * 480].reshape(n, 480)
    db = 10 * np.log10((fr.astype(np.float64) ** 2).mean(1) + 1e-12); dinh = np.abs(fr).max(1)
    pv = silero(x16); co = np.zeros(n, bool)
    if len(pv): co = pv[np.minimum(len(pv) - 1, (np.arange(n) * 0.01 / 0.032).astype(int))] >= 0.5
    gian = np.convolve(co.astype(float), np.ones(31), 'same') > 0
    W = []
    for k in range(0, n - 150 + 1, 100):
        if co[k:k + 150].mean() < 0.5: continue
        e = cam.nhung(x16[k * 160:(k + 150) * 160])
        if e is not None: W.append((k, e))
    if len(W) < 30:
        v.update(loi='ít tiếng nói', nhan=False); muc['video'][id] = v; json.dump(muc, open(MUC, 'w'), ensure_ascii=False, indent=1); print('  bỏ: ít tiếng nói', flush=True); continue
    V = np.stack([e for _, e in W]); tv = tamCum(V); tc = tamChung()
    cosChung = float(tv @ tc) if tc is not None else 1.0
    v['cosTamVideo_TamChung'] = round(cosChung, 2); v['phanCumLon'] = round(float((V @ tv > 0.5).mean()), 2)
    nguong = 0.35 if (tc is tamLive and tc is not None) else 0.5
    if cosChung < nguong:
        v.update(loi=f'tâm giọng video lệch tâm chung (cos {cosChung:.2f})', nhan=False); muc['video'][id] = v; json.dump(muc, open(MUC, 'w'), ensure_ascii=False, indent=1)
        print('  bỏ:', v['loi'], flush=True); continue
    tg = tc if tc is not None else tv
    gV = np.full(n, 9.0); gC = np.full(n, 9.0); phu = np.zeros(n, int)
    for k, e in W: gV[k:k + 150] = np.minimum(gV[k:k + 150], e @ tv); gC[k:k + 150] = np.minimum(gC[k:k + 150], e @ tg); phu[k:k + 150] += 1
    yen = np.zeros(n, bool)
    for k in range(0, n, 500):
        d = db[k:k + 500]; yen[k:k + 500] = len(d) > 100 and (np.percentile(d, 90) - np.percentile(d, 10)) >= 25
    giu = gian & yen & (dinh < 0.99) & (phu > 0) & (gV >= 0.5) & (gC >= 0.4) & (db > -70)
    giu[:12000] = False; giu[max(0, n - 6000):] = False                          # bỏ 2 phút đầu, 1 phút cuối
    k = 0; im = ~co
    while k < n:
        if giu[k] and im[k]:
            j = k
            while j < n and giu[j] and im[j]: j += 1
            if j - k > 15: giu[k + 15:j] = False
            k = j
        else: k += 1
    doan = []; k = 0
    while k < n:
        if not giu[k]: k += 1; continue
        j = k
        while j < n and giu[j]: j += 1
        if j - k >= 100: doan.append((k, j))
        k = j
    # tối đa YT_PHUT_TOI_DA phút / video: lấy đều theo thời gian (đa dạng trong bài)
    tong = sum(j - k for k, j in doan); toiDa = int(PHUT_TOI_DA * 6000)
    if tong > toiDa: buoc = tong / toiDa; doan = [d for i, d in enumerate(doan) if int(i / buoc) != int((i - 1) / buoc) or i == 0][:max(1, int(len(doan) / buoc))]
    mo = np.sin(np.linspace(0, np.pi / 2, 240)) ** 2
    ps = []
    for k, j in doan:
        s = x[k * 480:j * 480].copy(); s[:240] *= mo; s[-240:] *= mo[::-1]; ps += [s, np.zeros(int(0.1 * HZ), np.float32)]
    y = np.concatenate(ps) if ps else np.zeros(0, np.float32)
    v.update(giaySach=round(sum(j - k for k, j in doan) / 100, 1), doan=len(doan), dai=daiTan(y), _tam=[round(float(a), 5) for a in tv], nhan=True,
             mucDbfs=round(float(10 * np.log10(np.mean(y ** 2) + 1e-12)), 1) if len(y) else None)
    soCham = sum(1 for w in muc['video'].values() if w.get('dung') == 'cham')
    rong = v['dai'].get('tanCaoHz_tren_-60dB', 0) >= 16000
    v['dung'] = 'cham' if (soCham < SO_GIU and (rong or soCham >= 1) and len([w for w in muc['video'].values() if w.get('nhan')]) >= 2 and v['giaySach'] >= 120) else 'luyen'
    dich = os.path.join(RA, 'cham' if v['dung'] == 'cham' else '', id + '.flac')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(HZ), '-ac', '1', '-i', '-', '-c:a', 'flac', '-sample_fmt', 's16', dich], input=y.astype(np.float32).tobytes(), check=True)
    json.dump({k: w for k, w in v.items() if k != '_tam'}, open(dich[:-5] + '.json', 'w'), ensure_ascii=False, indent=1)
    muc['video'][id] = v
    luyen = sum(w.get('giaySach', 0) for w in muc['video'].values() if w.get('dung') == 'luyen'); cham = sum(w.get('giaySach', 0) for w in muc['video'].values() if w.get('dung') == 'cham')
    muc['tong'] = {'phutLuyen': round(luyen / 60, 1), 'phutCham': round(cham / 60, 1), 'videoLuyen': sum(1 for w in muc['video'].values() if w.get('dung') == 'luyen'),
                   'videoCham': [w['id'] for w in muc['video'].values() if w.get('dung') == 'cham']}
    json.dump(muc, open(MUC, 'w'), ensure_ascii=False, indent=1)
    print(f'  {v["dung"].upper()} {v["giaySach"] / 60:.1f} phút sạch / {v["giayTho"] / 60:.0f} phút thô · dải {v["dai"]} · cos {v["cosTamVideo_TamChung"]} · {time.time() - t0:.0f} s · máy chủ {may}', flush=True)
    print(f'TỔNG {muc["tong"]}', flush=True)
