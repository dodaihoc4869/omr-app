# Ghép tấm xem app THẬT hệ Kính (ảnh từ scripts/chup-v2/chup-kinh.mjs): mỗi lớp = [bản vẽ v2 nếu có] · điện thoại sáng · điện thoại tối · Fold mở · ngang · máy tính.
#   python3 ghep.py <thư mục ảnh thật>
import os, sys
from PIL import Image, ImageDraw, ImageFont
D = os.path.dirname(os.path.abspath(__file__)); A = sys.argv[1]; V = os.path.join(D, '..', 'v2', 'anh')
def font(sz): return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', sz)
NEN = (238, 238, 246); CHU = (27, 25, 56); PHU = (90, 88, 125)
LOP = [('hom-nay', 'Hôm nay · đang học', 'hom-nay'), ('hom-nay-du', 'Hôm nay · đủ mức (đổi hồng)', 'hom-nay-du'), ('hom-nay-kiem-tra', 'Hôm nay · có Kiểm tra ôn tập', 'hom-nay-kt'),
  ('hom-nay-ca', 'Hôm nay · ca kiểm tra đang mở', 'hom-nay-ca'), ('hom-nay-diem-danh', 'Hôm nay · điểm danh đang mở', None), ('them', 'Thêm (điểm danh · ca · A.I · cài đặt)', 'them'),
  ('luyen-tap', 'Luyện tập', 'luyen-tap'), ('thanh-tich', 'Thành tích', 'thanh-tich'),
  ('lam-1-cau', 'Làm câu · câu mới', 'lam-moi'), ('lam-2-chon', 'Làm câu · đang chọn', 'lam-chon'), ('lam-3-dung', 'Làm câu · đúng', 'lam-tln'), ('lam-4-sai', 'Làm câu · sai', 'lam-ds'),
  ('lam-5-loi-giai', 'Làm câu · lời giải từng bước', 'hoc-cach-giai'), ('lam-6-dung-sai', 'Làm câu · Đúng–sai', 'lam-ds'), ('lam-7-tln', 'Làm câu · trả lời ngắn', 'lam-ban-phim'),
  ('lam-8-xong', 'Kết chặng (story)', 'ket-chang'), ('tu-sua-loi', 'Tự sửa lỗi', 'tu-sua-loi'), ('chua-cau-sai', 'Chữa câu sai', 'chua-cau-sai'), ('tu-luyen', 'Tu luyện', 'tu-luyen'),
  ('tu-luyen-lam', 'Tu luyện · làm câu', None), ('ktcn-cau', 'Kiểm tra ôn tập · làm câu', None), ('ktcn-ket', 'Kiểm tra ôn tập · kết quả', None),
  ('thi-cau', 'MÀN THI · câu', None), ('thi-chon', 'MÀN THI · đang chọn (giám thị soi đèn)', None), ('thi-kq', 'MÀN THI · kết quả sau nộp', 'ket-qua'),
  ('tp-chuoi', 'Chuỗi ngày', 'chuoi-ngay'), ('tp-giai', 'Giải tuần', 'giai-tuan'), ('tp-nhiem-vu', 'Nhiệm vụ hôm nay', 'nhiem-vu'), ('tp-cua-hang', 'Cửa hàng', 'cua-hang'),
  ('tp-huy-hieu', 'Huy hiệu', None), ('tp-ban', 'Học cùng bạn', 'hoc-cung-ban'), ('tp-ket', 'Kết bài (thưởng)', None), ('dang-nhap', 'Đăng nhập', 'dang-nhap'), ('ai', 'A.I Đỗ Đại Học', 'ai')]
def mo(p, w, cao):
    if not os.path.exists(p): return None
    i = Image.open(p).convert('RGB'); i = i.resize((w, round(i.height * w / i.width)), Image.LANCZOS); return i.crop((0, 0, w, min(i.height, cao)))
ds = []
for so, (t, ten, ve) in enumerate(LOP, 1):
    o = []
    if ve: o.append(('BẢN VẼ', mo(f'{V}/{ve}-doc-sang.jpg', 300, 650)))
    o += [('Điện thoại sáng', mo(f'{A}/{t}-doc-sang.jpg', 300, 650)), ('Điện thoại tối', mo(f'{A}/{t}-doc-toi.jpg', 300, 650)), ('Fold gập', mo(f'{A}/{t}-fold-gap-sang.jpg', 277, 616)),
          ('Fold mở', mo(f'{A}/{t}-fold-toi.jpg', 420, 650)), ('Ngang', mo(f'{A}/{t}-ngang-sang.jpg', 560, 260)), ('Máy tính', mo(f'{A}/{t}-may-tinh-sang.jpg', 560, 350))]
    o = [(n, i) for n, i in o if i is not None]
    if len(o) < 2: continue
    P = 28; doc = [x for x in o if x[0] not in ('Ngang', 'Máy tính')]; rong = [x for x in o if x[0] in ('Ngang', 'Máy tính')]
    W = P * 2 + sum(i.width for _, i in doc) + 16 * (len(doc) - 1) + (16 + 560 if rong else 0); H = 80 + max([i.height for _, i in doc] + [sum(i.height + 30 for _, i in rong)]) + 40 + P
    b = Image.new('RGB', (W, H), NEN); d = ImageDraw.Draw(b); d.text((P, 22), f'{so:02d}. {ten}', fill=CHU, font=font(26))
    x = P
    for n, i in doc: d.text((x, 62), n, fill=PHU if n != 'BẢN VẼ' else (200, 60, 120), font=font(14)); b.paste(i, (x, 82)); x += i.width + 16
    y = 82
    for n, i in rong: d.text((x, y - 20), n, fill=PHU, font=font(14)); b.paste(i, (x, y)); y += i.height + 30
    ra = f'{D}/{so:02d}-{t}.jpg'; q = 70
    b.save(ra, quality=q, optimize=True)
    while os.path.getsize(ra) > 260 * 1024 and q > 40: q -= 8; b.save(ra, quality=q, optimize=True)
    ds.append(ra)
print(len(ds), 'tấm')
