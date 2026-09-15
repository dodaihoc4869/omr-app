#!/bin/bash
# KIỂM THẬT "LUYỆN DẠNG BÀI" TRÊN MÁY CHỦ ĐANG CHẠY. Nhấp đúp là chạy.
#
# Hỏi máy chủ đúng hai lệnh mà máy học sinh sẽ gọi ở mục 4, KHÔNG dùng mã bí
# mật — nếu ở đây phải có mã thì máy em cũng sẽ bị 403.
#
# Đo ba thứ, mỗi thứ chặn một kiểu hỏng:
#   1. Menu có đủ ba lớp và 55 dạng chưa, có dạng nào "0 câu" không
#   2. Tờ đề của một dạng lấy về có đủ số câu menu hứa không
#   3. Mã KHÔNG phải dạng bài có bị chặn không (kẻo thành đường tải đề bất kỳ)
#
# /usr/bin/python3: bản Python của macOS, bản DUY NHẤT có sẵn chứng chỉ gốc.
cd "$(dirname "$0")" || exit 1

/usr/bin/python3 - <<'PY'
import json, urllib.request, urllib.error, random

MAY_CHU = 'https://omr.ttadodaihoc.workers.dev'
loi = 0


def goi(than, han=90):
    d = json.dumps(than, ensure_ascii=False).encode('utf-8')
    q = urllib.request.Request(MAY_CHU + '/goi', data=d, headers={
        'Content-Type': 'application/json', 'User-Agent': 'kiem-dang-bai/1.0'})
    try:
        with urllib.request.urlopen(q, timeout=han) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        # PHẢI IN THÂN LỖI. Lượt chạy đầu 15/09 chỉ thấy "HTTP Error 500" kèm
        # một trang traceback của Python — mất thêm một vòng mới biết máy chủ
        # đang kêu gì. Thân lỗi nói thẳng, ví dụ "no such column: nhom".
        than_loi = ''
        try:
            than_loi = e.read().decode('utf-8', 'replace')[:300]
        except Exception:
            pass
        return {'ok': False, 'error': 'HTTP %s — %s' % (e.code, than_loi)}
    except Exception as e:
        return {'ok': False, 'error': str(e)[:200]}


def dat(ten, ok, them=''):
    global loi
    print('  %s %s%s' % ('ĐẠT ' if ok else 'TRƯỢT', ten, ' — %s' % them if them else ''))
    if not ok:
        loi += 1


print('KIỂM LUYỆN DẠNG BÀI TRÊN MÁY CHỦ ĐANG CHẠY')
print('──────────────────────────────────────────')
print('Máy chủ: %s' % MAY_CHU)
print()

# ---- 1. MENU -------------------------------------------------------------
dm = goi({'action': 'danhMucDangBai'})
dat('danhMucDangBai trả ok, KHÔNG đòi mã bí mật', dm.get('ok') is True, str(dm.get('error') or ''))
lops = dm.get('lops') or []
dat('đủ ba lớp 10 · 11 · 12', [l.get('lop') for l in lops] == ['10', '11', '12'],
    ', '.join(str(l.get('lop')) for l in lops))
dangs = [(l['lop'], b['tenBai'], d) for l in lops for b in l.get('bais', []) for d in b.get('dangs', [])]
dat('đủ 55 dạng', len(dangs) == 55, '%d dạng' % len(dangs))
trong = [d['ma'] for _, _, d in dangs if int(d.get('soCau') or 0) <= 0]
dat('không dạng nào 0 câu', not trong, ', '.join(trong[:8]))
xau = [b for l in lops for b in l.get('bais', []) if not str(b.get('tenBai', '')).startswith('Bài ')]
dat('mọi tên bài theo dáng "Bài N. …"', not xau, ' | '.join(str(b.get('tenBai')) for b in xau[:5]))

print()
print('  Menu máy chủ đang trả về:')
for l in lops:
    print('    Lớp %s — %d bài' % (l.get('lop'), len(l.get('bais', []))))
    for b in l.get('bais', []):
        print('      %-46s %d dạng · %4d câu'
              % (b.get('tenBai'), len(b.get('dangs', [])),
                 sum(int(d.get('soCau') or 0) for d in b.get('dangs', []))))

# ---- 2. TỜ ĐỀ CỦA BA DẠNG NGẪU NHIÊN --------------------------------------
print()
random.seed()
for lop, ten_bai, d in random.sample(dangs, min(3, len(dangs))):
    r = goi({'action': 'deTheoDangBai', 'ma': d['ma']})
    de = r.get('de') or {}
    so = len(de.get('cau') or [])
    dat('tờ %s (%s) lấy về đủ câu' % (d['ma'], d['ten'][:34]),
        r.get('ok') is True and so == int(d.get('soCau') or 0),
        'menu hứa %s, lấy về %d' % (d.get('soCau'), so))

# ---- 3. CHẶN MÃ KHÔNG PHẢI DẠNG BÀI ---------------------------------------
print()
for ma in ('12-KT-C1-D2', 'DH-10-C2-B5', 'DB-../../bi-mat', 'DB-KHONG-CO-THAT'):
    r = goi({'action': 'deTheoDangBai', 'ma': ma})
    dat('chặn mã %r' % ma, r.get('ok') is False, str(r.get('error') or '')[:60])

print()
print('KẾT LUẬN: %s' % ('ĐẠT' if loi == 0 else 'TRƯỢT — %d phép' % loi))
PY

echo
read -r -p "Bấm Enter để đóng cửa sổ..." _
