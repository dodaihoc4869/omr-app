# GIỌNG THẦY TỪ BÀI GIẢNG YOUTUBE (tác tử YouTube đổ FLAC 48 kHz mono đã làm sạch + JSON dải tần vào <yt>/). Mỗi tệp mới ⇒
#   <dl>/yt/sach/<tên>.f32  (24 kHz, KHÔNG nén — miền mic thật)  +  <dl>/yt/mp3/<tên>.f32  (qua MP3 24 kHz 48 kb/s — miền «Xem lại Live»).
# GIỮ RIÊNG để chấm độ sáng: tệp có dải rộng nhất (theo JSON, khoá bất kỳ chứa 'hz' / 'dai' lớn nhất; không có JSON ⇒ tệp đầu tiên) ⇒ <dl>/yt-cham/<tên>.wav (48 kHz).
#   python3 -I chuan-bi-yt.py <yt> <dl>
import sys, os, glob, json, subprocess
YT, DL = sys.argv[1:3]
for t in ('yt/sach', 'yt/mp3', 'yt-cham'): os.makedirs(os.path.join(DL, t), exist_ok=True)
tep = sorted(glob.glob(os.path.join(YT, '*.flac')))
if not tep: print('chưa có tệp'); sys.exit(0)
giu = os.path.join(DL, 'yt-cham', 'ten.txt')
if not os.path.exists(giu):
    def rong(f):
        j = os.path.splitext(f)[0] + '.json'
        try:
            d = json.load(open(j)); v = [x for k, x in d.items() if isinstance(x, (int, float)) and ('hz' in k.lower() or 'dai' in k.lower())]
            return max(v) if v else 0
        except Exception: return 0
    chon = max(tep, key=rong)
    open(giu, 'w').write(os.path.basename(chon))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', chon, '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', os.path.join(DL, 'yt-cham', 'thay-yt.wav')], check=True)
    print('giữ riêng để chấm:', os.path.basename(chon))
tenGiu = open(giu).read().strip(); moi = 0
for f in tep:
    ten = os.path.splitext(os.path.basename(f))[0]
    if os.path.basename(f) == tenGiu or os.path.exists(os.path.join(DL, 'yt/sach', ten + '.f32')): continue
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-ac', '1', '-ar', '24000', '-f', 'f32le', '-'], capture_output=True, check=True)
    open(os.path.join(DL, 'yt/sach', ten + '.f32.tmp'), 'wb').write(r.stdout)
    r2 = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-ac', '1', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', '48k', '-f', 'mp3', '-'], capture_output=True, check=True)
    r2 = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'mp3', '-i', '-', '-ac', '1', '-ar', '24000', '-f', 'f32le', '-'], input=r2.stdout, capture_output=True, check=True)
    open(os.path.join(DL, 'yt/mp3', ten + '.f32'), 'wb').write(r2.stdout)
    os.replace(os.path.join(DL, 'yt/sach', ten + '.f32.tmp'), os.path.join(DL, 'yt/sach', ten + '.f32')); moi += 1
print('thêm', moi, 'tệp YouTube')
