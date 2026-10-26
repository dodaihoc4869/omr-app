-- CHỈ THÊM (26/10/2026): HỆ THƯỞNG PHẠT KIỂU DUOLINGO — phần máy chủ «A» (thầy CHỐT 26/10: «Chốt thưởng phạt, build và đẩy lên bản sống luôn nhé»).
-- Đặc tả: docs/ban-ve-thuong-phat-2610/DAC-TA-THUONG-PHAT-2610.md §4.5. Chạy lại được (IF NOT EXISTS / INSERT OR IGNORE). Không đụng bảng/cột đang chạy.
-- Giải tuần + học cùng bạn (giai_tuan, ban_hoc, go_cua) ở migration-2610-giai-ban.sql (tác tử B).
-- Nguyên tử = sổ `exp_so` (loại mới 'nt_cau', 'nt_bai', 'nt_hoan_thanh', 'cau_sai'); tinh thể = sổ `vang_so` (khoá 'tt|…', xem server/src/thuong-luat.ts MA_TT).

-- Nhiệm vụ ngày: 3 ô mỗi em mỗi ngày (cron 00:10 VN sinh; lệnh /hs/thuong rút theo hạt giống em + ngày nếu cron chưa sinh). `xong_luc` = lúc đã trả tinh thể.
CREATE TABLE IF NOT EXISTS nhiem_vu_ngay (
  em        TEXT NOT NULL,
  ngay      TEXT NOT NULL,
  ma        TEXT NOT NULL,
  thu_tu    INTEGER NOT NULL DEFAULT 0,
  ten       TEXT NOT NULL,
  can       INTEGER NOT NULL,
  da        INTEGER NOT NULL DEFAULT 0,
  thuong    INTEGER NOT NULL,
  xong_luc  TEXT,
  PRIMARY KEY (em, ngay, ma)
);

-- Rương ngày: mở một lần mỗi ngày khi đủ 3 ô (khoá chính chống bấm lặp).
CREATE TABLE IF NOT EXISTS ruong_ngay (
  em      TEXT NOT NULL,
  ngay    TEXT NOT NULL,
  thuong  INTEGER NOT NULL,
  luc     TEXT NOT NULL,
  PRIMARY KEY (em, ngay)
);

-- Huy hiệu đã trao (ma: 'chuoi_7', 'hang_vang', 'hoan_hao_10', 'kc|<chuyên đề>', …). Trao một lần.
CREATE TABLE IF NOT EXISTS huy_hieu_em (
  em       TEXT NOT NULL,
  ma       TEXT NOT NULL,
  ngay     TEXT NOT NULL,
  du_lieu  TEXT,
  luc      TEXT NOT NULL,
  PRIMARY KEY (em, ma)
);

-- Cược chuỗi: đặt 50, giữ chuỗi đủ 7 ngày nhận 100. Mỗi em chỉ MỘT lượt đang chạy (chỉ mục duy nhất có điều kiện).
CREATE TABLE IF NOT EXISTS cuoc_chuoi (
  id          TEXT PRIMARY KEY,
  em          TEXT NOT NULL,
  dat         INTEGER NOT NULL,
  tu_ngay     TEXT NOT NULL,
  den_ngay    TEXT NOT NULL,
  trang_thai  TEXT NOT NULL CHECK (trang_thai IN ('dang', 'thang', 'thua')),
  luc         TEXT NOT NULL,
  xong_luc    TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_cuoc_chuoi_dang ON cuoc_chuoi(em) WHERE trang_thai = 'dang';
CREATE INDEX IF NOT EXISTS idx_cuoc_chuoi_em ON cuoc_chuoi(em, tu_ngay);

-- Thử thách Kim cương: phiên = mã lượt game_v2_session (câu KHÔNG đáp án). ket_qua NULL = đang làm; 'truot' khoá 24 giờ.
CREATE TABLE IF NOT EXISTS kim_cuong_phien (
  id         TEXT PRIMARY KEY,
  em         TEXT NOT NULL,
  chuyen_de  TEXT NOT NULL,
  tao_luc    INTEGER NOT NULL,
  xong_luc   INTEGER,
  ket_qua    TEXT CHECK (ket_qua IS NULL OR ket_qua IN ('dat', 'truot')),
  ong_con    INTEGER NOT NULL DEFAULT 3
);
CREATE INDEX IF NOT EXISTS idx_kim_cuong_phien_em ON kim_cuong_phien(em, chuyen_de, tao_luc);

-- Thông báo hiện MỘT lần (thăng hoa, cược, huy hiệu, …). Giao diện gọi /hs/thuong/da-xem {ma}.
CREATE TABLE IF NOT EXISTS thong_bao_thuong (
  em       TEXT NOT NULL,
  ma       TEXT NOT NULL,
  loai     TEXT NOT NULL,
  du_lieu  TEXT,
  luc      TEXT NOT NULL,
  da_xem   TEXT,
  PRIMARY KEY (em, ma)
);
CREATE INDEX IF NOT EXISTS idx_thong_bao_thuong_chua_xem ON thong_bao_thuong(em, da_xem);

-- Bài xong (một dòng mỗi bài, ghi sau câu cuối): nguồn số liệu nhiệm vụ / huy hiệu / thăng hoa / cược — đọc theo (em, ngày), không quét sổ.
CREATE TABLE IF NOT EXISTS thuong_bai_xong (
  em         TEXT NOT NULL,
  phien      TEXT NOT NULL,
  ngay       TEXT NOT NULL,
  so_cau     INTEGER NOT NULL,
  so_dung    INTEGER NOT NULL,
  chuoi_max  INTEGER NOT NULL DEFAULT 0,
  kho_dung   INTEGER NOT NULL DEFAULT 0,
  hoan_hao   INTEGER NOT NULL DEFAULT 0,
  nguyen_tu  INTEGER NOT NULL DEFAULT 0,
  luc        TEXT NOT NULL,
  PRIMARY KEY (em, phien)
);
CREATE INDEX IF NOT EXISTS idx_thuong_bai_xong_ngay ON thuong_bai_xong(em, ngay);
CREATE INDEX IF NOT EXISTS idx_thuong_bai_xong_ngay_chung ON thuong_bai_xong(ngay);

-- Mức câu hôm nay của Gói 7: bảng vốn do goi-bai-7-schema.ts dựng lúc chạy (đã có trên D1 thật — câu này không làm gì ở đó). Khai lại ĐÚNG định nghĩa
-- để lệnh /hs/thuong và câu cuối bài đọc được mục tiêu ngày ngay cả ở môi trường chưa mở Gói 7 lần nào.
CREATE TABLE IF NOT EXISTS goi_bai_7_muc_ngay (sbd TEXT NOT NULL,ngay TEXT NOT NULL,tang INTEGER NOT NULL,toi_thieu_tang INTEGER NOT NULL,quota INTEGER NOT NULL,muc INTEGER NOT NULL,luc TEXT NOT NULL,PRIMARY KEY(sbd,ngay));

-- Mốc bắt đầu của hệ (ngày VN chạy migration): thăng hoa / cược chỉ xét ngày ≥ mốc (trước mốc chưa có dữ liệu «bài xong»).
INSERT OR IGNORE INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES ('thuong_moc', date('now', '+7 hours'), datetime('now'));
