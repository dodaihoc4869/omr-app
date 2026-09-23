-- CNH-1.0 (P02) — PHẠM VI HỌC CÁ NHÂN (learner scope).
--
-- VÌ SAO: đặc tả 02-HOC-TAP-VA-RUT-CAU.md §2 buộc bộ chọn TỰ ĐỘNG chỉ phát câu khi:
--     q.approved ∧ mọi skill_ids đều taught ∧ mọi prerequisite_ids đều taught ∧ không bị bảo vệ
-- Trước bản này repo chỉ có NĂNG LỰC (`nam_kt_cau`, `nam_kt_dang`) và "đã từng gặp" (suy từ `su_kien_hoc`),
-- KHÔNG có chỗ nào ghi "kỹ năng này đã được DẠY cho em" — nen không có cách nào loại câu ngoài phạm vi.
--
-- PHÂN BIỆT RÕ (đặc tả §2): `encountered` (chỉ GẶP, do import tự đánh dấu) KHÁC `taught` (giáo viên/học bù
-- XÁC NHẬN). Membership lớp KHÔNG phải taught. Import KHÔNG BAO GIỜ tự ghi taught (xem `ghiEncountered`).
--
-- THÊM BẢNG THUẦN (không DROP, không sửa cột cũ) theo 07-PHAT-HANH-VA-DO-LUONG.md §2.1.
CREATE TABLE IF NOT EXISTS learner_scope (
  sbd TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  -- unknown | encountered | taught | revoked  (đặc tả §2; `unknown` = không có dòng)
  state TEXT NOT NULL,
  -- nguồn bằng chứng mở kỹ năng: 'thay' | 'thay_hoc_bu' | 'import' | 'de_cong_bo'
  source TEXT NOT NULL,
  -- tham chiếu bằng chứng (event_id / assignment_id / teacher_id / qid đề đã công bố); rỗng nếu nguồn không cần
  evidence_ref TEXT NOT NULL DEFAULT '',
  -- bắt buộc: đổi quyền phải thấy được đã đổi lúc nào (dùng cho T12 "kiểm lại revision trước phát")
  revision INTEGER NOT NULL DEFAULT 1,
  cap_nhat_luc TEXT NOT NULL,
  PRIMARY KEY (sbd, skill_id)
);
-- Chỉ mục tra theo (em, trạng thái) để lọc taught/revoked mà không quét cả bảng.
CREATE INDEX IF NOT EXISTS learner_scope_trang_thai ON learner_scope(sbd, state);
