#!/usr/bin/env python3
"""ĐO TƯƠNG PHẢN các cặp chữ / nền của bản vẽ v2 (WCAG 2.x). Chạy: python3 docs/ban-ve-giao-dien-v2-0211/do-tuong-phan.py
Giá trị token = trong-hs-mau.css (sáng · tối). color-mix(in oklab, a p%, b) tính bằng OKLab như trình duyệt."""

def hex2rgb(h):
    h = h.lstrip('#'); return [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
def lin(c): return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
def delin(c): return 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055
def lum(rgb): r, g, b = map(lin, rgb); return 0.2126 * r + 0.7152 * g + 0.0722 * b
def ti_le(a, b):
    la, lb = sorted([lum(a), lum(b)], reverse=True); return (la + 0.05) / (lb + 0.05)
def oklab(rgb):
    r, g, b = map(lin, rgb)
    l = (0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b) ** (1 / 3)
    m = (0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b) ** (1 / 3)
    s = (0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b) ** (1 / 3)
    return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s]
def tu_oklab(L):
    l, m, s = [(v) ** 3 for v in (L[0] + 0.3963377774 * L[1] + 0.2158037573 * L[2], L[0] - 0.1055613458 * L[1] - 0.0638541728 * L[2], L[0] - 0.0894841775 * L[1] - 1.2914855480 * L[2])]
    rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s]
    return [min(1, max(0, delin(c))) for c in rgb]
def tron(a, p, b):
    A, B = oklab(hex2rgb(a)), oklab(hex2rgb(b)); return tu_oklab([x * p + y * (1 - p) for x, y in zip(A, B)])

S = dict(mat='#ffffff', nen='#f6f6fc', mat2='#f0f0fa', mat3='#e1e1f1', chu='#1b1938', chu2='#454367', chu3='#5a587d', trang='#ffffff',
         hs_nut='#767eff', hs_nhat='#eeeeff', hs_chu='#565bbd', hs_tren='#ffffff', dung_nut='#00a87b', dung_nhat='#c5ffe8', dung_chu='#007c58',
         sai='#f4417c', sai_nhat='#fddfe9', sai_chu='#c70b5b', tin_chu='#007889', tin_nhat='#dbf5fa', chu_y_chu='#b24f19', chu_y_nhat='#ffeee0')
T = dict(mat='#1a1a29', nen='#1a1a29', mat2='#2c2d40', mat3='#414157', chu='#f1f0ff', chu2='#cdceeb', chu3='#acaece', trang='#1a1a29',
         hs_nut='#a8adff', hs_nhat='#2c2e47', hs_chu='#b1b6ff', hs_tren='#1a1a29', dung_nut='#00d497', dung_nhat='#18382a', dung_chu='#00df9f',
         sai='#f7498f', sai_nhat='#43272f', sai_chu='#ff9bba', tin_chu='#00d5ed', tin_nhat='#0e373d', chu_y_chu='#ffa569', chu_y_nhat='#422a1a')
CAP = [  # (tên, chữ, nền, cần)  cần: 4.5 chữ thường · 3 chữ lớn (≥ 18,7 px đậm)
    ('Nút chính: chữ trên chàm', 'hs_tren', 'hs_nut', 3), ('Nút Tiếp tục đúng', 'trang', 'dung_nut', 3), ('Nút Tiếp tục sai', 'trang', 'sai', 3),
    ('Đề trên nền', 'chu', 'mat', 4.5), ('Nhãn chữ phụ 3', 'chu3', 'mat', 4.5), ('Thẻ chọn: chữ chàm / nền chàm nhạt', 'hs_chu', 'hs_nhat', 4.5),
    ('Thẻ đúng: chữ / nền', 'dung_chu', 'dung_nhat', 4.5), ('Thẻ sai: chữ / nền', 'sai_chu', 'sai_nhat', 4.5), ('Gợi ý sai: chữ 2 / nền hồng nhạt', 'chu2', 'sai_nhat', 4.5),
    ('Số nguyên tử', 'tin_chu', 'mat', 4.5), ('Chip nguyên tử trên dải đúng', 'tin_chu', 'dung_nhat', 4.5), ('Chip chuỗi (cam)', 'chu_y_chu', 'mat', 4.5),
    ('Chip thường: chữ 2 / mat-2', 'chu2', 'mat2', 4.5),
]
for ten_bo, B in (('SÁNG', S), ('TỐI', T)):
    print(f'── {ten_bo}')
    for ten, c, n, can in CAP:
        r = ti_le(hex2rgb(B[c]), hex2rgb(B[n]))
        print(f'  {ten:40s} {r:5.2f}:1  {"đạt" if r >= can else "CHƯA ĐẠT"} (cần {can})')
    k = tron(B['chu3'], 0.82, B['mat3'])
    r = ti_le(k, hex2rgb(B['mat3']))
    print(f'  {"Nút khoá: chữ (pha) / mặt khoá":40s} {r:5.2f}:1  {"đạt" if r >= 3 else "CHƯA ĐẠT"} (cần 3, chữ lớn)')
