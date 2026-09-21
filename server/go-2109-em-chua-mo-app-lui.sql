-- LÙI việc gỡ 2 em khối 12 chưa mở app (server/go-2109-em-chua-mo-app.sql): chép NGUYÊN dòng từ bảng lưu về `hoc_sinh` / `danh_sach` (giữ cả token, mật khẩu, tên lớp), rồi mới dọn bảng lưu.
-- Chỉ dọn dòng lưu của em ĐÃ có mặt lại ở bảng gốc. INSERT OR IGNORE ⇒ chạy lại an toàn. Ghi dữ liệu THẬT — chỉ chạy khi thầy bấm cho phép.
INSERT OR IGNORE INTO hoc_sinh (sbd, ho_ten, nam_sinh, lop, sdt, trang_thai, token, mat_khau, tao_luc, cap_nhat_luc, ten_lop)
SELECT sbd, ho_ten, nam_sinh, lop, sdt, trang_thai, token, mat_khau, tao_luc, cap_nhat_luc, ten_lop FROM hoc_sinh_da_go WHERE ly_do = 'chua_mo_app_lan_nao_21_09' AND sbd IN ('12121', '12126');
INSERT OR IGNORE INTO danh_sach (sbd, ho_ten, nam_sinh, lop, cap_nhat_luc)
SELECT sbd, ho_ten, nam_sinh, lop, cap_nhat_luc FROM danh_sach_da_go WHERE ly_do = 'chua_mo_app_lan_nao_21_09' AND sbd IN ('12121', '12126');
DELETE FROM hoc_sinh_da_go WHERE ly_do = 'chua_mo_app_lan_nao_21_09' AND sbd IN ('12121', '12126') AND sbd IN (SELECT sbd FROM hoc_sinh);
DELETE FROM danh_sach_da_go WHERE ly_do = 'chua_mo_app_lan_nao_21_09' AND sbd IN ('12121', '12126') AND sbd IN (SELECT sbd FROM danh_sach);
