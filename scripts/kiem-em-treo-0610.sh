#!/usr/bin/env bash
# VIỆC #48 — VÌ SAO `chan-doan-em` CỦA TÀI KHOẢN THỬ 12121212 TREO > 5 PHÚT (em khác 1,5 giây)? CHỈ ĐỌC, CHỈ IN SỐ ĐẾM (repo công khai).
# Bước 1: bảng nào có cột sbd; Bước 2: số dòng của từng bảng cho em treo (12121212) so với em nhanh (11000) — bảng nào lệch cả nghìn lần là nghi phạm;
# Bước 3: chiến dịch nào có em treo (cờ 1/0, không in mã chiến dịch / tên).
set -euo pipefail
cd server
d1() { npx -y wrangler@4 d1 execute omr --remote --json --command "$1"; }
KT=$(d1 "SELECT m.name AS name FROM sqlite_master m WHERE m.type = 'table' AND m.name NOT LIKE 'sqlite_%' AND m.name NOT LIKE '_cf_%' AND EXISTS (SELECT 1 FROM pragma_table_info(m.name) p WHERE p.name = 'sbd') ORDER BY m.name" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(' '.join(r['name'] for r in d[0]['results']))")
echo "bảng có cột sbd: $(echo "$KT" | wc -w)"
# Gom 4 bảng một lệnh (D1 giới hạn số vế UNION trong một lệnh) (một lệnh quá dài / một bảng lỗi làm hỏng cả lệnh ⇒ in lỗi của đúng cụm đó, các cụm khác vẫn chạy).
echo 'bang | em_treo | em_nhanh'
SQL=""; N=0
chay_cum() {
  local sql="${SQL% UNION ALL}"
  [ -z "$sql" ] && return 0
  d1 "$sql" > /tmp/cum.json 2>/tmp/cum.err || true
  python3 -c "
import sys,json
try:
    d=json.load(open('/tmp/cum.json'))
    if isinstance(d,list):
        for r in d[0]['results']: print(r['bang'],'|',r['em_treo'],'|',r['em_nhanh'])
    else: print('LOI cụm:', json.dumps(d)[:500])
except Exception as e:
    print('LOI đọc cụm:', e, open('/tmp/cum.err').read()[:500])
"
}
for t in $KT; do
  SQL="$SQL SELECT '$t' AS bang, (SELECT COUNT(*) FROM \"$t\" WHERE sbd = '12121212') AS em_treo, (SELECT COUNT(*) FROM \"$t\" WHERE sbd = '11000') AS em_nhanh UNION ALL"
  N=$((N+1))
  if [ $((N % 4)) -eq 0 ]; then chay_cum; SQL=""; fi
done
chay_cum
echo '--- chiến dịch có em treo (cờ 1/0)'
d1 "SELECT trang_thai, tao_luc, han_nop, (SELECT COUNT(*) FROM json_each(sbd_json)) AS so_em, (SELECT COUNT(*) FROM json_each(qid_json)) AS so_cau, CASE WHEN EXISTS (SELECT 1 FROM json_each(sbd_json) WHERE value = '12121212') THEN 1 ELSE 0 END AS co_em_treo, CASE WHEN EXISTS (SELECT 1 FROM json_each(sbd_json) WHERE value = '11000') THEN 1 ELSE 0 END AS co_em_nhanh FROM chien_dich WHERE json_valid(sbd_json) AND (EXISTS (SELECT 1 FROM json_each(sbd_json) WHERE value IN ('12121212','11000'))) ORDER BY tao_luc" \
  | python3 -c "
import sys,json
for r in json.load(sys.stdin)[0]['results']: print(r)
"

# Bước 4 — ảnh chụp hồ sơ OMNI ban đêm (omni_em) phủ bao nhiêu em của từng lớp hôm nay? Thiếu ảnh ⇒ `thoCuaLop` (omni-d1.ts) PHÁT LẠI sổ của mọi em thiếu trong chính request.
echo '--- ảnh chụp OMNI theo lớp (em không khoá): số em · có ảnh hôm nay (06/10) · có ảnh bất kỳ ngày · số dòng sổ su_kien_hoc của cả lớp'
d1 "SELECT COALESCE(h.lop, '(không lớp)') AS lop, COUNT(*) AS so_em,
  SUM(CASE WHEN EXISTS (SELECT 1 FROM omni_em o WHERE o.sbd = h.sbd AND o.cap_nhat_luc = '2026-10-05T17:00:00.000Z' AND o.phien_ban = 'omni3-0510-v1') THEN 1 ELSE 0 END) AS co_anh_hom_nay,
  SUM(CASE WHEN EXISTS (SELECT 1 FROM omni_em o WHERE o.sbd = h.sbd) THEN 1 ELSE 0 END) AS co_anh_bat_ky,
  (SELECT COUNT(*) FROM su_kien_hoc s WHERE s.sbd IN (SELECT h2.sbd FROM hoc_sinh h2 WHERE COALESCE(h2.lop, '(không lớp)') = COALESCE(h.lop, '(không lớp)') AND COALESCE(h2.trang_thai, '') <> 'khoa')) AS dong_so_ca_lop
  FROM hoc_sinh h WHERE COALESCE(h.trang_thai, '') <> 'khoa' GROUP BY COALESCE(h.lop, '(không lớp)') ORDER BY so_em DESC LIMIT 12" \
  | python3 -c "
import sys,json
d=json.load(sys.stdin)[0]
for r in d['results']: print(r)
print('sql_duration_ms=%s rows_read=%s' % (d['meta']['timings']['sql_duration_ms'], d['meta']['rows_read']))
"
echo '--- các ngày chụp ảnh OMNI trong omni_em (số em mỗi ngày, mỗi phiên bản)'
d1 "SELECT cap_nhat_luc, phien_ban, COUNT(*) AS so_em FROM omni_em GROUP BY cap_nhat_luc, phien_ban ORDER BY cap_nhat_luc DESC LIMIT 6" \
  | python3 -c "
import sys,json
for r in json.load(sys.stdin)[0]['results']: print(r)
"
echo '--- con trỏ việc đêm OMNI (cau_hinh.omni_dem_con_tro)'
d1 "SELECT gia_tri FROM cau_hinh WHERE khoa = 'omni_dem_con_tro'" | python3 -c "
import sys,json
for r in json.load(sys.stdin)[0]['results']: print(r)
" || true
echo '--- lớp và số dòng sổ của em treo / em nhanh'
d1 "SELECT s.sbd AS sbd_treo_hoac_nhanh, (SELECT lop FROM hoc_sinh h WHERE h.sbd = s.sbd) AS lop, COUNT(*) AS dong_so, MIN(s.luc) AS dau, MAX(s.luc) AS cuoi FROM su_kien_hoc s WHERE s.sbd IN ('12121212', '11000') GROUP BY s.sbd" \
  | python3 -c "
import sys,json
for r in json.load(sys.stdin)[0]['results']: print(r)
"
