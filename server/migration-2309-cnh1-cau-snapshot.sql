-- CNH-1.0 (P01, T34) — SNAPSHOT ĐỀ LÚC GIAO.
--
-- VÌ SAO: trước bản này, lệnh NỘP (`/hs/on-lai/nop`) đọc lại kho ĐANG SỐNG để lấy đáp án rồi chấm
-- (`layCauChoEm` → `chamMotCau(x, q)`). Nếu thầy sửa đáp án hoặc đảo lựa chọn trong kho SAU khi em đã
-- mở câu, máy chủ chấm ĐỀ CŨ bằng ĐÁP ÁN MỚI — đúng kiểu trộn mà 01-QUYET-DINH-DA-CHOT.md §3 cấm.
--
-- Bảng này giữ ảnh chụp bất biến của câu NGAY LÚC GIAO: phiên bản câu, nhóm nội dung, đáp án phía máy chủ,
-- policy chấm và version chính sách. Lúc nộp phải chấm theo snapshot; kho đổi phiên bản ⇒ THU HỒI có lý do,
-- không chấm bằng dữ liệu mới.
--
-- THÊM BẢNG THUẦN (không DROP, không sửa cột cũ) theo 07-PHAT-HANH-VA-DO-LUONG.md §2.1.
CREATE TABLE IF NOT EXISTS cau_snapshot (
  sbd TEXT NOT NULL,
  qid TEXT NOT NULL,
  snapshot_id TEXT NOT NULL,
  question_version TEXT NOT NULL,
  content_group TEXT NOT NULL DEFAULT '',
  phan TEXT NOT NULL,
  dap_an TEXT NOT NULL,
  grading_policy TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  issued_at INTEGER NOT NULL,
  PRIMARY KEY (sbd, qid)
);
-- Chỉ mục để dọn/đối chiếu theo phiên bản câu (không dùng để chọn câu).
CREATE INDEX IF NOT EXISTS cau_snapshot_phien_ban ON cau_snapshot(sbd, question_version);
