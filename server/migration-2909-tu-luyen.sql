-- TU LUYỆN (29/09/2026) — CHỈ-THÊM. Bảng RIÊNG cho màn Tu luyện ở Sảnh: em tự luyện 4 chế độ, KHÔNG tính EXP/vàng/mảnh,
-- KHÔNG ghi su_kien_hoc / kế hoạch ngày / trần game / qid_da_lam. Không bảng nào khác đọc hai bảng này (game, chiến dịch, hồ sơ không đổi).
--
-- tu_luyen_luot: một dòng MỘT LƯỢT. Lúc rút: trang_thai 'dang_lam' + `de_rieng_json` (đáp án + lời giải, CHỈ nằm trên máy chủ
--   tới lúc nộp — máy em chỉ nhận câu công khai). Lúc nộp: 'da_nop' + số đúng, điểm, thời gian làm.
-- `de_cong_khai_json`: đúng các câu công khai đã gửi em (để em XEM LẠI lượt cũ trong "Lượt gần đây").
-- Máy chủ cũng tự dựng hai bảng này tại chỗ (server/src/tu-luyen.ts `SQL_BANG_TU_LUYEN`, y hệt tệp này) vì CI deploy không chạy migration.
-- tu_luyen_cau: một dòng MỘT CÂU đã nộp (đúng/sai + dạng/bài/lớp/sao/phần + thời gian) — nguồn của "Tổng hợp đánh giá".
CREATE TABLE IF NOT EXISTS tu_luyen_luot (
  id TEXT PRIMARY KEY,
  sbd TEXT NOT NULL,
  che_do INTEGER NOT NULL,
  tieu_de TEXT NOT NULL DEFAULT '',
  tham_so_json TEXT NOT NULL DEFAULT '{}',
  de_rieng_json TEXT NOT NULL DEFAULT '[]',
  de_cong_khai_json TEXT NOT NULL DEFAULT '[]',
  so_cau INTEGER NOT NULL DEFAULT 0,
  so_dung INTEGER NOT NULL DEFAULT 0,
  diem REAL,
  giay INTEGER NOT NULL DEFAULT 0,
  trang_thai TEXT NOT NULL DEFAULT 'dang_lam',
  tao_luc INTEGER NOT NULL,
  nop_luc INTEGER
);
CREATE INDEX IF NOT EXISTS idx_tu_luyen_luot_sbd ON tu_luyen_luot(sbd, tao_luc);

CREATE TABLE IF NOT EXISTS tu_luyen_cau (
  luot_id TEXT NOT NULL,
  sbd TEXT NOT NULL,
  che_do INTEGER NOT NULL,
  qid TEXT NOT NULL,
  phan TEXT NOT NULL,
  dung INTEGER NOT NULL DEFAULT 0,
  diem REAL NOT NULL DEFAULT 0,
  tra_loi TEXT NOT NULL DEFAULT '',
  dang_ma TEXT NOT NULL DEFAULT '',
  dang_ten TEXT NOT NULL DEFAULT '',
  bai TEXT NOT NULL DEFAULT '',
  lop TEXT NOT NULL DEFAULT '',
  sao INTEGER NOT NULL DEFAULT 0,
  giay INTEGER NOT NULL DEFAULT 0,
  co_goi_y INTEGER NOT NULL DEFAULT 0,
  nop_luc INTEGER NOT NULL,
  PRIMARY KEY (luot_id, qid)
);
CREATE INDEX IF NOT EXISTS idx_tu_luyen_cau_sbd ON tu_luyen_cau(sbd, nop_luc);
