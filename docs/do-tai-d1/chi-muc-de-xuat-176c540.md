# Đề xuất CHỈ MỤC (chỉ-thêm) — kiểm bằng EXPLAIN trên bản sao lưu thật

Mỗi ca: kế hoạch TRƯỚC / SAU khi thêm chỉ mục (thử trên bản sao tạm, không đụng D1 thật). Việc của Code 3: chạy migration chỉ-thêm sau 23:00, đo lại bằng bộ bắn tải giả.

## #4 profile/recommendations (su_kien_hoc nguon=btvn_lo)

```sql
CREATE INDEX idx_skh_em_ngay_nguon ON su_kien_hoc(sbd, ngay_vn, nguon, ma_nguon, lan, ket_qua)
```

- Trước: `SCAN CONSTANT ROW` → `SCALAR SUBQUERY 1` → `SEARCH be USING INDEX idx_btvn_em (sbd=?)` → `SEARCH b USING INDEX sqlite_autoindex_btvn_1 (ma_btvn=?)` → `SCALAR SUBQUERY 3` → `CO-ROUTINE x` → `SEARCH s USING INDEX idx_skh_nguon (nguon=?)` → `USE TEMP B-TREE FOR DISTINCT` → `SCAN x` → `SEARCH be2 USING INDEX idx_btvn_lo (ma_btvn=?)` → `SCALAR SUBQUERY 4` → `SEARCH su_kien_hoc USING INDEX idx_skh_em_ngay_qid (sbd=? AND ngay_vn=?)` → `SCALAR SUBQUERY 5` → `SEARCH nam_kt_cau USING INDEX idx_nkc_em_moc (sbd=? AND moc_on_ke>?)`
- Sau: `SCAN CONSTANT ROW` → `SCALAR SUBQUERY 1` → `SEARCH be USING INDEX idx_btvn_em (sbd=?)` → `SEARCH b USING INDEX sqlite_autoindex_btvn_1 (ma_btvn=?)` → `SCALAR SUBQUERY 3` → `CO-ROUTINE x` → `SEARCH s USING COVERING INDEX idx_skh_em_ngay_nguon (sbd=? AND ngay_vn=? AND nguon=?)` → `USE TEMP B-TREE FOR DISTINCT` → `SCAN x` → `SEARCH be2 USING INDEX idx_btvn_lo (ma_btvn=?)` → `SCALAR SUBQUERY 4` → `SEARCH su_kien_hoc USING COVERING INDEX idx_skh_em_ngay_nguon (sbd=? AND ngay_vn=? AND nguon=?)` → `SCALAR SUBQUERY 5` → `SEARCH nam_kt_cau USING INDEX idx_nkc_em_moc (sbd=? AND moc_on_ke>?)`
- Truy vấn: 379 lần, 2.401 dòng/lần trong bản đo 176c540

## #8 kế hoạch ngày: luot l theo sbd

```sql
CREATE INDEX idx_luot_sbd_nop ON luot(sbd, trang_thai, nop_luc)
```

- Trước: `SCAN l` → `SEARCH c USING INDEX sqlite_autoindex_ca_1 (ma_ca=?)` → `CORRELATED SCALAR SUBQUERY 1` → `SEARCH x USING INDEX idx_luot_em (ma_ca=?)` → `USE TEMP B-TREE FOR ORDER BY`
- Sau: `SEARCH l USING INDEX idx_luot_sbd_nop (sbd=? AND trang_thai=?)` → `SEARCH c USING INDEX sqlite_autoindex_ca_1 (ma_ca=?)` → `CORRELATED SCALAR SUBQUERY 1` → `SEARCH x USING INDEX idx_luot_em (ma_ca=?)` → `USE TEMP B-TREE FOR ORDER BY`
- Truy vấn: 1.557 lần, 288 dòng/lần trong bản đo 176c540

## #23 academic-sync: luot l theo sbd

```sql
CREATE INDEX idx_luot_sbd_nop ON luot(sbd, trang_thai, nop_luc)
```

- Trước: `SCAN l` (quét cả bảng `luot`; xem explain-176c540-tre40.md mục 23) → `SEARCH c USING INDEX sqlite_autoindex_ca_1 (ma_ca=?)` → …
- Sau: `SEARCH l USING INDEX idx_luot_sbd_nop (sbd=? AND trang_thai=? AND nop_luc>?)` → `SEARCH c USING INDEX sqlite_autoindex_ca_1 (ma_ca=?)` → `CORRELATED SCALAR SUBQUERY 1` → `SEARCH x USING INDEX idx_luot_em (ma_ca=?)` → `USE TEMP B-TREE FOR ORDER BY`
- Truy vấn: 500 lần, 266 dòng/lần trong bản đo 176c540


## Lưu ý
- `luot` chỉ 265 dòng trong bản sao lưu 18:07 nên `SCAN l` chưa đắt; nó lớn lên theo (số ca × số em) — mỗi kỳ thi thêm hàng nghìn dòng. Chỉ mục `luot(sbd, trang_thai, nop_luc)` phục vụ 5 lệnh của em: kế hoạch ngày, academic-sync, daily-honors, lịch sử, ôn lại.
- Ca #4: bộ lập kế hoạch của SQLite chọn `idx_skh_nguon (nguon, ma_nguon)` cho `sbd=? AND ngay_vn=? AND nguon='btvn_lo'` (không có ANALYZE ⇒ ưu tiên chỉ mục có cột `nguon`), nên đọc MỌI dòng `btvn_lo` của cả trường cho mỗi lần hỏi hồ sơ Đảo; số dòng đó tăng mỗi khi em nộp chặng (bản đo tự sinh ~7 nghìn dòng). Chỉ mục ba cột `(sbd, ngay_vn, nguon, …)` biến nó thành tra theo em.
- Sau khi thêm chỉ mục, chạy lại `node scripts/ban-tai-gia/chay.mjs --commit=<mã>` để đo dòng đọc thật (EXPLAIN chỉ cho thấy đường đi).
