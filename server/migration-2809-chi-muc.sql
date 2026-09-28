-- Tối ưu máy chủ 28/09 (việc 3) — CHỈ THÊM chỉ mục, không đổi dữ liệu, chạy lại vô hại (IF NOT EXISTS).
-- game_v2_attempt chỉ có chỉ mục (sbd, created_at) ⇒ mọi câu lọc theo `session` (NOT EXISTS mở Đảo srs2-game.ts, game-v2-luot.ts,
-- tiếp tục phiên game-v2.ts, kết thúc ván Bi-a) quét toàn bảng hoặc toàn lịch sử của em.
-- Cỡ bảng: game_v2_attempt bị xoá sạch ở reset 21/09 (docs/reset-2109.md) ⇒ ước ≤ vài chục nghìn dòng ⇒ tạo chỉ mục < 1 s, không khoá lâu.
-- Máy chủ CŨNG tự tạo chỉ mục này một lần mỗi isolate (server/src/chi-muc-luc-chay.ts) vì CI/D1 mới không chạy migration.
CREATE INDEX IF NOT EXISTS game_v2_attempt_session ON game_v2_attempt(session, sbd);
