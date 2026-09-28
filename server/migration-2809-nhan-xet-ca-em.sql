-- NHẬN XÉT CỦA THẦY theo em + ca (bản vẽ ca thi 28/09/2026, màn Báo cáo chi tiết › Từng em). CHỈ THÊM một bảng mới.
-- Ghi: POST /gv/nhan-xet-ca-em {maCa, sbd, noiDung}; đọc: /gv/bao-cao-ca-em trả `nhanXet`.
-- Lùi: DROP TABLE nhan_xet_ca_em.
CREATE TABLE IF NOT EXISTS nhan_xet_ca_em (
  ma_ca        TEXT NOT NULL,
  sbd          TEXT NOT NULL,
  noi_dung     TEXT NOT NULL,
  cap_nhat_luc TEXT NOT NULL,
  PRIMARY KEY (ma_ca, sbd)
);
