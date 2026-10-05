-- HỌC LIỆU MÁY SOẠN 05/10 (thầy: "làm tất nhé, tôi ko duyệt gì cả") — CHỈ THÊM, chạy lại vô hại. CHƯA chạy --remote:
-- máy chủ tự tạo hai bảng lúc dùng (server/src/cau-y-ds.ts, server/src/hoc-lieu-may-soan.ts) — tệp này là bản ghi tay để đối chiếu.
--
-- 1) KHO Ý ĐÚNG–SAI MỚI (Phần II): 8–12 ý mới cùng đề dẫn cho mỗi câu Đúng/Sai, mỗi ý Đ/S + lí do 1 dòng. Chỉ lưu ý đã qua HAI LƯỢT máy
--    độc lập khớp nhau (lượt soạn ↔ lượt kiểm mù không thấy giá trị đề xuất); `kiem_json` = bằng chứng lượt kiểm. Khoá (băm câu, chữ ý chuẩn).
--    `qid_mau` / `ma_de` / `lop` = khối và mã tờ của câu gốc (lấy từ kho lúc nhận) để cổng khối đọc được.
CREATE TABLE IF NOT EXISTS cau_y_ds (
  bam        TEXT NOT NULL,
  khoa_y     TEXT NOT NULL,
  stt        INTEGER NOT NULL,
  noi_dung   TEXT NOT NULL,
  gia_tri    TEXT NOT NULL,
  ly_do      TEXT NOT NULL,
  nguon      TEXT NOT NULL,
  luc        TEXT NOT NULL,
  qid_mau    TEXT NOT NULL,
  ma_de      TEXT NOT NULL,
  lop        TEXT,
  kiem_json  TEXT,
  PRIMARY KEY (bam, khoa_y)
);
CREATE INDEX IF NOT EXISTS cau_y_ds_qid ON cau_y_ds(qid_mau);

-- 2) HÀNG "CHỈ HỌC LIỆU" của máy soạn: câu em đã sai (sổ từ 29/09) đã có hồ sơ lời giải nhưng chưa có bản khác (Phần I/III) / kho ý (Phần II).
--    Một dòng một băm câu; trạng thái cho | dang | xong | truot | bo (như loi_giai_viec).
CREATE TABLE IF NOT EXISTS may_soan_viec (
  bam          TEXT PRIMARY KEY,
  qid          TEXT NOT NULL,
  ma_de        TEXT NOT NULL,
  dang         TEXT NOT NULL,
  lop          TEXT,
  bo           TEXT,
  so_em_sai    INTEGER NOT NULL DEFAULT 0,
  thieu        TEXT,
  uu_tien      INTEGER NOT NULL DEFAULT 0,
  trang_thai   TEXT NOT NULL,
  so_lan       INTEGER NOT NULL DEFAULT 0,
  ma_luot      TEXT,
  nhan_luc     TEXT,
  loi          TEXT,
  tao_luc      TEXT NOT NULL,
  cap_nhat_luc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS may_soan_viec_hang ON may_soan_viec(trang_thai, bo, uu_tien);
