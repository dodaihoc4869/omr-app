# Tạo phông con CHỈ một chữ «l» có đuôi, nét tròn khớp M PLUS Rounded 1c (700/800).
import math, sys
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont

RA = sys.argv[1]
def ve(w, lsb, R, E):
    h = w / 2; c = lsb + h; yt = 750 - h; y1 = h + R
    p = TTGlyphPen(None)
    def cung(cx, cy, r, a0, a1):
        # cung tròn từ a0 tới a1 (độ), mỗi 45° một đoạn bậc hai
        n = max(1, round(abs(a1 - a0) / 45)); d = (a1 - a0) / n
        for k in range(n):
            t0 = math.radians(a0 + d * k); t1 = math.radians(a0 + d * (k + 1)); tm = (t0 + t1) / 2
            q = r / math.cos((t1 - t0) / 2)
            p.qCurveTo((round(cx + q * math.cos(tm)), round(cy + q * math.sin(tm))), (round(cx + r * math.cos(t1)), round(cy + r * math.sin(t1))))
    p.moveTo((round(c - h), round(y1)))
    p.lineTo((round(c - h), round(yt)))
    cung(c, yt, h, 180, 0)
    p.lineTo((round(c + h), round(y1)))
    cung(c + R, y1, R - h, 180, 270)
    p.lineTo((round(c + R + E), round(w)))
    cung(c + R + E, h, h, 90, -90)
    p.lineTo((round(c + R), 0))
    cung(c + R, y1, R + h, 270, 180)
    p.closePath()
    adv = round(c + R + E + h + 34)
    return p.glyph(), adv

def notdef():
    p = TTGlyphPen(None); return p.glyph()

for dam, w, R in ((700, 140, 112), (800, 170, 124)):
    g, adv = ve(w, 84 if dam == 700 else 78, R, 8)
    fb = FontBuilder(1000, isTTF=True)
    fb.setupGlyphOrder(['.notdef', 'l'])
    fb.setupCharacterMap({0x6C: 'l'})
    fb.setupGlyf({'.notdef': notdef(), 'l': g})
    fb.setupHorizontalMetrics({'.notdef': (500, 0), 'l': (adv, g.xMin if hasattr(g, 'xMin') else 0)})
    fb.setupHorizontalHeader(ascent=1072, descent=-322)
    fb.setupNameTable({'familyName': 'DDH Chu L', 'styleName': 'Bold' if dam == 700 else 'ExtraBold', 'copyright': 'Ve tay cho omr-app (chu l co duoi)'})
    fb.setupOS2(sTypoAscender=1072, sTypoDescender=-322, usWinAscent=1072, usWinDescent=322, usWeightClass=dam, sxHeight=520, sCapHeight=730)
    fb.setupPost()
    f = fb.font
    f['glyf']['l'].recalcBounds(f['glyf'])
    f['hmtx']['l'] = (adv, f['glyf']['l'].xMin)
    f.flavor = 'woff2'
    duong = f'{RA}/chu-l-duoi-{dam}.woff2'
    f.save(duong)
    import os; print(duong, os.path.getsize(duong), 'B · adv', adv, 'bbox', f['glyf']['l'].xMin, f['glyf']['l'].xMax)
