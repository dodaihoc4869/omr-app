-- CHỈ THÊM (19/09/2026): SỔ EXP HỌC TẬP + SỔ MẢNH KHIÊN (DE-XUAT-EXP-MANH-KHIEN-1909.md, thầy chốt "Chốt. Quá thông minh").
--
-- Hai bảng này là SỔ CỘNG DỒN, chỉ thêm dòng, không sửa/xoá. Mọi khoản EXP/mảnh do MÁY CHỦ tính từ sổ `su_kien_hoc` và các bảng phụ
-- (hàm thuần `exp-hoc-tap.ts`), KHÔNG có khoản nào do máy em khai. Không đụng bảng/cột đang chạy. Mã máy chủ có phòng vệ nếu quên chạy
-- file này (mọi đường EXP bọc try/catch, lượt nộp bài KHÔNG hỏng). Không tính lại EXP quá khứ: chỉ ghi khoản từ mốc `exp_moi.tu`
-- (`cau_hinh`) trở đi.
--
--   khoa      `<sbd>|<khoá khoản>`  (idempotent: ghi lại = không thêm dòng; khoá khoản xem `exp-hoc-tap.ts`)
--   ngay_vn   ngày VN của khoản (để hiện "EXP hôm nay")
--   loai      cau | lo | btvn | mom | len_bac | khac_phuc | len_bang | diem_ca | dat_ngay | chuoi  /  manh: dat | chuoi7 | dang
--   ghi_chu   tiếng Việt sẵn in, kèm số
--
-- Cộng vào hồ sơ game KHÔNG đánh dấu từng dòng: hồ sơ giữ tổng luỹ kế đã cộng (`expMoi.daCong`, `expMoi.manhDaTinh`) và mỗi lần chỉ cộng
-- phần chênh SUM(sổ) − đã cộng, bằng CAS theo `revision` — nên em chưa có hồ sơ game thì khoản cứ nằm trong sổ ("chờ") và tự được cộng khi
-- hồ sơ có, và gọi lại bao nhiêu lần cũng không cộng trùng.
CREATE TABLE IF NOT EXISTS exp_so (
  khoa      TEXT PRIMARY KEY,
  sbd       TEXT NOT NULL,
  ngay_vn   TEXT NOT NULL,
  loai      TEXT NOT NULL,
  qid       TEXT,
  ma_nguon  TEXT,
  exp       INTEGER NOT NULL,
  luc       TEXT NOT NULL,
  ghi_chu   TEXT
);
CREATE INDEX IF NOT EXISTS idx_exp_so_em_ngay ON exp_so(sbd, ngay_vn);

CREATE TABLE IF NOT EXISTS manh_khien_so (
  khoa      TEXT PRIMARY KEY,
  sbd       TEXT NOT NULL,
  ngay_vn   TEXT NOT NULL,
  loai      TEXT NOT NULL,
  so        INTEGER NOT NULL,
  luc       TEXT NOT NULL,
  ghi_chu   TEXT
);
CREATE INDEX IF NOT EXISTS idx_manh_khien_so_em_ngay ON manh_khien_so(sbd, ngay_vn);
