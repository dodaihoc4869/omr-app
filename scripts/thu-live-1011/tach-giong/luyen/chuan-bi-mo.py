# KHO GIỌNG MỞ ⇒ dữ liệu giọng khác (tác tử YouTube tải vào <mo>/<kho>/<người>/*.flac|wav; ds.json nếu có: {kho: {cham: [người…], giayPhep}}).
# Mỗi người ghép ≤ 60 s ⇒ 24 kHz SẠCH (không nén) ⇒ <dl>/mo/<kho>__<người>.f32 (luyện) hoặc <dl>/mo-cham/… (chấm) + <dl>/mo/dai.json {tên: dải gốc Hz}.
# Tách luyện / chấm THEO NGƯỜI: theo ds.json; không có ⇒ 20 % người (băm tên) để chấm. BỎ kho phi thương mại (VIVOS CC BY-NC-SA …): trung tâm có thu phí.
#   python3 -I chuan-bi-mo.py <mo> <dl>
import sys, os, glob, json, subprocess, zlib
MO, DL = sys.argv[1:3]
for t in ('mo', 'mo-cham'): os.makedirs(os.path.join(DL, t), exist_ok=True)
try: ds = json.load(open(os.path.join(MO, 'ds.json')))
except Exception: ds = {}
dp = os.path.join(DL, 'mo', 'dai.json')
try: dai = json.load(open(dp))
except Exception: dai = {}
moi = 0
for kho in sorted(os.listdir(MO)):
    d = os.path.join(MO, kho)
    if not os.path.isdir(d) or kho.startswith('_'): continue
    thong = ds.get(kho, {}) if isinstance(ds, dict) else {}
    gp = str(thong.get('giayPhep', thong.get('license', ''))).upper()
    if 'vivos' in kho.lower() or '-NC' in gp or 'NONCOMMERCIAL' in gp.replace(' ', '').replace('-', ''): print('BỎ (phi thương mại):', kho); continue
    cham = set(map(str, thong.get('cham', thong.get('test', [])) or []))
    for nguoi in sorted(os.listdir(d)):
        p = os.path.join(d, nguoi)
        if not os.path.isdir(p) or nguoi.startswith('_'): continue
        tep = sorted(glob.glob(os.path.join(p, '**', '*.flac'), recursive=True) + glob.glob(os.path.join(p, '**', '*.wav'), recursive=True))
        if not tep: continue
        # người có trong bản đo 18 s (mẫu xôn xao: LibriSpeech 1320, 8230; VCTK p240, p260) LUÔN ở tập chấm
        laCham = nguoi in ('1320', '8230', 'p240', 'p260') or (nguoi in cham if cham else zlib.crc32(nguoi.encode()) % 5 == 0)
        ten = f'{kho}__{nguoi}'; ra = os.path.join(DL, 'mo-cham' if laCham else 'mo', ten + '.f32')
        if os.path.exists(ra): continue
        try: hz = int(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=sample_rate', '-of', 'csv=p=0', tep[0]], capture_output=True, text=True).stdout.strip() or 16000)
        except Exception: hz = 16000
        x, tong = [], 0
        for f in tep:
            r = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-ac', '1', '-ar', '24000', '-f', 'f32le', '-'], capture_output=True)
            if r.returncode or not r.stdout: continue
            x.append(r.stdout + b'\0' * (4 * int(24000 * 0.15))); tong += len(r.stdout)
            if tong > 60 * 24000 * 4: break
        if not x: continue
        open(ra + '.tmp', 'wb').write(b''.join(x)); os.replace(ra + '.tmp', ra)
        dai[ten] = min(hz / 2, 12000); moi += 1
json.dump(dai, open(dp, 'w'))
print('thêm', moi, 'người ·', len(glob.glob(os.path.join(DL, 'mo', '*.f32'))), 'luyện ·', len(glob.glob(os.path.join(DL, 'mo-cham', '*.f32'))), 'chấm')
