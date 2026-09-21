-- KẾ THỪA KHO LỚP (Boss lệnh 21/09 ~14:55): lớp "12 - Nhóm 10 điểm" (15 em, thầy tách sáng 21/09 từ Lớp Thường, chưa có bài giao riêng) chỉ thấy 11 dạng lớp vì bài/ca đã giao gắn sbd lúc các em còn ở Lớp Thường.
-- Khai lớp gốc THẬT của các em (Lớp THƯỜNG, không phải Tinh Hoa) để kho game của các em = dạng lớp gốc ∪ dạng của chính các em. Máy chủ nạp lại NGAY (mốc bảng đệm gắn chuỗi kế thừa).
-- Tệp SQL dữ liệu thật (không đặt tên migration-*). Sao lưu D1 TRƯỚC khi chạy. Tệp lùi: server/lui-2109-lop-ke-thua.sql. Soạn lúc 2026-09-21T07:55:17.000Z.
INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES ('lop_da_hoc_ke_thua', '{"12 - Nhóm 10 điểm":"12 - Lớp Thường"}', '2026-09-21T07:55:17.000Z')
  ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc;
-- Câu kiểm sau khi chạy (đọc, không sửa) — mong đợi 1 dòng đúng JSON trên; rồi sau khi 1 em của lớp mở game: lop_da_hoc của lớp này ≈ số dạng Lớp Thường (106) + phần riêng:
-- SELECT khoa, gia_tri FROM cau_hinh WHERE khoa = 'lop_da_hoc_ke_thua';
-- SELECT ten_lop, COUNT(*) AS so_dang FROM lop_da_hoc GROUP BY ten_lop;
