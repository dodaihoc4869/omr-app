# «GIỌNG KHÁC» NHIỀU NGƯỜI từ kho MỞ (giấy phép cho phép dùng thương mại) cho mô hình riêng giọng thầy — chạy trong phiên, tiếng KHÔNG vào git.
#   python3 -I lay-giong-khac.py <kho: fleurs-vi | librispeech> <thư mục ra = .../giong-khac-mo> <CAM++.onnx>
# Ra: <ra>/<kho>/<người>/<tệp>.flac (mono, GIỮ tần số gốc — cả hai kho là 16 kHz, không nâng lên 48 kHz) + <ra>/<kho>/ds.json
#   (kho, giấy phép, nguồn, tần số gốc, từng người: giới tính / số tệp / giây / tập «luyen» hoặc «cham»; danh sách tapLuyen / tapCham KHÔNG giao nhau).
# fleurs-vi: google/fleurs vi_vn (CC BY 4.0), dev + test. Kho KHÔNG có mã người ⇒ GOM NGƯỜI bằng CAM++ (cos với tâm cụm ≥ 0,55, gộp tâm ≥ 0,6),
#   giữ riêng ~15 % cụm (đủ nam / nữ) để chấm; tệp luyện nào cos ≥ 0,5 với tâm một cụm chấm ⇒ bỏ (không để lọt cùng người sang hai tập).
# librispeech: OpenSLR 12 dev-clean + test-clean (CC BY 4.0), mã người + giới tính từ SPEAKERS.TXT. Giữ riêng 8 người (4 nam, 4 nữ) gồm 1320 và 8230
#   (hai người này là «xôn xao» trong bản đo 18 s do-tach-giong.mjs ⇒ không được luyện).
# Tệp nén tải về đọc THEO DÒNG (không giải nén ra đĩa, tên tệp ra do mã này đặt) — tiết kiệm đĩa và không tin đường dẫn trong tệp nén.
import sys, os, re, io, json, csv, tarfile, subprocess, urllib.request
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'nhieu-that'))
KHO, RA, CAMP = sys.argv[1:4]
D = os.path.join(RA, KHO); os.makedirs(D, exist_ok=True)

def luong(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'omr-app-tach-giong/1.0'}), timeout=120)
def doc16(b, dang):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-f', dang, '-i', '-', '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], input=b, capture_output=True)
    return np.frombuffer(r.stdout, np.float32) if r.returncode == 0 else None
def ghiFlac(x, hz, dich):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(hz), '-ac', '1', '-i', '-', '-c:a', 'flac', '-sample_fmt', 's16', dich], input=x.astype(np.float32).tobytes(), check=True)

if KHO == 'fleurs-vi':
    from camxx import Cam
    cam = Cam(CAMP, 2)
    G = 'https://huggingface.co/datasets/google/fleurs/resolve/main/data/vi_vn/'
    gioi, tam = {}, os.path.join(D, '_tam'); os.makedirs(tam, exist_ok=True)
    for tach in ('dev', 'test'):
        for dong in csv.reader(io.TextIOWrapper(luong(G + tach + '.tsv'), encoding='utf-8'), delimiter='\t'):
            if len(dong) > 2:
                g = next((c for c in dong if c in ('MALE', 'FEMALE', 'OTHER')), None); gioi[dong[1]] = g
    tep = []
    for tach in ('dev', 'test'):
        with tarfile.open(fileobj=luong(G + 'audio/' + tach + '.tar.gz'), mode='r|gz') as tf:
            for m in tf:
                ten = os.path.basename(m.name)
                if not m.isfile() or not re.fullmatch(r'[0-9]+\.wav', ten): continue
                x = doc16(tf.extractfile(m).read(), 'wav')
                if x is None or len(x) < 16000: continue
                e = cam.nhung(x[:16000 * 8])
                if e is None: continue
                tep.append({'ten': ten[:-4], 'tach': tach, 'gioi': gioi.get(ten), 'giay': round(len(x) / 16000, 2), 'e': e})
                ghiFlac(x, 16000, os.path.join(tam, ten[:-4] + '.flac'))
        print(tach, len(tep), 'tệp', flush=True)
    # gom người: tham lam theo tâm, rồi gộp tâm gần
    cum = []
    for i, t in enumerate(tep):
        if cum:
            c = np.array([k['tam'] for k in cum]) @ t['e']; j = int(np.argmax(c))
            if c[j] >= 0.55:
                k = cum[j]; k['ds'].append(i); s = np.mean([tep[q]['e'] for q in k['ds']], 0); k['tam'] = s / np.linalg.norm(s); continue
        cum.append({'ds': [i], 'tam': t['e']})
    doi = True
    while doi:
        doi = False
        for a in range(len(cum)):
            for b in range(a + 1, len(cum)):
                if float(cum[a]['tam'] @ cum[b]['tam']) >= 0.6:
                    cum[a]['ds'] += cum[b]['ds']; s = np.mean([tep[q]['e'] for q in cum[a]['ds']], 0); cum[a]['tam'] = s / np.linalg.norm(s); del cum[b]; doi = True; break
            if doi: break
    cum = [k for k in cum if len(k['ds']) >= 3]
    for n, k in enumerate(cum):
        gs = [tep[q]['gioi'] for q in k['ds'] if tep[q]['gioi']]; k['gioi'] = max(set(gs), key=gs.count) if gs else None; k['id'] = f'cum{n:03d}'
    # giữ riêng ~15 % số tệp, xen kẽ nam / nữ, cụm cỡ vừa
    tong = sum(len(k['ds']) for k in cum); cham, dem = [], 0
    for g in ('FEMALE', 'MALE', 'FEMALE', 'MALE', 'FEMALE', 'MALE', 'FEMALE', 'MALE'):
        ung = sorted([k for k in cum if k['gioi'] == g and k not in cham and 5 <= len(k['ds']) <= tong * 0.08], key=lambda k: len(k['ds']))
        if ung and dem < tong * 0.15: k = ung[len(ung) // 2]; cham.append(k); dem += len(k['ds'])
    TC = np.array([k['tam'] for k in cham]) if cham else np.zeros((0, 512))
    nguoi, boLot = {}, 0
    for k in cum:
        la = k in cham; dd = os.path.join(D, k['id']); os.makedirs(dd, exist_ok=True); giay = 0; so = 0
        for q in k['ds']:
            t = tep[q]
            if not la and len(TC) and float((TC @ t['e']).max()) >= 0.5: boLot += 1; os.remove(os.path.join(tam, t['ten'] + '.flac')); continue
            os.replace(os.path.join(tam, t['ten'] + '.flac'), os.path.join(dd, t['ten'] + '.flac')); giay += t['giay']; so += 1
        nguoi[k['id']] = {'gioiTinh': k['gioi'], 'soTep': so, 'giay': round(giay), 'tap': 'cham' if la else 'luyen', 'ghiChu': 'mã người = cụm CAM++ (kho không có mã người)'}
    for f in os.listdir(tam): os.remove(os.path.join(tam, f))
    os.rmdir(tam)
    ds = {'kho': 'FLEURS vi_vn (google/fleurs, dev + test)', 'giayPhep': 'CC BY 4.0', 'nguon': G, 'tanSoGocHz': 16000, 'dinhDang': 'FLAC mono 16 bit, giữ 16 kHz (không nâng)',
          'nguoi': nguoi, 'tapLuyen': sorted(i for i, v in nguoi.items() if v['tap'] == 'luyen' and v['soTep']), 'tapCham': sorted(i for i, v in nguoi.items() if v['tap'] == 'cham'),
          'boVi_giongNguoiCham': boLot, 'cachGomNguoi': 'CAM++ (WeSpeaker VoxCeleb) 8 s đầu mỗi tệp; tâm cụm cos ≥ 0,55; gộp tâm ≥ 0,6; cụm < 3 tệp bỏ'}
elif KHO == 'librispeech':
    G = 'https://www.openslr.org/resources/12/'
    gioi, nguoi = {}, {}
    for tach in ('dev-clean', 'test-clean'):
        with tarfile.open(fileobj=luong(G + tach + '.tar.gz'), mode='r|gz') as tf:
            for m in tf:
                if not m.isfile(): continue
                ten = os.path.basename(m.name)
                if ten == 'SPEAKERS.TXT':
                    for dong in tf.extractfile(m).read().decode('utf-8', 'replace').splitlines():
                        c = [s.strip() for s in dong.split('|')]
                        if len(c) >= 2 and c[0].isdigit(): gioi[c[0]] = {'F': 'FEMALE', 'M': 'MALE'}.get(c[1])
                    continue
                mm = re.fullmatch(r'([0-9]+)-([0-9]+)-([0-9]+)\.flac', ten)
                if not mm: continue
                b = tf.extractfile(m).read()
                if b[:4] != b'fLaC': continue
                dd = os.path.join(D, mm.group(1)); os.makedirs(dd, exist_ok=True)
                open(os.path.join(dd, ten), 'wb').write(b)
                v = nguoi.setdefault(mm.group(1), {'soTep': 0, 'byte': 0, 'tachGoc': tach}); v['soTep'] += 1; v['byte'] += len(b)
        print(tach, len(nguoi), 'người', flush=True)
    for k, v in nguoi.items(): v['gioiTinh'] = gioi.get(k); v['giayUoc'] = round(v.pop('byte') / 16000 / 2 / 0.6)   # ước từ cỡ FLAC (≈ 60 % PCM 16 bit)
    co = [s for s in ('1320', '8230') if s in nguoi]
    nam = sorted(k for k, v in nguoi.items() if v['gioiTinh'] == 'MALE' and k not in co); nu = sorted(k for k, v in nguoi.items() if v['gioiTinh'] == 'FEMALE' and k not in co)
    cham = set(co)
    for ds_ in (nam, nu):
        for k in ds_[::max(1, len(ds_) // 4)]:
            if sum(1 for c in cham if nguoi[c]['gioiTinh'] == nguoi[k]['gioiTinh']) < 4: cham.add(k)
    for k, v in nguoi.items(): v['tap'] = 'cham' if k in cham else 'luyen'
    ds = {'kho': 'LibriSpeech dev-clean + test-clean (OpenSLR 12)', 'giayPhep': 'CC BY 4.0', 'nguon': G, 'tanSoGocHz': 16000, 'dinhDang': 'FLAC gốc của kho (mono 16 kHz), chép nguyên',
          'nguoi': nguoi, 'tapLuyen': sorted(k for k in nguoi if k not in cham), 'tapCham': sorted(cham),
          'ghiChu': '1320 và 8230 là giọng «xôn xao» trong bản đo 18 s (do-tach-giong.mjs, mẫu tai-mau-loc-on.mjs) ⇒ luôn ở tập chấm'}
else: sys.exit('kho lạ')
assert not set(ds['tapLuyen']) & set(ds['tapCham'])
json.dump(ds, open(os.path.join(D, 'ds.json'), 'w'), ensure_ascii=False, indent=1)
gl = lambda tap: sum(v.get('giay', v.get('giayUoc', 0)) for v in ds['nguoi'].values() if v['tap'] == tap)
print('XONG', KHO, '· người luyện', len(ds['tapLuyen']), f'({gl("luyen") / 3600:.2f} giờ)', '· người chấm', len(ds['tapCham']), f'({gl("cham") / 3600:.2f} giờ)',
      '· nam / nữ luyện', sum(1 for k in ds['tapLuyen'] if ds['nguoi'][k]['gioiTinh'] == 'MALE'), '/', sum(1 for k in ds['tapLuyen'] if ds['nguoi'][k]['gioiTinh'] == 'FEMALE'), flush=True)
