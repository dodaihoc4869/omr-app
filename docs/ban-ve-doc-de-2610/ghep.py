# Ghép tấm duyệt: máy tính sáng (rộng 1100) + điện thoại sáng + điện thoại tối (rộng 390), nền xám nhạt, tiêu đề.
import sys, os
from PIL import Image, ImageDraw, ImageFont
D = os.path.dirname(os.path.abspath(__file__))
F = os.path.join(D, 'font', 'be-vietnam-pro-vietnamese-600-normal.woff2')
def font(sz):
    for p in ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf']:
        if os.path.exists(p): return ImageFont.truetype(p, sz)
    return ImageFont.load_default()
for ten in sys.argv[1:]:
    import re
    m = re.search(r'<title>([^<]*)</title>', open(f'{D}/{ten}.html', encoding='utf8').read())
    tieu = (m.group(1) if m else ten).replace('HS ·', 'Học sinh ·').replace('GV ·', 'Thầy ·') + '   —   máy tính · điện thoại sáng · điện thoại tối'
    mt = Image.open(f'{D}/anh/{ten}-may-tinh-sang.jpg').convert('RGB')
    ds = Image.open(f'{D}/anh/{ten}-doc-sang.jpg').convert('RGB')
    dt = Image.open(f'{D}/anh/{ten}-doc-toi.jpg').convert('RGB')
    W1 = 1100; mt = mt.resize((W1, round(mt.height * W1 / mt.width)))
    W2 = 390; ds = ds.resize((W2, round(ds.height * W2 / ds.width))); dt = dt.resize((W2, round(dt.height * W2 / dt.width)))
    cao = max(mt.height, ds.height, dt.height); P = 40
    board = Image.new('RGB', (P + W1 + 32 + W2 + 24 + W2 + P, 90 + cao + P), (236, 238, 242))
    dr = ImageDraw.Draw(board)
    dr.text((P, 30), tieu, fill=(16, 24, 40), font=font(30))
    board.paste(mt, (P, 90)); board.paste(ds, (P + W1 + 32, 90)); board.paste(dt, (P + W1 + 32 + W2 + 24, 90))
    os.makedirs(f'{D}/bang', exist_ok=True)
    board.save(f'{D}/bang/{ten}.jpg', quality=58, optimize=True)
    print(ten, board.size, os.path.getsize(f'{D}/bang/{ten}.jpg') // 1024, 'KB')
