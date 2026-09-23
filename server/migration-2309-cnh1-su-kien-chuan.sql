-- CNH-1.0 (P03) — SỰ KIỆN HỌC CHUẨN + NĂNG LUC THEO BẰNG CHỨNG.
--
-- VÌ SAO: 04-DU-LIEU-API-DONG-THOI.md §2–§3 buộc mỗi dòng sự kiện học phải mang:
--   attempt_id (cơ hội làm do máy chủ cấp), assistance (none/assisted/unknown), visibility
--   (embargoed/released), correction_of (sự kiện bị sửa), policy_version, và BẢO TOÀN DỮ LIỆU THÔ
--   (payload máy em gửi + kết quả từng ý) để dựng lại được về sau.
-- Trước bản này `su_kien_hoc` chỉ có khoá + kết quả, nên KHÔNG thể:
--   · giữ bằng chứng `assisted` cho phần hỗ trợ (hiện chúng bị bỏ hẳn khỏi sổ),
--   · che kết quả ca chưa công bố (embargo — T47),
--   · liên kết một sự kiện sửa điểm với sự kiện gốc (correction — T20/T32).
--
-- CHỈ THÊM: KHÔNG sửa nghĩa khoá duy nhất `khoa` (nguon|ma_nguon|sbd|qid|lan) và KHÔNG đổi
-- ranh giới giao dịch đang chạy — đúng 04 §1 ("thay nghĩa, khoá duy nhất hoặc transaction
-- boundary thì không"). Cột mới đều NULL-được nên mọi dòng cũ đọc lên vẫn hợp lệ và được
-- hiểu là `assistance='none'`, `visibility='released'`, `attempt_id = khoa`.
--
-- LƯU Ý VẬN HÀNH: SQLite không có `ADD COLUMN IF NOT EXISTS` ⇒ tệp này chỉ chạy MỘT lần cho mỗi D1.
-- Mã máy chủ có đường lùi: cột chưa có thì ghi sổ bằng câu SQL cũ (xem `ghiSuKien` trong
-- server/src/su-kien-hoc.ts), không làm hỏng lượt nộp.
ALTER TABLE su_kien_hoc ADD COLUMN attempt_id TEXT;
ALTER TABLE su_kien_hoc ADD COLUMN assistance TEXT;
ALTER TABLE su_kien_hoc ADD COLUMN visibility TEXT;
ALTER TABLE su_kien_hoc ADD COLUMN correction_of TEXT;
ALTER TABLE su_kien_hoc ADD COLUMN policy_version TEXT;
ALTER TABLE su_kien_hoc ADD COLUMN purpose TEXT;
-- DỮ LIỆU THÔ: JSON đáp án máy em gửi (không chứa đáp án đúng) + kết quả từng ý Phần II.
ALTER TABLE su_kien_hoc ADD COLUMN raw_json TEXT;
ALTER TABLE su_kien_hoc ADD COLUMN subitem_json TEXT;
-- Giờ máy chủ TIẾP NHẬN (epoch ms). Khác `luc` (giờ học của sự kiện): sự kiện tới muộn vẫn xếp
-- theo giờ tiếp nhận để replay ổn định (04 §6 — "theo (received_at, event_id)").
ALTER TABLE su_kien_hoc ADD COLUMN received_at INTEGER;
CREATE INDEX IF NOT EXISTS idx_skh_tiep_nhan ON su_kien_hoc(sbd, received_at, khoa);
CREATE INDEX IF NOT EXISTS idx_skh_sua_diem ON su_kien_hoc(correction_of);

-- BẢN DỰNG LẠI năng lực theo skill (04 §3 `skill_snapshot`): working/validated/confidence + episode.
-- Là PROJECTION từ `su_kien_hoc` (đã GIỮ khi reset), KHÔNG phải nguồn sự thật ⇒ xoá đi vẫn dựng lại được.
--   cursor_received_at + cursor_event_id  đọc tới đâu rồi (để replay tăng dần, 04 §6)
--   revision                              đổi hồ sơ phải thấy được đã đổi lúc nào
--   nhat_ky_json                          sự kiện của kỹ năng trong cửa sổ (đệm để gộp tiếp, KHÔNG phải nguồn thật)
CREATE TABLE IF NOT EXISTS skill_snapshot (
  sbd                TEXT NOT NULL,
  skill_id           TEXT NOT NULL,
  policy_version     TEXT NOT NULL,
  working_level      INTEGER NOT NULL,
  validated_level    INTEGER,
  confidence         REAL NOT NULL,
  family_count       INTEGER NOT NULL,
  day_count          INTEGER NOT NULL,
  last_validated_at  TEXT,
  can_kiem_lai       INTEGER NOT NULL DEFAULT 0,
  episode_state      TEXT,
  episode_json       TEXT,
  recent5_json       TEXT NOT NULL DEFAULT '[]',
  evidence_json      TEXT NOT NULL DEFAULT '[]',
  nhat_ky_json       TEXT NOT NULL DEFAULT '[]',
  cursor_received_at INTEGER NOT NULL DEFAULT 0,
  cursor_event_id    TEXT NOT NULL DEFAULT '',
  revision           INTEGER NOT NULL DEFAULT 1,
  cap_nhat_luc       TEXT NOT NULL,
  PRIMARY KEY (sbd, skill_id, policy_version)
);
CREATE INDEX IF NOT EXISTS skill_snapshot_em ON skill_snapshot(sbd);
CREATE INDEX IF NOT EXISTS skill_snapshot_cursor ON skill_snapshot(sbd, cursor_received_at);

-- CON TRỎ theo EM (04 §6 "bảo giao cần biết projection đang tới cursor nào"): một dòng một em.
CREATE TABLE IF NOT EXISTS nang_luc_cursor (
  sbd                TEXT NOT NULL,
  policy_version     TEXT NOT NULL,
  cursor_received_at INTEGER NOT NULL DEFAULT 0,
  cursor_event_id    TEXT NOT NULL DEFAULT '',
  -- Bộ ĐỔI-CHIỀU của sổ: `so_dong` + `bam` (băm rẻ tiền trên (khoa, kết quả, hỗ trợ, visibility, giờ tiếp nhận)).
  -- Bằng nhau ⇒ snapshot CÒN SẠCH ⇒ không cần phát lại (04 §6: không full replay mỗi lần mở màn).
  -- Khác ⇒ đọc sổ và gộp tăng dần (hoặc dựng lại kỹ năng bị dơ do correction/tới muộn).
  so_dong            INTEGER NOT NULL DEFAULT 0,
  bam                INTEGER NOT NULL DEFAULT 0,
  revision           INTEGER NOT NULL DEFAULT 1,
  cap_nhat_luc       TEXT NOT NULL,
  PRIMARY KEY (sbd, policy_version)
);
