-- MIGRATION 11/09/2026 (đợt 5D) — CHI TIẾT CA và MỞ CA đọc/ghi thẳng D1.
--
-- CHỈ THÊM. Không đổi tên, không xoá, không đụng cột đang có.
--
-- SQLite KHÔNG có `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, nên chạy lần hai
-- sẽ báo "duplicate column name" và DỪNG. Đó là hành vi đúng và vô hại.

-- ĐIỂM VÀ HỌ TÊN CỦA LƯỢT.
--
-- Vì sao cần: màn Chi tiết ca đang phải đi Apps Script (p50 5,1 giây) chỉ vì
-- D1 thiếu đúng mấy cột này. Có chúng thì cả màn đọc thẳng D1.
--
-- `tong` để REAL: điểm 8,75 không nhét vừa INTEGER.
ALTER TABLE luot ADD COLUMN ho_ten    TEXT;
ALTER TABLE luot ADD COLUMN diem_i    REAL;
ALTER TABLE luot ADD COLUMN diem_ii   REAL;
ALTER TABLE luot ADD COLUMN diem_iii  REAL;
ALTER TABLE luot ADD COLUMN tong      REAL;
ALTER TABLE luot ADD COLUMN duyet_boi TEXT;
ALTER TABLE luot ADD COLUMN duyet_luc TEXT;

-- CA NÀY SINH RA Ở ĐÂU — cổng an toàn của cả đợt.
--
-- Màn Chi tiết ca CHỈ được đọc thẳng D1 khi ca sinh ra trên máy chủ mới, tức
-- mọi lượt của nó đều do `/vao-thi` tạo và D1 giữ đủ. Ca CŨ (chép sang bằng
-- lượt chuyển dữ liệu) thiếu điểm, thiếu họ tên, thiếu dòng bị chặn — đọc
-- thẳng là hiện thiếu điểm cả ca, sai số liệu còn tệ hơn chậm.
--
-- `dayCa` đặt cờ này = 1. `dayNhieuCa` (chuyển ca cũ) để nguyên 0.
ALTER TABLE ca ADD COLUMN sinh_tai_d1 INTEGER NOT NULL DEFAULT 0;

-- LƯỢT BỊ CỔNG DANH SÁCH CHẶN.
--
-- Máy chủ cố ý không nói cho em biết sai ô nào, nhưng thầy đứng trong phòng thì
-- phải thấy — 17/36 em bị chặn hôm 11/09 là nhờ bảng này bên Apps Script mới
-- truy ra được. Worker chặn mà không ghi thì màn Chi tiết ca đọc D1 sẽ mất hẳn
-- danh sách ấy.
CREATE TABLE IF NOT EXISTS chan_vao (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ma_ca       TEXT NOT NULL,
  sbd         TEXT,
  ho_ten_goi  TEXT,
  nam_sinh_goi TEXT,
  ho_ten_ds   TEXT,
  nam_sinh_ds TEXT,
  ly_do       TEXT,
  luc         TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_chan_vao_ca ON chan_vao(ma_ca, luc);
