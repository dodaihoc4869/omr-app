# Ghép bảng duyệt «Đấu Nguyên Tử v2»: bản cũ (v1, 01/11) cạnh bản mới. python3 docs/ban-ve-dau-ion-v2-0211/ghep.py
import os
from PIL import Image, ImageDraw, ImageFont

D = os.path.dirname(os.path.abspath(__file__))
CU = os.path.join(D, '../ban-ve-dau-ion-3v3-0111')
MOI = os.path.join(D, 'anh')
F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22)
F2 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 17)


def o(thu_muc, ten, cao):
    a = Image.open(os.path.join(thu_muc, ten)).convert('RGB')
    return a.resize((round(a.width * cao / a.height), cao), Image.LANCZOS)


def bang(ra, tieu_de, hang):
    # hang: [(cao, [(nhãn, thư mục, tệp)])]
    o_hang = [[(n, o(t, f, c)) for n, t, f in ds] for c, ds in hang]
    rong = max(sum(a.width for _, a in h) + 24 * (len(h) + 1) for h in o_hang)
    cao = 70 + sum(max(a.height for _, a in h) + 46 for h in o_hang) + 10
    b = Image.new('RGB', (rong, cao), (246, 246, 252))
    v = ImageDraw.Draw(b)
    v.text((24, 22), tieu_de, font=F, fill=(27, 25, 56))
    y = 70
    for h in o_hang:
        x = 24
        for n, a in h:
            mau = (90, 88, 125) if n.startswith('CŨ') else (86, 91, 189)
            v.text((x, y), n, font=F2, fill=mau)
            b.paste(a, (x, y + 26))
            v.rectangle([x - 1, y + 25, x + a.width, y + 26 + a.height], outline=(203, 203, 227))
            x += a.width + 24
        y += max(a.height for _, a in h) + 46
    if b.width > 1600: b = b.resize((1600, round(b.height * 1600 / b.width)), Image.LANCZOS)
    q = 78
    while True:
        b.save(os.path.join(D, ra), quality=q, optimize=True)
        if os.path.getsize(os.path.join(D, ra)) <= 150 * 1024 or q <= 50: break
        q -= 6
    print(ra, b.size, os.path.getsize(os.path.join(D, ra)) // 1024, 'KB')


bang('bang-1-tran.jpg', '1 · TRẬN ĐẤU — cũ (01/11) và mới «Phòng thí nghiệm kính»', [
    (330, [('CŨ · ngang 844', CU, 'tran-844-sang.jpg'), ('MỚI · ngang 844 · sáng', MOI, 'tran-844-sang.jpg')]),
    (330, [('MỚI · ngang 844 · tối', MOI, 'tran-844-toi.jpg'), ('MỚI · máy yếu (phẳng, không vệt, không quầng)', MOI, 'tran-844-sang-yeu.jpg')]),
    (620, [('CŨ · dọc 390', CU, 'tran-390-sang.jpg'), ('MỚI · dọc 390 · sáng', MOI, 'tran-390-sang.jpg'), ('MỚI · dọc 390 · tối', MOI, 'tran-390-toi.jpg'),
           ('MỚI · máy tính 1440', MOI, 'tran-1440-toi.jpg')]),
])
bang('bang-2-sanh.jpg', '2 · PHÒNG CHỜ (sảnh game) — cũ và mới', [
    (700, [('CŨ · 390', CU, 'sanh-390-sang.jpg'), ('MỚI · 390 · sáng', MOI, 'sanh-390-sang.jpg'), ('MỚI · 390 · tối', MOI, 'sanh-390-toi.jpg')]),
    (330, [('CŨ · ngang 844', CU, 'sanh-844-sang.jpg'), ('MỚI · ngang 844', MOI, 'sanh-844-sang.jpg')]),
    (440, [('CŨ · 1440', CU, 'sanh-1440-sang.jpg'), ('MỚI · 1440 · tối', MOI, 'sanh-1440-toi.jpg')]),
])
bang('bang-3-het-van.jpg', '3 · HẾT VÁN — cũ và mới', [
    (330, [('CŨ · ngang 844', CU, 'het-van-844-sang.jpg'), ('MỚI · ngang 844 · sáng', MOI, 'het-844-sang.jpg')]),
    (620, [('CŨ · 390', CU, 'het-van-390-sang.jpg'), ('MỚI · 390', MOI, 'het-390-sang.jpg'), ('MỚI · ngang 844 · tối', MOI, 'het-844-toi.jpg')]),
])
bang('bang-4-goi-y-vao-thay.jpg', '4 · GỢI Ý LẦN ĐẦU (3 giây) · BẠN VÀO THAY A.I', [
    (330, [('CŨ · gợi ý', CU, 'goi-y-dau-844-sang.jpg'), ('MỚI · gợi ý', MOI, 'goiy-844-sang.jpg')]),
    (330, [('CŨ · vào thay', CU, 'vao-thay-844-sang.jpg'), ('MỚI · vào thay · tối', MOI, 'vaothay-844-toi.jpg')]),
])
