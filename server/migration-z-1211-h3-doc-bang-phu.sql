-- 12/11 tối (H3 đợt 3 giảm chi phí D1 — câu đọc bảng phụ / cron). CHỈ-THÊM, chạy lại vô hại. Tên «z-» để chạy SAU các migration tạo bảng gốc
-- (1310 kiểm tra cá nhân, 1909 EXP / hồ sơ) — D1 giả trong test nạp migration theo thứ tự tên.
-- (Q2) Bandit cả lớp cộng sẵn bằng cron (server/src/hanh-trinh-bandit-lop.ts). Mã cũng tự tạo (SQL_DONG_CO_HANH_TRINH).
CREATE TABLE IF NOT EXISTS hanh_trinh_v4_bandit_lop(context TEXT NOT NULL,cach TEXT NOT NULL,dung INTEGER NOT NULL,sai INTEGER NOT NULL,PRIMARY KEY(context,cach));
CREATE TABLE IF NOT EXISTS hanh_trinh_v4_bandit_lop_moc(id INTEGER PRIMARY KEY CHECK(id=1),luc INTEGER NOT NULL);
-- (Q5) Cron làm mới đề kiểm tra cá nhân (server/src/kiem-tra-ca-nhan.ts dongBoKtCn): chỉ lịch chưa mở, chưa nộp. Mã cũng tự tạo (SQL_KT_CN).
CREATE INDEX IF NOT EXISTS ktcn_chua_mo ON kiem_tra_ca_nhan(mo_luc) WHERE nop_luc IS NULL;
