-- 12/11 (nhóm G4 giảm chi phí D1, goi-bai-7-em-nhan.ts): MỘT dòng đệm danh sách em đang nhận Gói 7 dùng chung cho hai cron nền
-- (lập sẵn Sảnh — san-sang.ts, Bốn bảng — bon-chi-so-d1.ts), làm mới tối đa 5 phút/lần. CHỈ-THÊM; mã cũng tự tạo (chayDdlMotLan) nếu chưa có.
CREATE TABLE IF NOT EXISTS goi_bai_7_em_nhan_dem (khoa TEXT PRIMARY KEY, luc INTEGER NOT NULL, json TEXT NOT NULL);
