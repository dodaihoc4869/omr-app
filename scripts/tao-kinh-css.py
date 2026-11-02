#!/usr/bin/env python3
"""HỆ KÍNH app học sinh (thầy chốt 02/11, bản vẽ docs/ban-ve-ban-sac-hs-0211/v2) — SINH lớp đè cho MỌI thẻ / nút của các tờ CSS «Trong» học sinh.

Vì sao sinh tự động: app có ~700 luật thẻ / nút rải trong 8 tờ CSS; đè tay dễ sót. Bộ sinh đọc từng tờ, tìm luật
  (1) mặt thẻ đặc `background: var(--tr-mat)`  ⇒ mặt KÍNH bán trong (`--kinh-mat`, không làm mờ nền — nhẹ máy);
  (2) nền trang `background: var(--tr-nen)`     ⇒ nền bán trong cho thấy nền loang; luật sticky/fixed ⇒ thêm kính mờ (`--kinh-mo`);
  (3) gờ đáy 3D kiểu Duolingo: `box-shadow: … inset 0 -Npx 0 …` / `… 0 Npx 0 <màu>` ⇒ bóng mềm; `border-bottom-width: Npx` (N ≥ 3) ⇒ bằng viền thường;
rồi GHI THÊM khối đè vào CUỐI CHÍNH tờ đó (cùng bộ chọn ⇒ cùng độ ưu tiên, đứng sau ⇒ thắng; luật trạng thái cụ thể hơn vẫn thắng như cũ).
Không xoá / không sửa khai báo màu nào đang có (luật kiem:mau-giu); khối đè chỉ dùng biến --tr-* / --kinh-*.
Chạy lại an toàn: khối cũ (giữa hai dấu mốc) được gỡ rồi sinh lại.   python3 scripts/tao-kinh-css.py
"""
import re, pathlib
GOC = pathlib.Path(__file__).resolve().parent.parent / 'src'
DAU, CUOI = '/* ═══ HỆ KÍNH — TỰ SINH bởi scripts/tao-kinh-css.py (thầy chốt 02/11). Đừng sửa tay: sửa bộ sinh rồi chạy lại. ═══ */', '/* ═══ HẾT HỆ KÍNH TỰ SINH ═══ */'
# tờ nguồn ⇒ tờ đích (nơi ghi khối đè; phải nạp SAU tờ nguồn). trong.css dùng chung app thầy ⇒ khối của nó ghi vào trong-hs.css (nạp sau, chỉ app học sinh).
TO = {
  'styles/trong.css': 'styles/trong-hs.css',
  'styles/trong-hs.css': 'styles/trong-hs.css',
  'styles/trong-lam-bai.css': 'styles/trong-lam-bai.css',
  'styles/trong-thuong.css': 'styles/trong-thuong.css',
  'styles/trong-thuong-gon.css': 'styles/trong-thuong-gon.css',
  'styles/trong-kiem-tra.css': 'styles/trong-kiem-tra.css',
  'styles/trong-giu-chan.css': 'styles/trong-giu-chan.css',
  'styles/trong-hoi-thay.css': 'styles/trong-hoi-thay.css',
}

TAY = '/* ═══ HỆ KÍNH — VIẾT TAY'
def go_khoi(s):
  """Gỡ khối tự sinh cũ (giữa DAU…CUOI), giữ nguyên phần viết tay đứng sau."""
  i = s.find(DAU)
  if i < 0: return s
  j = s.find(CUOI, i)
  return s[:i].rstrip() + '\n' + (s[j + len(CUOI):].lstrip('\n') if j >= 0 else '')

def chen(s, khoi):
  """Khối tự sinh đứng TRƯỚC phần viết tay (viết tay thắng khi trùng bộ chọn), không có viết tay ⇒ cuối tờ."""
  k = s.find(TAY)
  return s.rstrip() + '\n' + khoi + '\n' if k < 0 else s[:k].rstrip() + '\n' + khoi + '\n' + s[k:]

def tach(s):
  """(media, bộ chọn, thân) của mọi luật thường; giữ @media lồng một mức; bỏ @keyframes/@font-face/@supports khác."""
  s = re.sub(r'/\*.*?\*/', '', s, flags=re.S)
  ra, i, n = [], 0, len(s)
  def khoi(j):
    d = 0
    for k in range(j, n):
      if s[k] == '{': d += 1
      elif s[k] == '}':
        d -= 1
        if d == 0: return k
    return n - 1
  def doc(a, b, media):
    j = a
    while j < b:
      m = s.find('{', j, b)
      if m < 0: break
      dau = s[j:m].strip()
      k = khoi(m)
      if dau.startswith('@media'): doc(m + 1, k, dau)
      elif dau.startswith('@'): pass
      elif dau: ra.append((media, dau, s[m + 1:k]))
      j = k + 1
  doc(0, n, None)
  return ra

def tach_phay(sel):
  """Tách danh sách bộ chọn theo dấu phẩy NGOÀI ngoặc (giữ nguyên `:is(a, b)`, `:not(a, b)`)."""
  ra, d, cur = [], 0, ''
  for ch in sel:
    if ch in '([': d += 1
    elif ch in ')]': d -= 1
    if ch == ',' and d == 0: ra.append(cur); cur = ''
    else: cur += ch
  return ra + [cur]

def bo_chon_hs(sel):
  out = []
  for x in tach_phay(sel):
    x = ' '.join(x.split())
    if not x: continue
    if "data-trong='gv'" in x or 'data-trong="gv"' in x or "data-trong='ph'" in x: continue
    if not x.startswith(('[data-trong', ':root[data-trong', 'html')):
      continue  # luật không gắn [data-trong] ⇒ ngoài giao diện Trong, bỏ
    if x.startswith('[data-trong]'): x = "[data-trong='hs']" + x[len('[data-trong]'):]
    out.append(x)
  return ', '.join(out)

LO = re.compile(r'(?:inset\s+0\s+-\d+(?:\.\d+)?px\s+0(?:\s+0)?\s+(?:var\([^)]*\)|color-mix\((?:[^()]|\([^()]*\))*\))|(?<![-\w.])0\s+[2-8]px\s+0(?:\s+0)?\s+(?:var\(--(?!tr-phu)[^)]*\)|color-mix\((?:[^()]|\([^()]*\))*\)))')
def bong_moi(v):
  quan = '!important' in v
  v2 = v.replace('!important', '')
  if not LO.search(v2): return None
  phan = [p.strip() for p in re.split(r',(?![^(]*\))', v2)]
  giu = [p for p in phan if p and not LO.fullmatch(p) and not LO.search(p)]
  moi = ', '.join(giu + ['0 10px 24px -16px var(--tr-phu)'])
  return moi + (' !important' if quan else '')

def sinh(nguon):
  luat = {}
  for media, sel, than in tach(nguon):
    sel2 = bo_chon_hs(sel)
    if not sel2: continue
    d = {}
    for m in re.finditer(r'([\w-]+)\s*:\s*([^;]+)', than):
      ten, gt = m.group(1).strip(), m.group(2).strip()
      quan = ' !important' if '!important' in gt else ''
      g = gt.replace('!important', '').strip()
      if ten in ('background', 'background-color') and g == 'var(--tr-mat)': d[ten] = f'var(--kinh-mat){quan}'
      elif ten in ('background', 'background-color') and g == 'var(--tr-nen)':
        d[ten] = f'var(--kinh-nen){quan}'
        if re.search(r'position\s*:\s*(sticky|fixed)', than): d['-webkit-backdrop-filter'] = 'var(--kinh-mo)'; d['backdrop-filter'] = 'var(--kinh-mo)'
      elif ten == 'box-shadow':
        b = bong_moi(gt)
        if b: d['box-shadow'] = b
      elif ten == 'border-bottom-width' and re.fullmatch(r'[3-8]px', g):
        bw = re.search(r'border(?:-width)?\s*:\s*(\d+(?:\.\d+)?px)', than)
        d['border-bottom-width'] = (bw.group(1) if bw else '2px') + quan
    if d: luat.setdefault((media, sel2), {}).update(d)
  ra = []
  for (media, sel), d in luat.items():
    r = f'{sel} {{ ' + ' '.join(f'{k}: {v};' for k, v in d.items()) + ' }'
    ra.append((media, r))
  return ra

def main():
  khoi = {}
  for nguon, dich in TO.items():
    p = GOC / nguon
    s = go_khoi(p.read_text(encoding='utf8'))
    k = s.find(TAY)
    for media, r in sinh(s if k < 0 else s[:k]): khoi.setdefault(dich, []).append((media, r))
  for dich, ds in khoi.items():
    p = GOC / dich
    s = go_khoi(p.read_text(encoding='utf8'))
    thuong = [r for m, r in ds if not m]
    theo_media = {}
    for m, r in ds:
      if m: theo_media.setdefault(m, []).append(r)
    them = [DAU] + thuong + [f'{m} {{ ' + ' '.join(rs) + ' }' for m, rs in theo_media.items()] + [CUOI]
    p.write_text(chen(s, '\n'.join(them)), encoding='utf8')
    print(f'{dich}: {len(ds)} luật đè')

if __name__ == '__main__': main()
