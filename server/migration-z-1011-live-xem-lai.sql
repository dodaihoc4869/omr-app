-- XEM LẠI LIVE (thầy chốt build 11/11; đặc tả docs/dac-ta-live-xem-lai-1011.md mục 4.7). CHỈ-THÊM: hai bảng mới + hai chỉ mục, chạy lại bao nhiêu lần cũng được.
-- Bản sao trong mã: server/src/live-xem-lai.ts `SQL_LIVE_XEM_LAI` (test tests/live-xem-lai-lenh-1111.test.ts khoá hai bên khớp nhau).
-- Áp trước khi đẩy Worker: scripts/ap-migration-live-xem-lai-1111.mjs (qua API từng câu, không --file ⇒ D1 không ngừng phục vụ, chạy được cả giờ cao điểm).
CREATE TABLE IF NOT EXISTS live_buoi (
  id TEXT PRIMARY KEY,                       -- = buoi_hoc.id
  lop TEXT NOT NULL DEFAULT '',              -- lớp của buổi ('' = buổi mọi lớp)
  ngay TEXT NOT NULL,                        -- YYYY-MM-DD giờ Việt Nam
  bat_luc TEXT NOT NULL, tat_luc TEXT,
  ten_tu_dong TEXT NOT NULL DEFAULT '', ten_thay TEXT,
  so_cau INTEGER NOT NULL DEFAULT 0, so_doan INTEGER NOT NULL DEFAULT 0,
  giay_live INTEGER NOT NULL DEFAULT 0, giay_doan INTEGER NOT NULL DEFAULT 0,
  byte INTEGER NOT NULL DEFAULT 0,
  trang_thai TEXT NOT NULL DEFAULT 'dang_ghi', -- dang_ghi | dang_xu_ly | xong | loi | dang_xoa
  tien_do INTEGER NOT NULL DEFAULT 0,          -- 0..100
  quyen TEXT NOT NULL DEFAULT 'lop',           -- lop | diem_danh (điểm quyết 3)
  ghi_giong_em INTEGER NOT NULL DEFAULT 1,     -- điểm quyết 2
  ban INTEGER NOT NULL DEFAULT 1,              -- dựng lại ⇒ +1 (máy em bỏ bản đệm cũ)
  tao_luc TEXT NOT NULL, cap_nhat TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_live_buoi_lop ON live_buoi(lop, ngay);
CREATE TABLE IF NOT EXISTS live_doan (
  buoi_id TEXT NOT NULL, stt INTEGER NOT NULL,
  loai TEXT NOT NULL,                        -- len_bang | thay_chua
  luot INTEGER, qid TEXT,
  ten TEXT NOT NULL,
  sbd_len_bang TEXT, dat INTEGER,            -- 1 Đạt · 0 Chưa đạt · NULL không chấm
  t0 INTEGER NOT NULL, t1 INTEGER NOT NULL,  -- ms trên trục tiếng
  giay_co_tieng INTEGER NOT NULL DEFAULT 0, so_net INTEGER NOT NULL DEFAULT 0,
  ti_le_dung REAL, dang_xem INTEGER NOT NULL DEFAULT 0, ly_do TEXT,
  PRIMARY KEY (buoi_id, stt)
);
CREATE INDEX IF NOT EXISTS idx_live_doan_em ON live_doan(sbd_len_bang);
