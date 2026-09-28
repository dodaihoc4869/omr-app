#!/usr/bin/env python3
"""ÁP DỤNG / LÙI bản sửa TRÌNH BÀY kho đề (rà soát 28/09).

Dùng:  ap-dung.py <goi-api.py> sao-luu      — tải gói hiện tại, xuất nguyên bản mọi câu sẽ sửa
       ap-dung.py <goi-api.py> ap [--that]  — áp theo lô ≤ 20 câu (không --that: chỉ chạy thử)
       ap-dung.py <goi-api.py> lui [--that] — trả mọi trường đã sửa về nguyên bản từ sao-luu-truoc-sua.json

Đường ghi CHÍNH THỨC của app: POST /kho/day {maDe, de: <gói>, cau: <chỉ mục>} (sau cổng thầy),
giống hệt `chuyen-kho-de.ts`. Chỉ mục câu dựng lại cùng lúc theo đúng luật `/kho/chi-muc`
(tờ DẠNG BÀI `DB-…` cố ý KHÔNG có chỉ mục ⇒ gửi rỗng). `ngay_nap` của gói đổi sang ngày áp
để máy thầy/em tải lại tờ đã sửa (exam-sync so `ngayNap`).
Không in mã bí mật: mã nằm trong tệp .hdr cạnh goi-api.py.
"""
import json, os, sys, time, datetime
from importlib import util

D = os.path.dirname(os.path.abspath(__file__))
sp = util.spec_from_file_location('g', sys.argv[1]); g = util.module_from_spec(sp); sp.loader.exec_module(g)
lenh = sys.argv[2]
THAT = '--that' in sys.argv
GIOI_HAN = int(sys.argv[sys.argv.index('--gioi-han') + 1]) if '--gioi-han' in sys.argv else 10**9
SUA = json.load(open(f'{D}/sua-tung-cau.json'))
SAO_LUU = f'{D}/sao-luu-truoc-sua.json'
NHAT_KY = f'{D}/nhat-ky-ap-dung.md'
NGAY = datetime.date.today().isoformat()


def lay(maDe):
    # Gói lớn đôi khi về không trọn (curl cắt) ⇒ thử lại tối đa 3 lần rồi mới dừng.
    for lan in range(3):
        ma, j = g.goi('/kho/lay', {'maDe': maDe})
        if ma == 200 and isinstance(j, dict) and 'cau' in j:
            return j
        time.sleep(2 * (lan + 1))
    raise RuntimeError(f'không đọc được {maDe}: {ma}')


def tim_cau(goi, phan, so):
    for c in goi['cau']:
        if str(c.get('phan')) == str(phan) and str(c.get('so')) == str(so):
            return c
    return None


def doc_truong(c, t):
    p = t.split('.')
    if p[0] == 'de': return c.get('de')
    if p[0] in ('pa', 'y'): return (c.get(p[0]) or {}).get(p[1])
    lg = c.get('loi_giai') or {}
    if p[1] == 'chot': return lg.get('chot')
    if p[1] == 'ket_qua': return lg.get('ket_qua')
    if p[1] == 'buoc': return (lg.get('buoc') or [None] * 99)[int(p[2])]


def ghi_truong(c, t, v):
    p = t.split('.')
    if p[0] == 'de': c['de'] = v
    elif p[0] in ('pa', 'y'): c[p[0]][p[1]] = v
    elif p[1] in ('chot', 'ket_qua'): c['loi_giai'][p[1]] = v
    else: c['loi_giai']['buoc'][int(p[2])] = v


def chi_muc(maDe, goi):
    """Chỉ mục gửi kèm /kho/day. GIỮ NGUYÊN chỉ mục đang có trên máy chủ (đọc /kho/chi-muc-lay):
    chuyên đề/mức độ/lớp/có lời giải lấy từ dòng cũ cùng qid — sửa trình bày KHÔNG được đổi phân loại câu.
    Tờ DB-… cố ý không có chỉ mục. Không đọc được chỉ mục cũ, hoặc số dòng cũ ≠ số câu ⇒ DỪNG (không đoán)."""
    if maDe.startswith('DB-'):
        return []
    ma, j = g.goi('/kho/chi-muc-lay', {'maDe': maDe})
    if ma != 200 or not isinstance(j, dict) or not j.get('ok') or not isinstance(j.get('items'), list):
        raise RuntimeError(f'không đọc được chỉ mục cũ của {maDe}: {ma}')
    cu = {str(x.get('qid')): x for x in j['items']}
    if not cu:
        return []  # tờ vốn KHÔNG có chỉ mục (như tờ DB-): giữ nguyên, không tự tạo chỉ mục mới
    ra = []
    for c in goi['cau']:
        qid = str(c.get('qid') or c.get('id') or '').strip() or f"{maDe}-{str(c.get('phan') or '').strip().upper()}-{str(c.get('so') or '').strip()}"
        x = cu.get(qid)
        if x is None:
            raise RuntimeError(f'{maDe}: câu {qid} chưa có trong chỉ mục cũ — dừng, không đoán phân loại')
        ra.append({'phan': c.get('phan'), 'so': c.get('so'), 'qid': qid, 'chuyenDe': x.get('chuyen_de') or '', 'mucDo': x.get('muc_do') or '',
                   'lop': x.get('lop') or '', 'loiGiai': 1 if x.get('co_loi_giai') else None})
    if len(ra) != len(cu):
        raise RuntimeError(f'{maDe}: chỉ mục cũ có {len(cu)} dòng, gói có {len(ra)} câu — dừng')
    return ra


def day(maDe, goi):
    goi['ngay_nap'] = NGAY
    ma, j = g.goi('/kho/day', {'maDe': maDe, 'de': goi, 'cau': chi_muc(maDe, goi)})
    if ma != 200 or not j.get('ok'):
        raise RuntimeError(f'/kho/day {maDe} trả {ma} {str(j)[:200]}')


def ca_dang_mo():
    ma, j = g.goi('/ca/danh-sach', {})
    if ma != 200:
        raise RuntimeError(f'không hỏi được danh sách ca: {ma}')
    if not isinstance(j.get('items'), list):
        raise RuntimeError('danh sách ca không đúng dạng — dừng cho an toàn')
    return j['items']  # luật: phải RỖNG mới được ghi


def ghi_nk(dong):
    with open(NHAT_KY, 'a') as f:
        f.write(dong + '\n')


def nhom_lo(ds):
    """Theo tờ, mỗi lô ≤ 20 câu (một tờ nhiều câu thì chia nhiều lô)."""
    theo_to = {}
    for x in ds:
        theo_to.setdefault(x['maDe'], []).append(x)
    for maDe, muc in theo_to.items():
        qids = sorted({x['qid'] for x in muc})
        for i in range(0, len(qids), 20):
            chon = set(qids[i:i + 20])
            yield maDe, [x for x in muc if x['qid'] in chon]


if lenh == 'sao-luu':
    ra = {}
    for maDe in sorted({x['maDe'] for x in SUA}):
        goi = lay(maDe)
        for x in [y for y in SUA if y['maDe'] == maDe]:
            c = tim_cau(goi, x['phan'], x['so'])
            ra.setdefault(x['qid'], {'maDe': maDe, 'phan': x['phan'], 'so': x['so'], 'cau': c})
    json.dump(ra, open(SAO_LUU, 'w'), ensure_ascii=False, indent=0)
    print('sao lưu', len(ra), 'câu')

elif lenh in ('ap', 'lui'):
    mo = ca_dang_mo()
    if mo:
        print('DỪNG: đang có ca thi mở', len(mo)); sys.exit(2)
    SL = json.load(open(SAO_LUU))
    if THAT and not os.path.exists(NHAT_KY):
        ghi_nk('# Nhật ký áp dụng sửa trình bày kho đề (28/09)\n\n| giờ | lô | tờ | số câu | qid | kết quả |\n|---|---|---|---|---|---|')
    tong = {'cau': 0, 'truong': 0, 'bo_qua': 0}
    for so_lo, (maDe, muc) in enumerate(nhom_lo(SUA), 1):
        if so_lo > GIOI_HAN:
            break
        goi = lay(maDe)
        doi = 0
        for x in muc:
            c = tim_cau(goi, x['phan'], x['so'])
            goc_sl = doc_truong(SL[x['qid']]['cau'], x['truong'])
            hien = doc_truong(c, x['truong']) if c else None
            dich, phai_la = (x['sau'], x['truoc']) if lenh == 'ap' else (goc_sl, x['sau'])
            if hien == dich:
                continue
            if hien != phai_la or goc_sl != x['truoc']:
                tong['bo_qua'] += 1
                print('  BỎ QUA (câu đã đổi từ lúc rà):', x['qid'], x['truong']); continue
            ghi_truong(c, x['truong'], dich); doi += 1
        if not doi:
            continue
        qids = sorted({x['qid'] for x in muc})
        if not THAT:
            print(f'[thử] lô {so_lo} {maDe}: {doi} trường / {len(qids)} câu'); tong['truong'] += doi; continue
        day(maDe, goi)
        # Đọc lại kiểm
        moi = lay(maDe); sai = 0
        for x in muc:
            v = doc_truong(tim_cau(moi, x['phan'], x['so']), x['truong'])
            if v != (x['sau'] if lenh == 'ap' else doc_truong(SL[x['qid']]['cau'], x['truong'])):
                sai += 1
        kq = 'ĐÚNG' if not sai else f'LỆCH {sai}'
        ghi_nk(f"| {time.strftime('%H:%M:%S')} | {lenh} {so_lo} | {maDe} | {len(qids)} | {', '.join(q.split('-')[-2] + '.' + q.split('-')[-1] for q in qids)} | {doi} trường · đọc lại {kq} |")
        print(f'lô {so_lo} {maDe}: {doi} trường, đọc lại {kq}')
        tong['cau'] += len(qids); tong['truong'] += doi
        if sai:
            print('DỪNG vì đọc lại lệch'); sys.exit(3)
    print('TỔNG', tong)
