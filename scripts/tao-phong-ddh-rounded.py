# TẠO PHÔNG «ĐĐH Rounded» (thầy 27/10: «tự tạo font riêng» cho app học sinh, đẹp như chữ Duolingo).
# Dẫn xuất từ M PLUS Rounded 1c (SIL OFL 1.1, © 2016 The Rounded M+ Project Authors — KHÔNG có Reserved Font Name; vẫn đổi tên
# cho đúng tinh thần OFL). KHÔNG dùng / chép đường nét của phông Duolingo (Feather, DIN Next Rounded): chỉ học cảm giác tròn, dày, rộng.
#
# Hai kiểu — độ đậm HIỆU CHỈNH THEO SỐ ĐO ảnh Duolingo (thầy 27/10 «nét chữ thanh đậm đúng tỉ lệ với Duolingo»; tỉ lệ «bề dày nét đứng /
# chiều cao chữ x» đo bằng máy, số đo ở src/styles/phong-ddh/README.md). Gốc M+ không nội suy được (các độ đậm
# vẽ rời, số điểm khác nhau) ⇒ chỉnh độ đậm bằng dời đường viền (làm đậm / làm mảnh `net` đơn vị mỗi bên, kiểu FT_Outline_Embolden).
#   Đề  (chữ đề / phương án / thân — «Đề cho nét thanh hơn»): gốc Regular 400 + NET_DE, rộng ×1,03, khoảng chữ +1,2 %,
#        chữ thường cao +3 %, «l» có đuôi sẵn, «1» có chân.
#   Đậm (tiêu đề / nút / nhãn / số / chữ chạm được): gốc Bold 700 + NET_DAM, hẹp ×0,96, khoảng chữ −1,5 %, chữ thường cao +3 %,
#        «l» có đuôi qua ss01 (lớp .ct-l). Đo: Duolingo dùng MỘT độ đậm cho mọi chữ đậm (tiêu đề, nút, nhãn, số, dải kết quả).
# Cả hai: chỉ số dưới hạ dưới chân dòng (M+ đặt ₂ ₆ trên chân dòng), mũi tên → ← ↑ ↓ ⇄ ⇌ vẽ lại đầu tròn, hẹp (M+ rộng cả em),
# bỏ hinting / tên glyph / chữ dọc / liga; chia hai mảnh latin + vietnamese (unicode-range như trong-hs.css), woff2.
#
# Chạy: python3 scripts/tao-phong-ddh-rounded.py <thư mục có MPLUSRounded1c-Regular.ttf, -Bold.ttf> <thư mục ra>
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

NET_DE = float(os.environ.get('DDH_NET_DE', 12))     # đơn vị (1/1000 em) dời mỗi bên — số đo chốt ở bảng tỉ lệ
# 07/11 thầy «chữ đậm chỉ đậm hơn một chút giống Duolingo»: mặt Đậm dựng từ M+ MEDIUM làm đậm 10 (cũ: Bold + 8) — bề dày nét I / chiều cao chữ hoa
# 0,180 (Đề 0,129 ⇒ gấp 1,4 như chữ đậm / chữ thường của Duolingo trên ảnh thầy gửi; cũ 0,218 = gấp 1,7).
NET_DAM = float(os.environ.get('DDH_NET_DAM', 26))
KIEU = {
  'de': dict(tep='MPLUSRounded1c-Regular.ttf', net=NET_DE, sx=1.01, theo=12, kxh=1.03, dam=400, ten='De', hien='Đề',
             l_mac_dinh=True, mot_chan=True),
  'dam': dict(tep=os.environ.get('DDH_TEP_DAM', 'MPLUSRounded1c-Medium.ttf'), net=NET_DAM, sx=0.98, theo=-18, kxh=1.069, dam=700, ten='Dam', hien='Đậm',
              l_mac_dinh=True, mot_chan=False),
}
XH = 520  # chiều cao chữ thường của gốc (x, u, n… 0–520)
# BỀ NGANG TỪNG CHỮ (thầy 07/11 «nghiên cứu siêu kĩ font Duolingo»): hệ số rộng riêng theo chữ gốc (đo trên ảnh Duolingo, chuẩn hoá theo chiều cao
# chữ hoa / chữ thường) — áp cả chữ có dấu cùng gốc (ư, ũ, ụ… theo «u»). Không chép nét: chỉ co / giãn ngang chữ của gốc M+.
import json as _json
HEP = _json.loads(os.environ.get('DDH_HEP', '''{"De":{"a":1.12,"s":1.08,"r":0.82},"Dam":{"a":1.04,"c":1.12,"Đ":0.92,"D":0.92," ":0.62,"l":1.1,"?":1.08}}'''))
KIEU['de'].update(_json.loads(os.environ.get('DDH_DE', '{}'))); KIEU['dam'].update(_json.loads(os.environ.get('DDH_DAM', '{}')))

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

def lam_dam(f, s):
  """Dời mọi đường viền ra ngoài s đơn vị (s < 0: vào trong) — mép mực đi đều hai phía, nét dày thêm 2s. Điểm ở góc dời theo phân giác
  (miter, chặn ở góc gắt). TrueType: mực nằm bên PHẢI hướng đi của đường viền ⇒ pháp tuyến ngoài = (−dy, dx)."""
  if not s: return
  g = f['glyf']
  for ten in f.getGlyphOrder():
    gl = g[ten]
    if gl.isComposite() or gl.numberOfContours <= 0: continue
    c = gl.coordinates; dau = 0; moi = list(c)
    for cuoi in gl.endPtsOfContours:
      idx = list(range(dau, cuoi + 1)); n = len(idx)
      for k, i in enumerate(idx):
        x, y = c[i]
        def ke(buoc):
          for t in range(1, n):
            px, py = c[idx[(k + buoc * t) % n]]
            if (px, py) != (x, y): return px, py
          return x, y
        (ax, ay), (bx, by) = ke(-1), ke(1)
        ix, iy = x - ax, y - ay; L = math.hypot(ix, iy) or 1; ix, iy = ix / L, iy / L
        ox, oy = bx - x, by - y; L = math.hypot(ox, oy) or 1; ox, oy = ox / L, oy / L
        nx, ny = (-iy - oy), (ix + ox)  # tổng hai pháp tuyến ngoài
        cos = ix * ox + iy * oy; he = max(1 + cos, 0.25)
        moi[i] = (x + nx * s / he, y + ny * s / he)
      dau = cuoi + 1
    for i, (x, y) in enumerate(moi): c[i] = (round(x), round(y))
    gl.recalcBounds(g)

def bien_doi(f, k):
  """Rộng/hẹp theo sx, khoảng chữ `theo`, chữ thường cao thêm (k.kxh) — áp cho glyf, hmtx, neo dấu và kern của GPOS."""
  sx, theo, kxh = k['sx'], k['theo'], k['kxh']; d = XH * (kxh - 1)
  g = f['glyf']; hm = f['hmtx']; cm = f.getBestCmap()
  thuong = {n for cp, n in cm.items() if unicodedata.category(chr(cp)) == 'Ll'} | {'l.ss01', 'dotlessi', 'uni0237'}
  def ry(y, la_thuong): return y if not la_thuong or y < 0 else (y * kxh if y <= XH else y + d)
  dich = {}
  hep = HEP.get(k['ten'], {})
  goc = {}
  for cp, n in cm.items():
    b = unicodedata.normalize('NFD', chr(cp))[0]
    if b in hep: goc[n] = hep[b]
  hs = {}
  for ten in f.getGlyphOrder():
    adv, _ = hm[ten]; s = theo / 2 if adv > 0 else 0; dich[ten] = s
    fx = goc.get(ten, 1.0); hs[ten] = sx * fx
    gl = g[ten]
    if gl.isComposite():
      raise SystemExit(f'glyph ghép chưa xử lí: {ten}')
    if gl.numberOfContours:
      lt = ten in thuong
      c = gl.coordinates
      for i in range(len(c)): c[i] = (round(c[i][0] * hs[ten] + s), round(ry(c[i][1], lt)))
      gl.recalcBounds(g)
    hm[ten] = (max(0, round(adv * hs[ten] + theo)) if adv > 0 else 0, getattr(gl, 'xMin', 0))
  def neo(a, ten):
    if a is None: return
    a.XCoordinate = round(a.XCoordinate * hs.get(ten, sx) + dich.get(ten, 0)); a.YCoordinate = round(ry(a.YCoordinate, ten in thuong))
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

DUOI_A = _json.loads(os.environ.get('DDH_DUOI_A', '''{"Dam":{"x0":455,"y0":52,"x1":522,"y1":92,"r":42,"them":40,"bung":{"cx":262,"cy":172,"rx":124,"ry":98}},"De":{"x0":432,"y0":38,"x1":486,"y1":66,"r":34,"them":30,"bung":{"cx":252,"cy":160,"rx":118,"ry":96}}}'''))  # {"x0":430,"y0":50,"x1":485,"y1":58,"r":50,"them":40} — đuôi hất chân phải chữ «a»
DAU = _json.loads(os.environ.get('DDH_DAU', '''{"nang":62,"co":0.85}'''))       # {"nang":60,"co":0.92} — nâng dấu trên (đơn vị) + co chiều cao dấu

def ho_chu(cm, chu):
  """Mọi glyph có chữ gốc `chu` (a, à, á, â, ầ…)."""
  return sorted({n for cp, n in cm.items() if unicodedata.normalize('NFD', chr(cp))[0] == chu})

def them_duoi_a(f, cm, d):
  """Đuôi «a» kiểu Duolingo: nét tròn (viên thuốc) từ chân nét đứng phải hất sang phải, hơi lên; gộp vào chữ (bỏ chồng nét)."""
  g = f['glyf']; hm = f['hmtx']; ds = ho_chu(cm, 'a'); ds = [n for n in ds if not g[n].isComposite()]
  x0, y0, x1, y1, rr = d['x0'], d['y0'], d['x1'], d['y1'], d['r']
  goc = math.atan2(y1 - y0, x1 - x0); N = 14
  vien = [(x1 + rr * math.cos(goc - math.pi / 2 + math.pi * i / N), y1 + rr * math.sin(goc - math.pi / 2 + math.pi * i / N)) for i in range(N + 1)]
  vien += [(x0 + rr * math.cos(goc + math.pi / 2 + math.pi * i / N), y0 + rr * math.sin(goc + math.pi / 2 + math.pi * i / N)) for i in range(N + 1)]
  dt = sum(vien[i][0] * vien[(i + 1) % len(vien)][1] - vien[(i + 1) % len(vien)][0] * vien[i][1] for i in range(len(vien)))
  if dt > 0: vien = vien[::-1]  # TrueType: đường bao ngoài theo chiều kim đồng hồ (diện tích có dấu âm) — cùng chiều thân chữ ⇒ gộp liền
  for n in ds:
    gl = g[n]; pen = TTGlyphPen(g); gl.draw(pen, g)
    pen.moveTo(tuple(map(round, vien[0])))
    for pt in vien[1:]: pen.lineTo(tuple(map(round, pt)))
    pen.closePath()
    g[n] = pen.glyph(); adv, lsb = hm[n]; hm[n] = (adv + d.get('them', 0), lsb)
    bd = d.get('bung')  # lỗ bụng bầu dục nằm ngang (thay lỗ hình lá nghiêng của gốc): {"cx":..,"cy":..,"rx":..,"ry":..}
    if bd:
      gl = g[n]; c = gl.coordinates; ends = gl.endPtsOfContours; s0 = 0; moi = []; fl = []; en = []
      for e in ends:
        pts = [c[i] for i in range(s0, e + 1)]; xs = [x for x, _ in pts]; ys = [y for _, y in pts]
        la_lo = max(xs) < 400 and 40 < min(ys) and max(ys) < 320
        if la_lo:
          pts = [(round(bd['cx'] + bd['rx'] * math.cos(-2 * math.pi * i / 24)), round(bd['cy'] + bd['ry'] * math.sin(-2 * math.pi * i / 24))) for i in range(24)]
          if sum(pts[i][0] * pts[(i + 1) % 24][1] - pts[(i + 1) % 24][0] * pts[i][1] for i in range(24)) < 0: pts = pts[::-1]  # lỗ: ngược chiều kim đồng hồ
          moi += pts; fl += [1] * 24
        else:
          moi += pts; fl += [gl.flags[i] for i in range(s0, e + 1)]
        en.append(len(moi) - 1); s0 = e + 1
      from fontTools.ttLib.tables._g_l_y_f import GlyphCoordinates
      gl.coordinates = GlyphCoordinates(moi); gl.flags = bytearray(fl); gl.endPtsOfContours = en; gl.recalcBounds(g)
  removeOverlaps(f, ds)

def chinh_dau(f, cm, k, d):
  """Dấu trên (mũ, huyền, sắc, hỏi, ngã, trăng): co chiều cao theo `co` (giữ chân dấu), nâng `nang` đơn vị ⇒ hở đúng khoảng Duolingo;
  bề ngang dấu giữ nguyên dù thân chữ được nới (chia lại hệ số HEP của chữ gốc)."""
  g = f['glyf']; xh = XH * k['kxh']; hep = HEP.get(k['ten'], {})
  TREN = {0x300, 0x301, 0x302, 0x303, 0x306, 0x309}
  for cp, n in cm.items():
    tach = unicodedata.normalize('NFD', chr(cp))
    if len(tach) < 2 or not any(ord(c) in TREN for c in tach[1:]): continue
    gl = g[n]
    if gl.isComposite() or not gl.numberOfContours: continue
    b = tach[0]; bn = cm.get(ord(b)); thuong = b.islower() and b not in 'bdfhklt'
    nguong = (xh + 15) if thuong else ((g[bn].yMax if bn and hasattr(g[bn], 'yMax') else 700) - 5)
    c = gl.coordinates; ends = gl.endPtsOfContours; s0 = 0; dau = []
    for e in ends:
      if min(c[i][1] for i in range(s0, e + 1)) > nguong: dau.append((s0, e))
      s0 = e + 1
    if not dau: continue
    yb = min(c[i][1] for a, e in dau for i in range(a, e + 1))
    xs = [c[i][0] for a, e in dau for i in range(a, e + 1)]; xc = (min(xs) + max(xs)) / 2; fx = hep.get(b, 1.0)
    for a, e in dau:
      for i in range(a, e + 1):
        x, y = c[i]; c[i] = (round(xc + (x - xc) / fx), round(yb + (y - yb) * d['co'] + d['nang']))
    gl.recalcBounds(g)

VE_DAU = _json.loads(os.environ.get('DDH_VE_DAU', '''{"Dam":{"w":400,"h":190,"t":120,"gw":225,"gh":190,"hoi_x":-90,"hoi_y":0.75},"De":{"w":370,"h":170,"t":82,"gw":205,"gh":170,"hoi_x":5}}'''))  # {"Dam":{"w":400,"h":200,"t":118,"g":0,"gw":236,"gh":200}} — vẽ lại mũ / huyền / sắc bằng nét viên thuốc đều

def _vien(p0, p1, r, N=12):
  (x0, y0), (x1, y1) = p0, p1; goc = math.atan2(y1 - y0, x1 - x0)
  v = [(x1 + r * math.cos(goc - math.pi / 2 + math.pi * i / N), y1 + r * math.sin(goc - math.pi / 2 + math.pi * i / N)) for i in range(N + 1)]
  v += [(x0 + r * math.cos(goc + math.pi / 2 + math.pi * i / N), y0 + r * math.sin(goc + math.pi / 2 + math.pi * i / N)) for i in range(N + 1)]
  dt = sum(v[i][0] * v[(i + 1) % len(v)][1] - v[(i + 1) % len(v)][0] * v[i][1] for i in range(len(v)))
  return v[::-1] if dt > 0 else v

def _hop_nhanh(ds):
  """Gộp hai nhánh mũ (đa giác thẳng) thành một đường bao — chỉ gộp hình mới vẽ, KHÔNG gộp cả chữ (removeOverlaps làm hỏng lỗ chữ A)."""
  import pathops
  p = pathops.Path(); pen = p.getPen()
  for v in ds:
    pen.moveTo(v[0])
    for q in v[1:]: pen.lineTo(q)
    pen.closePath()
  p.simplify(fix_winding=True); ra = []
  from fontTools.pens.recordingPen import RecordingPen
  rp = RecordingPen(); p.draw(rp); cur = []
  for op, a in rp.value:
    if op == 'moveTo': cur = [a[0]]
    elif op == 'lineTo': cur.append(a[0])
    elif op in ('closePath', 'endPath'):
      dt = sum(cur[i][0] * cur[(i + 1) % len(cur)][1] - cur[(i + 1) % len(cur)][0] * cur[i][1] for i in range(len(cur)))
      ra.append(cur[::-1] if dt > 0 else cur); cur = []
  return ra

def ve_dau(f, cm, k, d):
  """Dấu mũ / huyền / sắc kiểu Duolingo: nét đều (viên thuốc, hai đầu tròn), mũ dẹt hai nhánh gặp nhau ở đỉnh.
  Dấu đơn: cỡ chuẩn `w×h` (mũ) / `gw×gh` (huyền, sắc), giữ tâm ngang và chân dấu cũ. Dấu ghép (ầ ấ ẩ…): khít khung cũ, chỉ đổi nét."""
  g = f['glyf']; t = d['t']; r = t / 2; xh = XH * k['kxh']
  sua = []
  for cp, n in cm.items():
    tach = unicodedata.normalize('NFD', chr(cp)); dm = [ord(c) for c in tach[1:]]
    if not any(m in (0x300, 0x301, 0x302) for m in dm): continue
    gl = g[n]
    if gl.isComposite() or not gl.numberOfContours: continue
    b = tach[0]; bn = cm.get(ord(b)); thuong = b.islower() and b not in 'bdfhklt'
    nguong = (xh + 15) if thuong else ((g[bn].yMax if bn and hasattr(g[bn], 'yMax') else 700) - 5)
    c = gl.coordinates; ends = gl.endPtsOfContours; s0 = 0; than = []; dau = []
    for e in ends:
      pts = [tuple(c[i]) for i in range(s0, e + 1)]; fl = [gl.flags[i] for i in range(s0, e + 1)]
      (dau if min(y for _, y in pts) > nguong else than).append((pts, fl)); s0 = e + 1
    if not dau: continue
    hop = lambda ds: (min(x for p, _ in ds for x, _ in p), min(y for p, _ in ds for _, y in p), max(x for p, _ in ds for x, _ in p), max(y for p, _ in ds for _, y in p))
    mu = 0x302 in dm; khac = [m for m in dm if m in (0x300, 0x301, 0x303, 0x309, 0x306)]
    ds = sorted(dau, key=lambda q: min(y for _, y in q[0])); hinh = []; giu = []
    xm = 0x300 if 0x300 in dm else (0x301 if 0x301 in dm else None)
    def ve_mu(xc, yb):
      W, H = d['w'], d['h']; dinh = (xc, yb + H - r)
      hinh.extend(_hop_nhanh([_vien((xc - W / 2 + r, yb + r), dinh, r), _vien(dinh, (xc + W / 2 - r, yb + r), r)]))
    def ve_xien(xc, ytren, W, H):
      yb = ytren - H
      p0, p1 = ((xc - W / 2 + r, yb + H - r), (xc + W / 2 - r, yb + r)) if xm == 0x300 else ((xc - W / 2 + r, yb + r), (xc + W / 2 - r, yb + H - r))
      hinh.append(_vien(p0, p1, r))
    def vua(q, dx=0):  # dấu huyền / sắc nằm trong dấu ghép: khít khung cũ, không vượt cỡ chuẩn
      x0, y0, x1, y1 = hop([q]); ve_xien((x0 + x1) / 2 + dx, y1, min(x1 - x0, d['gw']), min(y1 - y0, d['gh']))
    def dich(q, dx, dy=0): return ([(x + dx, y + dy) for x, y in q[0]], q[1])
    if mu and len(ds) == 1 and khac:  # mũ dính liền dấu (ấ, ẩ của gốc)
      if xm is None:  # mũ + hỏi dính liền (ẩ ể ổ): vẽ mũ mới, lấy dấu hỏi của chữ không mũ (ả ẻ ỏ) đặt góc trên phải như gốc
        hn = cm.get(ord(unicodedata.normalize('NFC', tach[0] + '\u0309'))); x0, y0, x1, y1 = hop(ds)
        hk = []
        if hn and not g[hn].isComposite():
          G = g[hn]; cc = G.coordinates; s1 = 0
          for e in G.endPtsOfContours:
            pts = [tuple(cc[i]) for i in range(s1, e + 1)]
            if min(y for _, y in pts) > nguong: hk.append((pts, [G.flags[i] & 1 for i in range(s1, e + 1)]))
            s1 = e + 1
        if not hk: giu += ds
        else:
          ve_mu(x0 + d['w'] / 2, y0); hx0, hy0, hx1, hy1 = hop(hk)
          giu += [dich(q, x0 + d['w'] + d.get('hoi_x', -20) - hx0, (y0 + d['h'] * d['hoi_y'] - hy0) if 'hoi_y' in d else (y1 - hy1)) for q in hk]
      else:
        x0, y0, x1, y1 = hop(ds); ve_mu(x0 + d['w'] / 2, y0); k2 = d.get('ghep', 0.9)
        ve_xien(x1 - d['gw'] * k2 / 2, y1, d['gw'] * k2, d['gh'] * k2)
    elif mu:
      x0, y0, x1, y1 = hop(ds[:1]); xc = (x0 + x1) / 2; ve_mu(xc, y0); dx = (d['w'] - (x1 - x0)) / 2
      for q in ds[1:]:
        qx0, _, qx1, _ = hop([q]); lech = dx if (qx0 + qx1) / 2 > xc + 40 else 0  # dấu nằm bên phải mũ ⇒ dời theo bề rộng mũ mới
        if xm is None: giu.append(dich(q, lech))
        else: vua(q, lech)
    elif len(ds) == 1:
      x0, y0, x1, y1 = hop(ds); ve_xien((x0 + x1) / 2, y0 + d['gh'], d['gw'], d['gh'])
    else:  # trăng + huyền/sắc (ằ ắ): giữ trăng, vẽ lại dấu trên
      giu.append(ds[0])
      for q in ds[1:]: vua(q)
    # dựng lại: giữ đường bao thân + dấu giữ nguyên (điểm & cờ gốc), thêm hình mới
    from fontTools.ttLib.tables._g_l_y_f import GlyphCoordinates
    moi = []; fl = []; en = []
    for pts, f0 in than + giu: moi += pts; fl += [x & 1 for x in f0]; en.append(len(moi) - 1)
    for v in hinh: moi += [tuple(map(round, p)) for p in v]; fl += [1] * len(v); en.append(len(moi) - 1)
    gl.coordinates = GlyphCoordinates(moi); gl.flags = bytearray(fl); gl.endPtsOfContours = en; gl.numberOfContours = len(en)
    gl.recalcBounds(g); sua.append(n)

LE = _json.loads(os.environ.get('DDH_LE', r'''{"Dam":{"Đ":[0,36],"u":[18,0],"l":[0,-18],"c":[18,-18],"p":[18,0],"e":[18,0],"\"":[18,55,45],"?":[-73,0]},"De":{"f":[-27,-27],"e":[18,9],"t":[0,-54]," ":[0,-105]}}'''))  # {"Dam":{"u":[18,-18],"\"":[18,55,45]}} — lề trái/phải (đơn vị) cả họ chữ (a, à, â…); số thứ ba: nới khe giữa hai nét của dấu nháy

def chinh_le(f, cm, d):
  """Khoảng cách từng cặp chữ đo theo Duolingo: dời chữ sang phải L đơn vị và cộng L+R vào bề rộng."""
  g = f['glyf']; hm = f['hmtx']
  for ch, v in d.items():
    L, R = v[0], v[1]; tach = v[2] if len(v) > 2 else 0
    for n in ho_chu(cm, ch):
      gl = g[n]; adv, _ = hm[n]
      if gl.numberOfContours > 0:
        c = gl.coordinates; s0 = 0
        mid = (gl.xMin + gl.xMax) / 2
        for e in gl.endPtsOfContours:
          xs = [c[i][0] for i in range(s0, e + 1)]; phai = tach and min(xs) > mid
          for i in range(s0, e + 1): c[i] = (c[i][0] + L + (tach if phai else 0), c[i][1])
          s0 = e + 1
        gl.recalcBounds(g)
      hm[n] = (max(0, adv + L + R + tach), getattr(gl, 'xMin', 0))

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
  if DUOI_A and DUOI_A.get(k['ten']): them_duoi_a(f, cm, DUOI_A[k['ten']])
  lam_dam(f, k['net'])
  k = dict(k, theo=k['theo'] + 2 * k['net'] * k['sx'])  # giữ khoảng trắng hai bên chữ như trước khi làm đậm
  bien_doi(f, k)
  if DAU: chinh_dau(f, cm, k, DAU)
  if VE_DAU and VE_DAU.get(k['ten']): ve_dau(f, cm, k, VE_DAU[k['ten']])
  if LE and LE.get(k['ten']): chinh_le(f, cm, LE[k['ten']])
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
