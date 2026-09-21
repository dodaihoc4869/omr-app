-- GỠ 2 EM KHỐI 12 CHƯA TỪNG MỞ APP — KHÔI PHỤC ĐƯỢC (21/09/2026; thầy lệnh, Boss soát; ghi dữ liệu THẬT — chỉ chạy khi thầy bấm cho phép). KHÔNG nằm trong danh sách migration-*.sql.
-- ĐIỀU KIỆN: đã chạy migration-2109-hoc-sinh-da-go.sql (bảng lưu) và ĐÃ SAO LƯU D1 (docs/ke-hoach-go-em-chua-mo-app-2109.md).
-- 2 SBD (thầy chốt 21/09 ~11:00: "xoá Dương Quỳnh Mai … xoá 12126, còn lại giữ nguyên"): 12121 Dương Quỳnh Mai (có ở hoc_sinh + danh_sach) và 12126 Đỗ Anh Toàn (CHỈ có ở danh_sach). Đối chiếu D1 sống chỉ-đọc: 0 dấu vết hoạt động cả hai. Mọi em khác GIỮ NGUYÊN.
-- AN TOÀN NHIỀU LỚP:
--   1. Chép sang bảng lưu TRƯỚC; chỉ xoá dòng gốc của em ĐÃ nằm trong bảng lưu (ly_do khớp) — không có đường xoá mà không lưu.
--   2. Chỉ chép em khối 12, CHƯA CÓ token / mật khẩu, và KHÔNG có dấu vết ở 27 bảng hoạt động + bài tập về nhà đã mở/nộp tại THỜI ĐIỂM CHẠY — em nào vừa mở app sẽ tự được giữ lại.
--   3. Bảng nào thiếu ⇒ câu lệnh lỗi ⇒ dừng trước khi xoá.  4. INSERT OR IGNORE ⇒ chạy lại không nhân đôi, không lỗi.
-- Chỉ động vào `hoc_sinh` + `danh_sach`. Mọi bảng khác (btvn_em, kế hoạch ngày, thông báo…) GIỮ NGUYÊN. Lùi: server/go-2109-em-chua-mo-app-lui.sql.
-- Kiểm sau khi chạy: SELECT COUNT(*) FROM hoc_sinh_da_go WHERE ly_do = 'chua_mo_app_lan_nao_21_09';  (mong 1: 12121; 12126 chỉ có ở danh_sach nên đếm ở danh_sach_da_go: mong 2)  ·  SELECT COUNT(*) FROM hoc_sinh WHERE sbd IN ('12121', '12126');  (mong 0).

INSERT OR IGNORE INTO hoc_sinh_da_go (sbd, ho_ten, nam_sinh, lop, sdt, trang_thai, token, mat_khau, tao_luc, cap_nhat_luc, ten_lop, go_luc, ly_do)
SELECT h.sbd, h.ho_ten, h.nam_sinh, h.lop, h.sdt, h.trang_thai, h.token, h.mat_khau, h.tao_luc, h.cap_nhat_luc, h.ten_lop, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), 'chua_mo_app_lan_nao_21_09'
  FROM hoc_sinh h
 WHERE h.lop = '12' AND h.sbd IN (
  '12121', '12126'
 )
   AND COALESCE(h.token, '') = '' AND COALESCE(h.mat_khau, '') = ''
   AND NOT EXISTS (SELECT 1 FROM su_kien_hoc x WHERE x.sbd = h.sbd)
   AND NOT EXISTS (SELECT 1 FROM luot x WHERE x.sbd = h.sbd)
   AND NOT EXISTS (SELECT 1 FROM phong_cho x WHERE x.sbd = h.sbd)
   AND NOT EXISTS (SELECT 1 FROM chi_tiet_cau x WHERE x.sbd = h.sbd)
   AND NOT EXISTS (SELECT 1 FROM phieu x WHERE x.sbd = h.sbd)
   AND NOT EXISTS (SELECT 1 FROM tien_do_hs x WHERE x.sbd = h.sbd)
   AND NOT EXISTS (SELECT 1 FROM nam_kt_cau x WHERE x.sbd = h.sbd)
   AND NOT EXISTS (SELECT 1 FROM nam_kt_dang x WHERE x.sbd = h.sbd)
   AND NOT EXISTS (SELECT 1 FROM qid_da_lam x WHERE x.sbd = h.sbd)
   AND NOT EXISTS (SELECT 1 FROM game_v2_profile x WHERE x.sbd = h.sbd)
   AND NOT EXISTS (SELECT 1 FROM game_v2_session x WHERE x.sbd = h.sbd)
   AND NOT EXISTS (SELECT 1 FROM game_v2_attempt x WHERE x.sbd = h.sbd)
   AND NOT EXISTS (SELECT 1 FROM game_v2_reward x WHERE x.sbd = h.sbd)
   AND NOT EXISTS (SELECT 1 FROM game_v2_task x WHERE x.sbd = h.sbd)
   AND NOT EXISTS (SELECT 1 FROM mom_bai x WHERE x.sbd = h.sbd)
   AND NOT EXISTS (SELECT 1 FROM nop_khac_phuc x WHERE x.sbd = h.sbd)
   AND NOT EXISTS (SELECT 1 FROM student_push x WHERE x.sbd = h.sbd)
   AND NOT EXISTS (SELECT 1 FROM ph_truy_cap x WHERE x.sbd = h.sbd)
   AND NOT EXISTS (SELECT 1 FROM study_preferences x WHERE x.sbd = h.sbd)
   AND NOT EXISTS (SELECT 1 FROM cau_hoi_em x WHERE x.sbd = h.sbd)
   AND NOT EXISTS (SELECT 1 FROM luyen_de_2026 x WHERE x.sbd = h.sbd)
   AND NOT EXISTS (SELECT 1 FROM than_thu x WHERE x.sbd = h.sbd)
   AND NOT EXISTS (SELECT 1 FROM exp_so x WHERE x.sbd = h.sbd)
   AND NOT EXISTS (SELECT 1 FROM chan_vao x WHERE x.sbd = h.sbd)
   AND NOT EXISTS (SELECT 1 FROM trang_thai x WHERE x.sbd = h.sbd)
   AND NOT EXISTS (SELECT 1 FROM tien_do_ca x WHERE x.sbd = h.sbd)
   AND NOT EXISTS (SELECT 1 FROM ban_do_sai x WHERE x.sbd = h.sbd)
   AND NOT EXISTS (SELECT 1 FROM btvn_em x WHERE x.sbd = h.sbd AND (x.nop_luc IS NOT NULL OR x.chot_luc IS NOT NULL OR COALESCE(x.lo_da_xong, 0) > 0 OR x.xong_vong1_luc IS NOT NULL));

INSERT OR IGNORE INTO danh_sach_da_go (sbd, ho_ten, nam_sinh, lop, cap_nhat_luc, go_luc, ly_do)
SELECT d.sbd, d.ho_ten, d.nam_sinh, d.lop, d.cap_nhat_luc, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), 'chua_mo_app_lan_nao_21_09'
  FROM danh_sach d
 WHERE d.lop = '12' AND d.sbd IN (
  '12121', '12126'
 )
   AND (NOT EXISTS (SELECT 1 FROM hoc_sinh h WHERE h.sbd = d.sbd) OR EXISTS (SELECT 1 FROM hoc_sinh_da_go g WHERE g.sbd = d.sbd AND g.ly_do = 'chua_mo_app_lan_nao_21_09'))
   AND NOT EXISTS (SELECT 1 FROM su_kien_hoc x WHERE x.sbd = d.sbd)
   AND NOT EXISTS (SELECT 1 FROM luot x WHERE x.sbd = d.sbd)
   AND NOT EXISTS (SELECT 1 FROM phong_cho x WHERE x.sbd = d.sbd)
   AND NOT EXISTS (SELECT 1 FROM chi_tiet_cau x WHERE x.sbd = d.sbd)
   AND NOT EXISTS (SELECT 1 FROM phieu x WHERE x.sbd = d.sbd)
   AND NOT EXISTS (SELECT 1 FROM tien_do_hs x WHERE x.sbd = d.sbd)
   AND NOT EXISTS (SELECT 1 FROM nam_kt_cau x WHERE x.sbd = d.sbd)
   AND NOT EXISTS (SELECT 1 FROM nam_kt_dang x WHERE x.sbd = d.sbd)
   AND NOT EXISTS (SELECT 1 FROM qid_da_lam x WHERE x.sbd = d.sbd)
   AND NOT EXISTS (SELECT 1 FROM game_v2_profile x WHERE x.sbd = d.sbd)
   AND NOT EXISTS (SELECT 1 FROM game_v2_session x WHERE x.sbd = d.sbd)
   AND NOT EXISTS (SELECT 1 FROM game_v2_attempt x WHERE x.sbd = d.sbd)
   AND NOT EXISTS (SELECT 1 FROM game_v2_reward x WHERE x.sbd = d.sbd)
   AND NOT EXISTS (SELECT 1 FROM game_v2_task x WHERE x.sbd = d.sbd)
   AND NOT EXISTS (SELECT 1 FROM mom_bai x WHERE x.sbd = d.sbd)
   AND NOT EXISTS (SELECT 1 FROM nop_khac_phuc x WHERE x.sbd = d.sbd)
   AND NOT EXISTS (SELECT 1 FROM student_push x WHERE x.sbd = d.sbd)
   AND NOT EXISTS (SELECT 1 FROM ph_truy_cap x WHERE x.sbd = d.sbd)
   AND NOT EXISTS (SELECT 1 FROM study_preferences x WHERE x.sbd = d.sbd)
   AND NOT EXISTS (SELECT 1 FROM cau_hoi_em x WHERE x.sbd = d.sbd)
   AND NOT EXISTS (SELECT 1 FROM luyen_de_2026 x WHERE x.sbd = d.sbd)
   AND NOT EXISTS (SELECT 1 FROM than_thu x WHERE x.sbd = d.sbd)
   AND NOT EXISTS (SELECT 1 FROM exp_so x WHERE x.sbd = d.sbd)
   AND NOT EXISTS (SELECT 1 FROM chan_vao x WHERE x.sbd = d.sbd)
   AND NOT EXISTS (SELECT 1 FROM trang_thai x WHERE x.sbd = d.sbd)
   AND NOT EXISTS (SELECT 1 FROM tien_do_ca x WHERE x.sbd = d.sbd)
   AND NOT EXISTS (SELECT 1 FROM ban_do_sai x WHERE x.sbd = d.sbd)
   AND NOT EXISTS (SELECT 1 FROM btvn_em x WHERE x.sbd = d.sbd AND (x.nop_luc IS NOT NULL OR x.chot_luc IS NOT NULL OR COALESCE(x.lo_da_xong, 0) > 0 OR x.xong_vong1_luc IS NOT NULL));

DELETE FROM hoc_sinh WHERE sbd IN (SELECT sbd FROM hoc_sinh_da_go WHERE ly_do = 'chua_mo_app_lan_nao_21_09') AND sbd IN ('12121', '12126');
DELETE FROM danh_sach WHERE sbd IN (SELECT sbd FROM danh_sach_da_go WHERE ly_do = 'chua_mo_app_lan_nao_21_09') AND sbd IN ('12121', '12126');
