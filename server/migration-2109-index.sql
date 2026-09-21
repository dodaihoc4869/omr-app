-- CHỈ THÊM (21/09/2026 · Boss: hạ chi phí đọc D1, 24 giờ qua 454 triệu dòng đọc): HAI CHỈ MỤC phủ trên `su_kien_hoc` cho truy vấn TIEN_BO_NGAY (`da_lam`, ke-hoach-ngay-d1.ts): hai nhánh EXISTS "câu này đã sai/đúng ở NGÀY TRƯỚC"
-- hiện quét lại TOÀN BỘ lịch sử của em cho từng câu (idx_skh_em_ngay chỉ khoá sbd + ngày). Đo trên BẢN SAO sao lưu 21/09 16:19 (kết quả 6 ngày × mọi em GIỐNG HỆT trước/sau):
--   cả lớp (168 em, 18/09): 611.670 dòng duyệt → 15.798 (39 lần), 65 ms → 8 ms · một em (213 sự kiện): 14.330 → 431 (33 lần).
-- Chỉ thêm, không đổi/xoá gì; chạy lại vô hại (IF NOT EXISTS). Chỉ mục cũ giữ nguyên. Lùi: server/lui-2109-index.sql.
-- (1) đường tra "cùng em + cùng câu + ngày trước" (phủ ket_qua ⇒ không đọc bảng); (2) đường "em + ngày" phủ qid + ket_qua (phần ngoài không đọc bảng).
CREATE INDEX IF NOT EXISTS idx_skh_em_qid_ngay ON su_kien_hoc(sbd, qid, ngay_vn, ket_qua);
CREATE INDEX IF NOT EXISTS idx_skh_em_ngay_qid ON su_kien_hoc(sbd, ngay_vn, qid, ket_qua);
