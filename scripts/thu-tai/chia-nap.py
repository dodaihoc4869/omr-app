# THỬ TẢI 28/10 — biến tệp `wrangler d1 export` thành tệp nạp được vào D1 SAO.
# Lỗi gặp thật (run 40608357630): nạp thẳng tệp export ⇒ «statement too long: SQLITE_TOOBIG» (D1 giới hạn mỗi câu 100 KB; có dòng JSON lớn hơn).
# Cách làm: (1) đọc tệp export theo từng câu vào SQLite tạm trong runner (trigger dựng SAU dữ liệu ⇒ dữ liệu y nguyên);
# (2) viết lại: bảng ⇒ dữ liệu ⇒ chỉ mục ⇒ trigger ⇒ view; dòng nào câu INSERT > 90 KB thì chèn chuỗi lớn rỗng rồi nối dần bằng
# `UPDATE … SET c = c || '<khúc>' WHERE <khoá chính>` (mỗi câu < 90 KB). Chỉ in số đếm — không in nội dung dòng.
# Ghi thành nhiều phần ≤ ~250 MB (<tiền tố ra>-000.sql …): phần 0 = bảng, các phần dữ liệu (một dòng + các câu nối của nó không bị cắt ngang), phần cuối = chỉ mục/trigger/view.
# python3 -I chia-nap.py <tệp export | dữ-liệu-giả.sqlite> <tiền tố ra> <tệp sqlite tạm>
import sqlite3, sys, os

vao, ra, tam = sys.argv[1], sys.argv[2], sys.argv[3]
GIOI = 90_000
if vao.endswith('.sqlite'):
    # Đầu vào là SQLite dữ liệu giả (tests/zz-thu-tai-sinh-gia-2810.test.ts) ⇒ đọc thẳng.
    db = sqlite3.connect(f'file:{vao}?mode=ro', uri=True)
    print('Đọc SQLite dữ liệu giả:', os.path.getsize(vao) // 1048576, 'MB')
else:
    if os.path.exists(tam): os.remove(tam)
    db = sqlite3.connect(tam, isolation_level=None)
    db.execute('PRAGMA foreign_keys=OFF'); db.execute('PRAGMA journal_mode=OFF'); db.execute('PRAGMA synchronous=OFF')
    db.execute('BEGIN')
    buf, sau, n = [], [], 0
    with open(vao, encoding='utf-8', newline='') as f:
        for dong in f:
            buf.append(dong)
            if not dong.rstrip().endswith(';'): continue
            cau = ''.join(buf)
            if not sqlite3.complete_statement(cau): continue
            buf = []
            dau = cau.lstrip()[:40].upper()
            if dau.startswith('PRAGMA') or dau.startswith('BEGIN') or dau.startswith('COMMIT'): continue
            if dau.startswith('CREATE TRIGGER'): sau.append(cau); continue
            db.execute(cau); n += 1
    if ''.join(buf).strip(): raise SystemExit('Tệp export kết thúc giữa chừng một câu')
    for c in sau: db.execute(c)
    db.execute('COMMIT')
    print(f'Đọc vào SQLite tạm: {n} câu · {len(sau)} trigger')

def lit(v):
    if v is None: return 'NULL'
    if isinstance(v, bool): return '1' if v else '0'
    if isinstance(v, int): return str(v)
    if isinstance(v, float):
        if v != v: return 'NULL'
        if v in (float('inf'), float('-inf')): return '9e999' if v > 0 else '-9e999'
        return repr(v)
    if isinstance(v, (bytes, bytearray, memoryview)): return "X'" + bytes(v).hex() + "'"
    return "'" + str(v).replace("'", "''") + "'"
blen = lambda s: len(s.encode('utf-8'))
q = lambda t: '"' + t.replace('"', '""') + '"'

bang = db.execute("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND sql IS NOT NULL ORDER BY rowid").fetchall()
dem = {'bang': 0, 'dong': 0, 'dong_lon': 0, 'cau_noi': 0}
class Ghi:
    def __init__(s): s.so, s.f, s.co = -1, None, 0; s.moi()
    def moi(s):
        if s.f: s.f.close()
        s.so += 1; s.co = 0
        s.f = open(f'{ra}-{s.so:03d}.sql', 'w', encoding='utf-8', newline='\n'); s.write('PRAGMA defer_foreign_keys = true;\n')
    def write(s, x): s.f.write(x); s.co += len(x)
    def ranh(s):
        if s.co > 150_000_000: s.moi()
o = Ghi()
if True:
    for _, sql in bang: o.write(sql.strip().rstrip(';') + ';\n'); dem['bang'] += 1
    o.moi()
    for ten, sql in bang:
        if sql.upper().startswith('CREATE VIRTUAL'): raise SystemExit('Có bảng ảo — chưa hỗ trợ')
        info = db.execute(f'PRAGMA table_info({q(ten)})').fetchall()
        cot = [r[1] for r in info]
        pk = [r[1] for r in sorted(info, key=lambda r: r[5]) if r[5] > 0]
        khong_rowid = 'WITHOUT ROWID' in sql.upper()
        dau = f'INSERT INTO {q(ten)}({",".join(q(c) for c in cot)}) VALUES('
        lay = ('' if khong_rowid else 'rowid, ') + ','.join(q(c) for c in cot)
        for hang in db.execute(f'SELECT {lay} FROM {q(ten)}'):
            rid, gt = (None, list(hang)) if khong_rowid else (hang[0], list(hang[1:]))
            o.ranh()
            cau = dau + ','.join(lit(v) for v in gt) + ');\n'
            dem['dong'] += 1
            if blen(cau) <= GIOI: o.write(cau); continue
            dem['dong_lon'] += 1
            # Bỏ trống dần các chuỗi lớn nhất tới khi câu INSERT vừa giới hạn.
            con = sorted([i for i, v in enumerate(gt) if isinstance(v, str)], key=lambda i: -len(gt[i]))
            rong, moi = [], list(gt)
            for i in con:
                moi[i] = ''; rong.append(i)
                if blen(dau + ','.join(lit(v) for v in moi) + ');') <= GIOI: break
            if pk:
                where = ' AND '.join(f'{q(c)} = {lit(gt[cot.index(c)])}' for c in pk)
                cau = dau + ','.join(lit(v) for v in moi) + ');\n'
            else:
                if khong_rowid: raise SystemExit(f'Bảng {ten}: dòng lớn, không khoá chính')
                where = f'rowid = {rid}'
                cau = f'INSERT INTO {q(ten)}(rowid,{",".join(q(c) for c in cot)}) VALUES({rid},' + ','.join(lit(v) for v in moi) + ');\n'
            if blen(cau) > GIOI: raise SystemExit(f'Bảng {ten}: dòng vẫn quá lớn sau khi tách')
            o.write(cau)
            for i in rong:
                s, k = gt[i], 0
                while k < len(s):
                    d = 20_000
                    while True:
                        u = f'UPDATE {q(ten)} SET {q(cot[i])} = {q(cot[i])} || {lit(s[k:k + d])} WHERE {where};\n'
                        if blen(u) <= GIOI or d < 100: break
                        d //= 2
                    o.write(u); dem['cau_noi'] += 1; k += d
    o.moi()
    for kieu in ('index', 'trigger', 'view'):
        for (sql,) in db.execute(f"SELECT sql FROM sqlite_master WHERE type='{kieu}' AND sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY rowid"):
            o.write(sql.strip().rstrip(';') + ';\n'); dem[kieu] = dem.get(kieu, 0) + 1
o.f.close(); db.close()
tong = sum(os.path.getsize(f'{ra}-{i:03d}.sql') for i in range(o.so + 1))
print('Tệp nạp:', ', '.join(f'{k}={v}' for k, v in dem.items()), f'· {o.so + 1} phần · {tong // 1048576} MB')
