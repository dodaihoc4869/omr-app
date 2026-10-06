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
SQL=""
for t in $KT; do
  SQL="$SQL SELECT '$t' AS bang, (SELECT COUNT(*) FROM \"$t\" WHERE sbd = '12121212') AS em_treo, (SELECT COUNT(*) FROM \"$t\" WHERE sbd = '11000') AS em_nhanh UNION ALL"
done
SQL="${SQL% UNION ALL} ORDER BY 2 DESC"
d1 "$SQL" | python3 -c "
import sys,json
d=json.load(sys.stdin)[0]
print('bang | em_treo | em_nhanh   (sql_duration_ms=%s, rows_read=%s)' % (d['meta']['timings']['sql_duration_ms'], d['meta']['rows_read']))
for r in d['results']: print(r['bang'],'|',r['em_treo'],'|',r['em_nhanh'])
"
echo '--- chiến dịch có em treo (cờ 1/0)'
d1 "SELECT trang_thai, tao_luc, han_nop, (SELECT COUNT(*) FROM json_each(sbd_json)) AS so_em, (SELECT COUNT(*) FROM json_each(qid_json)) AS so_cau, CASE WHEN EXISTS (SELECT 1 FROM json_each(sbd_json) WHERE value = '12121212') THEN 1 ELSE 0 END AS co_em_treo, CASE WHEN EXISTS (SELECT 1 FROM json_each(sbd_json) WHERE value = '11000') THEN 1 ELSE 0 END AS co_em_nhanh FROM chien_dich WHERE json_valid(sbd_json) AND (EXISTS (SELECT 1 FROM json_each(sbd_json) WHERE value IN ('12121212','11000'))) ORDER BY tao_luc" \
  | python3 -c "
import sys,json
for r in json.load(sys.stdin)[0]['results']: print(r)
"
