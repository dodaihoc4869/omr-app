-- CNH-1.0 (P02) — QUYỀN HỌC SINH DO MÁY CHỦ XÁC NHẬN.
--
-- VÌ SAO: 02-HOC-TAP-VA-RUT-CAU.md §2 — "Luyện đề toàn chương trình cần quyền `full_curriculum_practice`
-- do server xác nhận; checkbox tự khai không cấp quyền". Trước bản này, `server/src/luyen-de.ts` mở cổng
-- bằng đúng một boolean do MÁY EM gửi lên (`b.daHocXong === true`) — ai sửa request cũng qua được.
--
-- Bảng này là nguồn sự thật phía máy chủ cho các quyền kiểu đó. Chỉ THÊM bảng mới (07 §2.1), không DROP,
-- không sửa cột cũ. Chưa áp migration + chưa bật cờ ⇒ hành vi cũ giữ nguyên (không tự bật).
CREATE TABLE IF NOT EXISTS quyen_hoc_sinh (
  sbd TEXT NOT NULL,
  quyen TEXT NOT NULL,
  -- nguồn cấp: 'thay' | 'thay_hoc_bu' | 'de_cong_bo'  (KHÔNG có 'khach_khai': máy khách không cấp quyền)
  source TEXT NOT NULL,
  -- tham chiếu bằng chứng (teacher_id / assignment_id / event_id); rỗng nếu nguồn không cần
  evidence_ref TEXT NOT NULL DEFAULT '',
  revision INTEGER NOT NULL DEFAULT 1,
  cap_nhat_luc TEXT NOT NULL,
  PRIMARY KEY (sbd, quyen)
);
CREATE INDEX IF NOT EXISTS quyen_hoc_sinh_theo_quyen ON quyen_hoc_sinh(quyen, sbd);
