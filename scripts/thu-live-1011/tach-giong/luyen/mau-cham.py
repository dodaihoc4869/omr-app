# WAV 48 kHz cho bản đo 18 s: giọng thầy GIỮ RIÊNG (buổi 75f8acfc, không luyện) và giọng khác thật giữ riêng (bac5a835). Hở 0,3 s giữa các đoạn.
import sys, os, glob, subprocess
import numpy as np
DL, RA = sys.argv[1:3]
for ten, loai, buoi in (('thay-that', 'thay', '75f8acfc'), ('khac-that', 'khac', 'bac5a835')):
    ds = [np.fromfile(f, np.float32) for f in sorted(glob.glob(os.path.join(DL, 'live', loai, buoi + '_*.f32')), key=lambda f: int(f.split('_')[-1][:-4]))]
    x = np.concatenate([np.concatenate([d, np.zeros(7200, np.float32)]) for d in ds])
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', '24000', '-ac', '1', '-i', '-', '-ar', '48000', '-c:a', 'pcm_s16le', os.path.join(RA, ten + '.wav')], input=x.tobytes(), check=True)
    print(ten, round(len(x) / 24000, 1), 's')
