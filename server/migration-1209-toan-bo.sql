-- BỎ HẲN APPS SCRIPT — DỰNG NỐT MỌI BẢNG CÒN THIẾU TRÊN D1.
--
-- Chạy sau `migration-1109-chi-tiet-ca.sql`. CHỈ THÊM, không đụng bảng đang có.
--
-- Bối cảnh: tối 11/09 thầy đã xoá sạch dữ liệu ca (312 lượt · 90 ca · 259 danh
-- sách · mạnh–yếu · phiếu) để tuần sau các lớp thi lại từ đầu. Nhờ vậy đợt này
-- KHÔNG phải chép dữ liệu và KHÔNG phải chạy song song đối chiếu — chỉ dựng
-- bảng rỗng rồi chuyển lệnh. Kho đề là thứ DUY NHẤT phải chuyển nguyên vẹn.

-- ===========================================================================
-- KHỐI A — CHẤM ĐIỂM
-- ===========================================================================

-- CHI TIẾT TỪNG CÂU của một lượt. Khớp một-một sheet `ChiTietCau`.
--
-- Đây là bảng NẶNG NHẤT của cả hệ: mỗi lượt 15–40 dòng, mỗi ca 30 em ⇒ hơn một
-- nghìn dòng một ca. Khoá theo (ma_ca, sbd, lan_thu, phan, so_cau) để chấm lại
-- ghi đè đúng dòng cũ thay vì đẻ dòng mới — lỗi ấy đã làm điểm ca 447479 sai ba
-- lần hôm 09/09.
CREATE TABLE IF NOT EXISTS chi_tiet_cau (
  khoa         TEXT PRIMARY KEY,   -- ma_ca|sbd|lan_thu|phan|so_cau
  ma_ca        TEXT NOT NULL,
  sbd          TEXT NOT NULL,
  lan_thu      INTEGER NOT NULL DEFAULT 1,
  phan         TEXT NOT NULL,      -- I | II | III
  so_cau       INTEGER NOT NULL,
  qid          TEXT,
  chuyen_de    TEXT,
  muc_do       TEXT,
  dap_an_chon  TEXT,
  dap_an_dung  TEXT,
  dung_sai     INTEGER,            -- 1 đúng · 0 sai · NULL chưa chấm
  giay         INTEGER,
  cap_nhat_luc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ctc_ca  ON chi_tiet_cau(ma_ca);
CREATE INDEX IF NOT EXISTS idx_ctc_em  ON chi_tiet_cau(ma_ca, sbd, lan_thu);
CREATE INDEX IF NOT EXISTS idx_ctc_qid ON chi_tiet_cau(sbd, qid);

-- BẢN ĐỒ CÂU SAI — nguồn của "rút câu sai" và "gọi lên bảng".
CREATE TABLE IF NOT EXISTS ban_do_sai (
  khoa         TEXT PRIMARY KEY,   -- ma_ca|sbd|qid
  ma_ca        TEXT NOT NULL,
  sbd          TEXT NOT NULL,
  qid          TEXT NOT NULL,
  chuyen_de    TEXT,
  muc_do       TEXT,
  so_lan_sai   INTEGER NOT NULL DEFAULT 1,
  da_chua      INTEGER NOT NULL DEFAULT 0,
  chua_luc     TEXT,
  cap_nhat_luc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_bds_ca ON ban_do_sai(ma_ca);
CREATE INDEX IF NOT EXISTS idx_bds_em ON ban_do_sai(sbd, da_chua);

-- ===========================================================================
-- KHỐI B — HỒ SƠ VÀ TIẾN ĐỘ
-- ===========================================================================

-- TIẾN ĐỘ THEO CA: mỗi (ca, em, chuyên đề) một dòng.
CREATE TABLE IF NOT EXISTS tien_do_ca (
  khoa         TEXT PRIMARY KEY,   -- ma_ca|sbd|chuyen_de
  ma_ca        TEXT NOT NULL,
  sbd          TEXT NOT NULL,
  chuyen_de    TEXT NOT NULL,
  -- KHỚP MỘT-MỘT cột sheet `TienDoCa`: bên ấy lưu SỐ CÂU và SỐ SAI, không lưu
  -- số đúng. Đổi tên ở đây là mở đường cho lệch dữ liệu giữa hai nơi.
  so_cau       INTEGER NOT NULL DEFAULT 0,
  so_sai       INTEGER NOT NULL DEFAULT 0,
  nop_luc      TEXT,
  cap_nhat_luc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tdc_em ON tien_do_ca(sbd);

-- TIẾN ĐỘ TỔNG của em — bảng mạnh–yếu. Cộng dồn từ `tien_do_ca` và từ những
-- việc KHÔNG sinh lượt thi (gọi lên bảng, bài tự luyện).
CREATE TABLE IF NOT EXISTS tien_do_hs (
  khoa         TEXT PRIMARY KEY,   -- sbd|chuyen_de
  sbd          TEXT NOT NULL,
  chuyen_de    TEXT NOT NULL,
  so_cau       INTEGER NOT NULL DEFAULT 0,
  so_sai       INTEGER NOT NULL DEFAULT 0,
  cap_nhat_luc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tdh_em ON tien_do_hs(sbd);

-- CÂU EM ĐÃ LÀM — để không phát lại câu cũ.
CREATE TABLE IF NOT EXISTS qid_da_lam (
  khoa    TEXT PRIMARY KEY,        -- sbd|qid
  sbd     TEXT NOT NULL,
  qid     TEXT NOT NULL,
  lan_dau TEXT NOT NULL,
  so_lan  INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_qdl_em ON qid_da_lam(sbd);

-- GỌI LÊN BẢNG — ghi kết quả chữa bài tại lớp, KHÔNG tạo lượt thi giả.
CREATE TABLE IF NOT EXISTS len_bang (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  sbd          TEXT NOT NULL,
  chuyen_de    TEXT,
  qid          TEXT,
  dat          INTEGER NOT NULL DEFAULT 0,
  luc          TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_lb_em ON len_bang(sbd, luc);

-- ===========================================================================
-- KHỐI C — KHO ĐỀ
-- ===========================================================================

-- CHỈ MỤC CÂU HỎI của kho đề. Nội dung câu nằm trên R2 theo từng đề; bảng này
-- chỉ để TRA nhanh: câu nào thuộc chuyên đề nào, mức độ nào, ở đề nào.
--
-- Không nhét nội dung câu vào D1: một câu có ảnh và lời giải tới vài chục KB,
-- nhân vài nghìn câu là sai chỗ để.
CREATE TABLE IF NOT EXISTS cau_hoi (
  qid          TEXT PRIMARY KEY,
  ma_de        TEXT NOT NULL,
  chuyen_de    TEXT,
  muc_do       TEXT,
  phan         TEXT,
  lop          TEXT,
  co_loi_giai  INTEGER NOT NULL DEFAULT 0,
  cap_nhat_luc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ch_de  ON cau_hoi(ma_de);
CREATE INDEX IF NOT EXISTS idx_ch_cd  ON cau_hoi(chuyen_de, muc_do);

-- MỘT ĐỀ TRONG KHO. Gói câu đầy đủ nằm ở R2 `kho/<ma_de>.json`.
CREATE TABLE IF NOT EXISTS de_kho (
  ma_de        TEXT PRIMARY KEY,
  ten_de       TEXT,
  lop          TEXT,
  chuyen_de    TEXT,
  so_cau       INTEGER NOT NULL DEFAULT 0,
  r2_khoa      TEXT,
  da_xoa       INTEGER NOT NULL DEFAULT 0,
  cap_nhat_luc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_dk_lop ON de_kho(lop, da_xoa);

-- ===========================================================================
-- KHỐI D — NGƯỜI DÙNG VÀ TIN NHẮN
-- ===========================================================================

CREATE TABLE IF NOT EXISTS hoc_sinh (
  sbd          TEXT PRIMARY KEY,
  ho_ten       TEXT,
  nam_sinh     TEXT,
  lop          TEXT,
  sdt          TEXT,
  trang_thai   TEXT,               -- cho_duyet | da_duyet | khoa
  token        TEXT,
  tao_luc      TEXT,
  cap_nhat_luc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_hs_lop ON hoc_sinh(lop, trang_thai);

CREATE TABLE IF NOT EXISTS phu_huynh (
  id           TEXT PRIMARY KEY,
  sbd_con      TEXT NOT NULL,
  ho_ten       TEXT,
  sdt          TEXT,
  trang_thai   TEXT,
  token        TEXT,
  tao_luc      TEXT,
  cap_nhat_luc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ph_con ON phu_huynh(sbd_con);

CREATE TABLE IF NOT EXISTS tin_nhan (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  tu        TEXT NOT NULL,         -- 'thay' | sbd | id phụ huynh
  den       TEXT NOT NULL,
  vai       TEXT,                  -- hs | ph
  noi_dung  TEXT NOT NULL,
  da_doc    INTEGER NOT NULL DEFAULT 0,
  gui_luc   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tn_den ON tin_nhan(den, da_doc, gui_luc);

CREATE TABLE IF NOT EXISTS nhan_xet (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  sbd      TEXT NOT NULL,
  ma_ca    TEXT,
  noi_dung TEXT NOT NULL,
  luc      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nx_em ON nhan_xet(sbd, luc);

CREATE TABLE IF NOT EXISTS yeu_cau_giao_bai (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  sbd       TEXT NOT NULL,
  ma_ca     TEXT,
  trang_thai TEXT,                 -- cho | dong_y | tu_choi
  luc       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ycgb_em ON yeu_cau_giao_bai(sbd, trang_thai);

-- CÂU HỎI CỦA EM gửi thầy.
CREATE TABLE IF NOT EXISTS cau_hoi_em (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  sbd       TEXT NOT NULL,
  ma_ca     TEXT,
  qid       TEXT,
  noi_dung  TEXT,
  da_chua   INTEGER NOT NULL DEFAULT 0,
  luc       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_che_ca ON cau_hoi_em(ma_ca, da_chua);

-- NỘP PHIẾU KHẮC PHỤC.
CREATE TABLE IF NOT EXISTS nop_khac_phuc (
  khoa       TEXT PRIMARY KEY,     -- ma_phieu|sbd
  ma_phieu   TEXT NOT NULL,
  sbd        TEXT NOT NULL,
  ma_ca      TEXT,
  dap_an_json TEXT,
  so_dung    INTEGER NOT NULL DEFAULT 0,
  so_cau     INTEGER NOT NULL DEFAULT 0,
  nop_luc    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nkp_em ON nop_khac_phuc(sbd, nop_luc);

-- ===========================================================================
-- BÀI TẬP VỀ NHÀ — dựng mới trọn trên máy chủ mới (thầy chốt 11/09 tối).
-- Đặc tả: claude/PHAN-CONG-GIAO-BTVN.md
-- ===========================================================================

-- MỘT LƯỢT GIAO BÀI cho một ca. Hạn chốt NGAY LÚC BẤM, chung cho cả lớp.
CREATE TABLE IF NOT EXISTS btvn (
  ma_btvn      TEXT PRIMARY KEY,
  ma_ca        TEXT NOT NULL,      -- ca đã thi, dùng để biết giao cho những em nào
  ma_de        TEXT NOT NULL,      -- tờ đề trong kho
  so_cau       INTEGER NOT NULL DEFAULT 0,
  giao_luc     TEXT NOT NULL,
  han_nop      TEXT NOT NULL,      -- giao_luc + HAN_BTVN_GIO
  da_xoa       INTEGER NOT NULL DEFAULT 0,
  cap_nhat_luc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_btvn_ca ON btvn(ma_ca, da_xoa);

-- EM NÀO ĐƯỢC GIAO. Chốt danh sách NGAY LÚC GIAO, không tính lại về sau: em
-- được duyệt thi lại sau đó không tự nhiên bị giao thêm bài.
CREATE TABLE IF NOT EXISTS btvn_em (
  khoa      TEXT PRIMARY KEY,      -- ma_btvn|sbd
  ma_btvn   TEXT NOT NULL,
  sbd       TEXT NOT NULL,
  ho_ten    TEXT,
  nop_luc   TEXT,
  so_dung   INTEGER,
  so_cau    INTEGER,
  dap_an_json TEXT,
  so_lan_lam INTEGER DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_btvn_em ON btvn_em(sbd);
CREATE INDEX IF NOT EXISTS idx_btvn_lo ON btvn_em(ma_btvn);
