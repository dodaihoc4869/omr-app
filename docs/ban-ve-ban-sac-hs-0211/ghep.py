# Ghép tấm duyệt: (1) mỗi màn: máy tính sáng + điện thoại sáng + điện thoại tối + ngang tối; (2) tổng quan 14 màn điện thoại; (3) trước/sau Lộ trình.
import os, re, glob
from PIL import Image, ImageDraw, ImageFont
D = os.path.dirname(os.path.abspath(__file__))
def font(sz): return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', sz)
NEN = (236, 237, 245); CHU = (27, 25, 56)
def tieu(ten): return re.search(r'<title>([^<]*)</title>', open(f'{D}/{ten}.html', encoding='utf8').read()).group(1)
def mo(p, w, cao=None):
    i = Image.open(p).convert('RGB'); i = i.resize((w, round(i.height * w / i.width)))
    return i.crop((0, 0, w, min(i.height, cao))) if cao else i
os.makedirs(f'{D}/bang', exist_ok=True)
TRANG = ['dang-nhap', 'lo-trinh', 'lo-trinh-kt', 'lo-trinh-ca', 'lo-trinh-du', 'lam-moi', 'lam-chon', 'lam-ds', 'lam-tln', 'ket-chang', 'luyen-tap', 'thanh-tich', 'them', 'ai']
for t in TRANG:
    mt = mo(f'{D}/anh/{t}-may-tinh-sang.jpg', 960, 1200); ds = mo(f'{D}/anh/{t}-doc-sang.jpg', 360, 1500); dt = mo(f'{D}/anh/{t}-doc-toi.jpg', 360, 1500)
    ng = mo(f'{D}/anh/{t}-ngang-toi.jpg', 960, 900)
    P = 36; W = P + 960 + 28 + 360 + 20 + 360 + P; H = 96 + max(mt.height + 24 + ng.height, ds.height, dt.height) + P
    b = Image.new('RGB', (W, H), NEN); d = ImageDraw.Draw(b)
    d.text((P, 28), f'Học sinh · {tieu(t)}', fill=CHU, font=font(30))
    d.text((P, 66), 'máy tính sáng · ngang tối (844×390) · điện thoại sáng · điện thoại tối', fill=(90, 88, 125), font=font(17))
    b.paste(mt, (P, 96)); b.paste(ng, (P, 96 + mt.height + 24)); b.paste(ds, (P + 960 + 28, 96)); b.paste(dt, (P + 960 + 28 + 380, 96))
    b.save(f'{D}/bang/{t}.jpg', quality=70, optimize=True)
# tổng quan
th = [mo(f'{D}/anh/{t}-doc-sang.jpg', 300, 650) for t in TRANG]
cot = 7; P = 30; W = P * 2 + cot * 300 + (cot - 1) * 18; H = 100 + 2 * (650 + 64) + P
b = Image.new('RGB', (W, H), NEN); d = ImageDraw.Draw(b)
d.text((P, 30), 'App học sinh · hệ «Ô nguyên tố» — 14 màn, điện thoại sáng', fill=CHU, font=font(32))
for k, (t, i) in enumerate(zip(TRANG, th)):
    x = P + (k % cot) * 318; y = 100 + (k // cot) * 714
    b.paste(i, (x, y)); d.text((x, y + 656), tieu(t).split(' · ')[0] + (' · ' + tieu(t).split(' · ')[1][:22] if ' · ' in tieu(t) else ''), fill=CHU, font=font(15))
b.save(f'{D}/bang/00-tong-quan.jpg', quality=72, optimize=True)
# trước / sau
truoc = mo(f'{D}/../anh-lo-trinh-bong-bong-0211/sau-doc-sang.jpg', 390); sau = mo(f'{D}/anh/lo-trinh-doc-sang.jpg', 390, truoc.height)
P = 36; b = Image.new('RGB', (P * 2 + 390 * 2 + 40, 110 + truoc.height + P), NEN); d = ImageDraw.Draw(b)
d.text((P, 28), 'Lộ trình: trước (giống Duolingo) → sau (Ô nguyên tố)', fill=CHU, font=font(24))
d.text((P, 70), 'TRƯỚC — đang chạy 02/11', fill=(90, 88, 125), font=font(17)); d.text((P + 430, 70), 'SAU — bản vẽ', fill=(90, 88, 125), font=font(17))
b.paste(truoc, (P, 100)); b.paste(sau, (P + 430, 100))
b.save(f'{D}/bang/01-truoc-sau-lo-trinh.jpg', quality=74, optimize=True)
for p in sorted(glob.glob(f'{D}/bang/*.jpg')): print(os.path.basename(p), Image.open(p).size, os.path.getsize(p) // 1024, 'KB')
