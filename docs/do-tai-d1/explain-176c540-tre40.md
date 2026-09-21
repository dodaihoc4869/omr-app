# EXPLAIN các truy vấn tốn nhất — 176c540-tre40

Nguồn: sổ đo của lượt bắn tải giả (`ban-tai-176c540-tre40.md`), EXPLAIN QUERY PLAN trên bản sao lưu THẬT nạp cục bộ. **SCAN không kèm INDEX = quét cả bảng.**

## 1. 1.585.350 dòng đọc · 1.950 lần · 813 dòng/lần · lệnh: hs/ke-hoach-ngay [sau ghi], game-v2/answer [Đảo]

```sql
SELECT ca.ma_ca,ca.bank_r2,ca.cap_nhat_luc,ca.trang_thai,ca.cong_bo,ca.het_han_vao,ca.thoi_gian_phut,ca.loai,ca.han_nop,ca.bat_dau, (SELECT COUNT(*) FROM luot l WHERE l.ma_ca=ca.ma_ca) entered, (SELECT COUNT(*) FROM luot l WHERE l.ma_ca=ca.ma_ca AND l.trang_thai='da_nop') submitted, (SELECT COUNT(*) FROM luot l WHERE l.ma_ca=ca.ma_ca AND l.trang_thai='dang_lam' AND (l.het_gio_luc IS NULL OR l.het_gio_luc>?)) active FROM ca WHERE ca.trang_thai<>'da_xoa' ORDER BY ca.ma_ca
```

Kế hoạch: `SCAN ca USING INDEX sqlite_autoindex_ca_1` → `CORRELATED SCALAR SUBQUERY 1` → `SEARCH l USING COVERING INDEX idx_luot_em (ma_ca=?)` → `CORRELATED SCALAR SUBQUERY 2` → `SEARCH l USING INDEX idx_luot_em (ma_ca=?)` → `CORRELATED SCALAR SUBQUERY 3` → `SEARCH l USING INDEX idx_luot_em (ma_ca=?)`

## 2. 1.266.951 dòng đọc · 1.617 lần · 784 dòng/lần · lệnh: game-v2/start [Đảo], game-v2/recommendations [Đảo]

```sql
SELECT q.ma_de,q.qid,q.json FROM json_each(?) j JOIN game_v2_question q ON q.ma_de=json_extract(j.value,'$[0]') AND q.qid=json_extract(j.value,'$[1]') ORDER BY j.key
```

**Quét toàn bảng:** `j VIRTUAL TABLE INDEX 1:`

Kế hoạch: `SCAN j VIRTUAL TABLE INDEX 1:` → `SEARCH q USING INDEX sqlite_autoindex_game_v2_question_1 (ma_de=? AND qid=?)` → `USE TEMP B-TREE FOR ORDER BY`

## 3. 1.091.432 dòng đọc · 240 lần · 4.548 dòng/lần · lệnh: game-v2/start [Đảo], game-v2/recommendations [Đảo]

```sql
SELECT q.dang,q.ma_de,q.qid FROM game_v2_question q JOIN de_kho d ON d.ma_de=q.ma_de JOIN game_v2_index g ON g.ma_de=d.ma_de AND g.source_version=d.cap_nhat_luc WHERE COALESCE(d.da_xoa,0)=0 AND q.dang IN (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
```

Kế hoạch: `SEARCH q USING INDEX game_v2_question_dang (dang=?)` → `SEARCH d USING INDEX sqlite_autoindex_de_kho_1 (ma_de=?)` → `SEARCH g USING INDEX sqlite_autoindex_game_v2_index_1 (ma_de=?)`

## 4. 909.895 dòng đọc · 379 lần · 2.401 dòng/lần · lệnh: game-v2/profile [Đảo], game-v2/recommendations [Đảo]

```sql
SELECT (SELECT COUNT(*) FROM btvn_em be JOIN btvn b ON b.ma_btvn = be.ma_btvn WHERE be.sbd = ? AND be.nop_luc IS NULL AND b.da_xoa = 0 AND COALESCE(be.thu_hoi, 0) = 0 AND b.han_nop > ? AND (be.so_chang IS NULL OR COALESCE(be.lo_da_xong, 0) < be.so_chang)) AS dang_chay, (SELECT COUNT(*) FROM (SELECT DISTINCT s.ma_nguon AS ma, (s.lan % 1000) AS chi FROM su_kien_hoc s WHERE s.sbd = ? AND s.ngay_vn = ? AND s.nguon = 'btvn_lo' AND s.ket_qua IS NOT NULL) x JOIN btvn_em be2 ON be2.ma_btvn = x.ma AND be2.sbd = ? WHERE x.chi < COALESCE(be2.lo_da_xong, 0)) AS chang_xong_hom_nay, (SELECT COUNT(*) FROM su_kien_hoc WHERE sbd = ? AND ngay_vn = ? AND nguon = 'on_lai') AS on_hom_nay, (SELECT COUNT(*) FROM …
```

**Quét toàn bảng:** `CONSTANT ROW` · `x`

Kế hoạch: `SCAN CONSTANT ROW` → `SCALAR SUBQUERY 1` → `SEARCH be USING INDEX idx_btvn_em (sbd=?)` → `SEARCH b USING INDEX sqlite_autoindex_btvn_1 (ma_btvn=?)` → `SCALAR SUBQUERY 3` → `CO-ROUTINE x` → `SEARCH s USING INDEX idx_skh_nguon (nguon=?)` → `USE TEMP B-TREE FOR DISTINCT` → `SCAN x` → `SEARCH be2 USING INDEX idx_btvn_lo (ma_btvn=?)` → `SCALAR SUBQUERY 4` → `SEARCH su_kien_hoc USING INDEX idx_skh_em_ngay_qid (sbd=? AND ngay_vn=?)` → `SCALAR SUBQUERY 5` → `SEARCH nam_kt_cau USING INDEX idx_nkc_em_moc (sbd=? AND moc_on_ke>?)`

## 5. 679.518 dòng đọc · 2.454 lần · 277 dòng/lần · lệnh: btvn/xong-lo [nộp chặng], hs/ke-hoach-ngay [sau ghi]

```sql
SELECT qid, MIN(dang) AS dang FROM game_v2_question WHERE dang IS NOT NULL AND qid IN (SELECT value FROM json_each(?)) GROUP BY qid
```

Kế hoạch: `SEARCH game_v2_question USING INDEX game_v2_question_qid (qid=?)` → `LIST SUBQUERY 1` → `SCAN json_each VIRTUAL TABLE INDEX 1:`

## 6. 504.031 dòng đọc · 2.454 lần · 205 dòng/lần · lệnh: btvn/xong-lo [nộp chặng], hs/ke-hoach-ngay [sau ghi]

```sql
SELECT qid, chuyen_de FROM cau_hoi WHERE COALESCE(chuyen_de,'') <> '' AND qid IN (SELECT value FROM json_each(?))
```

Kế hoạch: `SEARCH cau_hoi USING INDEX sqlite_autoindex_cau_hoi_1 (qid=?)` → `LIST SUBQUERY 1` → `SCAN json_each VIRTUAL TABLE INDEX 1:`

## 7. 465.291 dòng đọc · 169 lần · 2.753 dòng/lần · lệnh: game-v2/recommendations [Đảo], game-v2/start [Đảo]

```sql
SELECT DISTINCT q.dang AS dang FROM chi_tiet_cau cc JOIN ca c ON c.ma_ca = cc.ma_ca JOIN game_v2_question q ON q.qid = cc.qid WHERE cc.sbd IN (SELECT value FROM json_each(?)) AND c.trang_thai <> 'da_xoa' AND (c.trang_thai = 'dong' OR (c.cong_bo = 'ngay' OR (c.cong_bo = 'ca_lop_xong' AND (c.trang_thai = 'dong' OR ((SELECT COUNT(*) FROM luot cb_a WHERE cb_a.ma_ca = c.ma_ca) > 0 AND (SELECT COUNT(*) FROM luot cb_a WHERE cb_a.ma_ca = c.ma_ca) <= (SELECT COUNT(*) FROM luot cb_b WHERE cb_b.ma_ca = c.ma_ca AND cb_b.trang_thai = 'da_nop')))))) AND q.dang IS NOT NULL
```

Kế hoạch: `SEARCH cc USING INDEX idx_ctc_qid (sbd=?)` → `LIST SUBQUERY 1` → `SCAN json_each VIRTUAL TABLE INDEX 1:` → `SEARCH c USING INDEX sqlite_autoindex_ca_1 (ma_ca=?)` → `CORRELATED SCALAR SUBQUERY 2` → `SEARCH cb_a USING COVERING INDEX idx_luot_em (ma_ca=?)` → `CORRELATED SCALAR SUBQUERY 3` → `SEARCH cb_a USING COVERING INDEX idx_luot_em (ma_ca=?)` → `CORRELATED SCALAR SUBQUERY 4` → `SEARCH cb_b USING INDEX idx_luot_em (ma_ca=?)` → `SEARCH q USING INDEX game_v2_question_qid (qid=?)` → `USE TEMP B-TREE FOR DISTINCT`

## 8. 448.820 dòng đọc · 1.557 lần · 288 dòng/lần · lệnh: hs/ke-hoach-ngay [sau ghi], hs/ke-hoach-ngay [dựng đầu ngày]

```sql
SELECT l.ma_ca, c.ten_ca, l.lan_thu, l.nop_luc, l.diem_i, l.diem_ii, l.diem_iii FROM luot l JOIN ca c ON c.ma_ca = l.ma_ca WHERE l.sbd = ? AND l.trang_thai IN ('da_nop','khoa') AND c.trang_thai <> 'da_xoa' AND (c.cong_bo = 'ngay' OR (c.cong_bo = 'ca_lop_xong' AND (c.trang_thai = 'dong' OR NOT EXISTS (SELECT 1 FROM luot x WHERE x.ma_ca = c.ma_ca AND x.trang_thai <> 'da_nop')))) ORDER BY l.nop_luc
```

**Quét toàn bảng:** `l`

Kế hoạch: `SCAN l` → `SEARCH c USING INDEX sqlite_autoindex_ca_1 (ma_ca=?)` → `CORRELATED SCALAR SUBQUERY 1` → `SEARCH x USING INDEX idx_luot_em (ma_ca=?)` → `USE TEMP B-TREE FOR ORDER BY`

## 9. 445.263 dòng đọc · 1.124 lần · 396 dòng/lần · lệnh: hs/ke-hoach-ngay [sau ghi], hs/ke-hoach-ngay [dựng đầu ngày]

```sql
SELECT 'g' AS k, giay AS a, NULL AS b FROM (SELECT giay FROM su_kien_hoc WHERE sbd = ? AND giay IS NOT NULL AND ngay_vn >= ? ORDER BY luc DESC LIMIT 400) UNION ALL SELECT 'h', CAST(strftime('%H', luc, '+7 hours') AS INTEGER), COUNT(*) FROM su_kien_hoc WHERE sbd = ? AND ngay_vn >= ? GROUP BY strftime('%H', luc, '+7 hours')
```

**Quét toàn bảng:** `(subquery-1)`

Kế hoạch: `COMPOUND QUERY` → `LEFT-MOST SUBQUERY` → `CO-ROUTINE (subquery-1)` → `SEARCH su_kien_hoc USING INDEX idx_skh_em_ngay (sbd=? AND ngay_vn>?)` → `USE TEMP B-TREE FOR ORDER BY` → `SCAN (subquery-1)` → `UNION ALL` → `SEARCH su_kien_hoc USING INDEX idx_skh_em_ngay (sbd=? AND ngay_vn>?)` → `USE TEMP B-TREE FOR GROUP BY`

## 10. 393.520 dòng đọc · 1.557 lần · 253 dòng/lần · lệnh: hs/ke-hoach-ngay [sau ghi], hs/ke-hoach-ngay [dựng đầu ngày]

```sql
SELECT khoa, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, ma_dang, chuyen_de FROM su_kien_hoc WHERE sbd = ? ORDER BY luc, khoa
```

Kế hoạch: `SEARCH su_kien_hoc USING INDEX idx_skh_em_ngay_qid (sbd=?)` → `USE TEMP B-TREE FOR ORDER BY`

## 11. 324.675 dòng đọc · 500 lần · 649 dòng/lần · lệnh: hs/thi-dua-hom-nay [mở], hs/thi-dua-hom-nay [nền]

```sql
SELECT sbd, ngay_vn, COUNT(*) AS n, MAX(luc1) AS luc FROM ( SELECT sbd, ngay_vn, qid, MIN(luc) AS luc1 FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) AND ngay_vn >= ? AND ngay_vn <= ? AND luc >= ? AND ket_qua IS NOT NULL GROUP BY sbd, ngay_vn, qid ) GROUP BY sbd, ngay_vn
```

**Quét toàn bảng:** `(subquery-2)`

Kế hoạch: `CO-ROUTINE (subquery-2)` → `SEARCH su_kien_hoc USING INDEX idx_skh_em_ngay_qid (sbd=? AND ngay_vn>? AND ngay_vn<?)` → `LIST SUBQUERY 1` → `SCAN json_each VIRTUAL TABLE INDEX 1:` → `SCAN (subquery-2)` → `USE TEMP B-TREE FOR GROUP BY`

## 12. 296.872 dòng đọc · 1.487 lần · 200 dòng/lần · lệnh: hs/ke-hoach-ngay [sau ghi], btvn/xong-lo [nộp chặng]

```sql
SELECT qid, MIN(json_extract(json, '$.phan')) AS phan, MIN(json_extract(json, '$.sao')) AS sao FROM game_v2_question WHERE qid IN (SELECT value FROM json_each(?)) GROUP BY qid
```

Kế hoạch: `SEARCH game_v2_question USING INDEX game_v2_question_qid (qid=?)` → `LIST SUBQUERY 1` → `SCAN json_each VIRTUAL TABLE INDEX 1:`

## 13. 290.638 dòng đọc · 500 lần · 581 dòng/lần · lệnh: notifications/list [mở], notifications/list [nền]

```sql
SELECT * FROM (SELECT e.sbd,'btvn:'||e.khoa id,'Bài tập mới từ Thầy' title,b.ma_de body,'btvn' target,b.giao_luc created_at,b.han_nop deadline FROM btvn_em e JOIN btvn b ON b.ma_btvn=e.ma_btvn WHERE b.da_xoa=0 AND e.thu_hoi=0 AND e.nop_luc IS NULL AND b.han_nop>strftime('%Y-%m-%dT%H:%M:%fZ','now') UNION ALL SELECT sbd,'mom:'||sbd||':'||id,'Bài luyện mới',title,'mom',created_at,NULL FROM mom_bai WHERE submitted_at IS NULL) WHERE (? IS NULL OR sbd=?)
```

**Quét toàn bảng:** `e` · `mom_bai` (4 dòng) · `(subquery-2)`

Kế hoạch: `CO-ROUTINE (subquery-2)` → `COMPOUND QUERY` → `LEFT-MOST SUBQUERY` → `SCAN e` → `SEARCH b USING INDEX sqlite_autoindex_btvn_1 (ma_btvn=?)` → `UNION ALL` → `SCAN mom_bai` → `SCAN (subquery-2)`

## 14. 265.000 dòng đọc · 500 lần · 530 dòng/lần · lệnh: hs/thi-dua-hom-nay [mở], hs/thi-dua-hom-nay [nền]

```sql
SELECT sbd, ho_ten, lop, ten_lop, 1 AS uu FROM hoc_sinh WHERE COALESCE(trang_thai, '') <> 'khoa' UNION ALL SELECT sbd, ho_ten, lop, NULL AS ten_lop, 0 AS uu FROM danh_sach
```

**Quét toàn bảng:** `hoc_sinh` (265 dòng) · `danh_sach` (265 dòng)

Kế hoạch: `COMPOUND QUERY` → `LEFT-MOST SUBQUERY` → `SCAN hoc_sinh` → `UNION ALL` → `SCAN danh_sach`

## 15. 233.478 dòng đọc · 969 lần · 241 dòng/lần · lệnh: btvn/xong-lo [nộp chặng], hs/on-lai/nop [nộp ôn]

```sql
SELECT khoa, sbd, qid, nguon, ket_qua, giay, luc, ngay_vn, ma_dang, chuyen_de FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) ORDER BY sbd, luc, khoa
```

Kế hoạch: `SEARCH su_kien_hoc USING INDEX idx_skh_em_qid (sbd=?)` → `LIST SUBQUERY 1` → `SCAN json_each VIRTUAL TABLE INDEX 1:` → `USE TEMP B-TREE FOR LAST 2 TERMS OF ORDER BY`

## 16. 219.612 dòng đọc · 903 lần · 243 dòng/lần · lệnh: btvn/xong-lo [nộp chặng], btvn/cua-em [chặng]

```sql
SELECT 'd' AS k, sbd, ma_dang AS a, bac AS b, so_gap AS c, so_sai AS d, so_da_khac_phuc AS e, so_chua_thay_sai AS f FROM nam_kt_dang WHERE sbd IN (SELECT value FROM json_each(?)) AND ma_dang IN (SELECT value FROM json_each(?)) UNION ALL SELECT 'c', sbd, qid, trang_thai, ngay_dung_khac_nhau, lan_sai, NULL, NULL FROM nam_kt_cau WHERE sbd IN (SELECT value FROM json_each(?)) AND qid IN (SELECT value FROM json_each(?)) UNION ALL SELECT 't', sbd, NULL, SUM(CASE WHEN trang_thai IN ('moi_sai','dang_on') THEN 1 ELSE 0 END), SUM(CASE WHEN trang_thai IN ('moi_sai','dang_on','da_khac_phuc') AND can_day_lai = 0 AND moc_on_ke IS NOT NULL AND moc_on_ke <= ? THEN 1 ELSE 0 END), NULL, NULL, NULL FROM nam_kt…
```

Kế hoạch: `COMPOUND QUERY` → `LEFT-MOST SUBQUERY` → `SEARCH nam_kt_dang USING INDEX idx_nkd_em (sbd=?)` → `LIST SUBQUERY 1` → `SCAN json_each VIRTUAL TABLE INDEX 1:` → `LIST SUBQUERY 2` → `SCAN json_each VIRTUAL TABLE INDEX 1:` → `CREATE BLOOM FILTER` → `UNION ALL` → `SEARCH nam_kt_cau USING INDEX idx_nkc_em_dang (sbd=?)` → `LIST SUBQUERY 4` → `SCAN json_each VIRTUAL TABLE INDEX 1:` → `LIST SUBQUERY 5` → `SCAN json_each VIRTUAL TABLE INDEX 1:` → `CREATE BLOOM FILTER` → `UNION ALL` → `SEARCH nam_kt_cau USING INDEX idx_nkc_em_dang (sbd=?)` → `LIST SUBQUERY 7` → `SCAN json_each VIRTUAL TABLE INDEX 1:`

## 17. 174.627 dòng đọc · 1.367 lần · 128 dòng/lần · lệnh: hs/ke-hoach-ngay [sau ghi], hs/ke-hoach-ngay [dựng đầu ngày]

```sql
SELECT sbd, giay FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) AND giay IS NOT NULL AND ngay_vn >= ?
```

Kế hoạch: `SEARCH su_kien_hoc USING INDEX idx_skh_em_ngay (sbd=? AND ngay_vn>?)` → `LIST SUBQUERY 1` → `SCAN json_each VIRTUAL TABLE INDEX 1:`

## 18. 174.583 dòng đọc · 1.367 lần · 128 dòng/lần · lệnh: hs/ke-hoach-ngay [sau ghi], hs/ke-hoach-ngay [dựng đầu ngày]

```sql
SELECT sbd, COUNT(*) AS n FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) GROUP BY sbd
```

Kế hoạch: `SEARCH su_kien_hoc USING COVERING INDEX idx_skh_em_qid (sbd=?)` → `LIST SUBQUERY 1` → `SCAN json_each VIRTUAL TABLE INDEX 1:`

## 19. 147.686 dòng đọc · 1.125 lần · 131 dòng/lần · lệnh: hs/ke-hoach-ngay [sau ghi], hs/ke-hoach-ngay [dựng đầu ngày]

```sql
SELECT q.qid, q.content_group, q.json FROM game_v2_question q JOIN de_kho d ON d.ma_de = q.ma_de JOIN game_v2_index g ON g.ma_de = d.ma_de AND g.source_version = d.cap_nhat_luc WHERE COALESCE(d.da_xoa, 0) = 0 AND q.qid IN (SELECT value FROM json_each(?))
```

Kế hoạch: `SEARCH q USING INDEX game_v2_question_qid (qid=?)` → `LIST SUBQUERY 1` → `SCAN json_each VIRTUAL TABLE INDEX 1:` → `SEARCH d USING INDEX sqlite_autoindex_de_kho_1 (ma_de=?)` → `SEARCH g USING INDEX sqlite_autoindex_game_v2_index_1 (ma_de=?)`

## 20. 147.023 dòng đọc · 591 lần · 249 dòng/lần · lệnh: btvn/cua-em [chặng], btvn/xong-lo [nộp chặng]

```sql
SELECT qid, dang, chuyen_de, muc_do, sao, phan, loi, ghim FROM btvn_cau WHERE ma_btvn = ? ORDER BY thu_tu
```

Kế hoạch: `SEARCH btvn_cau USING INDEX sqlite_autoindex_btvn_cau_1 (ma_btvn=?)` → `USE TEMP B-TREE FOR ORDER BY`

## 21. 138.777 dòng đọc · 249 lần · 557 dòng/lần · lệnh: game-v2/recommendations [Đảo], game-v2/so-tay [Đảo]

```sql
SELECT c.qid,c.dung_sai,c.ma_ca,c.lan_thu,l.nop_luc FROM chi_tiet_cau c JOIN luot l ON l.ma_ca=c.ma_ca AND l.sbd=c.sbd AND l.lan_thu=c.lan_thu JOIN ca ON ca.ma_ca=c.ma_ca WHERE c.sbd=? AND l.nop_luc IS NOT NULL AND l.trang_thai IN ('da_nop','khoa') AND c.dung_sai IN (0,1) AND ca.trang_thai<>'da_xoa' AND (ca.cong_bo='ngay' OR (ca.cong_bo='ca_lop_xong' AND (ca.trang_thai='dong' OR (EXISTS(SELECT 1 FROM luot lc WHERE lc.ma_ca=ca.ma_ca) AND NOT EXISTS(SELECT 1 FROM luot ln WHERE ln.ma_ca=ca.ma_ca AND ln.trang_thai<>'da_nop'))))) ORDER BY l.nop_luc DESC
```

Kế hoạch: `SEARCH c USING INDEX idx_ctc_qid (sbd=?)` → `SEARCH ca USING INDEX sqlite_autoindex_ca_1 (ma_ca=?)` → `CORRELATED SCALAR SUBQUERY 1` → `SEARCH lc USING COVERING INDEX idx_luot_em (ma_ca=?)` → `CORRELATED SCALAR SUBQUERY 2` → `SEARCH ln USING INDEX idx_luot_em (ma_ca=?)` → `SEARCH l USING INDEX idx_luot_em (ma_ca=? AND sbd=? AND lan_thu=?)` → `USE TEMP B-TREE FOR ORDER BY`

## 22. 133.464 dòng đọc · 249 lần · 536 dòng/lần · lệnh: game-v2/recommendations [Đảo], game-v2/so-tay [Đảo]

```sql
SELECT COUNT(*) AS n, COALESCE(MAX(d.cap_nhat_luc),'') AS t, COALESCE(GROUP_CONCAT(d.ma_de),'') AS ids FROM de_kho d JOIN game_v2_index g ON g.ma_de=d.ma_de AND g.source_version=d.cap_nhat_luc WHERE COALESCE(d.da_xoa,0)=0
```

**Quét toàn bảng:** `d`

Kế hoạch: `SCAN d` → `SEARCH g USING INDEX sqlite_autoindex_game_v2_index_1 (ma_de=?)`

## 23. 133.000 dòng đọc · 500 lần · 266 dòng/lần · lệnh: game-v2/academic-sync [mở], game-v2/academic-sync [nền]

```sql
SELECT l.*,c.bo_theo_em_json FROM luot l JOIN ca c ON c.ma_ca=l.ma_ca WHERE l.sbd=? AND l.nop_luc>=? AND l.trang_thai IN ('da_nop','khoa') AND c.trang_thai<>'da_xoa' AND (c.cong_bo='ngay' OR (c.cong_bo='ca_lop_xong' AND (c.trang_thai='dong' OR NOT EXISTS(SELECT 1 FROM luot x WHERE x.ma_ca=c.ma_ca AND x.trang_thai<>'da_nop')))) ORDER BY l.nop_luc
```

**Quét toàn bảng:** `l`

Kế hoạch: `SCAN l` → `SEARCH c USING INDEX sqlite_autoindex_ca_1 (ma_ca=?)` → `CORRELATED SCALAR SUBQUERY 1` → `SEARCH x USING INDEX idx_luot_em (ma_ca=?)` → `USE TEMP B-TREE FOR ORDER BY`

## 24. 132.500 dòng đọc · 500 lần · 265 dòng/lần · lệnh: daily-honors [mở], daily-honors [nền]

```sql
SELECT l.sbd,COALESCE(h.ho_ten,l.ho_ten) ho_ten,l.tong,l.nop_luc,l.vao_luc,c.ten_ca, json_extract(g.json,'$.nickname') nickname,json_extract(g.json,'$.pet') pet,json_extract(g.json,'$.cap') level FROM luot l JOIN ca c ON c.ma_ca=l.ma_ca LEFT JOIN hoc_sinh h ON h.sbd=l.sbd LEFT JOIN game_v2_profile g ON g.sbd=l.sbd WHERE l.sbd<>'12121212' AND l.nop_luc>=? AND l.nop_luc<? AND l.tong IS NOT NULL AND l.lan_thu=1 AND c.loai='thi' AND c.trang_thai<>'da_xoa' AND (c.cong_bo='ngay' OR (c.cong_bo='ca_lop_xong' AND NOT EXISTS(SELECT 1 FROM luot z WHERE z.ma_ca=c.ma_ca AND z.nop_luc IS NULL)))
```

**Quét toàn bảng:** `l`

Kế hoạch: `SCAN l` → `SEARCH c USING INDEX sqlite_autoindex_ca_1 (ma_ca=?)` → `CORRELATED SCALAR SUBQUERY 1` → `SEARCH z USING INDEX idx_luot_em (ma_ca=?)` → `SEARCH h USING INDEX sqlite_autoindex_hoc_sinh_1 (sbd=?) LEFT-JOIN` → `SEARCH g USING INDEX sqlite_autoindex_game_v2_profile_1 (sbd=?) LEFT-JOIN`

## 25. 101.131 dòng đọc · 250 lần · 405 dòng/lần · lệnh: hs/lich-su [mở]

```sql
SELECT l.ma_ca, l.lan_thu, l.nop_luc, l.vao_luc, l.diem_i, l.diem_ii, l.diem_iii, l.tong, l.dap_an_json, COALESCE(c.ten_ca, '') AS ten_ca, COALESCE(c.lop, '') AS lop, c.thoi_gian_phut, c.cong_bo, c.bo_theo_em_json, c.so_cau_json, (SELECT COUNT(*) FROM chi_tiet_cau t WHERE t.ma_ca = l.ma_ca AND t.sbd = l.sbd AND t.lan_thu = l.lan_thu AND t.dung_sai = 0 AND NOT (t.phan = 'II' AND ((CASE WHEN substr(replace(replace(upper(COALESCE(t.dap_an_chon,'')),'Đ','D'),'đ','D'),1,1) IN ('D','S') AND substr(replace(replace(upper(COALESCE(t.dap_an_chon,'')),'Đ','D'),'đ','D'),1,1) = substr(replace(replace(upper(COALESCE(t.dap_an_dung,'')),'Đ','D'),'đ','D'),1,1) THEN 1 ELSE 0 END) + (CASE WHEN substr(replace(…
```

**Quét toàn bảng:** `l`

Kế hoạch: `SCAN l` → `SEARCH c USING INDEX sqlite_autoindex_ca_1 (ma_ca=?) LEFT-JOIN` → `CORRELATED SCALAR SUBQUERY 1` → `SEARCH t USING INDEX idx_ctc_em (ma_ca=? AND sbd=? AND lan_thu=?)` → `CORRELATED SCALAR SUBQUERY 2` → `SEARCH t USING INDEX idx_ctc_em (ma_ca=? AND sbd=? AND lan_thu=?)` → `CORRELATED SCALAR SUBQUERY 3` → `SEARCH t USING INDEX idx_ctc_em (ma_ca=? AND sbd=? AND lan_thu=?)` → `CORRELATED SCALAR SUBQUERY 4` → `SEARCH t USING INDEX idx_ctc_em (ma_ca=? AND sbd=? AND lan_thu=?)` → `CORRELATED SCALAR SUBQUERY 5` → `SEARCH t USING INDEX idx_ctc_em (ma_ca=? AND sbd=? AND lan_thu=?)` → `CORRELATED SCALAR SUBQUERY 6` → `SEARCH t USING INDEX idx_ctc_em (ma_ca=? AND sbd=? AND lan_thu=?)` → `CORRELATED SCALAR SUBQUERY 7` → `SEARCH t USING COVERING INDEX idx_ctc_em (ma_ca=? AND sbd=? AND lan_thu=?)` → `USE TEMP B-TREE FOR ORDER BY`

## 26. 99.277 dòng đọc · 190 lần · 523 dòng/lần · lệnh: hs/on-lai/nop [nộp ôn]

```sql
SELECT qid, ket_qua FROM su_kien_hoc WHERE sbd = ? AND nguon = ? AND ma_nguon = ? AND lan = 1 AND qid IN (SELECT value FROM json_each(?))
```

Kế hoạch: `SEARCH su_kien_hoc USING INDEX idx_skh_nguon (nguon=? AND ma_nguon=?)` → `LIST SUBQUERY 1` → `SCAN json_each VIRTUAL TABLE INDEX 1:` → `CREATE BLOOM FILTER`

## 27. 97.727 dòng đọc · 1.367 lần · 71 dòng/lần · lệnh: hs/ke-hoach-ngay [sau ghi], hs/ke-hoach-ngay [dựng đầu ngày]

```sql
SELECT sbd, COUNT(*) AS n FROM nam_kt_cau WHERE sbd IN (SELECT value FROM json_each(?)) AND trang_thai IN ('moi_sai','dang_on') GROUP BY sbd
```

Kế hoạch: `SEARCH nam_kt_cau USING INDEX idx_nkc_em_dang (sbd=?)` → `LIST SUBQUERY 1` → `SCAN json_each VIRTUAL TABLE INDEX 1:`

## 28. 93.045 dòng đọc · 354 lần · 263 dòng/lần · lệnh: game-v2/recommendations [Đảo], game-v2/so-tay [Đảo]

```sql
SELECT q.json FROM game_v2_question q JOIN de_kho d ON d.ma_de=q.ma_de JOIN game_v2_index g ON g.ma_de=d.ma_de AND g.source_version=d.cap_nhat_luc WHERE COALESCE(d.da_xoa,0)=0 AND q.qid IN (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
```

Kế hoạch: `SEARCH q USING INDEX game_v2_question_qid (qid=?)` → `SEARCH d USING INDEX sqlite_autoindex_de_kho_1 (ma_de=?)` → `SEARCH g USING INDEX sqlite_autoindex_game_v2_index_1 (ma_de=?)`

## 29. 75.291 dòng đọc · 1.557 lần · 48 dòng/lần · lệnh: hs/ke-hoach-ngay [sau ghi], hs/ke-hoach-ngay [dựng đầu ngày]

```sql
SELECT e.sbd, COUNT(DISTINCT e.qid) AS da_lam, COUNT(DISTINCT CASE WHEN e.ket_qua = 1 THEN e.qid END) AS dung, COUNT(DISTINCT CASE WHEN e.ket_qua = 1 AND EXISTS (SELECT 1 FROM su_kien_hoc p WHERE p.sbd = e.sbd AND p.qid = e.qid AND p.ngay_vn < e.ngay_vn AND (p.ket_qua = 0 OR p.ket_qua IS NULL)) THEN e.qid END) AS len_bac, COUNT(DISTINCT CASE WHEN e.ket_qua = 0 AND EXISTS (SELECT 1 FROM su_kien_hoc p WHERE p.sbd = e.sbd AND p.qid = e.qid AND p.ngay_vn < e.ngay_vn AND p.ket_qua = 1) THEN e.qid END) AS tut_bac FROM su_kien_hoc e WHERE e.sbd IN (SELECT value FROM json_each(?)) AND e.ngay_vn = ? GROUP BY e.sbd
```

Kế hoạch: `SEARCH e USING COVERING INDEX idx_skh_em_ngay_qid (sbd=? AND ngay_vn=?)` → `LIST SUBQUERY 3` → `SCAN json_each VIRTUAL TABLE INDEX 1:` → `CORRELATED SCALAR SUBQUERY 1` → `SEARCH p USING COVERING INDEX idx_skh_em_qid_ngay (sbd=? AND qid=? AND ngay_vn<?)` → `CORRELATED SCALAR SUBQUERY 2` → `SEARCH p USING COVERING INDEX idx_skh_em_qid_ngay (sbd=? AND qid=? AND ngay_vn<?)` → `USE TEMP B-TREE FOR count(DISTINCT)` → `USE TEMP B-TREE FOR count(DISTINCT)` → `USE TEMP B-TREE FOR count(DISTINCT)` → `USE TEMP B-TREE FOR count(DISTINCT)`

## 30. 72.669 dòng đọc · 249 lần · 292 dòng/lần · lệnh: game-v2/recommendations [Đảo], game-v2/so-tay [Đảo]

```sql
SELECT l.ma_ca,l.lan_thu,l.nop_luc,l.dap_an_json,ca.bo_theo_em_json FROM luot l JOIN ca ON ca.ma_ca=l.ma_ca WHERE l.sbd=? AND l.nop_luc IS NOT NULL AND l.trang_thai IN ('da_nop','khoa') AND ca.trang_thai<>'da_xoa' AND (ca.cong_bo='ngay' OR (ca.cong_bo='ca_lop_xong' AND (ca.trang_thai='dong' OR (EXISTS(SELECT 1 FROM luot lc WHERE lc.ma_ca=ca.ma_ca) AND NOT EXISTS(SELECT 1 FROM luot ln WHERE ln.ma_ca=ca.ma_ca AND ln.trang_thai<>'da_nop'))))) ORDER BY l.nop_luc DESC
```

**Quét toàn bảng:** `l`

Kế hoạch: `SCAN l` → `SEARCH ca USING INDEX sqlite_autoindex_ca_1 (ma_ca=?)` → `CORRELATED SCALAR SUBQUERY 1` → `SEARCH lc USING COVERING INDEX idx_luot_em (ma_ca=?)` → `CORRELATED SCALAR SUBQUERY 2` → `SEARCH ln USING INDEX idx_luot_em (ma_ca=?)` → `USE TEMP B-TREE FOR ORDER BY`

## 31. 71.301 dòng đọc · 1.367 lần · 52 dòng/lần · lệnh: hs/ke-hoach-ngay [sau ghi], hs/ke-hoach-ngay [dựng đầu ngày]

```sql
SELECT sbd, qid, ma_dang, moc_on_ke, lan_sai FROM nam_kt_cau WHERE sbd IN (SELECT value FROM json_each(?)) AND trang_thai IN ('moi_sai','dang_on','da_khac_phuc') AND can_day_lai = 0 AND moc_on_ke IS NOT NULL AND moc_on_ke <= ?
```

Kế hoạch: `SEARCH nam_kt_cau USING INDEX idx_nkc_em_moc (sbd=? AND moc_on_ke>? AND moc_on_ke<?)` → `LIST SUBQUERY 1` → `SCAN json_each VIRTUAL TABLE INDEX 1:`

## 32. 68.361 dòng đọc · 249 lần · 275 dòng/lần · lệnh: game-v2/recommendations [Đảo], game-v2/so-tay [Đảo]

```sql
SELECT qid,trang_thai,luc_cuoi,nguon_cuoi FROM nam_kt_cau WHERE sbd=? AND qid IN (SELECT qid FROM su_kien_hoc s WHERE s.sbd=? AND (s.nguon NOT IN ('thi','game') OR (s.nguon='thi' AND NOT EXISTS (SELECT 1 FROM ca WHERE ca.ma_ca=s.ma_nguon))))
```

Kế hoạch: `SEARCH nam_kt_cau USING INDEX idx_nkc_em_dang (sbd=?)` → `LIST SUBQUERY 2` → `SEARCH s USING INDEX idx_skh_em_ngay_qid (sbd=?)` → `CORRELATED SCALAR SUBQUERY 1` → `SEARCH ca USING COVERING INDEX sqlite_autoindex_ca_1 (ma_ca=?)` → `CREATE BLOOM FILTER`

## 33. 67.620 dòng đọc · 969 lần · 70 dòng/lần · lệnh: btvn/xong-lo [nộp chặng], hs/on-lai/nop [nộp ôn]

```sql
SELECT khoa, ma_dang, chuyen_de, lan_gap, lan_sai, lan_trong, dung_lien_tiep, ngay_dung_khac_nhau, ket_qua_cuoi, nguon_cuoi, luc_cuoi, moc_on_ke, trang_thai, can_day_lai, giay_tb FROM nam_kt_cau WHERE sbd IN (SELECT value FROM json_each(?))
```

Kế hoạch: `SEARCH nam_kt_cau USING INDEX idx_nkc_em_dang (sbd=?)` → `LIST SUBQUERY 1` → `SCAN json_each VIRTUAL TABLE INDEX 1:`

## 34. 49.714 dòng đọc · 1.124 lần · 44 dòng/lần · lệnh: hs/ke-hoach-ngay [sau ghi], hs/ke-hoach-ngay [dựng đầu ngày]

```sql
SELECT moc_on_ke AS ngay, COUNT(*) AS n FROM nam_kt_cau WHERE sbd = ? AND trang_thai IN ('moi_sai', 'dang_on', 'da_khac_phuc') AND can_day_lai = 0 AND moc_on_ke IS NOT NULL AND moc_on_ke < ? GROUP BY moc_on_ke
```

Kế hoạch: `SEARCH nam_kt_cau USING INDEX idx_nkc_em_moc (sbd=? AND moc_on_ke>? AND moc_on_ke<?)`

## 35. 46.909 dòng đọc · 1.367 lần · 34 dòng/lần · lệnh: hs/ke-hoach-ngay [sau ghi], hs/ke-hoach-ngay [dựng đầu ngày]

```sql
SELECT * FROM nam_kt_dang WHERE sbd IN (SELECT value FROM json_each(?))
```

Kế hoạch: `SEARCH nam_kt_dang USING INDEX idx_nkd_em (sbd=?)` → `LIST SUBQUERY 1` → `SCAN json_each VIRTUAL TABLE INDEX 1:`

## 36. 46.621 dòng đọc · 169 lần · 276 dòng/lần · lệnh: game-v2/recommendations [Đảo], game-v2/start [Đảo]

```sql
SELECT DISTINCT bc.dang AS dang FROM btvn_cau bc JOIN btvn b ON b.ma_btvn = bc.ma_btvn JOIN btvn_em be ON be.ma_btvn = b.ma_btvn WHERE b.da_xoa = 0 AND be.sbd IN (SELECT value FROM json_each(?)) AND bc.dang IS NOT NULL
```

Kế hoạch: `SEARCH be USING INDEX idx_btvn_em (sbd=?)` → `LIST SUBQUERY 1` → `SCAN json_each VIRTUAL TABLE INDEX 1:` → `SEARCH b USING INDEX sqlite_autoindex_btvn_1 (ma_btvn=?)` → `SEARCH bc USING INDEX sqlite_autoindex_btvn_cau_1 (ma_btvn=?)` → `USE TEMP B-TREE FOR DISTINCT`

## 37. 43.789 dòng đọc · 1.124 lần · 39 dòng/lần · lệnh: hs/ke-hoach-ngay [sau ghi], hs/ke-hoach-ngay [dựng đầu ngày]

```sql
WITH dang AS (SELECT be.ma_btvn AS ma, COALESCE(NULLIF(TRIM(c.ten_ca), ''), NULLIF(TRIM(d.ten_de), ''), '') AS ten, b.han_nop, b.giao_luc, b.so_cau AS so_cau_bai, COALESCE(be.lo_da_xong, 0) AS lo_da_xong, COALESCE(b.ca_nhan, 0) AS ca_nhan, be.so_cau_em, be.chot_luc, be.chang_mo_json, be.so_chang FROM btvn_em be JOIN btvn b ON b.ma_btvn = be.ma_btvn LEFT JOIN ca c ON c.ma_ca = b.ma_ca LEFT JOIN de_kho d ON d.ma_de = b.ma_de WHERE be.sbd = ? AND COALESCE(be.nop_luc, '') = '' AND be.thu_hoi = 0 AND b.da_xoa = 0 AND b.han_nop > ? ORDER BY b.han_nop, b.ma_btvn LIMIT 20) SELECT 'bt' AS k, ma AS c1, ten AS c2, han_nop AS c3, giao_luc AS c4, so_cau_bai AS c5, lo_da_xong AS c6, ca_nhan AS c7, so_cau…
```

**Quét toàn bảng:** `dang`

Kế hoạch: `COMPOUND QUERY` → `LEFT-MOST SUBQUERY` → `MATERIALIZE dang` → `SEARCH be USING INDEX idx_btvn_em (sbd=?)` → `SEARCH b USING INDEX sqlite_autoindex_btvn_1 (ma_btvn=?)` → `SEARCH c USING INDEX sqlite_autoindex_ca_1 (ma_ca=?) LEFT-JOIN` → `SEARCH d USING INDEX sqlite_autoindex_de_kho_1 (ma_de=?) LEFT-JOIN` → `USE TEMP B-TREE FOR ORDER BY` → `SCAN dang` → `UNION ALL` → `SEARCH m USING COVERING INDEX idx_btvn_em_cau_em (ma_btvn=? AND sbd=? AND chang>?)` → `LIST SUBQUERY 3` → `SEARCH be USING INDEX idx_btvn_em (sbd=?)` → `SEARCH b USING INDEX sqlite_autoindex_btvn_1 (ma_btvn=?)` → `USE TEMP B-TREE FOR ORDER BY`

## 38. 43.364 dòng đọc · 1.017 lần · 43 dòng/lần · lệnh: hs/ke-hoach-ngay [sau ghi], btvn/xong-lo [nộp chặng]

```sql
SELECT ma_btvn, sbd, chang, COUNT(*) AS n FROM btvn_em_cau WHERE chang >= 0 AND sbd IN (SELECT value FROM json_each(?)) AND ma_btvn IN (SELECT value FROM json_each(?)) GROUP BY ma_btvn, sbd, chang ORDER BY chang
```

Kế hoạch: `SEARCH btvn_em_cau USING COVERING INDEX idx_btvn_em_cau_em (ma_btvn=? AND sbd=? AND chang>?)` → `LIST SUBQUERY 2` → `SCAN json_each VIRTUAL TABLE INDEX 1:` → `LIST SUBQUERY 1` → `SCAN json_each VIRTUAL TABLE INDEX 1:` → `USE TEMP B-TREE FOR ORDER BY`

## 39. 36.909 dòng đọc · 1.367 lần · 27 dòng/lần · lệnh: hs/ke-hoach-ngay [sau ghi], hs/ke-hoach-ngay [dựng đầu ngày]

```sql
SELECT ma_ca, ten_ca, bat_dau, lop FROM ca WHERE trang_thai = 'mo' AND COALESCE(loai, 'thi') = 'thi' AND bat_dau > ? AND bat_dau <= ?
```

**Quét toàn bảng:** `ca` (27 dòng)

Kế hoạch: `SCAN ca`

## 40. 32.706 dòng đọc · 969 lần · 34 dòng/lần · lệnh: btvn/xong-lo [nộp chặng], hs/on-lai/nop [nộp ôn]

```sql
SELECT khoa, so_gap, so_sai, so_da_khac_phuc, so_moi_sai, so_chua_thay_sai, bac, moc_on_ke, moc_moi_sai FROM nam_kt_dang WHERE sbd IN (SELECT value FROM json_each(?))
```

Kế hoạch: `SEARCH nam_kt_dang USING INDEX idx_nkd_em (sbd=?)` → `LIST SUBQUERY 1` → `SCAN json_each VIRTUAL TABLE INDEX 1:`

