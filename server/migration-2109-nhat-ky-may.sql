-- CHỈ THÊM (21/09/2026): NHẬT KÝ LỖI CỦA MÁY (B11 "tự canh sức khoẻ hệ thống", Boss duyệt). Trước đây lỗi của các việc chạy nền (cron) chỉ `console.error` nên màn Hôm nay không biết "có lỗi không".
-- Mỗi dòng = MỘT lỗi của MỘT việc nền (nguon ∈ nhac_nop_bai · ke_hoach_ngay · exp_ngay · tin_phu_huynh · gui_thong_bao); chống trùng: một nguồn ghi tối đa MỘT dòng mỗi 30 phút; giữ ≤ 500 dòng mới nhất.
-- `chu` là câu đơn giản cho thầy ("Nhắc nộp bài lỗi, máy sẽ thử lại"), KHÔNG chứa chi tiết kỹ thuật. Chỉ `/gv/bang-tin` đọc. Chưa chạy migration thì việc ghi lỗi im lặng bỏ qua và bảng tin ghi `lyDoThieu.nhatKyMay`.
-- Lùi: DROP TABLE nhat_ky_may.
CREATE TABLE IF NOT EXISTS nhat_ky_may (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  luc   TEXT NOT NULL,
  nguon TEXT NOT NULL,
  muc   TEXT NOT NULL DEFAULT 'loi',
  chu   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nhat_ky_may_nguon ON nhat_ky_may(nguon, luc);
