-- CHỈ THÊM (21/09/2026 · Bảng tin sàn `/gv/bang-tin-song`, đọc mỗi 10 giây): CHỈ MỤC PHỦ theo THỜI GIAN trên `su_kien_hoc(luc, sbd, ket_qua, ma_dang)`. Các truy vấn "sự kiện HÔM NAY" (`WHERE luc >= mốc`) hiện quét CẢ bảng (không chỉ mục nào khoá `luc`).
-- Đo trên BẢN SAO sao lưu 21/09 16:19 (sqlite .scanstats): 28.564 → 1.150 dòng duyệt (25 lần), phủ đủ cột nên không đọc bảng. Chạy lại vô hại (IF NOT EXISTS). Lùi: server/lui-2109-index-luc.sql.
CREATE INDEX IF NOT EXISTS idx_skh_luc ON su_kien_hoc(luc, sbd, ket_qua, ma_dang);
