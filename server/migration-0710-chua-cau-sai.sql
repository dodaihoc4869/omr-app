-- VÒNG CHỮA CÂU SAI (07/10/2026) — CHỈ-THÊM.
-- Năm bảng cho vòng "sai → chẩn đoán → chữa bước → ghép bài → kiểm chứng độc lập".
-- KHÔNG sửa bảng nào đang có; chạy lại vô hại (IF NOT EXISTS / OR IGNORE).
-- Lùi (nếu cần): DROP TABLE IF EXISTS chua_loi_dot, chua_loi_phien, chua_loi_item, chua_loi_nop, chua_loi_hoc_lieu
-- (chỉ khi chưa có dữ liệu học sinh thật; nếu đã có dữ liệu thì TẮT CỜ thay cho DROP).
-- Chạy: npx wrangler d1 execute omr --file=migration-0710-chua-cau-sai.sql --remote -y

-- ĐỢT LỖI: một (học sinh, câu chuẩn) mỗi đợt sai liên tục.
-- Unique `(sbd, qid_chuan, dong_luc IS NULL)` được kiểm nguyên tử khi tạo đợt mới.
CREATE TABLE IF NOT EXISTS chua_loi_dot (
  id              TEXT    PRIMARY KEY,
  sbd             TEXT    NOT NULL,
  qid_chuan       TEXT    NOT NULL,  -- câu gốc sau khi tách ~ss/~bt/tc
  content_group   TEXT    NOT NULL DEFAULT '',  -- nhóm nội dung đã xác minh trùng
  cohort_id       TEXT    NOT NULL DEFAULT '',
  nguon_sai       TEXT    NOT NULL DEFAULT '',  -- kênh lần sai ban đầu (thi/game/…)
  phien_ban_cau   TEXT    NOT NULL DEFAULT '',  -- version câu lúc sai đầu
  mo_luc          INTEGER NOT NULL,             -- ms lần sai đầu (TỰ làm)
  sai_cuoi_luc    INTEGER,                      -- ms lần sai cuối (TỰ làm) trong đợt này
  dong_luc        INTEGER,                      -- ms lúc đóng đợt (NULL = còn mở)
  trang_thai_day  TEXT    NOT NULL DEFAULT 'can_chan_doan',
  -- can_chan_doan | dang_chua_buoc | dang_ghep_bai | cho_gap_lai_2
  -- | dang_kiem_chung | da_tu_sua | can_thay | thieu_hoc_lieu | tam_khoa | cau_thay_doi
  buoc_dang_xu_ly INTEGER,                      -- chỉ số bước hiện tại (0-based)
  lan_gap_lai     INTEGER NOT NULL DEFAULT 0,   -- 0=ban đầu, 1=gặp lại 1, 2=kiểm chứng
  den_han         TEXT    NOT NULL DEFAULT '',  -- YYYY-MM-DD ngày gặp lại 2 sớm nhất
  policy_snapshot TEXT    NOT NULL DEFAULT '{}',-- cấu hình lúc tạo đợt
  revision        INTEGER NOT NULL DEFAULT 0,
  tao_luc         INTEGER NOT NULL,
  cap_nhat_luc    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cld_sbd_trang_thai ON chua_loi_dot(sbd, trang_thai_day, den_han);
CREATE INDEX IF NOT EXISTS idx_cld_sbd_qid        ON chua_loi_dot(sbd, qid_chuan);
CREATE INDEX IF NOT EXISTS idx_cld_cohort         ON chua_loi_dot(cohort_id, mo_luc);

-- PHIÊN CHỮA: một lần gặp lại (gặp lại 1 hoặc kiểm chứng lần 2).
CREATE TABLE IF NOT EXISTS chua_loi_phien (
  id              TEXT    PRIMARY KEY,
  dot_id          TEXT    NOT NULL REFERENCES chua_loi_dot(id),
  sbd             TEXT    NOT NULL,
  qid_chuan       TEXT    NOT NULL,
  lan_gap_lai     INTEGER NOT NULL,  -- 1 hoặc 2
  so_luot         INTEGER NOT NULL DEFAULT 1,  -- phiên thứ mấy của lần gặp này
  trang_thai      TEXT    NOT NULL DEFAULT 'dang_xu_ly',
  -- dang_xu_ly | xong | het_ngan_sach | can_thay | loi_mang
  tien_do_json    TEXT    NOT NULL DEFAULT '[]', -- mảng BuocTienDo JSON
  item_hien_tai   TEXT,                          -- id item đang phát (FK chua_loi_item)
  so_ho_tro       INTEGER NOT NULL DEFAULT 0,
  bat_dau_luc     INTEGER NOT NULL,
  ket_thuc_luc    INTEGER,
  policy_snapshot TEXT    NOT NULL DEFAULT '{}',
  revision        INTEGER NOT NULL DEFAULT 0,
  tao_luc         INTEGER NOT NULL,
  cap_nhat_luc    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_clp_sbd_dot    ON chua_loi_phien(sbd, dot_id);
CREATE UNIQUE INDEX IF NOT EXISTS uidx_clp_dot_lan_luot ON chua_loi_phien(dot_id, lan_gap_lai, so_luot);

-- ITEM: mỗi câu nhỏ (chẩn đoán, phân biệt, kiểm lại, ghép bài, kiểm chứng…).
CREATE TABLE IF NOT EXISTS chua_loi_item (
  id              TEXT    PRIMARY KEY,
  phien_id        TEXT    NOT NULL REFERENCES chua_loi_phien(id),
  dot_id          TEXT    NOT NULL,
  sbd             TEXT    NOT NULL,
  thu_tu          INTEGER NOT NULL,  -- thứ tự trong phiên (0-based)
  loai            TEXT    NOT NULL,
  -- chan_doan | phan_biet | kiem_lai | kiem_ly_do | chuyen_giao | ghep_bai | kiem_chung | nen
  buoc_so         INTEGER,           -- bước áp dụng (NULL nếu không có)
  buoc_id         TEXT    NOT NULL DEFAULT '',
  probe_ref       TEXT    NOT NULL DEFAULT '{}', -- ProbeRef JSON (riêng máy chủ)
  public_json     TEXT    NOT NULL DEFAULT '{}', -- phần công khai gửi máy em
  trang_thai      TEXT    NOT NULL DEFAULT 'chua_nop',
  -- chua_nop | da_nop | het_han | thu_hoi
  co_ho_tro       INTEGER NOT NULL DEFAULT 0,   -- đã lộ gợi ý/hướng dẫn
  phat_luc        INTEGER NOT NULL,
  het_han_luc     INTEGER,
  lo_luc          INTEGER,  -- lúc item này được coi là đã lộ (xem lời giải)
  tao_luc         INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uidx_cli_phien_thu_tu ON chua_loi_item(phien_id, thu_tu);
CREATE INDEX IF NOT EXISTS idx_cli_phien ON chua_loi_item(phien_id);

-- NỘP: receipt lần nộp của học sinh (idempotent theo attempt_id).
CREATE TABLE IF NOT EXISTS chua_loi_nop (
  id              TEXT    PRIMARY KEY,
  attempt_id      TEXT    NOT NULL,  -- UUID từ máy em
  item_id         TEXT    NOT NULL REFERENCES chua_loi_item(id),
  phien_id        TEXT    NOT NULL,
  dot_id          TEXT    NOT NULL,
  sbd             TEXT    NOT NULL,
  tra_loi         TEXT    NOT NULL DEFAULT '',  -- đáp án đã khóa lần đầu
  dung            INTEGER NOT NULL DEFAULT 0,
  giay            INTEGER NOT NULL DEFAULT 0,
  co_ho_tro       INTEGER NOT NULL DEFAULT 0,
  muc_ho_tro      INTEGER NOT NULL DEFAULT 0,  -- 0-3
  bang_chung_json TEXT    NOT NULL DEFAULT '{}',
  -- { maLoi?, loaiLoi?, banTuongDuongDaKiem?, mucKetLuan, receiptIds[] }
  response_json   TEXT    NOT NULL DEFAULT '{}', -- phản hồi đã phát cho em
  ledger_key      TEXT    NOT NULL DEFAULT '',   -- khóa sổ su_kien_hoc
  pending         INTEGER NOT NULL DEFAULT 0,    -- 1 = chưa ghi được sổ
  nop_luc         INTEGER NOT NULL,
  server_luc      INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uidx_cln_attempt ON chua_loi_nop(sbd, attempt_id);
CREATE UNIQUE INDEX IF NOT EXISTS uidx_cln_item_lan ON chua_loi_nop(item_id, sbd);
CREATE INDEX IF NOT EXISTS idx_cln_phien ON chua_loi_nop(phien_id);

-- HỌC LIỆU: bản đồ bước và bản tương đương đã kiểm.
-- bam = băm ổn định của qid_chuan + phiên bản học liệu
CREATE TABLE IF NOT EXISTS chua_loi_hoc_lieu (
  bam             TEXT    NOT NULL,
  content_version TEXT    NOT NULL,
  qid_chuan       TEXT    NOT NULL,
  hoc_lieu_json   TEXT    NOT NULL DEFAULT '{}',  -- HocLieuChua đầy đủ
  trang_thai      TEXT    NOT NULL DEFAULT 'chua_kiem',
  -- chua_kiem | du_dung | thieu_ban_ghep | thieu_ban_kiem | hoc_lieu_hong
  ly_do_thieu     TEXT    NOT NULL DEFAULT '',
  nguoi_duyet     TEXT    NOT NULL DEFAULT '',
  phien_ban_duyet TEXT    NOT NULL DEFAULT '',
  kiem_tra_luc    INTEGER NOT NULL DEFAULT 0,
  tao_luc         INTEGER NOT NULL,
  cap_nhat_luc    INTEGER NOT NULL,
  PRIMARY KEY (bam, content_version)
);
CREATE INDEX IF NOT EXISTS idx_clhl_qid ON chua_loi_hoc_lieu(qid_chuan, trang_thai);
