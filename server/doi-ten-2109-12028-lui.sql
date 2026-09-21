-- LÙI đổi tên học sinh 12028: "Nguyễn Công Huy" ⇒ "Nguyễn Công Hy".
-- Theo ĐÚNG logic lệnh `/hoc-sinh/doi-ten` (server/src/doi-ten-hoc-sinh.ts, docs/hop-dong-doi-ten-hoc-sinh-2109.md): CHỈ cột tên, theo sbd '12028', năm bảng danh_sach + hoc_sinh + các bản chép luot / btvn_em / phong_cho
-- (bản chép chỉ sửa dòng ĐÃ có tên). KHÔNG đụng phieu, chan_vao (sổ/nhật ký đã phát), phu_huynh, SBD, lớp, mật khẩu, điểm. Ghi dữ liệu THẬT — chỉ chạy khi thầy bấm cho phép. KHÔNG nằm trong danh sách migration-*.sql.
-- AN TOÀN: chỉ chạy khi em đang mang tên "Nguyễn Công Huy" ở danh_sach hoặc hoc_sinh (nếu tên đã khác thì không đổi gì); các bản chép đổi TRƯỚC hai bảng chính để điều kiện ấy còn đúng; chạy lại không đổi thêm.
UPDATE luot SET ho_ten = 'Nguyễn Công Hy' WHERE sbd = '12028' AND COALESCE(ho_ten, '') <> '' AND ho_ten <> 'Nguyễn Công Hy'
   AND (EXISTS (SELECT 1 FROM danh_sach WHERE sbd = '12028' AND ho_ten = 'Nguyễn Công Huy') OR EXISTS (SELECT 1 FROM hoc_sinh WHERE sbd = '12028' AND ho_ten = 'Nguyễn Công Huy'));
UPDATE btvn_em SET ho_ten = 'Nguyễn Công Hy' WHERE sbd = '12028' AND COALESCE(ho_ten, '') <> '' AND ho_ten <> 'Nguyễn Công Hy'
   AND (EXISTS (SELECT 1 FROM danh_sach WHERE sbd = '12028' AND ho_ten = 'Nguyễn Công Huy') OR EXISTS (SELECT 1 FROM hoc_sinh WHERE sbd = '12028' AND ho_ten = 'Nguyễn Công Huy'));
UPDATE phong_cho SET ho_ten = 'Nguyễn Công Hy' WHERE sbd = '12028' AND COALESCE(ho_ten, '') <> '' AND ho_ten <> 'Nguyễn Công Hy'
   AND (EXISTS (SELECT 1 FROM danh_sach WHERE sbd = '12028' AND ho_ten = 'Nguyễn Công Huy') OR EXISTS (SELECT 1 FROM hoc_sinh WHERE sbd = '12028' AND ho_ten = 'Nguyễn Công Huy'));
UPDATE hoc_sinh SET ho_ten = 'Nguyễn Công Hy' WHERE sbd = '12028' AND ho_ten = 'Nguyễn Công Huy';
UPDATE danh_sach SET ho_ten = 'Nguyễn Công Hy' WHERE sbd = '12028' AND ho_ten = 'Nguyễn Công Huy';
-- Câu kiểm sau khi chạy (mong: mỗi bảng một dòng, tên = "Nguyễn Công Hy"; luot / btvn_em / phong_cho có thể trống nếu em chưa có dòng):
SELECT 'danh_sach' AS bang, sbd, ho_ten FROM danh_sach WHERE sbd = '12028'
UNION ALL SELECT 'hoc_sinh', sbd, ho_ten FROM hoc_sinh WHERE sbd = '12028'
UNION ALL SELECT 'luot', sbd, ho_ten FROM luot WHERE sbd = '12028'
UNION ALL SELECT 'btvn_em', sbd, ho_ten FROM btvn_em WHERE sbd = '12028'
UNION ALL SELECT 'phong_cho', sbd, ho_ten FROM phong_cho WHERE sbd = '12028';
