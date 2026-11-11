# HÀNG CHẤM «THẦY NÓI TO / CAO GIỌNG» (bắt lỗi «người giả» dạy mạng hạ cả thầy lúc nhấn mạnh, hô to): từ giọng thầy GIỮ RIÊNG (24 kHz), cắt cửa sổ 1 s,
# lấy các cửa sổ thuộc 30 % to nhất HOẶC 30 % cao giọng nhất (F0 trung vị, tự tương quan) ⇒ WAV 48 kHz. Mô hình đúng phải hạ ≈ 0 dB ở hàng này.
#   python3 -I thay-to.py <ra.wav> <tệp f32 24 kHz> …
import sys, subprocess
import numpy as np
RA, tep = sys.argv[1], sys.argv[2:]
x = np.concatenate([np.fromfile(f, np.float32) for f in tep]); HZ = 24000
def f0(w):
    o = []
    for i in range(0, len(w) - 960, 480):
        f = w[i:i + 960].astype(np.float64); f -= f.mean()
        if np.sqrt(np.mean(f ** 2)) < 0.01: continue
        a = np.correlate(f, f, 'full')[959:]; lo, hi = HZ // 400, HZ // 70; k = lo + int(np.argmax(a[lo:hi]))
        if a[k] / a[0] > 0.5: o.append(HZ / k)
    return np.median(o) if o else 0
cs = [x[i:i + HZ] for i in range(0, len(x) - HZ, HZ)]
rms = np.array([np.sqrt(np.mean(c ** 2)) for c in cs]); fo = np.array([f0(c) for c in cs])
chon = [c for c, r, f in zip(cs, rms, fo) if r > 0.003 and (r >= np.percentile(rms, 70) or f >= np.percentile(fo[fo > 0], 70))]
y = np.concatenate(chon).astype(np.float32)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', '24000', '-ac', '1', '-i', '-', '-ar', '48000', '-c:a', 'pcm_s16le', RA], input=y.tobytes(), check=True)
print(f'{len(chon)} cửa sổ · F0 trung vị {np.median(fo[fo > 0]):.0f} Hz (cả bộ) → {np.median([f for f in fo if f]):.0f}; chọn F0 ≥ {np.percentile(fo[fo > 0], 70):.0f} Hz hoặc RMS ≥ {20 * np.log10(np.percentile(rms, 70)):.1f} dBFS')
