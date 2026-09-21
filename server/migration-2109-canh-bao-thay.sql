-- CHỈ THÊM (21/09/2026): CẢNH BÁO CỦA THẦY cho em chưa nộp bài tập về nhà (docs/hop-dong-hom-nay-v2-2109.md).
-- Hai nguồn dòng: (1) THẦY bấm tay (lệnh /gv/canh-bao-nop-bai): khoá `cb:<maBtvn>:<sbd>:<yyyy-mm-dd>` ⇒ MỘT cảnh báo tay/em/bài/ngày; (2) NHẮC TỰ ĐỘNG theo luật Boss (server/src/nhac-tu-dong.ts,
-- cron 30 phút, KHÔNG dùng AI): khoá `ca:<maBtvn>:<sbd>:<M1..M4>:<yyyy-mm-dd>` (bài|em|mốc|ngày) ⇒ idempotent. Bộ não A.I không có đường ghi bảng này.
-- Lùi: DROP TABLE canh_bao_thay. Chưa chạy migration thì lệnh cảnh báo trả lỗi bằng lời, mọi lệnh khác chạy như cũ (đọc bọc try/catch).
CREATE TABLE IF NOT EXISTS canh_bao_thay (
  id            TEXT PRIMARY KEY,
  ma_btvn       TEXT NOT NULL,
  sbd           TEXT NOT NULL,
  ngay          TEXT NOT NULL,      -- ngày VN gửi
  ten_btvn      TEXT NOT NULL,
  han_nop       TEXT NOT NULL,      -- ISO, chép từ btvn.han_nop lúc gửi
  loi_em        TEXT NOT NULL,      -- lời cho EM (thầy sửa được trước khi gửi)
  loi_ph        TEXT NOT NULL,      -- lời cho PHỤ HUYNH (máy chủ dựng)
  trang_thai_em TEXT NOT NULL,      -- chua_mo | do_chang | qua_han LÚC GỬI (nhật ký)
  gui_luc       TEXT NOT NULL,
  em_xem_luc    TEXT,
  ph_xem_luc    TEXT,
  moc           TEXT NOT NULL DEFAULT 'tay',   -- tay | M1 | M2 | M3 | M4
  gui_ph        INTEGER NOT NULL DEFAULT 1,    -- 1 = phụ huynh được báo (loi_ph); 0 = mốc chỉ cho em hoặc phụ huynh đã đủ trần
  ph_nhom       TEXT                            -- `<sbd>|<ngày>` của MỘT tin phụ huynh (nhiều bài gộp chung một nhóm; `loi_ph` chỉ ở dòng đầu, dòng còn lại rỗng). NULL = tin tay
);
CREATE INDEX IF NOT EXISTS idx_canh_bao_thay_sbd ON canh_bao_thay(sbd, gui_luc);
CREATE INDEX IF NOT EXISTS idx_canh_bao_thay_btvn ON canh_bao_thay(ma_btvn, ngay);
CREATE INDEX IF NOT EXISTS idx_canh_bao_thay_ph ON canh_bao_thay(sbd, ph_nhom);
