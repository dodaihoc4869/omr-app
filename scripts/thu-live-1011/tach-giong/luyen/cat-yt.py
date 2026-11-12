# LỌC GIỌNG THẦY TỪ TỆP BÀI GIẢNG — bước 2: cắt đoạn. Ô 0,5 s «tốt» khi ≥ 2 cửa sổ 1,5 s phủ nó đạt (cos ≥ T với tâm thầy, mức > −45 dBFS);
# đoạn = chuỗi ô tốt liền, gọt 0,25 s mỗi đầu, bỏ đoạn < 2 s. Khối GIỮ RIÊNG liền ~3 phút ở giữa (không luyện) ⇒ <yt>/cham/; còn lại ⇒ <yt>/<tên>-luyen.flac.
#   python3 -I cat-yt.py <phan-tich.npz> <x48.flac> <thư mục yt> <tên> <giữ từ s> <giữ tới s> [T=0.494]
import sys, os, subprocess
import numpy as np
NPZ, X48, YT, TEN, G0, G1 = sys.argv[1:7]; G0, G1 = float(G0), float(G1); T = float(sys.argv[7]) if len(sys.argv) > 7 else 0.494
d = np.load(NPZ); t, db, cs = d['t'], d['db'], d['cs']
dat = (~np.isnan(cs)) & (cs >= T) & (db > -45)
n = len(t) + 2; phu = np.zeros(n, int)
for i in np.nonzero(dat)[0]: phu[i:i + 3] += 1      # cửa sổ i phủ ô i, i+1, i+2
tot = phu >= 2
doan = []; i = 0
while i < n:
    if tot[i]:
        j = i
        while j + 1 < n and tot[j + 1]: j += 1
        a, b = i * 0.5 + 0.25, (j + 1) * 0.5 - 0.25
        if b - a >= 2: doan.append((a, b))
        i = j + 1
    else: i += 1
r = subprocess.run(['ffmpeg', '-v', 'error', '-i', X48, '-ac', '1', '-ar', '48000', '-f', 'f32le', '-'], capture_output=True, check=True)
x = np.frombuffer(r.stdout, np.float32); HZ = 48000; gap = np.zeros(int(0.15 * HZ), np.float32)
luyen, giu = [], []
for a, b in doan:
    if b <= G0 - 10 or a >= G1 + 10: luyen.append((a, b))
    elif a >= G0 and b <= G1: giu.append((a, b))   # đoạn chạm vùng đệm ±10 s: bỏ hẳn
def ghi(ds, duong):
    y = np.concatenate([np.concatenate([x[int(a * HZ):int(b * HZ)], gap]) for a, b in ds])
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(HZ), '-ac', '1', '-i', '-', '-c:a', 'flac', duong], input=y.tobytes(), check=True)
    return len(y) / HZ
os.makedirs(os.path.join(YT, 'cham'), exist_ok=True)
sg = ghi(giu, os.path.join(YT, 'cham', TEN + '-giu.flac')); sl = ghi(luyen, os.path.join(YT, TEN + '-luyen.flac'))
tong = sum(b - a for a, b in doan)
print(f'{len(doan)} đoạn · {tong:.0f} s giọng thầy (của {len(x) / HZ:.0f} s) · luyện {len(luyen)} đoạn {sl:.0f} s · giữ riêng {len(giu)} đoạn {sg:.0f} s')
