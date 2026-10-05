-- BẬT OMNI CHO MỌI EM — thầy 05/10 (~23:30 giờ VN, nguyên văn): "Bật hết omni luôn nhé."
--
-- CHỈ THÊM một khoá cấu hình `cau_hinh.omni` = {"bat":true,"lop":[],"sbd":[]} (cùng khuôn `ghiCauHinh` ở server/src/omni-gv.ts):
-- bật, không danh sách lớp/SBD ⇒ áp cho MỌI em đang dùng Hoá 2.0 (`omniBat` = `cheDo2` ∧ `coOmniApCho`, server/src/omni-d1.ts).
-- `INSERT OR IGNORE`: khoá đã có (thầy từng chỉnh ở Cài đặt OMNI) thì GIỮ NGUYÊN, không ghi đè — xem số dòng ghi trong nhật ký workflow.
-- Tắt lại / chỉ bật vài lớp: màn Cài đặt OMNI ở app thầy (ghi đè khoá này). Gỡ hẳn: xoá dòng khoa = 'omni' (app về đúng đường cũ).
-- Chạy: GitHub Actions "Chạy migration chỉ-thêm" (.github/workflows/migration-chi-them.yml), tệp `migration-0510-bat-omni.sql`.
INSERT OR IGNORE INTO cau_hinh (khoa, gia_tri, cap_nhat_luc)
VALUES ('omni', '{"bat":true,"lop":[],"sbd":[]}', '2026-10-05T16:30:00.000Z');
