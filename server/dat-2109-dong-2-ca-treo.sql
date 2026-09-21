-- ĐÓNG 2 CA TREO (thầy lệnh 21/09: "bạn tự đóng 2 ca treo luôn"; Boss 21/09). Y HỆT lệnh Khoá ca của thầy (khoaCa, server/src/goi-cu.ts): nộp hộ em còn đang làm rồi đóng ca. Không hơn không kém.
--   118019 = '2009 - Lớp 2 - L1' (28 da_nop + 2 lượt 'khoa'), 543998 = '2009 - Lớp TH - L1' (39 da_nop + 1 lượt 'khoa'); cả hai đang trang_thai='mo', cong_bo='ca_lop_xong'.
-- KHÔNG đụng lượt 'khoa' của 3 em, KHÔNG đụng điểm / đáp án / cong_bo. Sau khi đóng: laSanSangCongBo(ca_lop_xong, 'dong') = công bố ⇒ 67 em thấy điểm.
-- Tệp SQL dữ liệu thật (không đặt tên migration-*). Sao lưu D1 TRƯỚC khi chạy. Tệp lùi: server/lui-2109-dong-2-ca-treo.sql.
-- Soạn lúc 2026-09-21T06:43:28.000Z.
UPDATE luot SET trang_thai='da_nop', nop_luc=COALESCE(NULLIF(nop_luc,''), '2026-09-21T06:43:28.000Z'), cap_nhat_luc='2026-09-21T06:43:28.000Z' WHERE ma_ca IN ('118019','543998') AND trang_thai='dang_lam';   -- mong đợi 0 dòng
UPDATE ca SET trang_thai='dong', cap_nhat_luc='2026-09-21T06:43:28.000Z' WHERE ma_ca IN ('118019','543998') AND trang_thai='mo';   -- mong đợi 2 dòng
-- Câu kiểm sau khi chạy (đọc, không sửa):
-- SELECT ma_ca, trang_thai, cong_bo FROM ca WHERE ma_ca IN ('118019','543998');                                   -- 2 dòng: 'dong', 'ca_lop_xong'
-- SELECT ma_ca, trang_thai, COUNT(*) AS n FROM luot WHERE ma_ca IN ('118019','543998') GROUP BY ma_ca, trang_thai; -- 118019: da_nop 28 + khoa 2; 543998: da_nop 39 + khoa 1
