-- 12/11 tối (H3 đợt 3 giảm chi phí D1 — câu đọc bảng phụ / cron). CHỈ-THÊM, chạy lại vô hại. Tên «z-» để chạy SAU các migration tạo bảng gốc
-- (1310 kiểm tra cá nhân, 1909 EXP / hồ sơ) — D1 giả trong test nạp migration theo thứ tự tên.
-- (Q2) Bandit cả lớp cộng sẵn bằng cron (server/src/hanh-trinh-bandit-lop.ts). Mã cũng tự tạo (SQL_DONG_CO_HANH_TRINH).
CREATE TABLE IF NOT EXISTS hanh_trinh_v4_bandit_lop(context TEXT NOT NULL,cach TEXT NOT NULL,dung INTEGER NOT NULL,sai INTEGER NOT NULL,PRIMARY KEY(context,cach));
CREATE TABLE IF NOT EXISTS hanh_trinh_v4_bandit_lop_moc(id INTEGER PRIMARY KEY CHECK(id=1),luc INTEGER NOT NULL);
-- (Q5) Cron làm mới đề kiểm tra cá nhân (server/src/kiem-tra-ca-nhan.ts dongBoKtCn): chỉ lịch chưa mở, chưa nộp. Mã cũng tự tạo (SQL_KT_CN).
CREATE INDEX IF NOT EXISTS ktcn_chua_mo ON kiem_tra_ca_nhan(mo_luc) WHERE nop_luc IS NULL;
-- (Q6) Hồ sơ câu khi lập kế hoạch (server/src/ke-hoach-ngay-d1.ts docHoSoD1): đo 24h 5.861 lượt × ~1.952 hàng — trước đọc MỌI câu của em (chỉ mục + bảng).
--  · nkc_em_toi_han: câu tới hạn — cùng thứ tự (sbd, moc_on_ke) với idx_nkc_em_moc, chỉ chứa câu đủ điều kiện (danh sách 4 trạng thái chỉ câu này dùng).
--  · nkc_em_chua_kp: đếm câu chưa khắc phục trên chỉ mục (không chạm bảng). Danh sách ('dang_on','moi_sai') khớp ĐÚNG câu đếm — câu khác viết ('moi_sai','dang_on')
--    không dùng chỉ mục này (giữ nguyên kế hoạch và thứ tự dòng của chúng; tests/doc-bang-phu-h3-1211.test.ts khoá).
CREATE INDEX IF NOT EXISTS nkc_em_toi_han ON nam_kt_cau(sbd, moc_on_ke) WHERE trang_thai IN ('moi_sai','dang_on','da_khac_phuc','chua_thay_sai') AND can_day_lai = 0 AND moc_on_ke IS NOT NULL;
CREATE INDEX IF NOT EXISTS nkc_em_chua_kp ON nam_kt_cau(sbd, trang_thai) WHERE trang_thai IN ('dang_on','moi_sai');
-- (Q7) Tổng EXP mùa của em (server/src/exp-d1.ts lenhTongSo, điều kiện CAS dieuKienTongSo, docTongSoSom) + nhánh EXP dòng thời gian em (gv-hom-nay-v2.ts):
-- đo 24h 7.429 lượt × ~1.449 hàng — trước đọc mọi dòng của em qua (sbd, ngay_vn) rồi tra bảng. Chỉ mục PHỦ: chỉ đọc dòng từ đầu mùa, không chạm bảng.
CREATE INDEX IF NOT EXISTS exp_so_em_luc ON exp_so(sbd, luc, exp, ngay_vn);
