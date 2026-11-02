# Tấm duyệt v2: (1) mỗi màn: điện thoại sáng + tối (+ máy tính sáng, ngang tối nếu có); (2) tổng quan theo nhóm; (3) trước → v1 → v2.
import os, re
from PIL import Image, ImageDraw, ImageFont
D = os.path.dirname(os.path.abspath(__file__))
def font(sz): return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', sz)
NEN = (238, 238, 246); CHU = (27, 25, 56); PHU = (90, 88, 125)
def tieu(t): return re.search(r'<title>([^<]*)</title>', open(f'{D}/{t}.html', encoding='utf8').read()).group(1)
def mo(p, w, cao=None):
    i = Image.open(p).convert('RGB'); i = i.resize((w, round(i.height * w / i.width)), Image.LANCZOS)
    return i.crop((0, 0, w, min(i.height, cao))) if cao else i
os.makedirs(f'{D}/bang', exist_ok=True)
NHOM = [('Hôm nay|hom-nay', ['hom-nay', 'hom-nay-du', 'hom-nay-kt', 'hom-nay-ca', 'thong-bao']),
        ('Học một chặng|hoc-chang', ['lam-moi', 'lam-chon', 'lam-ban-phim', 'lam-ds', 'lam-tln', 'hoc-cach-giai', 'ket-chang']),
        ('Luyện tập|luyen-tap', ['luyen-tap', 'tu-sua-loi', 'chua-cau-sai', 'cau-da-lam', 'tu-luyen', 'bai-tap']),
        ('Thành tích|thanh-tich', ['thanh-tich', 'chuoi-ngay', 'giai-tuan', 'cua-hang', 'hoc-cung-ban', 'kim-cuong', 'ket-qua']),
        ('Thêm · A.I · Đăng nhập|them-ai-dang-nhap', ['them', 'ai', 'dang-nhap', 'tam-dong'])]
for so, (tt, ds) in enumerate(NHOM, 1):
    ten, slug = tt.split('|')
    th = [mo(f'{D}/anh/{t}-doc-sang.jpg', 330, 760) for t in ds]
    P = 32; W = P * 2 + len(ds) * 330 + (len(ds) - 1) * 20; H = 96 + 760 + 56 + P
    b = Image.new('RGB', (W, H), NEN); d = ImageDraw.Draw(b)
    d.text((P, 28), f'{so}. {ten}', fill=CHU, font=font(32))
    for k, (t, im) in enumerate(zip(ds, th)):
        x = P + k * 350; b.paste(im, (x, 96)); d.text((x, 96 + im.height + 12), tieu(t)[:30], fill=PHU, font=font(15))
    b.save(f'{D}/bang/{so:02d}-{slug}.jpg', quality=62, optimize=True)
for t in [x[:-5] for x in sorted(os.listdir(D)) if x.endswith('.html')]:
    ds = mo(f'{D}/anh/{t}-doc-sang.jpg', 360, 1400); dt = mo(f'{D}/anh/{t}-doc-toi.jpg', 360, 1400)
    mt = mo(f'{D}/anh/{t}-may-tinh-sang.jpg', 900, 900); ng = mo(f'{D}/anh/{t}-ngang-toi.jpg', 900, 640)
    P = 32; W = P * 2 + 900 + 24 + 360 + 16 + 360; H = 90 + max(mt.height + 20 + ng.height, ds.height, dt.height) + P
    b = Image.new('RGB', (W, H), NEN); d = ImageDraw.Draw(b)
    d.text((P, 26), tieu(t), fill=CHU, font=font(28)); d.text((P, 62), 'máy tính sáng · ngang tối · điện thoại sáng · điện thoại tối', fill=PHU, font=font(15))
    b.paste(mt, (P, 90)); b.paste(ng, (P, 90 + mt.height + 20)); b.paste(ds, (P + 924, 90)); b.paste(dt, (P + 924 + 376, 90))
    b.save(f'{D}/bang/man-{t}.jpg', quality=58, optimize=True)
# trước → v1 → v2
a = mo(f'{D}/../../anh-lo-trinh-bong-bong-0211/sau-doc-sang.jpg', 360, 780); b1 = mo(f'{D}/../anh/lo-trinh-doc-sang.jpg', 360, 780); c = mo(f'{D}/anh/hom-nay-doc-sang.jpg', 360, 780)
P = 32; b = Image.new('RGB', (P * 2 + 360 * 3 + 40, 110 + 780 + P), NEN); d = ImageDraw.Draw(b)
d.text((P, 26), 'Màn chính: đang chạy → bản v1 (bị chê) → bản v2 «Kính»', fill=CHU, font=font(26))
for k, (im, t) in enumerate([(a, 'ĐANG CHẠY (giống Duolingo)'), (b1, 'V1 · Ô nguyên tố (chưa đột phá)'), (c, 'V2 · KÍNH (đề xuất)')]):
    d.text((P + k * 380, 70), t, fill=PHU, font=font(16)); b.paste(im, (P + k * 380, 100))
b.save(f'{D}/bang/00-truoc-sau.jpg', quality=66, optimize=True)
print('xong', len(os.listdir(f'{D}/bang')), 'tấm')
