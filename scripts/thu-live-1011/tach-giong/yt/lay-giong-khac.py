# «GIỌNG KHÁC» NHIỀU NGƯỜI + ỒN từ kho MỞ cho mô hình riêng giọng thầy — chạy trong phiên, tiếng KHÔNG vào git.
#   python3 -I lay-giong-khac.py <kho> <thư mục ra = .../giong-khac-mo> <CAM++.onnx>
#   kho: fleurs-vi | librispeech | vivos | fosd | vlsp2020 | musan-noise | aishell
# Ra: <ra>/<kho>/<người>/<tệp>.flac (mono 16 bit, GIỮ TẦN SỐ GỐC — không hạ, không nâng; gốc > 48 kHz thì về 48 kHz) + <ra>/<kho>/ds.json
#   (kho, giấy phép, nguồn, sr_goc, từng người: giới tính / số tệp / giây / tập «luyen» | «cham»; tapLuyen / tapCham KHÔNG giao nhau).
# Kho phi thương mại (NC): THẦY DUYỆT dùng nội bộ 11/11 («Kho phi thương mại … tôi chỉ dùng nội bộ thôi») ⇒ ds.json gắn noiBo: true.
# · fleurs-vi: google/fleurs vi_vn (CC BY 4.0), dev + test, 16 kHz. Kho KHÔNG có mã người ⇒ GOM NGƯỜI bằng CAM++ (xem gomNguoi).
# · librispeech: OpenSLR 12 dev-clean + test-clean (CC BY 4.0), 16 kHz, mã người + giới tính từ SPEAKERS.TXT. Giữ riêng 8 người (4 nam, 4 nữ) gồm 1320 và
#   8230 (hai người này là «xôn xao» trong bản đo 18 s do-tach-giong.mjs ⇒ không được luyện).
# · vivos: AILAB-VNUHCM/vivos (CC BY-NC-SA 4.0 ⇒ noiBo), 16 kHz, mã người + giới tính, train ⇒ luyện, test ⇒ chấm; ≤ 4 phút / người.
# · fosd (FPT Open Speech Data, doof-ferb/fpt_fosd, CC BY 4.0) · vlsp2020 (VinAI 100 h, doof-ferb/vlsp2020_vinai_100h, CC BY 4.0): một mảnh parquet,
#   ≤ 3 giờ, không có mã người ⇒ gom người bằng CAM++, giới tính đoán theo F0.
# · musan-noise: OpenSLR 17, phần noise (giấy phép từng thư mục: CC0 / CC BY / phạm vi công cộng — chép LICENSE gốc vào ds.json); ≤ 3 giờ.
# · aishell: AISHELL-1 (OpenSLR 33, Apache 2.0), 60 người đầu × ≤ 3 phút, tiếng Trung có thanh điệu.
# Tệp nén đọc THEO DÒNG (không giải nén ra đĩa; tên tệp ra do mã này đặt) — tiết kiệm đĩa và không tin đường dẫn trong tệp nén.
import sys, os, re, io, json, csv, tarfile, subprocess, urllib.request, shutil, zlib
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'nhieu-that'))
KHO, RA, CAMP = sys.argv[1:4]
D = os.path.join(RA, KHO); os.makedirs(D, exist_ok=True)
NB_ = {'noiBo': True, 'ghiChuNoiBo': 'kho phi thương mại — thầy duyệt dùng nội bộ 11/11'}

def luong(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'omr-app-tach-giong/1.0'}), timeout=120)
def doc(b, dang=None):
    """Giải mã GIỮ tần số gốc (≤ 48 kHz) ⇒ (x float32 mono, sr) hoặc (None, 0)."""
    f = ['-f', dang] if dang else []
    p = subprocess.run(['ffprobe', '-v', 'error', *f, '-show_entries', 'stream=sample_rate', '-of', 'csv=p=0', '-i', '-'], input=b, capture_output=True, text=False)
    try: sr = min(48000, int(p.stdout.decode().split()[0]))
    except Exception: return None, 0
    r = subprocess.run(['ffmpeg', '-v', 'error', *f, '-i', '-', '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'], input=b, capture_output=True)
    return (np.frombuffer(r.stdout, np.float32), sr) if r.returncode == 0 and r.stdout else (None, 0)
def ve16(x, sr):
    if sr == 16000: return x
    return np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', str(sr), '-ac', '1', '-i', '-', '-ar', '16000', '-f', 'f32le', '-'], input=x.tobytes(), capture_output=True, check=True).stdout, np.float32)
def ghiFlac(x, hz, dich):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(hz), '-ac', '1', '-i', '-', '-c:a', 'flac', '-sample_fmt', 's16', dich], input=x.astype(np.float32).tobytes(), check=True)
def f0(x):  # trung vị F0 (Hz, x 16 kHz) các khung 40 ms có giọng (tự tương quan) ⇒ đoán giới tính khi kho không ghi
    n, o = 640, []
    for i in range(0, min(len(x), 640 * 300) - n, n):
        f = x[i:i + n] - x[i:i + n].mean()
        if (f ** 2).mean() < 1e-5: continue
        c = np.correlate(f, f, 'full')[n - 1:]; k = 40 + int(np.argmax(c[40:229]))
        if c[k] > 0.4 * c[0]: o.append(16000 / k)
    return float(np.median(o)) if len(o) >= 5 else None
def gioiF0(x16): v = f0(x16); return None if v is None else ('MALE' if v < 165 else 'FEMALE')

def gomNguoi(tep, tam, dau):
    """Kho không có mã người: gom người bằng CAM++ (tham lam theo tâm cos ≥ 0,55, gộp tâm ≥ 0,6, cụm < 3 tệp bỏ), giữ riêng ~15 % (xen kẽ nam / nữ)
    để chấm; tệp luyện cos ≥ 0,5 với tâm một cụm chấm ⇒ bỏ (không để cùng người ở hai tập). tep: [{ten, gioi, giay, e}], FLAC đang ở <tam>/<ten>.flac."""
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
    boNho = [q for k in cum if len(k['ds']) < 3 for q in k['ds']]
    cum = [k for k in cum if len(k['ds']) >= 3]
    for n, k in enumerate(cum):
        gs = [tep[q]['gioi'] for q in k['ds'] if tep[q]['gioi']]; k['gioi'] = max(set(gs), key=gs.count) if gs else None; k['id'] = f'cum{n:03d}'
    tong = sum(len(k['ds']) for k in cum); cham, dem = [], 0
    for g in ('FEMALE', 'MALE') * 6:
        ung = sorted([k for k in cum if k['gioi'] == g and k not in cham and 3 <= len(k['ds']) <= max(5, tong * 0.08)], key=lambda k: len(k['ds']))
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
    shutil.rmtree(tam, ignore_errors=True)
    return {**dau, 'nguoi': nguoi, 'tapLuyen': sorted(i for i, v in nguoi.items() if v['tap'] == 'luyen' and v['soTep']),
            'tapCham': sorted(i for i, v in nguoi.items() if v['tap'] == 'cham'), 'boVi_giongNguoiCham': boLot, 'boVi_cumNho': len(boNho),
            'cachGomNguoi': 'CAM++ (WeSpeaker VoxCeleb) 8 s đầu mỗi tệp; tâm cụm cos ≥ 0,55; gộp tâm ≥ 0,6; cụm < 3 tệp bỏ'}

if KHO == 'fleurs-vi':
    from camxx import Cam
    cam = Cam(CAMP, 2)
    G = 'https://huggingface.co/datasets/google/fleurs/resolve/main/data/vi_vn/'
    gioi, tam = {}, os.path.join(D, '_tam'); os.makedirs(tam, exist_ok=True)
    for tach in ('dev', 'test'):
        for dong in csv.reader(io.TextIOWrapper(luong(G + tach + '.tsv'), encoding='utf-8'), delimiter='\t'):
            if len(dong) > 2: gioi[dong[1]] = next((c for c in dong if c in ('MALE', 'FEMALE', 'OTHER')), None)
    tep, srs = [], set()
    for tach in ('dev', 'test'):
        with tarfile.open(fileobj=luong(G + 'audio/' + tach + '.tar.gz'), mode='r|gz') as tf:
            for m in tf:
                ten = os.path.basename(m.name)
                if not m.isfile() or not re.fullmatch(r'[0-9]+\.wav', ten): continue
                x, sr = doc(tf.extractfile(m).read(), 'wav')
                if x is None or len(x) < sr: continue
                x16 = ve16(x, sr); e = cam.nhung(x16[:16000 * 8])
                if e is None: continue
                tep.append({'ten': ten[:-4], 'gioi': gioi.get(ten), 'giay': round(len(x) / sr, 2), 'e': e}); srs.add(sr)
                ghiFlac(x, sr, os.path.join(tam, ten[:-4] + '.flac'))
        print(tach, len(tep), 'tệp', flush=True)
    ds = gomNguoi(tep, tam, {'kho': 'FLEURS vi_vn (google/fleurs, dev + test)', 'giayPhep': 'CC BY 4.0', 'nguon': G, 'sr_goc': sorted(srs), 'dinhDang': 'FLAC mono 16 bit, giữ tần số gốc'})
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
    for k, v in nguoi.items(): v['gioiTinh'] = gioi.get(k); v['giayUoc'] = round(v.pop('byte') / 16000 / 2 / 0.6)
    co = [s for s in ('1320', '8230') if s in nguoi]
    nam = sorted(k for k, v in nguoi.items() if v['gioiTinh'] == 'MALE' and k not in co); nu = sorted(k for k, v in nguoi.items() if v['gioiTinh'] == 'FEMALE' and k not in co)
    cham = set(co)
    for ds_ in (nam, nu):
        for k in ds_[::max(1, len(ds_) // 4)]:
            if sum(1 for c in cham if nguoi[c]['gioiTinh'] == nguoi[k]['gioiTinh']) < 4: cham.add(k)
    for k, v in nguoi.items(): v['tap'] = 'cham' if k in cham else 'luyen'
    ds = {'kho': 'LibriSpeech dev-clean + test-clean (OpenSLR 12)', 'giayPhep': 'CC BY 4.0', 'nguon': G, 'sr_goc': [16000], 'dinhDang': 'FLAC gốc của kho (mono 16 kHz), chép nguyên',
          'nguoi': nguoi, 'tapLuyen': sorted(k for k in nguoi if k not in cham), 'tapCham': sorted(cham),
          'ghiChu': '1320 và 8230 là giọng «xôn xao» trong bản đo 18 s (do-tach-giong.mjs, mẫu tai-mau-loc-on.mjs) ⇒ luôn ở tập chấm'}
elif KHO == 'vivos':
    G = 'https://huggingface.co/datasets/AILAB-VNUHCM/vivos/resolve/main/data/vivos.tar.gz'
    gioi, nguoi, srs = {}, {}, set()
    with tarfile.open(fileobj=luong(G), mode='r|gz') as tf:
        for m in tf:
            if not m.isfile(): continue
            ten = os.path.basename(m.name)
            if ten == 'genders.txt':
                for dong in tf.extractfile(m).read().decode('utf-8', 'replace').splitlines():
                    c = dong.split()
                    if len(c) == 2: gioi[c[0]] = {'m': 'MALE', 'f': 'FEMALE'}.get(c[1].lower())
                continue
            mm = re.fullmatch(r'((?:VIVOSSPK|VIVOSDEV)[0-9]+)_[A-Za-z0-9_]+\.wav', ten)
            if not mm: continue
            v = nguoi.setdefault(mm.group(1), {'soTep': 0, 'giay': 0.0, 'tap': 'cham' if '/test/' in m.name else 'luyen'})
            if v['giay'] >= 240: continue
            x, sr = doc(tf.extractfile(m).read(), 'wav')
            if x is None: continue
            dd = os.path.join(D, mm.group(1)); os.makedirs(dd, exist_ok=True); ghiFlac(x, sr, os.path.join(dd, ten[:-4] + '.flac')); v['soTep'] += 1; v['giay'] += len(x) / sr; srs.add(sr)
    for k, v in nguoi.items(): v['gioiTinh'] = gioi.get(k); v['giay'] = round(v['giay'])
    ds = {'kho': 'VIVOS (AILAB-VNUHCM)', 'giayPhep': 'CC BY-NC-SA 4.0', **NB_, 'nguon': G, 'sr_goc': sorted(srs), 'dinhDang': 'FLAC mono 16 bit, giữ tần số gốc; ≤ 4 phút / người',
          'nguoi': nguoi, 'tapLuyen': sorted(k for k, v in nguoi.items() if v['tap'] == 'luyen'), 'tapCham': sorted(k for k, v in nguoi.items() if v['tap'] == 'cham'),
          'ghiChu': 'tách người theo kho: train ⇒ luyện, test ⇒ chấm (hai tập người khác nhau)'}
elif KHO in ('fosd', 'vlsp2020'):
    import pyarrow.parquet as pq
    from camxx import Cam
    cam = Cam(CAMP, 2)
    REPO, TEP, LIC, TEN = {'fosd': ('doof-ferb/fpt_fosd', 'data/train-00000-of-00002.parquet', 'CC BY 4.0', 'FPT Open Speech Data (FOSD)'),
                           'vlsp2020': ('doof-ferb/vlsp2020_vinai_100h', 'data/train-00000-of-00035.parquet', 'CC BY 4.0', 'VLSP 2020 VinAI 100 h')}[KHO]
    G = f'https://huggingface.co/datasets/{REPO}/resolve/main/{TEP}'
    tam = os.path.join(D, '_tam'); os.makedirs(tam, exist_ok=True); pqp = os.path.join(RA, f'_{KHO}.parquet')
    with luong(G) as r, open(pqp, 'wb') as fh: shutil.copyfileobj(r, fh, 1 << 20)
    pf = pq.ParquetFile(pqp); tep, tong, srs = [], 0.0, set()
    for b in pf.iter_batches(batch_size=32):
        a = [c for c in b.schema.names if 'audio' in c.lower()][0]
        for au in b.column(a).to_pylist():
            byt = au.get('bytes') if isinstance(au, dict) else None
            if not byt or tong > 3 * 3600: continue
            x, sr = doc(byt)
            if x is None or len(x) < sr: continue
            x16 = ve16(x, sr); e = cam.nhung(x16[:16000 * 8])
            if e is None: continue
            ten = f'{KHO}{len(tep):05d}'; ghiFlac(x, sr, os.path.join(tam, ten + '.flac')); srs.add(sr)
            tep.append({'ten': ten, 'gioi': gioiF0(x16), 'giay': round(len(x) / sr, 2), 'e': e}); tong += len(x) / sr
        if tong > 3 * 3600: break
    os.remove(pqp); print(KHO, len(tep), 'tệp', round(tong / 3600, 2), 'giờ', flush=True)
    ds = gomNguoi(tep, tam, {'kho': f'{TEN} ({REPO}, một mảnh {TEP.split("/")[-1]})', 'giayPhep': LIC, 'nguon': G, 'sr_goc': sorted(srs),
                             'dinhDang': 'FLAC mono 16 bit, giữ tần số gốc; ≤ 3 giờ', 'gioiTinh': 'đoán theo F0 trung vị (< 165 Hz ⇒ nam) — kho không ghi'})
elif KHO == 'musan-noise':
    G = 'https://www.openslr.org/resources/17/musan.tar.gz'
    lic, tepL, tepC, tong, daQua, srs = {}, [], [], 0.0, False, set()
    with tarfile.open(fileobj=luong(G), mode='r|gz') as tf:
        for m in tf:
            ph = m.name.split('/')
            if len(ph) >= 3 and ph[1] == 'noise':
                daQua = True
                if ph[-1] == 'LICENSE' and m.isfile(): lic[ph[2]] = tf.extractfile(m).read().decode('utf-8', 'replace')[:2000]; continue
                if not m.isfile() or not re.fullmatch(r'noise-[a-z-]+-[0-9]+\.wav', ph[-1]) or tong > 3 * 3600: continue
                x, sr = doc(tf.extractfile(m).read(), 'wav')
                if x is None: continue
                dd = os.path.join(D, ph[2]); os.makedirs(dd, exist_ok=True); ghiFlac(x, sr, os.path.join(dd, ph[-1][:-4] + '.flac')); tong += len(x) / sr; srs.add(sr)
                (tepC if zlib.crc32(ph[-1].encode()) % 10 == 0 else tepL).append(ph[2] + '/' + ph[-1][:-4])
            elif daQua and len(ph) >= 2 and ph[1] not in ('noise', ''): break
    ds = {'kho': 'MUSAN — phần noise (OpenSLR 17)', 'giayPhep': 'theo từng thư mục (musan/noise/*/LICENSE): free-sound CC0 / CC BY, sound-bible CC BY / phạm vi công cộng',
          'licenseGoc': lic, 'nguon': G, 'sr_goc': sorted(srs), 'dinhDang': 'FLAC mono 16 bit, giữ tần số gốc; ≤ 3 giờ', 'giay': round(tong),
          'nguoi': {}, 'tapLuyen': tepL, 'tapCham': tepC, 'ghiChu': 'ồn, không có người: tapLuyen / tapCham là danh sách TỆP (crc32 % 10 == 0 ⇒ chấm)'}
elif KHO == 'aishell':
    G = 'https://www.openslr.org/resources/33/'
    gioi, nguoi, srs = {}, {}, set()
    with tarfile.open(fileobj=luong(G + 'resource_aishell.tgz'), mode='r|gz') as tf:
        for m in tf:
            if m.isfile() and os.path.basename(m.name) == 'speaker.info':
                for dong in tf.extractfile(m).read().decode('utf-8', 'replace').splitlines():
                    c = dong.split()
                    if len(c) == 2: gioi['S' + c[0]] = {'M': 'MALE', 'F': 'FEMALE'}.get(c[1])
    with tarfile.open(fileobj=luong(G + 'data_aishell.tgz'), mode='r|gz') as tf:
        for m in tf:
            mm = re.fullmatch(r'(S[0-9]{4})\.tar\.gz', os.path.basename(m.name))
            if not m.isfile() or not mm: continue
            if len(nguoi) >= 60: break
            sp = mm.group(1); v = nguoi.setdefault(sp, {'soTep': 0, 'giay': 0.0, 'gioiTinh': gioi.get(sp)}); dd = os.path.join(D, sp); os.makedirs(dd, exist_ok=True)
            with tarfile.open(fileobj=tf.extractfile(m), mode='r|gz') as ti:
                for n in ti:
                    t2 = os.path.basename(n.name)
                    if not n.isfile() or not re.fullmatch(r'BAC009S[0-9]{4}W[0-9]{4}\.wav', t2) or v['giay'] >= 180: continue
                    x, sr = doc(ti.extractfile(n).read(), 'wav')
                    if x is None: continue
                    ghiFlac(x, sr, os.path.join(dd, t2[:-4] + '.flac')); v['soTep'] += 1; v['giay'] += len(x) / sr; srs.add(sr)
            print(sp, round(v['giay']), flush=True)
    ks = sorted(nguoi)
    for i, k in enumerate(ks): nguoi[k]['tap'] = 'cham' if i % 8 == 3 else 'luyen'; nguoi[k]['giay'] = round(nguoi[k]['giay'])
    ds = {'kho': 'AISHELL-1 (OpenSLR 33) — 60 người đầu, ≤ 3 phút / người', 'giayPhep': 'Apache 2.0', 'nguon': G, 'sr_goc': sorted(srs), 'dinhDang': 'FLAC mono 16 bit, giữ tần số gốc',
          'nguoi': nguoi, 'tapLuyen': [k for k in ks if nguoi[k]['tap'] == 'luyen'], 'tapCham': [k for k in ks if nguoi[k]['tap'] == 'cham'], 'ghiChu': 'tiếng Trung (có thanh điệu) — đa dạng giọng'}
else: sys.exit('kho lạ')
assert not set(ds['tapLuyen']) & set(ds['tapCham'])
json.dump(ds, open(os.path.join(D, 'ds.json'), 'w'), ensure_ascii=False, indent=1)
gl = lambda tap: sum(v.get('giay', v.get('giayUoc', 0)) for v in ds['nguoi'].values() if v.get('tap') == tap)
print('XONG', KHO, '· sr_goc', ds.get('sr_goc'), '· người luyện', len(ds['tapLuyen']), f'({gl("luyen") / 3600:.2f} giờ)', '· người chấm', len(ds['tapCham']), f'({gl("cham") / 3600:.2f} giờ)',
      '· nam / nữ luyện', sum(1 for k in ds['tapLuyen'] if ds['nguoi'].get(k, {}).get('gioiTinh') == 'MALE'), '/', sum(1 for k in ds['tapLuyen'] if ds['nguoi'].get(k, {}).get('gioiTinh') == 'FEMALE'), flush=True)
