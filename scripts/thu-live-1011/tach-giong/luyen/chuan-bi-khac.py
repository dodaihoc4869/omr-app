# Giọng KHÁC cho dữ liệu luyện: AudioMNIST (MIT, 60 người, 48 kHz) ⇒ mỗi người ghép các chữ số (hở 0–0,25 s) thành một dòng nói liền,
# rồi đi qua ĐÚNG đường của tệp «Xem lại Live» (MP3 24 kHz 48 kb/s, LAME) để cùng miền với giọng thầy trích ra. Ra: <ra>/am/<người>.f32 (24 kHz).
import sys, os, glob, wave, subprocess
import numpy as np
GOC, RA = sys.argv[1:3]
SACH = len(sys.argv) > 3 and sys.argv[3] == 'sach'   # 'sach' ⇒ bản SẠCH (chỉ đổi 48 → 24 kHz, không MP3) cho mẫu miền mic thật ⇒ <ra>/am-sach/
THU = 'am-sach' if SACH else 'am'
os.makedirs(os.path.join(RA, THU), exist_ok=True)
rng = np.random.default_rng(7)
for d in sorted(glob.glob(os.path.join(GOC, '[0-9][0-9]'))):
    p = []
    for f in sorted(glob.glob(os.path.join(d, '*.wav')), key=lambda _: rng.random()):
        with wave.open(f) as w:
            assert w.getframerate() == 48000 and w.getsampwidth() == 2
            x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
        p += [x, np.zeros(int(rng.uniform(0, 0.25) * 48000), np.float32)]
    x = np.concatenate(p)
    if SACH: r = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', '48000', '-ac', '1', '-i', '-', '-ar', '24000', '-f', 'f32le', '-'], input=x.tobytes(), capture_output=True, check=True)
    else:
        r = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', '48000', '-ac', '1', '-i', '-', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', '48k', '-f', 'mp3', '-'], input=x.tobytes(), capture_output=True, check=True)
        r = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'mp3', '-i', '-', '-ac', '1', '-ar', '24000', '-f', 'f32le', '-'], input=r.stdout, capture_output=True, check=True)
    np.frombuffer(r.stdout, np.float32).tofile(os.path.join(RA, THU, os.path.basename(d) + '.f32'))
print('xong', len(glob.glob(os.path.join(RA, THU, '*.f32'))))
