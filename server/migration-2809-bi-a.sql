-- BI-A PHẢN ỨNG (đặc tả DAC-TA-BI-A-PHAN-UNG-2809.md mục 9.3) — migration CHỈ-THÊM: chỉ CREATE ... IF NOT EXISTS, không đụng bảng có sẵn.
-- Chạy lại nhiều lần vô hại. Không có bản lùi phá dữ liệu: muốn tắt Bi-a thì tắt cờ `cau_hinh.bi_a`, bảng để nguyên.

-- Một ván Bi-a (đấu đơn 2 ghế hoặc đánh đôi 4 ghế).
CREATE TABLE IF NOT EXISTS bi_a_van (
  id          TEXT PRIMARY KEY,            -- mã ván
  loai        TEXT NOT NULL,               -- 'ai' | 'ban' | 'giao_huu'
  che_do      TEXT NOT NULL,               -- 'don' (2 ghế) | 'doi' (4 ghế)
  ngay        TEXT NOT NULL,               -- ngày VN 'YYYY-MM-DD'
  chu_ban     TEXT NOT NULL,               -- sbd người tạo ván
  trang_thai  TEXT NOT NULL,               -- 'mo' | 'xong' | 'bo' | 'het_gio'
  doi_thang   INTEGER,                     -- 0 Phe Kim loại | 1 Phe Phi kim | NULL
  diem_0      INTEGER,
  diem_1      INTEGER,
  json        TEXT,                        -- tóm tắt: lý do kết thúc, số cú, ghế đổi sang A.I
  tao_luc     TEXT NOT NULL,
  xong_luc    TEXT
);
CREATE INDEX IF NOT EXISTS bi_a_van_chu_ngay ON bi_a_van(chu_ban, ngay);

-- Ghế trong ván (1..4, theo thứ tự đánh). sbd NULL = ghế máy A.I.
CREATE TABLE IF NOT EXISTS bi_a_ghe (
  van      TEXT NOT NULL,
  ghe      INTEGER NOT NULL,
  doi      INTEGER NOT NULL,               -- 0 Kim loại | 1 Phi kim
  sbd      TEXT,
  session  TEXT,                           -- phiên game_v2_session của em (NULL ở ghế A.I và Bàn giao hữu)
  dung     INTEGER NOT NULL DEFAULT 0,
  sai      INTEGER NOT NULL DEFAULT 0,
  an       INTEGER NOT NULL DEFAULT 0,
  vang     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (van, ghe)
);
CREATE INDEX IF NOT EXISTS bi_a_ghe_sbd ON bi_a_ghe(sbd);

-- GĐ2 (đấu online) — tạo sẵn cho đủ lược đồ, GĐ1 chưa ghi.
CREATE TABLE IF NOT EXISTS bi_a_diem_ban (sbd TEXT PRIMARY KEY, diem INTEGER NOT NULL DEFAULT 1000, so_van INTEGER NOT NULL DEFAULT 0, cap_nhat TEXT);
CREATE TABLE IF NOT EXISTS bi_a_moi (id TEXT PRIMARY KEY, tu_sbd TEXT NOT NULL, den_sbd TEXT NOT NULL, loai TEXT NOT NULL, van TEXT, ghe INTEGER, trang_thai TEXT NOT NULL, tao_luc TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS bi_a_moi_den ON bi_a_moi(den_sbd, trang_thai);
CREATE TABLE IF NOT EXISTS bi_a_co_mat (sbd TEXT PRIMARY KEY, ten_lop TEXT, last_seen TEXT NOT NULL, con_tran INTEGER);
CREATE INDEX IF NOT EXISTS bi_a_co_mat_lop ON bi_a_co_mat(ten_lop, last_seen);
