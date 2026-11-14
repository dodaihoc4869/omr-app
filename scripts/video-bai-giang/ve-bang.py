# VIDEO TÓM TẮT — vẽ lại bảng của buổi từ net-gio.json thành ảnh (để người / tác tử soạn đọc nội dung bảng và lấy toạ độ khoanh «neo»).
# Toạ độ ghi trên lưới = toạ độ bảng rộng 1600 (đúng đơn vị của danhDau.neo và anNet trong cấu hình). Mỗi ảnh một khúc cao ~1050.
# Dùng: python3 ve-bang.py <thư mục tư liệu>  ⇒ <thư mục>/bang-0.jpg, bang-1.jpg, …
import json, sys
from PIL import Image, ImageDraw
d = sys.argv[1]
g = json.load(open(d + '/net-gio.json')); TL = g['tiLe']
def mau(m):
    if isinstance(m, str) and m.startswith('rgb'): return tuple(int(x) for x in m[4:-1].split(','))
    return (244, 239, 228)
diem = [[(n['d'][k] * 1600, n['d'][k + 1] * 1600 / TL) for k in range(0, len(n['d']), 4)] for n in g['net']]
H = int(max((p[1] for ds in diem for p in ds), default=900)) + 60
im = Image.new('RGB', (1600, H), (18, 30, 34)); dr = ImageDraw.Draw(im)
for x in range(0, 1600, 100): dr.line([(x, 0), (x, H)], fill=(34, 50, 56)); dr.text((x + 3, 3), str(x), fill=(90, 120, 130))
for y in range(0, H, 100): dr.line([(0, y), (1600, y)], fill=(34, 50, 56)); dr.text((3, y + 3), str(y), fill=(90, 120, 130))
for n, ds in zip(g['net'], diem):
    if len(ds) > 1: dr.line(ds, fill=mau(n['mau']), width=3)
for i, y0 in enumerate(range(0, H, 1050)):
    y1 = min(H, y0 + 1050)
    im.crop((0, y0, 1600, y1)).resize((1200, int((y1 - y0) * 0.75))).save(f'{d}/bang-{i}.jpg', quality=82)
print(f'bảng {len(g["net"])} nét, cao {H} ⇒ {(H + 1049) // 1050} ảnh')
