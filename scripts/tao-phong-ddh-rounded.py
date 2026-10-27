# TẠO PHÔNG «ĐĐH Rounded» (thầy 27/10: «tự tạo font riêng» cho app học sinh, đẹp như chữ Duolingo).
# Dẫn xuất từ M PLUS Rounded 1c (SIL OFL 1.1, © 2016 The Rounded M+ Project Authors — KHÔNG có Reserved Font Name; vẫn đổi tên
# cho đúng tinh thần OFL). KHÔNG dùng / chép đường nét của phông Duolingo (Feather, DIN Next Rounded): chỉ học cảm giác tròn, dày, rộng.
#
# Ba kiểu:
#   Đề  (chữ đề / phương án / thân, gốc Medium 500 — thầy 27/10 «Đề cho nét thanh hơn»): mặt chữ rộng ×1,03, khoảng chữ +1,2 %,
#        chiều cao chữ thường +3 %, «l» có đuôi sẵn, «1» có chân.
#   Nhấn (chữ chạm được / nhãn đậm vừa, gốc Bold 700): cùng các sửa của Đề, đậm hơn một bậc.
#   Đậm (tiêu đề / nút / số, gốc Black 900): hẹp ×0,96, khoảng chữ −1,5 %, chiều cao chữ thường +3 %, «l» có đuôi qua ss01 (lớp .ct-l).
# Cả hai: chỉ số dưới hạ dưới chân dòng (M+ đặt ₂ ₆ trên chân dòng), mũi tên → ← ↑ ↓ ⇄ ⇌ vẽ lại đầu tròn, hẹp (M+ rộng cả em),
# bỏ hinting / tên glyph / chữ dọc / liga; chia hai mảnh latin + vietnamese (unicode-range như trong-hs.css), woff2.
#
# Chạy: python3 scripts/tao-phong-ddh-rounded.py <thư mục có MPLUSRounded1c-Medium.ttf, -Bold.ttf, -Black.ttf> <thư mục ra>
#   (TTF lấy ở github.com/google/fonts, ofl/mplusrounded1c). Cần: fonttools, brotli, skia-pathops.
import math, os, sys, unicodedata
from fontTools.ttLib import TTFont
from fontTools.ttLib.removeOverlaps import removeOverlaps
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.subset import Subsetter, Options
from fontTools.otlLib.builder import buildSingleSubstSubtable, buildLookup
from fontTools.ttLib.tables import otTables as ot

NGUON, RA = sys.argv[1], sys.argv[2]

def khoang(a, b): return list(range(a, b + 1))

# Mảnh vietnamese: đúng unicode-range cũ (trong-hs.css). Mảnh latin: Latin cơ bản + Latin-1 + dấu câu + kí hiệu Hoá.
VIET = (khoang(0x102, 0x103) + khoang(0x110, 0x111) + khoang(0x128, 0x129) + khoang(0x168, 0x169) + khoang(0x1A0, 0x1A1)
        + khoang(0x1AF, 0x1B0) + khoang(0x300, 0x301) + khoang(0x303, 0x304) + khoang(0x308, 0x309) + [0x323, 0x329]
        + khoang(0x1EA0, 0x1EF9) + [0x20AB])
# Latin-1: chỉ dấu câu / kí hiệu hay gặp và chữ có dấu tiếng Việt (À Á Â Ã È É Ê Ì Í Ò Ó Ô Õ Ù Ú Ý + chữ thường);
# kí tự khác (Ç Ö Æ © ¼ ‰ ™…) rơi sang phông máy từng chữ — bớt byte để ba kiểu vẫn nhẹ hơn bộ M PLUS cũ.
LATIN1 = ([0xA0, 0xAB, 0xAD, 0xB0, 0xB1, 0xB2, 0xB3, 0xB7, 0xB9, 0xBB, 0xD7, 0xF7]
          + [ord(c) for c in 'ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúý'])
LATIN = (khoang(0x20, 0x7E) + LATIN1 + [0x394, 0x3B1, 0x3B2]
         + khoang(0x2013, 0x2014) + [0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2026]
         + [0x2070] + khoang(0x2074, 0x207B) + khoang(0x2080, 0x208B) + [0x20AC, 0x2103]
         + khoang(0x2190, 0x2193) + [0x21C4, 0x21CC, 0x2212, 0x2264, 0x2265])

KIEU = {
  'de': dict(tep='MPLUSRounded1c-Medium.ttf', sx=1.03, theo=12, kxh=1.03, dam=500, ten='De', hien='Đề',
             l_mac_dinh=True, mot_chan=True),
  'nhan': dict(tep='MPLUSRounded1c-Bold.ttf', sx=1.03, theo=12, kxh=1.03, dam=700, ten='Nhan', hien='Nhấn',
               l_mac_dinh=True, mot_chan=True),
  'dam': dict(tep='MPLUSRounded1c-Black.ttf', sx=0.96, theo=-15, kxh=1.03, dam=900, ten='Dam', hien='Đậm',
              l_mac_dinh=False, mot_chan=False),
}
XH = 520  # chiều cao chữ thường của gốc (x, u, n… 0–520)

def tuy_chon(ten_glyph):
  o = Options()
  o.layout_features = ['ccmp', 'kern', 'mark', 'mkmk', 'locl', 'ss01']
  o.hinting = False
  o.glyph_names = ten_glyph
  o.name_IDs = ['*']; o.name_languages = ['*']; o.name_legacy = True
  o.notdef_outline = True
  o.drop_tables += ['vhea', 'vmtx', 'VORG', 'DSIG', 'gasp']
  o.recalc_bounds = True
  return o

# ── bút vẽ: cung tròn bậc hai, thanh đầu tròn (capsule), đa giác cong ──
def cung(p, cx, cy, r, a0, a1):
  n = max(1, round(abs(a1 - a0) / 45)); d = (a1 - a0) / n
  for k in range(n):
    t0 = math.radians(a0 + d * k); t1 = math.radians(a0 + d * (k + 1)); tm = (t0 + t1) / 2
    q = r / math.cos((t1 - t0) / 2)
    p.qCurveTo((round(cx + q * math.cos(tm)), round(cy + q * math.sin(tm))), (round(cx + r * math.cos(t1)), round(cy + r * math.sin(t1))))

def thanh(p, x1, y1, x2, y2, s):
  """Thanh nét dày s từ (x1,y1) tới (x2,y2), hai đầu tròn — vẽ chiều kim đồng hồ (TrueType)."""
  h = s / 2; a = math.degrees(math.atan2(y2 - y1, x2 - x1))
  nx, ny = -math.sin(math.radians(a)) * h, math.cos(math.radians(a)) * h  # pháp tuyến bên trái
  p.moveTo((round(x1 - nx), round(y1 - ny)))
  cung(p, x1, y1, h, a - 90, a - 270)  # đầu (x1,y1): quay từ phải sang trái qua phía sau ⇒ chiều kim đồng hồ
  p.lineTo((round(x2 + nx), round(y2 + ny)))
  cung(p, x2, y2, h, a + 90, a - 90)
  p.closePath()

def goc_bo(p, pts, r):
  """Đa giác (chiều kim đồng hồ) bo góc bán kính r bằng đường bậc hai qua đỉnh."""
  n = len(pts)
  for i in range(n):
    a, b, c = pts[i - 1], pts[i], pts[(i + 1) % n]
    def lui(u, v, d):
      L = math.hypot(v[0] - u[0], v[1] - u[1]); d = min(d, L / 2)
      return (round(v[0] + (u[0] - v[0]) * d / L), round(v[1] + (u[1] - v[1]) * d / L))
    p0, p1 = lui(a, b, r), lui(c, b, r)
    (p.moveTo if i == 0 else p.lineTo)(p0)
    p.qCurveTo(b, p1)
  p.closePath()

# ── «l» có đuôi: thân thẳng (đầu bo r 57 như M+), cuối thân cong sang phải thành đuôi ngang, đầu đuôi bo ──
def ve_l(L, w, Ri, keo, top=750, r=57):
  p = TTGlyphPen(None); R = L + w; cx, cy = R + Ri, w + Ri; Xe = cx + keo
  p.moveTo((L, cy))
  p.lineTo((L, top - r)); p.qCurveTo((L, top), (L + r, top))
  p.lineTo((R - r, top)); p.qCurveTo((R, top), (R, top - r))
  p.lineTo((R, cy))
  cung(p, cx, cy, Ri, 180, 270)                 # cong trong
  p.lineTo((Xe - r, w)); p.qCurveTo((Xe, w), (Xe, w - r))
  p.lineTo((Xe, r)); p.qCurveTo((Xe, 0), (Xe - r, 0))
  p.lineTo((cx, 0))
  cung(p, cx, cy, Ri + w, 270, 180)             # cong ngoài
  p.closePath()
  return p.glyph(), Xe

def them_glyph(f, ten, glyph, adv):
  g = f['glyf']; g[ten] = glyph
  thu_tu = f.getGlyphOrder()
  if ten not in thu_tu: f.setGlyphOrder(thu_tu + [ten])
  glyph.recalcBounds(g)
  f['hmtx'][ten] = (adv, getattr(glyph, 'xMin', 0))

def dat_cmap(f, cp, ten):
  for st in f['cmap'].tables:
    if st.isUnicode(): st.cmap[cp] = ten

def do_net(f):
  """Độ dày nét ngang (gạch «−») và nét đứng («l») của gốc."""
  g = f['glyf']; m = g['minus']; m.recalcBounds(g); l = g['l']; l.recalcBounds(g)
  return m.yMax - m.yMin, (m.yMax + m.yMin) / 2, l.xMax - l.xMin, l.xMin

def ve_mui_ten(f, cm):
  s, tam, _, _ = do_net(f)
  B = 175; A = 42  # dài ngạnh, góc ngạnh
  ca, sa = math.cos(math.radians(A)) * B, math.sin(math.radians(A)) * B
  def ngang(p, x1, x2, y, phai=True, nua=None):
    thanh(p, x1, y, x2, y, s)
    tip = x2 if phai else x1; dx = -ca if phai else ca
    if nua in (None, 'tren'): thanh(p, tip, y, tip + dx, y + sa, s)
    if nua in (None, 'duoi'): thanh(p, tip, y, tip + dx, y - sa, s)
  ADV = 700; X1, X2 = 80, 620
  bang = {}
  p = TTGlyphPen(None); ngang(p, X1, X2, tam, True); bang[0x2192] = (p, ADV)
  p = TTGlyphPen(None); ngang(p, X1, X2, tam, False); bang[0x2190] = (p, ADV)
  lech = s / 2 + 52
  p = TTGlyphPen(None); ngang(p, X1, X2, tam + lech + 8, True, 'tren'); ngang(p, X1, X2, tam - lech - 8, False, 'duoi'); bang[0x21CC] = (p, ADV)
  p = TTGlyphPen(None); ngang(p, X1, X2, tam + lech + 30, True); ngang(p, X1, X2, tam - lech - 30, False); bang[0x21C4] = (p, ADV)
  VX, Y1, Y2 = 260, 0, 720
  p = TTGlyphPen(None); thanh(p, VX, Y1, VX, Y2, s); thanh(p, VX, Y2, VX - sa, Y2 - ca, s); thanh(p, VX, Y2, VX + sa, Y2 - ca, s); bang[0x2191] = (p, 520)
  p = TTGlyphPen(None); thanh(p, VX, Y2, VX, Y1, s); thanh(p, VX, Y1, VX - sa, Y1 + ca, s); thanh(p, VX, Y1, VX + sa, Y1 + ca, s); bang[0x2193] = (p, 520)
  moi = []
  for cp, (p, adv) in bang.items():
    ten = cm.get(cp) or f'uni{cp:04X}'
    them_glyph(f, ten, p.glyph(), adv); dat_cmap(f, cp, ten); moi.append(ten)
  removeOverlaps(f, moi)

def mot_co_chan(f):
  g = f['glyf']; c, e, _ = g['one'].getCoordinates(g)
  # thân «1»: hai cạnh đứng dài nhất (x xuất hiện nhiều lần ở cả y gần 0 lẫn gần 700)
  xs = sorted({x for x, y in c if 50 < y < 680 and any(abs(x - x2) < 1 and y2 < 60 for x2, y2 in c)})
  L, R = xs[0], xs[-1]; tam = (L + R) / 2
  s, _, _, _ = do_net(f)
  p = TTGlyphPen(None); g['one'].draw(p, g)
  goc_bo(p, [(tam - 165, 0), (tam - 165, s), (tam + 165, s), (tam + 165, 0)], 50)
  adv = f['hmtx']['one'][0]
  them_glyph(f, 'one', p.glyph(), adv); removeOverlaps(f, ['one'])

def ha_chi_so_duoi(f, cm):
  g = f['glyf']
  for cp in khoang(0x2080, 0x208B):
    ten = cm.get(cp)
    if not ten or g[ten].isComposite() or g[ten].numberOfContours == 0: continue
    c = g[ten].coordinates
    for i in range(len(c)): c[i] = (c[i][0], c[i][1] - 140)
    g[ten].recalcBounds(g)

def them_ss01(f):
  gsub = f['GSUB'].table
  lk = buildLookup([buildSingleSubstSubtable({'l': 'l.ss01'})])
  gsub.LookupList.Lookup.append(lk); gsub.LookupList.LookupCount = len(gsub.LookupList.Lookup)
  fr = ot.FeatureRecord(); fr.FeatureTag = 'ss01'; fr.Feature = ot.Feature(); fr.Feature.FeatureParams = None
  fr.Feature.LookupListIndex = [len(gsub.LookupList.Lookup) - 1]; fr.Feature.LookupCount = 1
  gsub.FeatureList.FeatureRecord.append(fr); gsub.FeatureList.FeatureCount = len(gsub.FeatureList.FeatureRecord)
  fi = gsub.FeatureList.FeatureCount - 1
  for sr in gsub.ScriptList.ScriptRecord:
    for ls in [sr.Script.DefaultLangSys] + [x.LangSys for x in sr.Script.LangSysRecord]:
      if ls is not None: ls.FeatureIndex.append(fi); ls.FeatureCount = len(ls.FeatureIndex)

def bien_doi(f, k):
  """Rộng/hẹp theo sx, khoảng chữ `theo`, chữ thường cao thêm (k.kxh) — áp cho glyf, hmtx, neo dấu và kern của GPOS."""
  sx, theo, kxh = k['sx'], k['theo'], k['kxh']; d = XH * (kxh - 1)
  g = f['glyf']; hm = f['hmtx']; cm = f.getBestCmap()
  thuong = {n for cp, n in cm.items() if unicodedata.category(chr(cp)) == 'Ll'} | {'l.ss01', 'dotlessi', 'uni0237'}
  def ry(y, la_thuong): return y if not la_thuong or y < 0 else (y * kxh if y <= XH else y + d)
  dich = {}
  for ten in f.getGlyphOrder():
    adv, _ = hm[ten]; s = theo / 2 if adv > 0 else 0; dich[ten] = s
    gl = g[ten]
    if gl.isComposite():
      raise SystemExit(f'glyph ghép chưa xử lí: {ten}')
    if gl.numberOfContours:
      lt = ten in thuong
      c = gl.coordinates
      for i in range(len(c)): c[i] = (round(c[i][0] * sx + s), round(ry(c[i][1], lt)))
      gl.recalcBounds(g)
    hm[ten] = (max(0, round(adv * sx + theo)) if adv > 0 else 0, getattr(gl, 'xMin', 0))
  def neo(a, ten):
    if a is None: return
    a.XCoordinate = round(a.XCoordinate * sx + dich.get(ten, 0)); a.YCoordinate = round(ry(a.YCoordinate, ten in thuong))
    if a.Format != 1: a.Format = 1
  for lk in f['GPOS'].table.LookupList.Lookup:
    for st in lk.SubTable:
      if lk.LookupType == 9: st = st.ExtSubTable
      t = st.LookupType if hasattr(st, 'LookupType') else lk.LookupType
      if t == 2:
        vrs = []
        if st.Format == 1:
          for ps in st.PairSet:
            for pv in ps.PairValueRecord: vrs += [pv.Value1, getattr(pv, 'Value2', None)]
        else:
          for c1 in st.Class1Record:
            for c2 in c1.Class2Record: vrs += [c2.Value1, getattr(c2, 'Value2', None)]
        for v in vrs:
          if v is None: continue
          for fld in ('XAdvance', 'XPlacement'):
            if hasattr(v, fld): setattr(v, fld, round(getattr(v, fld) * sx))
        if st.Format == 1:
          # bỏ cặp kern < 0,022 em (≤ 0,4 px ở cỡ chữ 17 px — mắt không thấy): bớt ~1/2 bảng kern ⇒ đủ byte cho kiểu thứ ba
          nho = lambda pv: pv.Value1 is not None and abs(getattr(pv.Value1, 'XAdvance', 0)) < 22 and not getattr(pv.Value1, 'XPlacement', 0) and getattr(pv, 'Value2', None) is None
          for ps in st.PairSet:
            ps.PairValueRecord = [pv for pv in ps.PairValueRecord if not nho(pv)]; ps.PairValueCount = len(ps.PairValueRecord)
      elif t == 4:
        for ten, mr in zip(st.MarkCoverage.glyphs, st.MarkArray.MarkRecord): neo(mr.MarkAnchor, ten)
        for ten, br in zip(st.BaseCoverage.glyphs, st.BaseArray.BaseRecord):
          for a in br.BaseAnchor: neo(a, ten)
      elif t == 6:
        for ten, mr in zip(st.Mark1Coverage.glyphs, st.Mark1Array.MarkRecord): neo(mr.MarkAnchor, ten)
        for ten, br in zip(st.Mark2Coverage.glyphs, st.Mark2Array.Mark2Record):
          for a in br.Mark2Anchor: neo(a, ten)
      else:
        raise SystemExit(f'GPOS loại {t} chưa xử lí')

def dat_ten(f, k):
  nm = f['name']; nm.names = []
  ban_quyen = 'Copyright 2016 The Rounded M+ Project Authors. DDH Rounded: modified 2026 (omr-app).'
  bang = {0: ban_quyen, 1: f"DDH Rounded {k['ten']}", 2: 'Regular', 3: f"DDHRounded-{k['ten']} 1.000",
          4: f"ĐĐH Rounded {k['hien']}", 5: 'Version 1.000',
          6: f"DDHRounded-{k['ten']}",
          13: 'SIL Open Font License 1.1 (OFL.txt)',
          14: 'https://openfontlicense.org'}
  for i, s in bang.items(): nm.setName(s, i, 3, 1, 0x409)
  f['OS/2'].usWeightClass = k['dam']
  f['OS/2'].achVendID = 'DDH '
  f['head'].fontRevision = 1.0
  if 'post' in f: f['post'].formatType = 3.0

def tao(ma, k):
  goc = TTFont(os.path.join(NGUON, k['tep']))
  sub = Subsetter(tuy_chon(True)); sub.populate(unicodes=VIET + LATIN); sub.subset(goc)
  tam = os.path.join(RA, f'.tam-{ma}.ttf'); goc.save(tam)
  f = TTFont(tam); cm = f.getBestCmap()
  ha_chi_so_duoi(f, cm)
  ve_mui_ten(f, cm)
  _, _, w, L = do_net(f)
  Ri = 42 if w < 170 else 40
  gl, Xe = ve_l(L, w, Ri, 8 + w / 2)
  if k['l_mac_dinh']:
    them_glyph(f, 'l', gl, Xe + 34)
  else:
    them_glyph(f, 'l.ss01', gl, Xe + 40); them_ss01(f)
    if 'GDEF' in f and f['GDEF'].table.GlyphClassDef: f['GDEF'].table.GlyphClassDef.classDefs['l.ss01'] = 1
  if k['mot_chan']: mot_co_chan(f)
  bien_doi(f, k)
  dat_ten(f, k)
  f.save(tam); f.close()
  tong = 0
  for manh, ds in (('latin', LATIN), ('vietnamese', VIET)):
    f = TTFont(tam)
    o = tuy_chon(False); o.flavor = 'woff2'
    s = Subsetter(o); s.populate(unicodes=ds); s.subset(f)
    ra = os.path.join(RA, f'ddh-rounded-{ma}-{manh}.woff2'); f.flavor = 'woff2'; f.save(ra)
    n = os.path.getsize(ra); tong += n
    print(f'{ra}: {n} B · {len(f.getGlyphOrder())} glyph')
  os.remove(tam)
  return tong

os.makedirs(RA, exist_ok=True)
tong = sum(tao(m, k) for m, k in KIEU.items())
print('TỔNG', tong, 'B')
